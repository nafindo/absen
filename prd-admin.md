 Saya akan membuatkan PRD (Product Requirements Document) lengkap untuk aplikasi **Absensi Pro — Admin Dashboard** berdasarkan backend Google Apps Script yang sudah ada. Ini akan mencakup desain frontend yang modern, rapi, dan komprehensif.

---

# 📋 PRD: Absensi Pro — Admin Dashboard (Native APK)

## 1. INFORMASI PRODUK

| Atribut | Detail |
|---------|--------|
| **Nama Produk** | Absensi Pro — Admin Control Center |
| **Versi** | 3.0 |
| **Platform** | Android Native (Kotlin/Java) |
| **Target User** | Admin, Owner, HR Manager |
| **Backend** | Google Apps Script (REST API) |
| **Real-time** | Pusher WebSocket + FCM Push Notification |
| **Spreadsheet ID** | `1CC10iigHkBpSpGxL_vtc_lwBAC7vIsqNLoy3pXO2MVc` |

---

## 2. FITUR UTAMA ADMIN

### 2.1 Dashboard Sekilas (Home)
### 2.2 Manajemen Toko (CRUD + Shift)
### 2.3 Manajemen Karyawan (CRUD + Jadwal)
### 2.4 Monitoring Absensi Real-time
### 2.5 Approval Center (Lembur, Izin, Tukar Shift)
### 2.6 Laporan & Analitik
### 2.7 Manajemen Tugas & Berita
### 2.8 Pengaturan Global
### 2.9 Chat & Notifikasi

---

## 3. ARSITEKTUR TEKNOLOGI

```
┌─────────────────────────────────────────┐
│         ANDROID NATIVE (Kotlin)         │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ │
│  │  UI Layer│ │ ViewModel│ │  Repository│ │
│  │ (Compose)│ │ (MVVM)   │ │ (Retrofit) │ │
│  └────┬────┘ └────┬────┘ └────┬─────┘ │
│       └─────────────┴─────────────┘     │
│              Coroutines + Flow            │
├─────────────────────────────────────────┤
│     Pusher (WebSocket) ← Real-time      │
│     FCM (Push Notification)             │
│     Google Maps SDK (Monitoring)        │
│     CameraX (Verifikasi Foto)           │
├─────────────────────────────────────────┤
│         REST API (Google Apps Script)    │
│         Google Sheets (Database)         │
│         Google Drive (File Storage)      │
└─────────────────────────────────────────┘
```

---

## 4. DESAIN FRONTEND DETAIL

### 🎨 SISTEM DESAIN (Design System)

#### Warna
```kotlin
// Color Palette
val Primary         = Color(0xFF1A73E8)      // Google Blue
val PrimaryDark     = Color(0xFF1557B0)
val PrimaryLight    = Color(0xFFE8F0FE)
val Secondary       = Color(0xFF34A853)      // Success Green
val SecondaryLight  = Color(0xFFE6F4EA)
val Warning         = Color(0xFFFBBC04)      // Warning Yellow
val Danger          = Color(0xFFEA4335)      // Danger Red
val DangerLight     = Color(0xFFFCE8E6)
val Info            = Color(0xFF00BCD4)      // Info Cyan
val Purple          = Color(0xFF7B1FA2)      // Accent Purple

// Neutrals
val Background      = Color(0xFFF8F9FA)
val Surface         = Color(0xFFFFFFFF)
val SurfaceElevated = Color(0xFFFFFFFF)      // With shadow
val TextPrimary     = Color(0xFF202124)
val TextSecondary   = Color(0xFF5F6368)
val TextTertiary    = Color(0xFF80868B)
val Divider         = Color(0xFFE8EAED)
val Border          = Color(0xFFDADCE0)
```

#### Tipografi
```kotlin
val Typography = Typography(
    h1 = TextStyle(fontSize = 28.sp, fontWeight = FontWeight.Bold, color = TextPrimary),
    h2 = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.Bold, color = TextPrimary),
    h3 = TextStyle(fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary),
    h4 = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary),
    body1 = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Normal, color = TextPrimary),
    body2 = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Normal, color = TextSecondary),
    caption = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Medium, color = TextTertiary),
    button = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 0.5.sp)
)
```

#### Spacing & Shape
```kotlin
// Rounded Corners
val ShapeSmall    = RoundedCornerShape(8.dp)
val ShapeMedium   = RoundedCornerShape(12.dp)
val ShapeLarge    = RoundedCornerShape(16.dp)
val ShapeExtraLarge = RoundedCornerShape(24.dp)
val ShapeCircle   = CircleShape

// Elevation
val ElevationCard   = 2.dp
val ElevationFAB    = 6.dp
val ElevationBottomSheet = 8.dp
val ElevationDialog = 24.dp
```

---

### 📱 SCREEN 1: SPLASH & LOGIN

#### Splash Screen
```
┌─────────────────────────────┐
│                             │
│                             │
│      [LOGO APP - 120dp]     │
│      Absensi Pro            │
│      Admin Dashboard        │
│                             │
│      v3.0                   │
│                             │
│      ─────────────────      │
│      Powered by Nafindo     │
│                             │
└─────────────────────────────┘
```
- **Background**: Gradient Primary → PrimaryDark
- **Animasi**: Logo scale up + fade in (800ms)
- **Transition**: Auto-navigate ke Login setelah 2 detik (jika belum login)

#### Login Screen
```
┌─────────────────────────────┐
│  [Back Button]              │
│                             │
│  Selamat Datang             │
│  Admin! 👋                  │
│                             │
│  ┌─────────────────────────┐│
│  │ 👤 ID Karyawan          ││
│  │    ADM001               ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ 🔒 PIN (4 digit)        ││
│  │    ••••                 ││
│  └─────────────────────────┘│
│                             │
│  [ ] Ingat saya             │
│                             │
│  ┌─────────────────────────┐│
│  │      MASUK              ││
│  └─────────────────────────┘│
│                             │
│  Lupa PIN?                  │
│                             │
└─────────────────────────────┘
```
- **PIN Input**: Numeric keyboard, 4 digit dengan dot indicator
- **Validasi**: Cek `action: login` → response `jabatan: admin/owner`
- **Error State**: Shake animation + Snackbar merah
- **Biometric**: Optional fingerprint/face unlock

---

### 📱 SCREEN 2: DASHBOARD UTAMA (HOME)

**Layout**: Scrollable Vertical + Pull-to-Refresh

```
┌─────────────────────────────┐
│ 🏠 Dashboard        🔔 [3]  │  ← Top App Bar
│                             │
│ ┌─────────────────────────┐ │
│ │  👤 Halo, Admin Budi   │ │
│ │  Senin, 29 Mei 2026    │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  RINGKASAN HARI INI    │ │
│ │  ─────────────────────  │ │
│ │                         │ │
│ │  [📊] [⏰] [📋] [⚠️]   │ │
│ │  24    3     5     2   │ │
│ │ Hadir Telat  Izin  Cuti│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  MONITORING TOKO       │ │
│ │  ─────────────────────  │ │
│ │                         │ │
│ │  🏪 Toko Pusat         │ │
│ │  ┌───┐  5/8 Online     │ │
│ │  │IMG│  ●●●●●○○○       │ │
│ │  └───┘  2 Telat        │ │
│ │                         │ │
│ │  🏪 Toko Cabang A      │ │
│ │  ┌───┐  3/4 Online     │ │
│ │  │IMG│  ●●●●○○○○       │ │
│ │  └───┘  0 Telat        │ │
│ │                         │ │
│ │  [Lihat Semua →]       │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  AKTIVITAS TERBARU     │ │
│ │  ─────────────────────  │ │
│ │                         │ │
│ │  🟢 Andi - Masuk       │ │
│ │     08:02 · Toko Pusat │ │
│ │     Status: Ontime ✅   │ │
│ │  ─────────────────────  │ │
│ │  🔴 Budi - Masuk       │ │
│ │     08:25 · Toko A     │ │
│ │     Status: Telat 10m  │ │
│ │  ─────────────────────  │ │
│ │  📋 Sari - Izin Cuti   │ │
│ │     Pending Approval   │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  MENU CEPAT            │ │
│ │  ─────────────────────  │ │
│ │  [👥] [🏪] [📅] [📊]   │ │
│ │ Karyawan Toko Jadwal   │ │
│ │  [📋] [⏰] [💬] [⚙️]   │ │
│ │ Approval Lembur Chat   │ │
│ └─────────────────────────┘ │
│                             │
│      [HOME] [MONITOR] [+]  │  ← Bottom Nav
│      [REPORT] [PROFILE]    │
└─────────────────────────────┘
```

#### Komponen Detail:

**A. Header Profile Card**
```kotlin
@Composable
fun HeaderProfileCard(
    nama: String,
    tanggal: String,
    fotoUrl: String,
    notifCount: Int
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = ShapeLarge,
        colors = CardDefaults.cardColors(containerColor = Primary)
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar
            AsyncImage(
                model = fotoUrl,
                contentDescription = "Profile",
                modifier = Modifier
                    .size(56.dp)
                    .clip(ShapeCircle)
                    .border(3.dp, Color.White.copy(alpha = 0.3f), ShapeCircle),
                placeholder = painterResource(R.drawable.ic_admin),
                error = painterResource(R.drawable.ic_admin)
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text("Halo, $nama 👋", color = Color.White, style = Typography.h4)
                Text(tanggal, color = Color.White.copy(alpha = 0.8f), style = Typography.body2)
            }
            
            // Notification Bell
            BadgedBox(
                badge = { 
                    if (notifCount > 0) {
                        Badge(containerColor = Danger) {
                            Text(notifCount.toString(), color = Color.White)
                        }
                    }
                }
            ) {
                IconButton(onClick = { /* Open notifications */ }) {
                    Icon(Icons.Default.Notifications, "Notifikasi", tint = Color.White)
                }
            }
        }
    }
}
```

**B. Stats Summary Card**
```kotlin
@Composable
fun StatsSummaryCard(stats: DashboardStats) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = ShapeLarge,
        elevation = CardDefaults.cardElevation(defaultElevation = ElevationCard)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text("Ringkasan Hari Ini", style = Typography.h4)
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                StatItem(icon = "📊", value = stats.hadir, label = "Hadir", color = Secondary)
                StatItem(icon = "⏰", value = stats.telat, label = "Telat", color = Warning)
                StatItem(icon = "📋", value = stats.izin, label = "Izin", color = Info)
                StatItem(icon = "⚠️", value = stats.cuti, label = "Cuti", color = Danger)
            }
        }
    }
}

@Composable
fun StatItem(icon: String, value: Int, label: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(ShapeCircle)
                .background(color.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Text(icon, fontSize = 24.sp)
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(value.toString(), style = Typography.h3, color = color)
        Text(label, style = Typography.caption)
    }
}
```

**C. Toko Monitoring Card**
```kotlin
@Composable
fun TokoMonitoringCard(toko: TokoMonitor) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        shape = ShapeMedium,
        elevation = CardDefaults.cardElevation(defaultElevation = ElevationCard)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Foto Toko
            AsyncImage(
                model = toko.fotoUrl,
                contentDescription = toko.nama,
                modifier = Modifier
                    .size(80.dp)
                    .clip(ShapeMedium),
                contentScale = ContentScale.Crop
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(toko.nama, style = Typography.h4)
                Text("${toko.jamBuka} - ${toko.jamTutup}", style = Typography.caption)
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Progress Bar Online
                LinearProgressIndicator(
                    progress = toko.onlineCount.toFloat() / toko.totalKaryawan,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(ShapeCircle),
                    color = if (toko.onlineCount == toko.totalKaryawan) Secondary else Warning,
                    trackColor = Divider
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Row {
                    Text(
                        "${toko.onlineCount}/${toko.totalKaryawan} Online",
                        style = Typography.caption,
                        color = Secondary
                    )
                    if (toko.telatCount > 0) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "• ${toko.telatCount} Telat",
                            style = Typography.caption,
                            color = Danger
                        )
                    }
                }
            }
            
            Icon(Icons.Default.ChevronRight, "Detail", tint = TextTertiary)
        }
    }
}
```

**D. Activity Feed**
```kotlin
@Composable
fun ActivityFeedItem(activity: ActivityItem) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.Top
    ) {
        // Status Indicator
        Box(
            modifier = Modifier
                .size(12.dp)
                .clip(ShapeCircle)
                .background(
                    when (activity.status) {
                        "Ontime" -> Secondary
                        "Telat" -> Warning
                        "Pending" -> Info
                        else -> TextTertiary
                    }
                )
        )
        
        Spacer(modifier = Modifier.width(12.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(activity.nama, style = Typography.body1, fontWeight = FontWeight.Medium)
            Text(
                "${activity.waktu} · ${activity.toko}",
                style = Typography.caption
            )
            
            // Status Chip
            Surface(
                shape = ShapeSmall,
                color = when (activity.status) {
                    "Ontime" -> SecondaryLight
                    "Telat" -> Warning.copy(alpha = 0.1f)
                    "Pending" -> PrimaryLight
                    else -> Divider
                },
                modifier = Modifier.padding(top = 4.dp)
            ) {
                Text(
                    activity.status,
                    style = Typography.caption,
                    color = when (activity.status) {
                        "Ontime" -> Secondary
                        "Telat" -> Warning
                        "Pending" -> Primary
                        else -> TextSecondary
                    },
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                )
            }
        }
    }
}
```

---

### 📱 SCREEN 3: MONITORING TOKO (Real-time)

```
┌─────────────────────────────┐
│ ← Monitoring Toko    🔄     │
│                             │
│ ┌─────────────────────────┐ │
│ │  [🔍 Cari Toko...]     │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  MAP VIEW / LIST VIEW   │ │
│ │  [Map] [List]          │ │
│ │                         │ │
│ │  ┌─────────────────┐   │ │
│ │  │                 │   │ │
│ │  │    [MAP]        │   │ │
│ │  │    Google Maps  │   │ │
│ │  │                 │   │ │
│ │  │  📍Toko Pusat   │   │ │
│ │  │  📍Toko A       │   │ │
│ │  │  📍Toko B       │   │ │
│ │  └─────────────────┘   │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  🏪 Toko Pusat         │ │
│ │  📍 Jl. Sudirman No.1  │ │
│ │                         │ │
│ │  KARYAWAN ONLINE:      │ │
│ │  ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐  │ │
│ │  │👤│ │👤│ │👤│ │👤│ │➕│  │ │
│ │  └─┘ └─┘ └─┘ └─┘ └─┘  │ │
│ │  Andi Budi Cici Dedi   │ │
│ │  ✅  ⏰  ✅  ✅        │ │
│ │                         │ │
│ │  KARYAWAN OFFLINE:     │ │
│ │  ┌─┐ ┌─┐ ┌─┐          │ │
│ │  │👤│ │👤│ │👤│          │ │
│ │  └─┘ └─┘ └─┘          │ │
│ │  Evi  Fani  Gani       │ │
│ │  ⚪  ⚪  ⚪            │ │
│ │                         │ │
│ │  [Detail] [Chat Group] │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

#### Detail Karyawan Bottom Sheet
```
┌─────────────────────────────┐
│        ───────              │  ← Drag handle
│                             │
│  ┌───┐  Andi Wijaya        │
│  │IMG│  Karyawan · Shift Pagi│
│  └───┘                      │
│                             │
│  📅 Jadwal Hari Ini:        │
│  Senin, 29 Mei 2026         │
│  08:00 - 17:00              │
│                             │
│  ⏰ Absensi:                │
│  Masuk: 08:02 ✅ Ontime     │
│  Pulang: — (Belum)          │
│                             │
│  📍 Lokasi:                 │
│  200m dari toko (Valid)     │
│  [🗺️ Lihat di Peta]        │
│                             │
│  [📞 Telepon] [💬 Chat]     │
│                             │
└─────────────────────────────┘
```

---

### 📱 SCREEN 4: MANAJEMEN KARYAWAN

```
┌─────────────────────────────┐
│ ← Karyawan          [+]     │
│                             │
│ ┌─────────────────────────┐ │
│ │  [🔍 Cari karyawan...] │ │
│ └─────────────────────────┘ │
│                             │
│  Filter: [Semua ▼] [Aktif ▼]│
│                             │
│ ┌─────────────────────────┐ │
│ │  ┌───┐                 │ │
│ │  │IMG│  Andi Wijaya    │ │
│ │  └───┘  KRY001         │ │
│ │         📱 0812xxxx     │ │
│ │         🏪 Toko Pusat   │ │
│ │         ⏰ Shift Pagi   │ │
│ │                         │ │
│ │  [✏️] [🗑️] [📋 Jadwal] │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  ┌───┐                 │ │
│ │  │IMG│  Budi Santoso   │ │
│ │  └───┘  KRY002         │ │
│ │         📱 0813xxxx     │ │
│ │         🏪 Toko A       │ │
│ │         ⏰ Shift Siang  │ │
│ │         ⚠️ Nonaktif     │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

#### Form Tambah/Edit Karyawan
```
┌─────────────────────────────┐
│ ← Tambah Karyawan    💾     │
│                             │
│  ┌─────────────────────────┐│
│  │    [📷 FOTO PROFIL]    ││
│  │      Tap untuk upload    ││
│  └─────────────────────────┘│
│                             │
│  Nama Lengkap *            │
│  ┌─────────────────────────┐│
│  │                         ││
│  └─────────────────────────┘│
│                             │
│  PIN (4 digit) *           │
│  ┌─────────────────────────┐│
│  │    ••••                 ││
│  └─────────────────────────┘│
│                             │
│  Jabatan *                 │
│  ┌─────────────────────────┐│
│  │ Karyawan ▼             ││
│  └─────────────────────────┘│
│  [Admin] [Owner] [Karyawan]│
│                             │
│  Nomor HP                  │
│  ┌─────────────────────────┐│
│  │ +62                     ││
│  └─────────────────────────┘│
│                             │
│  Email                     │
│  ┌─────────────────────────┐│
│  │                         ││
│  └─────────────────────────┘│
│                             │
│  Toko Default              │
│  ┌─────────────────────────┐│
│  │ Pilih Toko... ▼        ││
│  └─────────────────────────┘│
│                             │
│  Shift Default             │
│  ┌─────────────────────────┐│
│  │ Pilih Shift... ▼       ││
│  └─────────────────────────┘│
│                             │
│  Tanggal Masuk             │
│  ┌─────────────────────────┐│
│  │ 29/05/2026 📅          ││
│  └─────────────────────────┘│
│                             │
│  [SIMPAN]                  │
│                             │
└─────────────────────────────┘
```

---

### 📱 SCREEN 5: MANAJEMEN JADWAL (Template Mingguan)

```
┌─────────────────────────────┐
│ ← Jadwal Karyawan     [+]   │
│                             │
│  Andi Wijaya (KRY001)      │
│                             │
│  ┌─────────────────────────┐│
│  │  Template Shift: ▼     ││
│  │  [Minggu 1] [Minggu 2] ││
│  │  [Minggu 3] [Minggu 4] ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  SENIN    29 Mei       ││
│  │  🏪 Toko Pusat         ││
│  │  ⏰ 08:00 - 17:00      ││
│  │  [✏️] [🗑️]            ││
│  ├─────────────────────────┤│
│  │  SELASA   30 Mei       ││
│  │  🏪 Toko A             ││
│  │  ⏰ 14:00 - 22:00      ││
│  │  [✏️] [🗑️]            ││
│  ├─────────────────────────┤│
│  │  RABU     31 Mei       ││
│  │  🏖️ LIBUR              ││
│  │  [✏️]                  ││
│  ├─────────────────────────┤│
│  │  KAMIS    01 Jun       ││
│  │  🏪 Toko Pusat         ││
│  │  ⏰ 08:00 - 17:00      ││
│  │  [✏️] [🗑️]            ││
│  ├─────────────────────────┤│
│  │  JUMAT    02 Jun       ││
│  │  🏪 Toko Pusat         ││
│  │  ⏰ 08:00 - 17:00      ││
│  │  [✏️] [🗑️]            ││
│  ├─────────────────────────┤│
│  │  SABTU    03 Jun       ││
│  │  🏖️ LIBUR              ││
│  │  [✏️]                  ││
│  ├─────────────────────────┤│
│  │  MINGGU   04 Jun       ││
│  │  🏖️ LIBUR              ││
│  │  [✏️]                  ││
│  └─────────────────────────┘│
│                             │
│  [💾 Simpan Template]      │
│  [🔄 Terapkan ke Periode]  │
│                             │
└─────────────────────────────┘
```

#### Dialog Tambah Jadwal
```
┌─────────────────────────────┐
│      Tambah Jadwal    [X]   │
│                             │
│  Hari:                     │
│  [Sen] [Sel] [Rab] [Kam]   │
│  [Jum] [Sab] [Min]         │
│                             │
│  Toko:                     │
│  ┌─────────────────────────┐│
│  │ Pilih Toko... ▼        ││
│  └─────────────────────────┘│
│                             │
│  Shift:                    │
│  ┌─────────────────────────┐│
│  │ Pilih Shift... ▼       ││
│  └─────────────────────────┘│
│                             │
│  Periode Aktif:            │
│  Dari: [01/06/2026] 📅    │
│  Sampai: [31/12/2026] 📅  │
│                             │
│  [SIMPAN]                  │
│                             │
└─────────────────────────────┘
```

---

### 📱 SCREEN 6: APPROVAL CENTER

```
┌─────────────────────────────┐
│ ← Persetujuan         [3]   │
│                             │
│  ┌─────────────────────────┐│
│  │  [⏰ Lembur] [📋 Izin]  ││
│  │  [⇆ Tukar Shift]       ││
│  └─────────────────────────┘│
│                             │
│  LEMBUR PENDING (2)        │
│                             │
│ ┌─────────────────────────┐ │
│ │  ┌───┐  Andi Wijaya    │ │
│ │  │IMG│  KRY001          │ │
│ │  └───┘  📅 29 Mei 2026 │ │
│ │         ⏰ Mulai: 17:00 │ │
│ │         🏪 Toko Pusat   │ │
│ │         📝 Lembur stok  │ │
│ │                         │ │
│ │  [FOTO LEMBUR]         │ │
│ │  ┌─────────────────┐   │ │
│ │  │                 │   │ │
│ │  │   [Preview]     │   │ │
│ │  └─────────────────┘   │ │
│ │                         │ │
│ │  [✅ Setuju] [❌ Tolak]│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  ┌───┐  Budi Santoso   │ │
│ │  │IMG│  KRY002          │ │
│ │  └───┘  📅 29 Mei 2026 │ │
│ │         ⏰ Mulai: 18:00 │ │
│ │         🏪 Toko A       │ │
│ │         📝 Raport bulan │ │
│ │                         │ │
│ │  [✅ Setuju] [❌ Tolak]│ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

#### Dialog Konfirmasi
```
┌─────────────────────────────┐
│                             │
│      ⚠️ Konfirmasi         │
│                             │
│  Setujui lembur Andi       │
│  Wijaya?                   │
│                             │
│  Durasi akan dihitung      │
│  otomatis saat pulang.     │
│                             │
│  [BATAL]    [SETUJU]       │
│                             │
└─────────────────────────────┘
```

---

### 📱 SCREEN 7: LAPORAN & ANALITIK

```
┌─────────────────────────────┐
│ ← Laporan            [📤]   │
│                             │
│  ┌─────────────────────────┐│
│  │  [Harian ▼]            ││
│  │  [📅 29 Mei 2026]      ││
│  └─────────────────────────┘│
│                             │
│  FILTER:                   │
│  Toko: [Semua ▼]           │
│  Shift: [Semua ▼]          │
│  Karyawan: [Semua ▼]       │
│                             │
│  ┌─────────────────────────┐│
│  │  📊 STATISTIK          ││
│  │  ────────────────────  ││
│  │                        ││
│  │  [PIE CHART]           ││
│  │  Hadir: 20   Telat: 3  ││
│  │  Izin: 2     Cuti: 1   ││
│  │  Alfa: 0               ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  📈 TREND MINGGUAN     ││
│  │  [LINE CHART]          ││
│  │                        ││
│  │  Sen Sel Rab Kam Jum   ││
│  │  ████░░░░████░░░░      ││
│  └─────────────────────────┘│
│                             │
│  DAFTAR ABSENSI:           │
│  ┌─────────────────────────┐│
│  │  Andi Wijaya           ││
│  │  ✅ 08:02 - 17:05      ││
│  │  🏪 Toko Pusat         ││
│  │  [📷] [📍] [📋 Detail] ││
│  ├─────────────────────────┤│
│  │  Budi Santoso          ││
│  │  ⏰ 08:25 - 17:00      ││
│  │  🏪 Toko A             ││
│  │  Telat: 25 menit       ││
│  │  [📷] [📍] [📋 Detail] ││
│  └─────────────────────────┘│
│                             │
│  [📥 Export Excel]         │
│  [📤 Export PDF]           │
│                             │
└─────────────────────────────┘
```

---

### 📱 SCREEN 8: PENGATURAN

```
┌─────────────────────────────┐
│ ← Pengaturan                │
│                             │
│  AKUN                      │
│  ┌─────────────────────────┐│
│  │  👤 Profil Saya    >   ││
│  │  🔒 Ganti PIN      >   ││
│  │  🔔 Notifikasi     >   ││
│  └─────────────────────────┘│
│                             │
│  APLIKASI                  │
│  ┌─────────────────────────┐│
│  │  🎨 Tema           >   ││
│  │     [Light] [Dark] [System]│
│  │  🌐 Bahasa         >   ││
│  │     [Indonesia ▼]      ││
│  │  📍 GPS Validation >   ││
│  │     [STRICT ▼]         ││
│  └─────────────────────────┘│
│                             │
│  MANAJEMEN DATA            │
│  ┌─────────────────────────┐│
│  │  🏪 Manajemen Toko >   ││
│  │  ⏰ Manajemen Shift >  ││
│  │  📋 Jenis Izin     >   ││
│  │  💰 Pengaturan Gaji >  ││
│  └─────────────────────────┘│
│                             │
│  SISTEM                    │
│  ┌─────────────────────────┐│
│  │  🔄 Sinkronisasi   >   ││
│  │  💾 Cadangkan Data >   ││
│  │  🗑️ Hapus Cache    >   ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  ℹ️ Tentang Aplikasi   ││
│  │  v3.0.1                ││
│  │  © 2026 Nafindo Group  ││
│  └─────────────────────────┘│
│                             │
│  [🚪 Keluar]               │
│                             │
└─────────────────────────────┘
```

---

## 5. KOMPONEN UI REUSABLE

### 5.1 Custom Components

```kotlin
// 1. Status Chip
@Composable
fun StatusChip(
    status: String,
    modifier: Modifier = Modifier
) {
    val (bgColor, textColor) = when (status.lowercase()) {
        "ontime", "approved", "selesai", "aktif" -> SecondaryLight to Secondary
        "telat", "pending", "proses" -> Warning.copy(alpha = 0.1f) to Warning
        "rejected", "nonaktif", "alfa" -> DangerLight to Danger
        else -> Divider to TextSecondary
    }
    
    Surface(
        shape = ShapeSmall,
        color = bgColor,
        modifier = modifier
    ) {
        Text(
            status,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
            style = Typography.caption,
            color = textColor,
            fontWeight = FontWeight.Medium
        )
    }
}

// 2. Info Row
@Composable
fun InfoRow(
    icon: ImageVector,
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = TextTertiary, modifier = Modifier.size(20.dp))
        Spacer(modifier = Modifier.width(12.dp))
        Text(label, style = Typography.body2, color = TextSecondary)
        Spacer(modifier = Modifier.weight(1f))
        Text(value, style = Typography.body1, fontWeight = FontWeight.Medium)
    }
}

// 3. Loading Shimmer
@Composable
fun ShimmerCard(modifier: Modifier = Modifier) {
    val shimmerColors = listOf(
        Color.LightGray.copy(alpha = 0.6f),
        Color.LightGray.copy(alpha = 0.2f),
        Color.LightGray.copy(alpha = 0.6f)
    )
    // ... shimmer implementation
}

// 4. Empty State
@Composable
fun EmptyState(
    icon: ImageVector,
    title: String,
    subtitle: String,
    action: @Composable (() -> Unit)? = null
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(icon, null, modifier = Modifier.size(80.dp), tint = TextTertiary)
        Spacer(modifier = Modifier.height(16.dp))
        Text(title, style = Typography.h4, color = TextSecondary)
        Text(subtitle, style = Typography.body2, color = TextTertiary, textAlign = TextAlign.Center)
        if (action != null) {
            Spacer(modifier = Modifier.height(16.dp))
            action()
        }
    }
}

// 5. Search Bar
@Composable
fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    placeholder: String = "Cari...",
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        modifier = modifier.fillMaxWidth(),
        placeholder = { Text(placeholder) },
        leadingIcon = { Icon(Icons.Default.Search, null) },
        trailingIcon = {
            if (query.isNotEmpty()) {
                IconButton(onClick = { onQueryChange("") }) {
                    Icon(Icons.Default.Clear, null)
                }
            }
        },
        shape = ShapeLarge,
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = Surface,
            unfocusedContainerColor = Surface
        ),
        singleLine = true
    )
}
```

---

## 6. NAVIGASI & BOTTOM BAR

```kotlin
@Composable
fun AdminBottomNavigation(
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    val items = listOf(
        NavItem("home", "Beranda", Icons.Default.Home),
        NavItem("monitor", "Monitor", Icons.Default.LocationOn),
        NavItem("add", "Tambah", Icons.Default.Add, isFAB = true),
        NavItem("report", "Laporan", Icons.Default.Assessment),
        NavItem("profile", "Profil", Icons.Default.Person)
    )
    
    BottomAppBar(
        containerColor = Surface,
        tonalElevation = ElevationBottomSheet
    ) {
        items.forEach { item ->
            if (item.isFAB) {
                FloatingActionButton(
                    onClick = { /* Show quick action menu */ },
                    containerColor = Primary,
                    shape = ShapeCircle,
                    elevation = FloatingActionButtonDefaults.elevation(defaultElevation = ElevationFAB)
                ) {
                    Icon(item.icon, item.label, tint = Color.White)
                }
            } else {
                NavigationBarItem(
                    icon = { Icon(item.icon, item.label) },
                    label = { Text(item.label) },
                    selected = currentRoute == item.route,
                    onClick = { onNavigate(item.route) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Primary,
                        selectedTextColor = Primary,
                        indicatorColor = PrimaryLight
                    )
                )
            }
        }
    }
}
```

**Quick Action FAB Menu:**
```
    [📋] Izin
[👥]    [+]    [⏰]
Karyawan      Lembur
    [🏪] Toko
```

---

## 7. REAL-TIME FEATURES

### 7.1 Pusher Integration
```kotlin
class PusherManager {
    private val pusher = Pusher("3c015a6e56c1e4beb0ea", PusherOptions().apply {
        setCluster("ap1")
    })
    
    fun connect() {
        pusher.connect(object : ConnectionEventListener {
            override fun onConnectionStateChange(change: ConnectionStateChange) {
                Log.d("Pusher", "State: ${change.currentState}")
            }
            override fun onError(message: String, code: String, e: Exception) {
                Log.e("Pusher", "Error: $message")
            }
        })
    }
    
    fun subscribeAbsenAlerts(onNewAbsen: (AbsenAlert) -> Unit) {
        val channel = pusher.subscribe("pinguin-chat")
        channel.bind("absen-alert") { event ->
            val data = Gson().fromJson(event.data, AbsenAlert::class.java)
            onNewAbsen(data)
        }
    }
}
```

### 7.2 Push Notification Handler
```kotlin
class AdminFirebaseService : FirebaseMessagingService() {
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val type = remoteMessage.data["type"]
        
        when (type) {
            "absen_masuk" -> showAbsenNotification(remoteMessage)
            "lembur" -> showApprovalNotification(remoteMessage)
            "izin" -> showApprovalNotification(remoteMessage)
            "tukar_shift" -> showSwapNotification(remoteMessage)
            "new_message" -> showChatNotification(remoteMessage)
        }
        
        // Update badge count
        updateBadgeCount()
    }
}
```

---

## 8. STATE MANAGEMENT (MVVM)

```kotlin
// ViewModel Dashboard
@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val repository: AdminRepository,
    private val pusherManager: PusherManager
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()
    
    init {
        loadDashboard()
        setupRealtimeUpdates()
    }
    
    private fun loadDashboard() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                val dashboard = repository.getDashboardData()
                val tokoList = repository.getMonitoringToko()
                
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        stats = dashboard.stats,
                        tokoList = tokoList.toko,
                        error = null
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, error = e.message)
                }
            }
        }
    }
    
    private fun setupRealtimeUpdates() {
        pusherManager.subscribeAbsenAlerts { alert ->
            _uiState.update { current ->
                current.copy(
                    recentActivities = listOf(alert.toActivity()) + current.recentActivities.take(9),
                    stats = current.stats.copy(
                        hadirHariIni = current.stats.hadirHariIni + 1
                    )
                )
            }
            // Show in-app notification
            showInAppNotification(alert)
        }
    }
}
```

---

## 9. API INTEGRATION MAP

| Screen | API Action | Method |
|--------|-----------|--------|
| Dashboard | `getDashboardData` | POST |
| Dashboard | `getMonitoringToko` | POST |
| Toko List | `getTokoList` | POST |
| Toko Detail | `getStores` | POST |
| Add Toko | `saveToko` | POST |
| Edit Toko | `updateToko` | POST |
| Karyawan List | `getKaryawanList` | POST |
| Add Karyawan | `saveKaryawan` | POST |
| Edit Karyawan | `updateKaryawan` | POST |
| Jadwal | `getJadwalKaryawan` | POST |
| Save Jadwal | `saveJadwalKaryawan` | POST |
| Approval | `getPendingApprovals` | POST |
| Approve Lembur | `approveLembur` | POST |
| Approve Izin | `approveIzin` | POST |
| Laporan | `getLaporanAbsensi` | POST |
| Chat | `getChatMessages` | POST |
| Send Chat | `sendChatMessage` | POST |
| Settings | `getSettingGlobal` | POST |
| Update Settings | `updateSettingGlobal` | POST |

---

## 10. RESPONSIVE & ADAPTIVE

### Tablet Layout (Landscape)
```
┌─────────────────────────────────────────────────────────┐
│  [Sidebar]    │  DASHBOARD CONTENT                      │
│  ─────────    │  ─────────────────────────────────────  │
│  🏠 Beranda   │  ┌──────────┐ ┌─────────────────────┐ │
│  🏪 Toko      │  │ Stats    │ │ Monitoring Toko     │ │
│  👥 Karyawan  │  │ Cards    │ │                     │ │
│  📅 Jadwal    │  │          │ │ [Toko cards...]     │ │
│  📋 Approval  │  └──────────┘ └─────────────────────┘ │
│  📊 Laporan   │  ┌─────────────────────────────────────┐│
│  💬 Chat      │  │ Activity Feed                       ││
│  ⚙️ Settings  │  │                                     ││
│               │  └─────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 11. ANIMATIONS & INTERACTIONS

| Interaction | Animation |
|-------------|-----------|
| Pull Refresh | Circular progress + bounce |
| Card Tap | Scale 0.98 + elevation increase |
| List Item Enter | Fade in + slide up (staggered 50ms) |
| FAB Press | Rotation 45° + menu expansion |
| Status Change | Color transition 300ms |
| Notification | Slide down from top + vibration |
| Image Load | Crossfade 300ms + shimmer placeholder |
| Bottom Sheet | Slide up + scrim fade |
| Dialog | Scale up + fade in |

---

## 12. ERROR HANDLING & EMPTY STATES

```
┌─────────────────────────────┐
│                             │
│      📡                     │
│      Koneksi Terputus       │
│                             │
│      Periksa koneksi        │
│      internet Anda          │
│                             │
│      [🔄 Coba Lagi]        │
│                             │
└─────────────────────────────┘

┌─────────────────────────────┐
│                             │
│      📭                     │
│      Tidak Ada Data         │
│                             │
│      Belum ada karyawan     │
│      yang terdaftar         │
│                             │
│      [+ Tambah Karyawan]   │
│                             │
└─────────────────────────────┘
```

---

## 13. PERFORMANCE OPTIMIZATION

- **Image Loading**: Coil with caching (disk + memory)
- **List**: LazyColumn with key + rememberSaveable
- **API**: Retrofit with OkHttp caching (5 min for dashboard)
- **Database**: Room for offline cache
- **Sync**: WorkManager for background sync every 15 min
- **Delta Sync**: `getDeltas` with syncType parameter

---

## 14. SECURITY

- **PIN**: 4-digit with brute force protection (3 attempts → 5 min lock)
- **Device Binding**: 1 device per account (force override available)
- **Biometric**: Optional fingerprint/face unlock
- **SSL Pinning**: For API communication
- **Screenshot**: Disabled on sensitive screens

---

Dokumen ini mencakup seluruh spesifikasi untuk membangun **Admin Dashboard Native Android** yang modern, profesional, dan fully integrated dengan backend Google Apps Script yang sudah ada. Semua komponen UI dirancang dengan Material Design 3 principles dan siap untuk implementasi dengan Jetpack Compose.

Apakah Anda ingin saya elaborasi lebih detail untuk screen tertentu, atau membuatkan file Kotlin/Compose langsung untuk komponen spesifik?