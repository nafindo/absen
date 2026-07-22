# PRD TEKNIS REVISI — RESPONS TERHADAP PERTANYAAN KRITIS
# Absensi Pro v2.3 — Android + Google Apps Script + Firebase
# Tanggal: 27 Mei 2026

---

## PERTANYAAN 1: FIRESTORE CHAT — BISA KIRIM FOTO & FILE?

### JAWABAN: YA, TAPI BUKAN DI FIRESTORE LANGSUNG

**Firestore hanya menyimpan metadata file, bukan file-nya.** File (foto, PDF, dll) disimpan di **Google Drive**, URL-nya disimpan di Firestore.

### Alur Kirim File di Chat:

```
User pilih foto/file
        ↓
┌─────────────────────────┐
│ 1. Compress/Resize      │ ← Foto: 800px, quality 80%
│ 2. Upload ke Google Drive│ ← Via Apps Script (background)
│ 3. Dapatkan file URL    │ ← https://drive.google.com/uc?id=xxx
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ 4. Simpan ke Firestore  │ ← Document chat dengan field:
│    /toko/{id}/chat/{msg}│   • type: "image" | "file"
│                         │   • fileUrl: "https://drive.google.com/..."
│                         │   • fileName: "foto.jpg"
│                         │   • fileSize: 1024 (KB)
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ 5. Real-time delivery   │ ← Semua user di toko langsung lihat
│ 6. FCM Push Notif       │ ← Notifikasi ke user lain
└─────────────────────────┘
```

### Struktur Firestore Chat Document (dengan file):

```javascript
{
  "senderId": "K001",
  "senderName": "Budi Santoso",
  "senderFoto": "https://drive.google.com/thumbnail?id=xxx",
  "message": "",                    // Kosong untuk file
  "type": "image",                  // "text" | "image" | "file"
  "fileUrl": "https://drive.google.com/uc?id=FILE_ID",
  "fileName": "absensi_2026-05-27.jpg",
  "fileSize": 1024,                 // KB
  "mimeType": "image/jpeg",
  "replyTo": "msg_previous_id",     // Optional
  "timestamp": "2026-05-27T14:30:00Z",
  "readBy": ["K002", "K003"],
  "deleted": false
}
```

### Android Implementation (Kotlin):

```kotlin
class ChatRepository(
    private val firestore: FirebaseFirestore,
    private val api: AppsScriptApi,
    private val context: Context
) {
    // Kirim pesan dengan file
    suspend fun sendFileMessage(
        tokoId: String,
        fileUri: Uri,
        messageText: String = "",
        replyTo: String? = null
    ): Result<String> {
        try {
            // 1. Compress & upload file ke Drive via Apps Script
            val compressedFile = compressImage(fileUri, maxWidth = 800, quality = 80)
            val base64 = fileToBase64(compressedFile)

            val uploadResult = api.uploadChatFile(
                base64 = base64,
                fileName = compressedFile.name,
                mimeType = compressedFile.mimeType
            )

            if (!uploadResult.success) {
                return Result.failure(Exception("Gagal upload file"))
            }

            // 2. Simpan metadata ke Firestore
            val chatDoc = hashMapOf(
                "senderId" to currentUserId,
                "senderName" to currentUserName,
                "senderFoto" to currentUserFoto,
                "message" to messageText,
                "type" to if (compressedFile.mimeType.startsWith("image")) "image" else "file",
                "fileUrl" to uploadResult.fileUrl,
                "fileName" to compressedFile.name,
                "fileSize" to compressedFile.size / 1024, // KB
                "mimeType" to compressedFile.mimeType,
                "replyTo" to (replyTo ?: ""),
                "timestamp" to FieldValue.serverTimestamp(),
                "readBy" to listOf(currentUserId),
                "deleted" to false
            )

            val docRef = firestore.collection("toko/$tokoId/chat").document()
            docRef.set(chatDoc).await()

            // 3. Update chat_meta untuk unread count
            updateChatMeta(tokoId, docRef.id, messageText.ifEmpty { "Mengirim file" })

            // 4. Kirim FCM ke member toko lain
            sendFcmToTopic(tokoId, "Pesan dari $currentUserName", messageText.ifEmpty { "Mengirim file" })

            return Result.success(docRef.id)

        } catch (e: Exception) {
            return Result.failure(e)
        }
    }

    // Compress image sebelum upload
    private fun compressImage(uri: Uri, maxWidth: Int, quality: Int): File {
        val bitmap = BitmapFactory.decodeStream(context.contentResolver.openInputStream(uri))
        val scaledBitmap = Bitmap.createScaledBitmap(
            bitmap,
            maxWidth,
            (bitmap.height * maxWidth / bitmap.width),
            true
        )

        val outputFile = File(context.cacheDir, "compressed_${System.currentTimeMillis()}.jpg")
        FileOutputStream(outputFile).use { out ->
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, quality, out)
        }

        return outputFile
    }
}
```

### Limitasi & Solusi:

| Aspek | Limitasi | Solusi |
|-------|----------|--------|
| **Ukuran file** | Drive upload via base64 terbatas | Compress image 80%, max 2MB |
| **Kecepatan upload** | Base64 30% lebih besar | Compress + chunk upload |
| **Offline kirim** | Tidak bisa upload tanpa internet | Queue di Room DB, sync saat online |
| **File type** | Semua type | Filter: image, pdf, doc max 5MB |
| **Bandwidth** | 50 user × chat intensif | Thumbnail preview, tap to download full |

---

## PERTANYAAN 2: FIRESTORE ABSENSI CACHE — MASALAH FACE ID?

### JAWABAN: TIDAK MASALAH, FIRESTORE HANYA CACHE STATUS — FACE ID TETAP DI APPS SCRIPT

**Firestore untuk absensi = cache real-time status, bukan pengganti proses absensi.**

### Arsitektur Absensi (Hybrid):

```
┌─────────────────────────────────────────────────────────────┐
│                    PROSES ABSENSI (REAL-TIME)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User tap Fingerprint                                       │
│       ↓                                                     │
│  ┌─────────────────┐                                        │
│  │ ANDROID APP     │                                        │
│  │ • Validasi GPS  │ ← Room DB cache lokasi toko            │
│  │ • Validasi Shift│ ← Room DB cache jadwal                 │
│  │ • Ambil Foto    │ ← CameraX + Face Detection (Blink)     │
│  │ • Compress Foto │ ← 800px, quality 80%                   │
│  └────────┬────────┘                                        │
│           ↓                                                 │
│  ┌─────────────────┐     ┌─────────────────┐                  │
│  │ FIRESTORE       │     │ APPS SCRIPT     │                  │
│  │ (Cache Status)  │     │ (Proses Utama)  │                  │
│  │                 │     │                 │                  │
│  │ • Write status  │     │ • Validasi Face │ ← Face ID        │
│  │   "checking_in" │────→│ • Validasi GPS  │ ← Radius toko    │
│  │ • Real-time     │     │ • Hitung telat  │ ← Toleransi      │
│  │   monitoring    │     │ • Simpan Sheets │ ← Master DB      │
│  │                 │     │ • Upload Drive  │ ← Foto absensi   │
│  └─────────────────┘     │ • FCM Notif     │ ← Push admin     │
│           ↑              └─────────────────┘                  │
│           │                              ↓                    │
│  ┌─────────────────┐          ┌─────────────────┐             │
│  │ ADMIN DASHBOARD │          │ GOOGLE SHEETS   │             │
│  │ (Real-time)     │          │ (Master Data)   │             │
│  │ • Lihat status  │          │ • ABSENSI sheet │             │
│  │   karyawan      │          │ • LEMBUR sheet  │             │
│  │ • Monitoring    │          │ • IZIN sheet    │             │
│  │   toko          │          │ • dll           │             │
│  └─────────────────┘          └─────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Flow Detail Absensi:

| Step | Proses | Di mana | Face ID? |
|------|--------|---------|----------|
| 1 | User tap fingerprint | Android App | — |
| 2 | Validasi GPS (radius toko) | Room DB cache | — |
| 3 | Validasi jadwal shift | Room DB cache | — |
| 4 | **Face Detection (Blink)** | **CameraX di Android** | **✅ YA — di sini** |
| 5 | Ambil foto | CameraX | ✅ Hasil face detection |
| 6 | Compress foto | Android (800px, 80%) | — |
| 7 | **Write Firestore** | **Firestore** | **❌ TIDAK — hanya status** |
| 8 | **Kirim ke Apps Script** | **POST API** | **✅ YA — foto + data lengkap** |
| 9 | **Validasi ulang di server** | **Apps Script** | **✅ YA — verifikasi wajah** |
| 10 | Simpan ke Sheets | Apps Script | ✅ Data final |
| 11 | Upload foto ke Drive | Apps Script | ✅ Foto tersimpan |
| 12 | FCM notif ke admin | Apps Script | — |
| 13 | Update Firestore "success" | Firestore | ❌ Hanya status update |

### Firestore Absensi Document (Hanya Cache):

```javascript
// Firestore: /absensi/{date}_{nik}
{
  "idKaryawan": "K001",
  "nama": "Budi Santoso",
  "idToko": "T001",
  "status": "checked_in",        // "checking_in" | "checked_in" | "checked_out" | "rejected"
  "checkInTime": "14:00:35",
  "checkOutTime": null,
  "jamKerja": null,
  "statusMasuk": "Ontime",       // Dari Apps Script
  "menitTelat": 0,               // Dari Apps Script
  "fotoMasukUrl": "https://drive.google.com/uc?id=xxx",  // Dari Apps Script
  "fotoPulangUrl": null,
  "latitude": -6.123456,
  "longitude": 106.789012,
  "jarakMeter": 12,
  "faceVerified": true,          // ✅ Hasil verifikasi dari Apps Script
  "faceConfidence": 0.94,        // ✅ Confidence score
  "syncedToSheets": true,        // ✅ Sudah tersimpan di Sheets
  "serverValidated": true,       // ✅ Sudah divalidasi server
  "timestamp": "2026-05-27T14:00:35Z",
  "lastUpdated": "2026-05-27T14:00:40Z"
}
```

### Kenapa Firestore Hanya Cache?

| Alasan | Penjelasan |
|--------|-----------|
| **Face ID butuh server-side processing** | Verifikasi wajah butuh akses ke master data, algoritma di Apps Script |
| **Sheets adalah source of truth** | Data absensi harus tersimpan permanen di Sheets untuk laporan |
| **Real-time monitoring** | Admin perlu lihat siapa yang sedang absen (status "checking_in") |
| **Offline resilience** | Karyawan bisa absen meski internet lemot, Firestore sync otomatis |
| **Anti-ban** | Firestore tidak hitung ke quota Apps Script |

### Admin Dashboard Real-time:

```kotlin
// Admin lihat status absensi real-time dari Firestore
val absensiRef = firestore.collection("absensi")
    .whereEqualTo("idToko", tokoId)
    .whereEqualTo("date", today)

absensiRef.addSnapshotListener { snapshot, error ->
    val karyawanStatus = snapshot?.documents?.map { doc ->
        KaryawanStatus(
            nama = doc.getString("nama") ?: "",
            status = doc.getString("status") ?: "belum", // "checking_in" | "checked_in" | "checked_out"
            jamMasuk = doc.getString("checkInTime") ?: "—",
            telat = doc.getLong("menitTelat") ?: 0,
            fotoUrl = doc.getString("fotoMasukUrl") ?: "",
            faceVerified = doc.getBoolean("faceVerified") ?: false
        )
    } ?: emptyList()

    _monitoringData.value = karyawanStatus
}
```

**Admin bisa lihat secara real-time:**
- Siapa yang sedang proses absen (status "checking_in")
- Siapa yang sudah absen masuk (status "checked_in") 
- Siapa yang sudah absen pulang (status "checked_out")
- Foto absensi langsung muncul (URL Drive)
- Status face verification (✅/❌)

---

## PERTANYAAN 3: FCM DIBLOK HP — BELUM TERSELESAIKAN

### JAWABAN: MASALAH SERIUS, BUTUH STRATEGI MULTI-LAYER

**FCM diblok oleh Android battery optimization adalah masalah industri-wide, bukan bug di aplikasi kamu.** 20-40% push notification gagal karena ini.citeweb_search:2#1

### Kenapa FCM Diblok?

| Penyebab | Dampak | Device |
|----------|--------|--------|
| **Doze Mode** (Android 6+) | Notifikasi ditunda saat layar mati | Semua Android |
| **App Standby** (Android 9+) | FCM dibatasi per hari | Semua Android |
| **Battery Optimization** | App dibunuh background | Semua Android |
| **MIUI Battery Saver** (Xiaomi) | FCM sering gagal total | Xiaomi/Redmi |
| **Samsung Adaptive Battery** | Notifikasi delay 5-30 menit | Samsung |
| **OPPO/Vivo Auto-Kill** | App dibunuh dalam 10 menit | OPPO, Vivo, Realme |
| **Huawei Power Genie** | FCM diblok agresif | Huawei |
| **Android 14+ Restrictions** | Foreground service harus declare type | Android 14+ |

### Solusi Multi-Layer (Defense in Depth):

#### LAYER 1: FCM High Priority (Backend)

```javascript
// Apps Script — pastikan SELALU kirim HIGH priority
function sendFCMv1(fcmToken, title, body, channelId, extraData) {
  const payload = {
    message: {
      token: fcmToken,
      notification: {
        title: title,
        body: body
      },
      android: {
        priority: "HIGH",                    // ← WAJIB HIGH
        notification: {
          channel_id: channelId,
          sound: "default",
          default_vibrate_timings: true,
          default_light_settings: true,
          visibility: "PUBLIC",
          notification_priority: "PRIORITY_HIGH",
          // Android 14+: wajib declare
          fcm_options: {
            analytics_label: "absensi_pro"
          }
        }
      },
      data: {
        // Semua value harus STRING
        title: String(title),
        body: String(body),
        type: String(extraData.type || "general"),
        click_action: "FLUTTER_NOTIFICATION_CLICK"  // Untuk deep link
      }
    }
  };
  // ... kirim ke FCM API
}
```

#### LAYER 2: Battery Optimization Whitelist (Android Code)

```kotlin
// Di Android App — minta user whitelist app dari battery optimization
class BatteryOptimizationHelper(private val context: Context) {

    fun isBatteryOptimizationIgnored(): Boolean {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            powerManager.isIgnoringBatteryOptimizations(context.packageName)
        } else {
            true
        }
    }

    fun requestBatteryOptimizationWhitelist() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!isBatteryOptimizationIgnored()) {
                // Tampilkan dialog penjelasan ke user
                AlertDialog.Builder(context)
                    .setTitle("Akses Notifikasi")
                    .setMessage("Untuk menerima notifikasi absensi dan chat secara real-time, mohon matikan optimasi baterai untuk Absensi Pro di pengaturan berikutnya.")
                    .setPositiveButton("Buka Pengaturan") { _, _ ->
                        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                            data = Uri.parse("package:${context.packageName}")
                        }
                        context.startActivity(intent)
                    }
                    .setNegativeButton("Nanti") { _, _ -> }
                    .setCancelable(false)
                    .show()
            }
        }
    }

    // Untuk Android 15+ (API 35): cara berbeda
    fun requestUnrestrictedBattery() {
        if (Build.VERSION.SDK_INT >= 35) {
            AlertDialog.Builder(context)
                .setTitle("Penggunaan Baterai")
                .setMessage("Pilih 'Tidak dibatasi' agar notifikasi selalu masuk.")
                .setPositiveButton("Buka Pengaturan") { _, _ ->
                    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                        data = Uri.parse("package:${context.packageName}")
                    }
                    context.startActivity(intent)
                }
                .show()
        }
    }
}
```

#### LAYER 3: Auto-Start Permission (Xiaomi, OPPO, Vivo, Samsung)

```kotlin
// Guide user untuk enable auto-start (khusus OEM China)
class AutoStartHelper(private val context: Context) {

    fun showAutoStartGuide() {
        val manufacturer = Build.MANUFACTURER.lowercase()

        when {
            manufacturer.contains("xiaomi") || manufacturer.contains("redmi") -> {
                showGuideDialog(
                    "Pengaturan Xiaomi",
                    "1. Buka Pengaturan > Aplikasi > Izin > Auto-start
" +
                    "2. Cari 'Absensi Pro' dan aktifkan Auto-start
" +
                    "3. Buka Pengaturan > Baterai > App Battery Saver
" +
                    "4. Pilih 'Absensi Pro' > 'Tidak dibatasi'"
                )
            }
            manufacturer.contains("oppo") || manufacturer.contains("realme") -> {
                showGuideDialog(
                    "Pengaturan OPPO/Realme",
                    "1. Buka Phone Manager > App Management
" +
                    "2. Cari 'Absensi Pro' > 'Autostart' > Aktifkan
" +
                    "3. Buka Pengaturan > Baterai > App Battery Management
" +
                    "4. Pilih 'Absensi Pro' > 'Don't restrict'"
                )
            }
            manufacturer.contains("vivo") -> {
                showGuideDialog(
                    "Pengaturan Vivo",
                    "1. Buka i Manager > App Manager > Autostart
" +
                    "2. Cari 'Absensi Pro' dan aktifkan
" +
                    "3. Buka Pengaturan > Baterai > Background power consumption
" +
                    "4. Pilih 'Absensi Pro' > 'Allow'"
                )
            }
            manufacturer.contains("samsung") -> {
                showGuideDialog(
                    "Pengaturan Samsung",
                    "1. Buka Pengaturan > Perawatan Perangkat > Baterai > Penggunaan Baterai yang Tidak Dipantau
" +
                    "2. Tambahkan 'Absensi Pro'
" +
                    "3. Buka Pengaturan > Aplikasi > Absensi Pro > Baterai > Tidak dibatasi"
                )
            }
            manufacturer.contains("huawei") || manufacturer.contains("honor") -> {
                showGuideDialog(
                    "Pengaturan Huawei",
                    "1. Buka Pengaturan > Aplikasi > Peluncuran > Absensi Pro
" +
                    "2. Matikan 'Kelola secara otomatis', aktifkan 'Autostart'
" +
                    "3. Buka Pengaturan > Baterai > Peluncuran Aplikasi
" +
                    "4. Pilih 'Absensi Pro' > 'Kelola secara manual' > Aktifkan semua"
                )
            }
        }
    }

    private fun showGuideDialog(title: String, message: String) {
        AlertDialog.Builder(context)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("Buka Pengaturan") { _, _ ->
                context.startActivity(Intent(Settings.ACTION_SETTINGS))
            }
            .setNegativeButton("OK") { _, _ -> }
            .show()
    }
}
```

#### LAYER 4: Foreground Service (Fallback Terakhir)

```kotlin
// Jika semua gagal, gunakan Foreground Service untuk keep-alive
class AbsensiProForegroundService : Service() {

    override fun onCreate() {
        super.onCreate()

        // Android 14+ (API 34): wajib declare foregroundServiceType
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                createNotification(),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_REMOTE_MESSAGING  // ← WAJIB untuk FCM
            )
        } else {
            startForeground(NOTIFICATION_ID, createNotification())
        }
    }

    private fun createNotification(): Notification {
        val channelId = "absensi_pro_persistent"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Absensi Pro Service",
                NotificationManager.IMPORTANCE_LOW  // LOW = tidak muncul di status bar
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }

        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("Absensi Pro Aktif")
            .setContentText("Menerima notifikasi absensi dan chat")
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val NOTIFICATION_ID = 9999

        fun start(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(Intent(context, AbsensiProForegroundService::class.java))
            } else {
                context.startService(Intent(context, AbsensiProForegroundService::class.java))
            }
        }
    }
}
```

**AndroidManifest.xml:**
```xml
<!-- WAJIB untuk Android 14+ -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_REMOTE_MESSAGING" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<service
    android:name=".service.AbsensiProForegroundService"
    android:foregroundServiceType="remoteMessaging"
    android:exported="false" />

<receiver
    android:name=".fcm.AbsensiFcmReceiver"
    android:exported="false"
    android:foregroundServiceType="remoteMessaging">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</receiver>
```

#### LAYER 5: In-App Notification Badge (Fallback UI)

```kotlin
// Jika FCM gagal, user tetap lihat notifikasi saat buka app
class NotificationRepository(
    private val firestore: FirebaseFirestore,
    private val dao: NotificationDao
) {
    // Listen notifikasi dari Firestore (real-time, tidak bergantung FCM)
    fun getUnreadNotifications(userId: String): Flow<List<Notification>> {
        return firestore.collection("notifications")
            .whereEqualTo("targetId", userId)
            .whereEqualTo("read", false)
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .snapshotFlow()
            .map { snapshot ->
                snapshot.toObjects(Notification::class.java)
            }
    }

    // Badge count di bottom nav
    fun getUnreadCount(userId: String): Flow<Int> {
        return getUnreadNotifications(userId).map { it.size }
    }
}
```

### Strategi FCM + Fallback:

```
┌─────────────────────────────────────────────────────────────┐
│                    NOTIFIKASI STRATEGI                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PRIORITAS 1: FCM High Priority                              │
│  ├── Backend kirim HIGH priority                              │
│  ├── Android: Wake lock, vibrate, sound                       │
│  └── Success rate: ~60-80% (tergantung device)              │
│                                                             │
│  PRIORITAS 2: Firestore Real-time Listener                   │
│  ├── App aktif: Langsung muncul notif UI                     │
│  ├── App background: FCM trigger + Firestore sync            │
│  └── Success rate: ~95% (selama app tidak di-kill)          │
│                                                             │
│  PRIORITAS 3: In-App Badge                                  │
│  ├── User buka app → lihat badge notifikasi                  │
│  ├── Pull-to-refresh → sync notifikasi                     │
│  └── Success rate: 100% (tapi butuh user buka app)          │
│                                                             │
│  PRIORITAS 4: Foreground Service (Last Resort)              │
│  ├── Keep connection ke Firestore                            │
│  ├── Notif persistent di status bar                         │
│  └── Success rate: ~90% (tapi drain battery)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Play Store Compliance:

**⚠️ PERINGATAN:** Google Play melarang app meminta `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` kecuali core function app terdampak. Untuk app absensi, ini bisa dijustifikasi karena:
- Notifikasi absensi = time-critical
- Admin perlu monitoring real-time
- Chat group = komunikasi kerja

**Solusi aman untuk Play Store:**
1. Gunakan `ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS` (bukan REQUEST)
2. Tampilkan dialog penjelasan ke user sebelum redirect ke settings
3. Jangan auto-whitelist tanpa consent user
4. Dokumentasikan di app description kenapa perlu ini

---

## RINGKASAN PERUBAHAN DARI PRD SEBELUMNYA

| Aspek | PRD Sebelumnya | Revisi Sekarang |
|-------|---------------|-----------------|
| **Chat File** | Tidak detail | ✅ Full flow: Drive upload + Firestore metadata |
| **Face ID** | Tidak address | ✅ Face ID tetap di Apps Script, Firestore hanya cache status |
| **FCM Diblok** | Tidak address | ✅ 5-layer defense: FCM HIGH + Battery whitelist + Auto-start guide + Foreground service + In-app badge |
| **Admin Real-time** | Firestore listener | ✅ Firestore + Sheets hybrid, admin lihat status "checking_in" real-time |
| **Offline Absensi** | Queue pattern | ✅ Firestore write dulu (instant), Sheets batch nanti (background) |

---

## CHECKLIST IMPLEMENTASI PRIORITAS (Diperbarui)

### PHASE 1: FCM Fix (URGENT — Minggu 1)
- [ ] Update FCM payload ke HIGH priority
- [ ] Implementasi BatteryOptimizationHelper
- [ ] Implementasi AutoStartHelper (per OEM)
- [ ] Test FCM di Xiaomi, Samsung, OPPO
- [ ] Implementasi Foreground Service (fallback)

### PHASE 2: Firestore Chat (Minggu 2)
- [ ] Setup Firestore collections
- [ ] Implementasi file upload ke Drive + metadata Firestore
- [ ] Implementasi real-time chat listener
- [ ] Test kirim foto di chat

### PHASE 3: Absensi Hybrid (Minggu 3)
- [ ] Implementasi Firestore absensi cache
- [ ] Face ID tetap di Android + validasi di Apps Script
- [ ] Admin dashboard real-time dari Firestore
- [ ] Batch sync ke Sheets (nightly)

### PHASE 4: Polish (Minggu 4)
- [ ] In-app notification badge
- [ ] Performance monitoring
- [ ] Load test 50 user
- [ ] Production deployment
