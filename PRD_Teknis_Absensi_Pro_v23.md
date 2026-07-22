# PRD TEKNIS LENGKAP
# Absensi Pro v2.3 — Android Full Stack
# Arsitektur: Android (Kotlin) + Google Apps Script + Firebase
# Target: 50 Pengguna Aktif | Chat Group Intensif
# Tanggal: 27 Mei 2026

---

## 1. EXECUTIVE SUMMARY

### 1.1 Konteks
Aplikasi **Absensi Pro v2.3** telah memiliki tampilan UI/UX final (screenshot terlampir). FCM push notification sudah terintegrasi. Yang dibutuhkan sekarang adalah **arsitektur sistem backend yang robust**, **strategi anti-lemot**, dan **anti-ban Google** untuk 50 pengguna aktif dengan chat group yang intensif.

### 1.2 Constraint Kritis
| Constraint | Detail |
|------------|--------|
| Server | Google Apps Script (Web App) — execution limit 6 menit |
| Database Master | Google Sheets (sudah ada, 14 sheet) |
| Pengguna | 50 karyawan aktif, chat intensif |
| Budget | Minimal — maksimalkan free tier |
| Ban Risk | Harus 0% — tidak boleh kena rate limit Google |

### 1.3 Filosofi Arsitektur
> **"Offline First, Sync Smart, Firestore for Chat, Sheets for Master"**

---

## 2. ARSITEKTUR SISTEM

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ANDROID APP (Kotlin)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Jetpack     │  │ Room DB     │  │ WorkManager │  │ FCM Client      │  │
│  │ Compose UI  │  │ (Local Cache)│  │ (Background)│  │ (Push Notif)    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Repository  │  │ ViewModel   │  │ Retrofit    │  │ Firestore SDK   │  │
│  │ Pattern     │  │ (StateFlow) │  │ (REST API)  │  │ (Real-time)     │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │ Apps Script │ │  Firestore  │ │ Google Drive│
            │  (Web App)  │ │  (NoSQL)   │ │ (File Store)│
            │  REST API   │ │  Real-time │ │             │
            └──────┬──────┘ └─────────────┘ └─────────────┘
                   │
            ┌──────┴──────┐
            │Google Sheets│
            │(Master DB)  │
            └─────────────┘
```

### 2.2 Layer Detail

#### LAYER 1: CLIENT (Android App)
| Komponen | Teknologi | Versi | Fungsi |
|----------|-----------|-------|--------|
| UI Framework | Jetpack Compose | 1.6+ | UI declarative, reaktif, modern |
| Local Database | Room (SQLite) | 2.6+ | Cache lokal semua data master |
| Dependency Injection | Hilt | 2.51+ | DI untuk Repository & ViewModel |
| Async Processing | Kotlin Coroutines + Flow | 1.8+ | Background ops, reactive streams |
| Networking | Retrofit + OkHttp | 2.9+ | REST API ke Apps Script |
| Image Loading | Coil | 2.6+ | Cache foto profil & bukti absensi |
| Background Sync | WorkManager | 2.9+ | Periodic sync, upload queue |
| Real-time Chat | Firestore SDK | 24.0+ | Real-time listener, offline persistence |
| Push Notification | Firebase Messaging | 23.0+ | FCM push notifikasi |
| Auth | Firebase Auth (Google Sign-In) | 22.0+ | JWT token, session management |
| Location | FusedLocationProvider | 21.0+ | GPS tracking absensi |
| Camera | CameraX | 1.3+ | Foto absensi dengan face detection |

#### LAYER 2: SERVER (Google Apps Script)
| Komponen | Teknologi | Fungsi |
|----------|-----------|--------|
| Backend API | Apps Script Web App (doPost/doGet) | REST API endpoint |
| Script Cache | CacheService | Cache master data 5 menit |
| Properties | PropertiesService | FCM token storage, online presence |
| File Storage | DriveApp | Upload foto absensi, lampiran |
| Batch Processing | Time-driven Triggers | Rekap harian, cleanup |

#### LAYER 3: DATABASE & STORAGE
| Data Type | Storage | Rationale |
|-----------|---------|-----------|
| Master Data (karyawan, toko, shift, jadwal) | Google Sheets | Sudah ada, jarang berubah |
| Chat Messages | **Firestore** | Real-time, write-heavy, 50K reads/day gratis |
| Status Absensi Hari Ini | Firestore | Real-time monitoring |
| Notifikasi Queue | Firestore | Reliable delivery |
| User Presence (online/offline) | Firestore | Real-time status |
| Log Absensi Detail (30 hari) | Firestore → Sheets (nightly batch) | Hot data di Firestore, cold di Sheets |
| Foto Absensi | Google Drive | Blob storage, URL direct access |
| Dokumen Izin/Sakit | Google Drive | Lampiran file |
| Backup Sheets | Google Drive (monthly archive) | Data retention |

---

## 3. STRATEGI ANTI-LEMOT & ANTI-BAN

### 3.1 Apps Script Optimization (KUNCI UTAMA)

| Problem | Impact | Solusi | Implementasi |
|---------|--------|--------|------------|
| Execution limit 6 menit | Timeout saat proses banyak data | Batch max 100 row per execution | `batchWriteAbsensi()` |
| URL Fetch limit 20K/day | FCM gagal kirim | Minimize external calls | Semua data dalam Google ecosystem |
| Concurrent requests | Data corruption | LockService + Queue | Apps Script tidak support concurrent |
| Slow Sheets (50+ user query) | UI freeze 5+ detik | Cache + Room DB | Cache 5 menit, local first |
| Sheets write limit | Ban risk | Batch append | `appendRow()` sekalian, bukan loop |

### 3.2 Teknik Khusus Apps Script

```javascript
// 1. BATCH WRITE — JANGAN loop satu-satu!
function batchWriteAbsensi(dataArray) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('ABSENSI');
  const lastRow = sheet.getLastRow();
  // 1 operasi = 100 row
  sheet.getRange(lastRow + 1, 1, dataArray.length, dataArray[0].length)
       .setValues(dataArray);
}

// 2. CACHE AGRESIF — 5 menit TTL
const cache = CacheService.getScriptCache();
function getKaryawanData() {
  const cached = cache.get('karyawan_all');
  if (cached) return JSON.parse(cached); // <50ms

  const data = sheet.getDataRange().getValues(); // 1x read
  cache.put('karyawan_all', JSON.stringify(data), 300); // 5 menit
  return data;
}

// 3. TIME-DRIVEN TRIGGER — JANGAN onEdit!
// ❌ Jangan: onEdit untuk chat (akan crash dengan 50 user)
// ✅ Gunakan: Firestore onWrite trigger untuk chat real-time
// ✅ Gunakan: Apps Script time-driven (every 5 min) untuk rekap batch

// 4. SPREADSHEET ACCESS OPTIMIZATION
// ❌ Jangan: SpreadsheetApp.openById() tiap request
// ✅ Gunakan: PropertiesService cache spreadsheet ID
const ssId = PropertiesService.getScriptProperties().getProperty('SS_ID');
```

### 3.3 Firestore untuk Chat (GAME CHANGER)

**Chat intensif JANGAN disimpan di Sheets!** Firestore gratis untuk 50 user:

```javascript
// Firestore Structure (NoSQL)
/users/{userId}              → profile, toko_assignment, fcm_token
/toko/{tokoId}/chat/{msgId}  → {message, senderId, senderName, timestamp, readBy[], type, fileUrl}
/absensi/{date}_{nik}        → {checkIn, checkOut, fotoUrl, location, status}
/notifications/{notifId}     → {targetId, title, body, timestamp, read}
/presence/{userId}           → {lastSeen, status, deviceId}

// Security Rules
match /toko/{tokoId}/chat/{messageId} {
  allow read: if request.auth.uid in getTokoMembers(tokoId);
  allow create: if request.auth.uid == resource.data.senderId;
}
```

**Keuntungan Firestore:**
- ⚡ Real-time listener (chat masuk tanpa refresh)
- 🔄 Offline persistence (chat tetap bisa dibaca tanpa internet)
- 📊 50K reads/day gratis = cukup untuk 50 user aktif
- 🚫 **Tidak hitung ke limit Apps Script!**
- 🔥 Sub-millisecond latency

### 3.4 Android App — Offline First Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   UI Layer  │ ←── │ ViewModel   │ ←── │  Repository │
│  (Compose)  │     │ (StateFlow) │     │   Pattern   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ↓                          ↓                          ↓
              ┌─────────┐              ┌─────────────┐            ┌─────────┐
              │Room DB  │              │ Apps Script │            │Firestore│
              │(Local)   │              │   API       │            │(Real-time)
              │• Cache   │              │• Master data│            │• Chat   │
              │• Queue   │              │• Rekap      │            │• Status │
              │• Draft  │              │• Bulk write │            │• Presence
              └─────────┘              └─────────────┘            └─────────┘
```

**Sync Strategy:**
| Data | Source | Sync Frequency | Strategy |
|------|--------|----------------|----------|
| Chat | Firestore | Real-time | Firestore listener + Room cache |
| Jadwal Shift | Sheets → Room | 1x/hari | WorkManager periodic (04:00) |
| Rekap Absensi | Sheets | On-demand | Repository pattern + cache 1 jam |
| Absensi hari ini | Firestore + Sheets | Real-time + batch | Firestore dulu, Sheets batch malam |
| Foto absensi | Google Drive | Async upload | Background upload queue |
| Master Karyawan | Sheets → Room | 1x/minggu | Manual refresh + cache 7 hari |
| Master Toko | Sheets → Room | 1x/minggu | Manual refresh + cache 7 hari |
| Master Shift | Sheets → Room | 1x/minggu | Manual refresh + cache 7 hari |

---

## 4. DATABASE SCHEMA

### 4.1 Google Sheets (Master Data — Cold Storage)

| Sheet | Kolom | Update Frequency | Rows Estimasi |
|-------|-------|-------------------|---------------|
| MASTER_KARYAWAN | ID, Nama, PIN, Jabatan, Status, No_HP, Email, Toko_Default, Shift_Default, Foto_Profil, FCM_Token, Device_ID | Jarang | 50 |
| MASTER_TOKO | ID, Nama, Alamat, Lat, Long, Radius, Jam_Buka, Jam_Tutup, Foto_URL, Status | Jarang | 10 |
| SHIFT_TOKO | ID, ID_Toko, Nama_Shift, Jam_Masuk, Jam_Pulang, Toleransi, Status | Jarang | 30 |
| JADWAL_KARYAWAN | ID, ID_Karyawan, ID_Toko, ID_Shift, Hari_Berjalan, Tgl_Mulai, Tgl_Selesai, Status | Mingguan | 200 |
| ABSENSI | Timestamp, ID_Karyawan, Nama, ID_Toko, ID_Shift, Tipe, Jam_Masuk, Jam_Pulang, Jam_Kerja, Status, Telat, Foto_URL, Lat, Long, Jarak, GPS_Status | Harian +50 | 1,500/bulan |
| LEMBUR | ID, ID_Karyawan, Tanggal, Jam_Mulai, Jam_Selesai, Durasi, Alasan, Status, Approved_By | Harian +5 | 150/bulan |
| IZIN_CUTI | ID, ID_Karyawan, ID_Jenis, Tgl_Mulai, Tgl_Selesai, Jumlah_Hari, Alasan, Lampiran, Status | Harian +3 | 90/bulan |
| MASTER_JENIS_IZIN | ID, Nama, Kode, Kuota_Tahun, Kuota_Bulan, Max_Hari, Gender, Potong_Cuti, Syarat, Status | Jarang | 10 |
| TUGAS | ID, ID_Toko, Judul, Deskripsi, Deadline, Prioritas, Status, Dibuat_Oleh, Ditugaskan_Ke | Harian +10 | 300/bulan |
| BERITA | ID, Judul, Isi, Kategori, Gambar_URL, Dibuat_Oleh, Tgl_Publish, Status | Mingguan | 20 |
| DATA_GAJI | ID_Karyawan, Gaji_Pokok, Tunjangan, Potongan, Periode, Status | Bulanan | 50 |
| SETTING_GLOBAL | Parameter, Value, Keterangan | Jarang | 20 |
| LOG_ERROR | Timestamp, Error, Stack, User, Action, Payload | Setiap error | 100/bulan |
| TUKER_SHIFT | ID, ID_Karyawan, ID_Toko_Saya, ID_Toko_Tujuan, ID_Karyawan_Tujuan, Shift_Saya, Shift_Tujuan, Tanggal, Status | Harian +2 | 60/bulan |

### 4.2 Firestore Collections (Hot Data — Real-time)

```
/users/{userId} (document)
  ├── idKaryawan: string
  ├── nama: string
  ├── jabatan: string
  ├── tokoDefault: string
  ├── shiftDefault: string
  ├── fotoProfil: string (URL)
  ├── fcmToken: string
  ├── deviceId: string
  ├── status: "online" | "offline"
  ├── lastSeen: timestamp
  └── tokoAssignment: string[]

/toko/{tokoId}/chat/{messageId} (document)
  ├── senderId: string
  ├── senderName: string
  ├── senderFoto: string (URL)
  ├── message: string
  ├── type: "text" | "image" | "file"
  ├── fileUrl: string
  ├── fileName: string
  ├── fileSize: number
  ├── replyTo: string (messageId)
  ├── timestamp: timestamp
  ├── readBy: string[] (userIds)
  └── deleted: boolean

/toko/{tokoId}/chat_meta (document)
  ├── lastMessageId: string
  ├── lastMessageText: string
  ├── lastMessageTime: timestamp
  ├── lastSenderId: string
  ├── unreadCount: map<string, int>  // per user
  └── totalMessages: number

/absensi/{date}_{nik} (document)
  ├── idKaryawan: string
  ├── nama: string
  ├── idToko: string
  ├── namaToko: string
  ├── idShift: string
  ├── namaShift: string
  ├── checkIn: timestamp
  ├── checkOut: timestamp
  ├── jamKerja: string ("8j 30m")
  ├── statusMasuk: "Ontime" | "Telat"
  ├── menitTelat: number
  ├── fotoMasukUrl: string
  ├── fotoPulangUrl: string
  ├── latitude: number
  ├── longitude: number
  ├── jarakMeter: number
  ├── statusGPS: "Valid" | "Invalid"
  └── syncedToSheets: boolean

/notifications/{notifId} (document)
  ├── targetId: string (karyawanId atau "ALL")
  ├── title: string
  ├── body: string
  ├── type: "chat" | "absensi" | "approval" | "tugas" | "berita"
  ├── data: map (payload extra)
  ├── timestamp: timestamp
  ├── read: boolean
  └── delivered: boolean

/presence/{userId} (document)
  ├── status: "online" | "away" | "offline"
  ├── lastSeen: timestamp
  ├── deviceId: string
  └── currentScreen: string
```

### 4.3 Google Drive (File Storage)

```
📁 Absensi_Pro_Root/
├── 📁 Foto_Absensi/
│   ├── 📁 2026-05/
│   │   ├── 2026-05-27_K001_Masuk.jpg
│   │   └── 2026-05-27_K001_Pulang.jpg
│   └── 📁 2026-06/
├── 📁 Foto_Profil/
│   ├── 2026-05-27_K001.jpg
│   └── 2026-05-27_K002.jpg
├── 📁 Foto_Toko/
│   └── 📁 2026-05/
│       └── 2026-05-27_T001.jpg
├── 📁 Lampiran_Izin/
│   └── 📁 2026-05/
│       └── 2026-05-27_K001_sakit.pdf
├── 📁 Chat_Files/
│   └── 📁 2026-05/
│       ├── 2026-05-27_142030_K001_image.jpg
│       └── 2026-05-27_143045_K002_document.pdf
└── 📁 Backup_Sheets/
    └── backup_2026-05-01.zip
```

---

## 5. API SPECIFICATION

### 5.1 Apps Script REST API (Existing + Optimized)

#### Endpoint Structure
```
POST https://script.google.com/macros/s/{SCRIPT_ID}/exec
Content-Type: application/json

Body: { "action": "actionName", ...params }
```

#### Optimized Endpoints

| Action | Method | Cache Strategy | Rate Limit |
|--------|--------|----------------|------------|
| `login` | POST | No cache | 10/min |
| `getDeltas` | POST | **Delta sync** — hanya data berubah | 1/min per type |
| `absenMasuk` | POST | No cache | 5/min |
| `absenPulang` | POST | No cache | 5/min |
| `getJadwalHariIni` | POST | Room cache 1 hari | 1/min |
| `getJadwalMingguan` | POST | Room cache 1 hari | 1/min |
| `getRaportBulanan` | POST | Room cache 1 jam | 5/min |
| `getDashboardData` | POST | Cache 5 menit | 10/min |
| `getMonitoringToko` | POST | Cache 2 menit | 5/min |
| `ajukanIzin` | POST | No cache | 5/min |
| `ajukanLembur` | POST | No cache | 5/min |
| `approveIzin` | POST | Invalidate cache | 10/min |
| `approveLembur` | POST | Invalidate cache | 10/min |
| `getChatMessages` | POST | **DEPRECATED** → pindah ke Firestore | — |
| `sendChatMessage` | POST | **DEPRECATED** → pindah ke Firestore | — |
| `getTokoList` | POST | Cache 1 hari | 1/min |
| `getKaryawanList` | POST | Cache 1 hari | 1/min |
| `saveKaryawan` | POST | Invalidate cache | 5/min |
| `updateKaryawan` | POST | Invalidate cache | 5/min |
| `getSettingGlobal` | POST | Cache 1 hari | 1/min |

#### Delta Sync API (BARU — Kritis untuk performa)

```json
// Request
{
  "action": "getDeltas",
  "lastSyncTimestamp": "2026-05-27T10:00:00Z",
  "syncTypes": ["ABSENSI", "LEMBUR", "IZIN", "TUGAS", "BERITA"]
}

// Response
{
  "success": true,
  "deltas": {
    "ABSENSI": [ /* hanya record baru sejak lastSync */ ],
    "LEMBUR": [ /* hanya record status berubah */ ],
    "IZIN": [ /* hanya record baru/berubah */ ]
  },
  "serverTime": "2026-05-27T14:30:00Z",
  "deletedIds": {
    "ABSENSI": ["deleted_id_1", "deleted_id_2"]
  }
}
```

### 5.2 Firestore Real-time API (BARU — untuk Chat)

```kotlin
// Android Kotlin — Firestore Chat Listener
val db = Firebase.firestore
val chatRef = db.collection("toko").document(tokoId).collection("chat")
  .orderBy("timestamp", Query.Direction.DESCENDING)
  .limit(50)

// Real-time listener
chatRef.addSnapshotListener { snapshot, error ->
    if (error != null) {
        Log.w("Chat", "Listen failed.", error)
        return@addSnapshotListener
    }

    val messages = snapshot?.documents?.map { doc ->
        ChatMessage(
            id = doc.id,
            senderId = doc.getString("senderId") ?: "",
            senderName = doc.getString("senderName") ?: "",
            message = doc.getString("message") ?: "",
            timestamp = doc.getTimestamp("timestamp")?.toDate(),
            type = doc.getString("type") ?: "text",
            fileUrl = doc.getString("fileUrl")
        )
    } ?: emptyList()

    // Update UI via StateFlow
    _chatMessages.value = messages.reversed()
}
```

### 5.3 FCM Push Notification API (Sudah Terintegrasi)

```javascript
// Apps Script — FCM v1 API (sudah ada di code.js)
function sendFCMv1(fcmToken, title, body, channelId, extraData) {
  const projectId = 'nafindo-group';
  const accessToken = ScriptApp.getOAuthToken();

  const payload = {
    message: {
      token: fcmToken,
      notification: { title: title, body: body },
      android: {
        priority: 'high',
        notification: {
          channel_id: channelId,
          sound: 'default',
          default_vibrate_timings: true
        }
      },
      data: { /* string key-value pairs */ }
    }
  };

  // POST ke https://fcm.googleapis.com/v1/projects/{projectId}/messages:send
}
```

---

## 6. SYNC STRATEGY

### 6.1 Sync Matrix

| Data | Source of Truth | Local Cache | Sync Trigger | Conflict Resolution |
|------|----------------|-------------|--------------|---------------------|
| Chat | Firestore | Room (last 100 msg) | Real-time listener | Firestore wins |
| Absensi hari ini | Firestore → Sheets | Room | Immediate + batch | Firestore wins |
| Jadwal | Sheets | Room (7 hari) | Daily 04:00 + manual | Sheets wins |
| Rekap | Sheets | Room (1 bulan) | On-demand + hourly | Sheets wins |
| Master Karyawan | Sheets | Room | Weekly + manual | Sheets wins |
| Master Toko | Sheets | Room | Weekly + manual | Sheets wins |
| Master Shift | Sheets | Room | Weekly + manual | Sheets wins |
| FCM Token | Firestore Auth | SharedPrefs | On login | Server wins |
| User Presence | Firestore | — | Real-time | Firestore wins |

### 6.2 Background Sync Schedule (WorkManager)

```kotlin
// WorkManager Periodic Tasks
val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.CONNECTED)
    .build()

// 1. Master Data Sync — setiap hari jam 04:00
val masterSyncWork = PeriodicWorkRequestBuilder<MasterDataSyncWorker>(1, TimeUnit.DAYS)
    .setConstraints(constraints)
    .setInitialDelay(calculateDelayTo4AM(), TimeUnit.MILLISECONDS)
    .addTag("master_sync")
    .build()

// 2. Absensi Batch Sync — setiap 15 menit
val absensiSyncWork = PeriodicWorkRequestBuilder<AbsensiSyncWorker>(15, TimeUnit.MINUTES)
    .setConstraints(constraints)
    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.SECONDS)
    .addTag("absensi_sync")
    .build()

// 3. Upload Queue — setiap 5 menit (foto, file)
val uploadWork = PeriodicWorkRequestBuilder<UploadQueueWorker>(5, TimeUnit.MINUTES)
    .setConstraints(constraints)
    .addTag("upload_queue")
    .build()

// 4. Cleanup — setiap hari jam 02:00
val cleanupWork = PeriodicWorkRequestBuilder<CleanupWorker>(1, TimeUnit.DAYS)
    .setInitialDelay(calculateDelayTo2AM(), TimeUnit.MILLISECONDS)
    .addTag("cleanup")
    .build()

WorkManager.getInstance(context).enqueueUniquePeriodicWork(
    "master_sync",
    ExistingPeriodicWorkPolicy.KEEP,
    masterSyncWork
)
```

### 6.3 Offline Queue Pattern

```kotlin
// Repository Pattern dengan Offline Queue
class AbsensiRepository(
    private val api: AppsScriptApi,
    private val db: AppDatabase,
    private val firestore: FirebaseFirestore
) {
    // 1. Absen Masuk — Firestore dulu, Sheets nanti
    suspend fun absenMasuk(data: AbsenRequest): Result<AbsenResponse> {
        // Simpan ke Firestore (real-time, instant)
        val firestoreRef = firestore.collection("absensi")
            .document("${today}_${data.idKaryawan}")

        firestoreRef.set(data.toFirestoreMap())
            .await() // Tunggu Firestore confirm

        // Queue untuk Sheets batch (background)
        db.pendingSyncDao().insert(
            PendingSync(
                type = "ABSENSI_MASUK",
                payload = data.toJson(),
                priority = SyncPriority.HIGH,
                createdAt = System.currentTimeMillis()
            )
        )

        return Result.success(AbsenResponse(...))
    }

    // 2. Background worker proses queue
    suspend fun processPendingSync() {
        val pending = db.pendingSyncDao().getPending()

        pending.chunked(50).forEach { batch ->
            try {
                api.batchSync(batch.map { it.payload })
                db.pendingSyncDao().markSynced(batch.map { it.id })
            } catch (e: Exception) {
                // Retry dengan exponential backoff
                db.pendingSyncDao().incrementRetry(batch.map { it.id })
            }
        }
    }
}
```

---

## 7. CHAT SYSTEM ARCHITECTURE

### 7.1 Chat Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User A    │────→│  Firestore  │←────│   User B    │     │   User C    │
│  (Kirim)    │     │  (Write)    │     │ (Listener)  │     │ (Listener)  │
└─────────────┘     └──────┬──────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ↓              ↓
              ┌─────────┐   ┌─────────────┐
              │ FCM Push│   │ Room Cache  │
              │ (BG app)│   │ (Local DB)  │
              └─────────┘   └─────────────┘
```

### 7.2 Chat Implementation

```kotlin
// 1. Send Message
suspend fun sendMessage(tokoId: String, message: ChatMessage) {
    val db = Firebase.firestore
    val batch = db.batch()

    // Write message
    val msgRef = db.collection("toko/$tokoId/chat").document()
    batch.set(msgRef, message.toMap())

    // Update metadata (unread counts)
    val metaRef = db.collection("toko/$tokoId").document("chat_meta")
    batch.update(metaRef, mapOf(
        "lastMessageId" to msgRef.id,
        "lastMessageText" to message.text,
        "lastMessageTime" to Timestamp.now(),
        "lastSenderId" to message.senderId
    ))

    batch.commit().await()

    // FCM ke semua member toko (kecuali sender)
    fcmManager.sendToTopic("toko_$tokoId", message)
}

// 2. Real-time Listener
fun listenChat(tokoId: String): Flow<List<ChatMessage>> = callbackFlow {
    val listener = db.collection("toko/$tokoId/chat")
        .orderBy("timestamp", Query.Direction.ASCENDING)
        .addSnapshotListener { snapshot, error ->
            if (error != null) {
                close(error)
                return@addSnapshotListener
            }

            val messages = snapshot?.toObjects(ChatMessage::class.java) ?: emptyList()
            trySend(messages)
        }

    awaitClose { listener.remove() }
}

// 3. Offline Support
@Dao
interface ChatDao {
    @Query("SELECT * FROM chat_messages WHERE tokoId = :tokoId ORDER BY timestamp DESC LIMIT 100")
    fun getMessages(tokoId: String): Flow<List<ChatMessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessages(messages: List<ChatMessageEntity>)

    @Query("DELETE FROM chat_messages WHERE tokoId = :tokoId AND timestamp < :cutoff")
    suspend fun cleanupOldMessages(tokoId: String, cutoff: Long)
}
```

### 7.3 Chat Features

| Feature | Implementation | Status |
|---------|---------------|--------|
| Text message | Firestore document | ✅ |
| Image message | Firestore + Drive upload | ✅ |
| File attachment | Firestore + Drive upload | ✅ |
| Reply to message | `replyTo` field in document | ✅ |
| Read receipts | `readBy` array in document | ✅ |
| Typing indicator | `presence/{userId}/typing` | ✅ |
| Online status | `presence/{userId}/status` | ✅ |
| Push notification | FCM topic per toko | ✅ |
| Message search | Room FTS (Full Text Search) | ✅ |
| Delete message | `deleted: true` flag | ✅ |

---

## 8. ABSENSI SYSTEM ARCHITECTURE

### 8.1 Absensi Flow

```
User tap Fingerprint
        ↓
┌───────────────────┐
│ 1. Validasi GPS   │ ← Cek radius toko (Firestore cache lokasi)
│ 2. Validasi Shift │ ← Cek jadwal hari ini (Room cache)
│ 3. Ambil Foto     │ ← CameraX + face detection
│ 4. Compress       │ ← Resize 800px, quality 80%
└─────────┬─────────┘
          ↓
┌───────────────────┐
│ 5. Write Firestore│ ← Real-time: absensi/{date}_{nik}
│ 6. FCM Push Admin │ ← Notifikasi ke admin real-time
│ 7. Queue Sheets   │ ← PendingSync table (background)
│ 8. Upload Foto    │ ← Drive upload queue (background)
└─────────┬─────────┘
          ↓
┌───────────────────┐
│ 9. Update UI      │ ← StateFlow update, success animation
│ 10. Cache Room    │ ← Simpan ke local DB
└───────────────────┘
```

### 8.2 Absensi Data Flow

| Step | Storage | Latency | Reliability |
|------|---------|---------|-------------|
| GPS Validation | Firestore (toko cache) | <100ms | High |
| Shift Check | Room DB | <50ms | High |
| Photo Capture | Memory | Instant | High |
| Firestore Write | Firestore | <500ms | Very High |
| FCM Push | FCM | <2s | High |
| Sheets Batch | Apps Script (queue) | 5-15 min | Medium |
| Drive Upload | Drive API | 2-10s | High |
| Room Cache | SQLite | <50ms | Very High |

---

## 9. SECURITY ARCHITECTURE

### 9.1 Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────→│ Apps Script │←────│ Google Sheets│
│  (ID+PIN)   │     │  validate   │     │ (MASTER_KARYAWAN)
└──────┬──────┘     └──────┬──────┘     └─────────────┘
       │                   │
       ↓                   ↓
┌─────────────┐     ┌─────────────┐
│ Firebase Auth│     │  Custom JWT │
│ (Google Sign-│     │  (session)  │
│   In)       │     │             │
└─────────────┘     └─────────────┘
```

### 9.2 Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function getUserToko() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tokoAssignment;
    }

    function isInSameToko(tokoId) {
      return tokoId in getUserToko();
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isInSameToko(resource.data.tokoDefault));
      allow write: if isAuthenticated() && isOwner(userId);
    }

    // Chat per toko
    match /toko/{tokoId}/chat/{messageId} {
      allow read: if isAuthenticated() && isInSameToko(tokoId);
      allow create: if isAuthenticated() && isInSameToko(tokoId) && request.auth.uid == request.resource.data.senderId;
      allow update, delete: if false; // No edit/delete after send
    }

    // Absensi
    match /absensi/{absenId} {
      allow read: if isAuthenticated() && (resource.data.idKaryawan == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() && request.resource.data.idKaryawan == request.auth.uid;
    }

    // Notifications
    match /notifications/{notifId} {
      allow read: if isAuthenticated() && (resource.data.targetId == request.auth.uid || resource.data.targetId == 'ALL');
      allow create: if isAuthenticated() && isAdmin();
      allow update: if isAuthenticated() && resource.data.targetId == request.auth.uid;
    }

    // Presence
    match /presence/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isOwner(userId);
    }
  }
}
```

### 9.3 Apps Script Security

```javascript
// 1. API Key Validation (header-based)
function validateApiKey(e) {
  const apiKey = e.parameter.apiKey || e.postData?.headers?.['X-API-Key'];
  const validKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (apiKey !== validKey) {
    throw new Error('Unauthorized: Invalid API Key');
  }
}

// 2. Rate Limiting (per device)
function checkRateLimit(deviceId, action) {
  const cache = CacheService.getScriptCache();
  const key = `rate_${deviceId}_${action}`;
  const count = parseInt(cache.get(key) || '0');

  if (count > 10) { // Max 10 request per menit
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  cache.put(key, String(count + 1), 60); // 1 menit window
}

// 3. Input Sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>"']/g, ''); // XSS prevention
}
```

---

## 10. PERFORMANCE OPTIMIZATION

### 10.1 Apps Script Performance Budget

| Metric | Budget | Current | Target |
|--------|--------|---------|--------|
| API Response Time | <2s | 3-5s | <1.5s |
| Sheets Read (full) | <3s | 5-8s | <2s (dengan cache) |
| Sheets Write (single) | <500ms | 1-2s | <300ms (batch) |
| FCM Delivery | <3s | 2-5s | <2s |
| Firestore Read | <100ms | — | <100ms |
| Firestore Write | <500ms | — | <300ms |
| Image Upload | <5s | 5-10s | <3s (compressed) |
| Chat Message Delivery | <1s | — | <500ms |

### 10.2 Optimization Techniques

| Technique | Implementation | Impact |
|-----------|---------------|--------|
| **CacheService** | Cache master data 5 menit | -80% Sheets reads |
| **Room DB** | Local cache semua master data | -90% API calls |
| **Delta Sync** | Hanya sync data berubah | -70% data transfer |
| **Batch Write** | 50-100 row per execution | -60% execution time |
| **Image Compression** | Resize 800px, quality 80% | -70% upload size |
| **Lazy Loading** | Pagination 20 item per page | -50% memory usage |
| **WorkManager** | Background sync, upload queue | Smooth UI |
| **Firestore Listener** | Real-time tanpa polling | -100% polling overhead |
| **Connection Pool** | OkHttp connection reuse | -30% network latency |
| **GZIP Compression** | OkHttp gzip interceptor | -40% payload size |

### 10.3 Memory Management (Android)

```kotlin
// Coil Image Cache
val coilCache = ImageLoader.Builder(context)
    .memoryCache {
        MemoryCache.Builder(context)
            .maxSizePercent(0.25) // 25% RAM
            .build()
    }
    .diskCache {
        DiskCache.Builder()
            .directory(context.cacheDir.resolve("image_cache"))
            .maxSizeBytes(50L * 1024 * 1024) // 50MB
            .build()
    }
    .build()

// Room Database Size Limit
@Database(entities = [/* entities */], version = 1)
abstract class AppDatabase : RoomDatabase() {
    companion object {
        const val MAX_DB_SIZE = 100 * 1024 * 1024L // 100MB
    }
}

// WorkManager Constraints
val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.CONNECTED)
    .setRequiresBatteryNotLow(true)
    .setRequiresStorageNotLow(true)
    .build()
```

---

## 11. MONITORING & LOGGING

### 11.1 Apps Script Monitoring

```javascript
// Performance logging
function logPerformance(action, startTime, payload) {
  const duration = Date.now() - startTime;
  const sheet = getSheet('LOG_PERFORMANCE');
  sheet.appendRow([
    new Date(),
    action,
    duration,
    JSON.stringify(payload).length,
    Session.getActiveUser().getEmail()
  ]);

  // Alert jika >3 detik
  if (duration > 3000) {
    sendAdminAlert(`Slow query: ${action} took ${duration}ms`);
  }
}

// Error logging (sudah ada di code.js)
function logError(action, error, payload) {
  // ... existing implementation
}

// Daily health check
function dailyHealthCheck() {
  const stats = {
    totalExecutions: getExecutionCount(),
    avgResponseTime: getAvgResponseTime(),
    errorRate: getErrorRate(),
    cacheHitRate: getCacheHitRate(),
    sheetsRows: getTotalRows(),
    firestoreReads: getFirestoreReads(),
    fcmDelivered: getFcmStats()
  };

  // Kirim ke admin dashboard
  sendAdminReport(stats);
}
```

### 11.2 Android App Monitoring

```kotlin
// Firebase Crashlytics
FirebaseCrashlytics.getInstance().setCustomKey("user_id", userId)
FirebaseCrashlytics.getInstance().setCustomKey("toko", tokoId)

// Performance Monitoring
val trace = FirebasePerformance.getInstance().newTrace("absen_masuk")
trace.start()
// ... absen process ...
trace.stop()

// ANR Detection
Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
    FirebaseCrashlytics.getInstance().recordException(throwable)
    // Restart app gracefully
}
```

---

## 12. DEPLOYMENT & MAINTENANCE

### 12.1 Deployment Checklist

| Step | Task | Responsible | Status |
|------|------|-------------|--------|
| 1 | Setup Firebase Project (Auth, Firestore, FCM) | Dev | ⬜ |
| 2 | Configure Firestore Security Rules | Dev | ⬜ |
| 3 | Setup Google Cloud Project (FCM v1 API) | Dev | ⬜ |
| 4 | Deploy Apps Script Web App (new version) | Dev | ⬜ |
| 5 | Update Android app dependencies | Dev | ⬜ |
| 6 | Implement Room DB entities & DAOs | Dev | ⬜ |
| 7 | Implement Repository pattern | Dev | ⬜ |
| 8 | Implement Firestore chat | Dev | ⬜ |
| 9 | Implement WorkManager sync | Dev | ⬜ |
| 10 | Test with 5 users (staging) | QA | ⬜ |
| 11 | Test with 25 users (load test) | QA | ⬜ |
| 12 | Deploy to production (50 users) | DevOps | ⬜ |
| 13 | Setup monitoring dashboard | DevOps | ⬜ |
| 14 | Document user manual | PM | ⬜ |

### 12.2 Maintenance Schedule

| Task | Frequency | Automation |
|------|-----------|------------|
| Backup Sheets ke Drive | Harian 02:00 | Apps Script trigger |
| Cleanup Firestore (30 hari) | Harian 03:00 | Firestore TTL |
| Cleanup Room DB (7 hari) | Harian 04:00 | WorkManager |
| Cleanup Drive (foto lama) | Mingguan | Apps Script |
| Update cache master data | Mingguan | Manual/Auto |
| Review error logs | Mingguan | Manual |
| Performance audit | Bulanan | Manual |
| FCM token refresh check | Bulanan | Auto |

### 12.3 Rollback Plan

```
Jika terjadi masalah kritis:

1. Apps Script: Deploy versi sebelumnya (Version History)
2. Android: Force update via Firebase Remote Config
3. Firestore: Restore dari backup (daily export)
4. Sheets: Restore dari Drive backup
5. FCM: Switch ke Webpushr fallback

SLA Target:
- P0 (app down): <15 menit recovery
- P1 (feature broken): <1 jam recovery
- P2 (performance issue): <4 jam recovery
```

---

## 13. TECHNOLOGY STACK SUMMARY

### 13.1 Final Stack

| Layer | Teknologi | Status | Notes |
|-------|-----------|--------|-------|
| **Mobile** | Kotlin + Jetpack Compose | ⬜ Baru | Migrasi dari XML |
| **Local DB** | Room (SQLite) | ⬜ Baru | Cache + Queue |
| **DI** | Hilt | ⬜ Baru | Dependency injection |
| **Async** | Coroutines + Flow | ⬜ Baru | Reactive programming |
| **Networking** | Retrofit + OkHttp | ⬜ Baru | REST API |
| **Image** | Coil | ⬜ Baru | Image loading & cache |
| **Auth** | Firebase Auth (Google Sign-In) | ⬜ Baru | JWT token |
| **Push Notif** | Firebase Cloud Messaging | ✅ Sudah | FCM v1 API |
| **Chat DB** | Firebase Firestore | ⬜ Baru | Real-time, NoSQL |
| **Master DB** | Google Sheets | ✅ Sudah | Via Apps Script |
| **File Storage** | Google Drive | ✅ Sudah | Foto & lampiran |
| **Backend** | Google Apps Script | ✅ Sudah | Web App |
| **Server Cache** | CacheService | ⬜ Perlu optimize | 5 menit TTL |
| **Real-time** | Firestore Listener | ⬜ Baru | Ganti Pusher |
| **Background** | WorkManager | ⬜ Baru | Sync & upload |
| **Monitoring** | Firebase Crashlytics | ⬜ Baru | Error tracking |
| **Performance** | Firebase Performance | ⬜ Baru | Trace monitoring |

### 13.2 Migration Path

```
Fase 1: Foundation (Minggu 1-2)
├── Setup Firebase Project
├── Implement Room DB + Repository
├── Implement Retrofit API client
└── Implement basic offline support

Fase 2: Chat Migration (Minggu 2-3)
├── Setup Firestore collections
├── Implement Firestore chat listener
├── Migrate chat dari Sheets ke Firestore
├── Implement FCM topic per toko
└── Test chat dengan 10 user

Fase 3: Absensi Optimization (Minggu 3-4)
├── Implement Firestore absensi cache
├── Implement batch Sheets sync
├── Implement image compression
├── Implement upload queue
└── Test absensi dengan 25 user

Fase 4: Polish & Scale (Minggu 4-5)
├── Implement Delta sync API
├── Implement WorkManager schedule
├── Setup monitoring (Crashlytics)
├── Performance optimization
├── Load test 50 user
└── Production deployment
```

---

## 14. APPENDIX

### 14.1 Apps Script Quota (Critical)

| Quota | Limit | Current Usage Est | Margin |
|-------|-------|-------------------|--------|
| Daily execution time | 6 hours/day | ~1.5 hours | 75% |
| Concurrent executions | 30 | ~5 peak | 83% |
| URL Fetch calls | 20,000/day | ~500 (FCM) | 97% |
| URL Fetch data | 100MB/day | ~10MB | 90% |
| Cache storage | 100MB | ~5MB | 95% |
| Properties storage | 500KB | ~50KB | 90% |
| Sheets API read | 300/min | ~50/min | 83% |
| Sheets API write | 300/min | ~20/min | 93% |
| Drive API | 1B requests/day | ~100 | 99.99% |
| Firestore reads | 50K/day (free) | ~10K | 80% |
| Firestore writes | 20K/day (free) | ~5K | 75% |
| FCM sends | Unlimited (free) | ~200/day | 99% |

### 14.2 Cost Estimation (Monthly)

| Service | Free Tier | Estimasi 50 User | Cost |
|---------|-----------|------------------|------|
| Firebase Auth | 10K users | 50 | $0 |
| Firestore | 50K reads/day | ~15K/day | $0 |
| FCM | Unlimited | ~6K/month | $0 |
| Google Cloud (FCM v1) | 1M requests | ~6K | $0 |
| Apps Script | 6 hrs/day | ~1.5 hrs | $0 |
| Google Sheets | Unlimited | 14 sheets | $0 |
| Google Drive | 15GB | ~2GB | $0 |
| **TOTAL** | | | **$0/month** |

### 14.3 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Apps Script timeout | Medium | High | Batch processing, queue system |
| Firestore quota exceeded | Low | High | Monitor, optimize reads |
| FCM token expired | Medium | Medium | Auto-refresh, fallback Webpushr |
| Sheets corruption | Low | Critical | Daily backup, Drive archive |
| 50 user concurrent | Low | High | Load test, scale Firestore |
| Network failure | Medium | Medium | Offline first, retry queue |
| Device lost/stolen | Low | Medium | Remote logout, device binding |

---

**Document Version:** 1.0  
**Last Updated:** 27 Mei 2026  
**Author:** AI Technical Architect  
**Status:** Draft — Ready for Review
