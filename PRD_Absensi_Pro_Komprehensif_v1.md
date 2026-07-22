# PRD Komprehensif — Absensi Pro (Pinguin Cell)
### Versi: 1.0 | Tanggal: 12 Juli 2026
### Berdasarkan: Analisis kode aktual folder `d:\absen`

---

## 1. Gambaran Umum Sistem

**Absensi Pro** adalah sistem manajemen kehadiran karyawan multi-toko yang terdiri dari **3 layer**:

| Layer | Teknologi | Lokasi |
|---|---|---|
| **Backend** | Google Apps Script (GAS) + Google Sheets | `code.gs` |
| **APK Admin** | Kotlin + Jetpack Compose | `absen-admin/` |
| **APK Karyawan** | Kotlin + Jetpack Compose | `absen-native/` |

### Arsitektur

```
┌──────────────────┐     ┌────────────────────────┐     ┌──────────────────┐
│   APK Karyawan   │────▶│   Google Apps Script   │◀────│    APK Admin     │
│  (absen-native)  │     │      (code.gs)         │     │  (absen-admin)   │
└──────────────────┘     │          │              │     └──────────────────┘
                         │    Google Sheets        │
                         │    Google Drive         │
                         │    Firebase FCM         │
                         │    Pusher (Realtime)    │
                         └────────────────────────┘
```

### Backend: Google Apps Script

- **Base URL**: `https://script.google.com/macros/s/.../exec`
- **Spreadsheet ID**: `1CC10iigHkBpSpGxL_vtc_lwBAC7vIsqNLoy3pXO2MVc`
- **Komunikasi**: REST API via `POST /exec` dengan JSON `{ action: "namaAction", ...params }`
- **Timeout**: 90 detik (OkHttp client)

### Sheet Database

| Sheet | Fungsi |
|---|---|
| `MASTER_KARYAWAN` | Data karyawan (ID, Nama, PIN, Jabatan, Foto, KTP, dll) |
| `MASTER_TOKO` | Data toko (ID, Nama, Alamat, Lat/Long, Radius, Jam, Foto) |
| `SHIFT_TOKO` | Shift per toko (ID, Nama Shift, Jam Masuk/Pulang, Toleransi) |
| `JADWAL_KARYAWAN` | Jadwal mingguan per karyawan |
| `TEMPLATE_JADWAL` | Template kebutuhan karyawan per toko (Pagi/Siang) |
| `ABSENSI` | Log absensi masuk/pulang |
| `LEMBUR` | Pengajuan & histori lembur |
| `IZIN_CUTI` | Pengajuan & histori izin/cuti |
| `MASTER_JENIS_IZIN` | Master jenis izin (Sakit, Cuti, dll) |
| `TUKAR_SHIFT` | Pengajuan tukar shift antar karyawan |
| `TUGAS` | Data tugas/task management |
| `LOG_TUGAS` | Log penyelesaian tugas dengan foto bukti |
| `BERITA` | Berita/pengumuman |
| `DATA_GAJI` | Data gaji karyawan |
| `DATA_KASBON` | Data kasbon karyawan |
| `CHAT` | Pesan chat grup |
| `SETTING_GLOBAL` | Pengaturan sistem (mode jadwal, toleransi, dll) |
| `LOG_ERROR` | Log error backend |

---

## 2. APK Karyawan (`absen-native/`)

### 2.1 Autentikasi & Keamanan

| Fitur | Detail |
|---|---|
| **Login** | ID Karyawan + PIN 6-digit |
| **Device Lock** | Satu akun hanya bisa login di satu device. `deviceId` & `deviceName` dikirim saat login. |
| **Force Login** | Parameter `force: true` untuk override device lock |
| **Face ID** | Registrasi wajah via `registerFaceId` (encrypted face descriptor) |
| **FCM Token** | Token Firebase didaftarkan via `registerFCMToken` untuk push notification |
| **Auto Update** | `checkUpdate` mengecek versi terbaru, jika ada → paksa download APK |
| **Splash Screen** | Cek session & auto-login dari SharedPreferences |

### 2.2 Navigasi

**Bottom Navigation Bar** (5 tab):
1. **Beranda** (`HomeScreen`)
2. **Absen** (`AbsensiScreen`)
3. **Tugas** (`TugasScreen`)
4. **Chat** (`ChatScreen`)
5. **Profil/Lainnya** (drawer menu)

**Menu Drawer/Tambahan**:
- Jadwal Mingguan
- Rekap Bulanan
- Gaji & Slip Gaji
- Izin/Cuti
- Lembur
- Tukar Shift
- Berita
- Pengaturan

### 2.3 Fitur Detail

#### 2.3.1 Beranda (`HomeScreen`)
- Salam + nama karyawan + foto profil
- Info jadwal hari ini (toko, shift, jam masuk/pulang)
- Status absensi hari ini (sudah masuk/belum, jam masuk, jam pulang)
- Quick actions: Absen, Izin, Lembur
- Notifikasi tugas pending

#### 2.3.2 Absensi (`AbsensiScreen` + `AbsensiViewModel`)
- **Absen Masuk** (`absenMasuk`):
  - Foto selfie wajah (kamera depan)
  - Validasi GPS lokasi (lat/lng)
  - Validasi di dalam radius toko
  - Data terenkripsi (`isEncrypted: true`)
  - Kirim: ID Karyawan, Nama, ID Toko, Nama Toko, ID Shift, Nama Shift, foto base64, lat, lng
- **Absen Pulang** (`absenPulang`):
  - Foto selfie
  - GPS lokasi
  - Mode lembur opsional (`isLemburMode`)
- **Offline Support**: Outbox pattern — jika gagal kirim, disimpan lokal dan retry otomatis

#### 2.3.3 Jadwal Mingguan (`JadwalScreen` + `JadwalViewModel`)
- Tampil jadwal 7 hari (Senin-Minggu)
- Per hari: toko, shift, jam masuk/pulang, status libur
- Navigasi minggu berikut/sebelum
- Data dari `getJadwalMingguan`

#### 2.3.4 Rekap Bulanan (`RekapScreen` + `RekapViewModel`)
- **Raport Bulanan** (`getRaportBulanan`):
  - Total: Hadir, Telat, Menit Telat, Jam Kerja, Jam Lembur, Lembur, Pulang Cepat, Sakit, Izin, Cuti
  - Detail harian: tanggal, toko, shift, jam masuk/pulang, status, menit telat, jam kerja, foto masuk/pulang, durasi lembur, info swap
  - Daftar izin/cuti: tanggal, tipe, alasan, lampiran

#### 2.3.5 Pengajuan Izin/Cuti (`AjukanIzinScreen` + `IzinScreen`)
- **Ajukan Izin** (`ajukanIzin`):
  - Pilih jenis izin dari master (`getJenisIzinAktif`)
  - Tanggal mulai & selesai
  - Alasan
  - Lampiran foto (base64)
- **Riwayat Izin** (`getIzinHistory`):
  - List dengan status: Pending/Disetujui/Ditolak

#### 2.3.6 Pengajuan Lembur (`AjukanLemburScreen` + `LemburScreen`)
- **Ajukan Lembur** (`ajukanLembur`):
  - Pilih toko
  - Alasan
  - Foto bukti (base64)
- **Riwayat Lembur** (`getLemburHistory`):
  - List dengan status approval

#### 2.3.7 Tukar Shift (`TukarShiftScreen` + `TukarShiftViewModel`)
- **Ajukan Tukar** (`ajukanTukarShift`):
  - Pilih karyawan tujuan
  - Info shift saya vs shift tujuan (toko, shift, tanggal)
  - Alasan
- **Pending Tukar Shift** (`getPendingTukarShift`):
  - List pengajuan masuk
  - Approve/Reject oleh karyawan tujuan
- **Validasi**: Cek jadwal karyawan pada tanggal tertentu via `getKaryawanJadwalByDate`

#### 2.3.8 Tugas (`TugasScreen` + `TugasViewModel`)
- **List Tugas** (`getTugasList`):
  - Filter by toko/karyawan
  - Kategori: Rutin/Non-Rutin
  - Prioritas: Low/Medium/High/Urgent
  - Status: Pending/In Progress/Done
- **Update Status** (`updateTugasStatus`)
- **Submit Bukti** (`submitTugasLog`):
  - Foto bukti
  - Catatan
- **Mode Toko**: "gugur" — tugas selesai jika satu orang di toko tersebut menyelesaikan

#### 2.3.9 Berita (`BeritaScreen` + `BeritaViewModel`)
- **List Berita** (`getBeritaList`):
  - Judul, isi, kategori, gambar
  - Tanggal tayang & off
- Tampilan card dengan gambar

#### 2.3.10 Chat Grup (`ChatScreen` + `ChatViewModel`)
- **Pesan Grup** — semua karyawan + admin satu channel
- **Kirim Pesan** (`sendChatMessage`):
  - Teks biasa
  - File/gambar (base64)
  - Reply to (quote pesan)
- **Load Pesan** (`getChatMessages`): limit + offset pagination
- **Online Status** (`pingOnline`): ping periodik, tampilkan user online
- **Realtime**: Pusher channel untuk notifikasi pesan baru
- **Push Notification**: Firebase FCM

#### 2.3.11 Gaji (`GajiScreen` + `GajiViewModel`)
- **Slip Gaji** (`getSlipGaji`):
  - Bulan/tahun, gaji pokok, tunjangan, potongan, total bersih
  - Keterangan

#### 2.3.12 Sistem Pendukung

| Komponen | Detail |
|---|---|
| **Shift Reminder** | `ShiftReminderReceiver` — alarm reminder sebelum shift |
| **Offline DB** | Room database lokal untuk cache data |
| **Delta Sync** | `getDeltas` untuk sinkronisasi incremental |
| **Outbox** | Request yang gagal disimpan & auto-retry |
| **Pusher** | Realtime events untuk chat & notifikasi |
| **Firebase FCM** | Push notification untuk tugas, approval, chat |
| **Battery Optimization** | `BatteryOptimizationHelper` untuk menjaga service |
| **Auto Start** | `AutoStartHelper` untuk MIUI/EMUI/dll |

---

## 3. APK Admin (`absen-admin/`)

### 3.1 Autentikasi
- Login dengan ID Admin + PIN
- Session disimpan di SharedPreferences
- Splash screen dengan auto-login

### 3.2 Navigasi

**Bottom Bar** (4 tab):
1. **Beranda** (`AdminDashboardScreen`)
2. **Monitor** (`AdminMonitorScreen`)
3. **Quick Action FAB** (tengah)
4. **Laporan** (`AdminReportScreen`)
5. **Lainnya** (Profile/menu)

**Drawer Menu** (side navigation):
- Manajemen Toko
- Manajemen Karyawan
- Manajemen Shift
- Manajemen Jadwal
- Manajemen Gaji
- Manajemen Tugas
- Manajemen Berita
- Pengaturan Aplikasi
- Keluar Akun

### 3.3 Fitur Detail

#### 3.3.1 Dashboard (`AdminDashboardScreen`)
- **Statistik** (`getDashboardData`):
  - Total karyawan
  - Hadir hari ini
  - Telat hari ini
  - Pending approval
  - Izin hari ini
- Card visual dengan ikon & warna
- Quick actions

#### 3.3.2 Monitor Toko (`AdminMonitorScreen`)
- **Data Real-time** (`getMonitoringToko`):
  - Per toko: nama, foto, jam buka/tutup
  - Total karyawan vs online
  - Status karyawan: Hadir/Telat/Belum Masuk
  - Lokasi GPS karyawan (lat/lng)
  - Menit keterlambatan
- Peta/visualisasi per toko

#### 3.3.3 Laporan (`AdminReportScreen`)
- **Absensi Lengkap** (`getAbsensiHariIniLengkap`):
  - Filter: tanggal, toko, shift
  - Data: nama, toko, shift, jam masuk/pulang, durasi kerja, durasi lembur, status, menit telat, foto masuk/pulang/lembur
- **Raport Bulanan Per Karyawan** (`getRaportBulanan`)
- **Laporan Izin** (`getIzinPeriode`)

#### 3.3.4 Approval (`AdminApprovalScreen`)
- **Pending Approvals** (`getPendingApprovals`):
  - Tipe: Lembur, Izin, Kasbon, Tukar Shift
  - Detail: nama, toko, waktu, nominal
  - Foto bukti
- **Aksi**:
  - `approveLembur` / reject
  - `approveIzin` / reject
  - `approveKasbon` (+ nominal disetujui, keterangan)
  - Tukar Shift approve/reject

#### 3.3.5 Manajemen Toko (`AdminStoreScreen` + `AdminTokoFormScreen`)
- **CRUD Toko**:
  - `getTokoList` — list semua toko
  - `saveToko` — tambah toko baru (nama, alamat, lat/lng, radius GPS, jam buka/tutup, foto)
  - `updateToko` — edit toko
  - `deleteToko` — hapus toko (soft delete / permanent)
  - `uploadFotoToko` — upload foto toko (base64 → Google Drive)

#### 3.3.6 Manajemen Karyawan (`AdminEmployeeScreen` + `KaryawanFormScreen`)
- **CRUD Karyawan**:
  - `getKaryawanList` — list semua karyawan
  - `saveKaryawan` — tambah karyawan baru
  - `updateKaryawan` — edit karyawan
  - `deleteKaryawan` — hapus karyawan
- **Data Karyawan**:
  - ID, Nama, PIN, Jabatan, No HP, Email
  - Tanggal Masuk, Status (Aktif/Nonaktif)
  - Toko Default, Shift Default
  - NIK, Tempat/Tanggal Lahir, Jenis Kelamin
  - Alamat: RT/RW, Desa, Kecamatan
  - Agama, Status Kawin, Kewarganegaraan
  - Kontak Darurat (Nama + Nomor)
- **Upload Foto**:
  - `uploadFotoProfil` — foto profil (base64 → Drive)
  - `uploadFotoKtp` — foto KTP (base64 → Drive, bisa OCR)
- **Profil Lengkap**:
  - `generateProfileToken` — buat link profil yang bisa diisi karyawan sendiri
  - Token-based self-service profil

#### 3.3.7 Manajemen Shift (`AdminShiftScreen` + `AdminShiftFormScreen`)
- **CRUD Shift**:
  - `getAllShifts` — list semua shift
  - `saveShift` — tambah shift (toko, nama, jam masuk/pulang, toleransi menit)
  - `updateShift` — edit shift
  - `deleteShiftPermanent` — hapus shift
- **Relasi**: Setiap shift terikat ke satu toko

#### 3.3.8 Manajemen Jadwal (`AdminJadwalScreen` + `JadwalViewModel`)

**Tab 1: Jadwal Mingguan (Matrix Grid)**
- **Generate Otomatis** (`generateJadwalMingguan`):
  - Input: tanggal mulai & selesai (1 minggu)
  - Auto-rolling: distribusi karyawan ke toko & shift berdasarkan template
- **Tampilan Matrix Grid**:
  - Baris: hari (Senin-Minggu)
  - Kolom: per toko, dibagi Pagi & Siang
  - Warna berbeda per toko (6 palet: biru, hijau, kuning, merah, ungu, pink)
  - Foto + nama karyawan dalam sel
  - 2 foto per baris dalam sel, overflow ke baris baru
- **Drag & Drop Edit**:
  - Long press (~500ms) → drag karyawan
  - Drop ke sel lain dalam **hari yang sama** saja
  - Anti-duplikat: orang yang sama tidak bisa di slot yang sudah ada
  - Menggunakan `detectDragGesturesAfterLongPress`
  - Composable: `LongPressDraggable`, `DropTarget`, `DraggableScreen`
- **AllDay Button**: Copy jadwal Senin ke semua hari (Selasa-Minggu)
- **Simpan** (`saveJadwalMingguan`): kirim seluruh jadwal ke server
- **Navigasi Minggu**: tombol sebelum/sesudah untuk navigasi antar minggu
- **Scroll**: horizontal + vertical dalam satu container

**Tab 2: Template Kebutuhan Karyawan (`AdminJadwalKaryawanTab`)**
- Template per toko: kebutuhan Pagi & Siang
- `getTemplateJadwal` / `saveTemplateJadwal`

**Tab 3: Penempatan (`AdminPenempatanTab`)**
- Assign karyawan ke toko default

#### 3.3.9 Manajemen Gaji (`AdminSalaryScreen` + `AdminSalaryDetailScreen`)
- **List Gaji** (`getSalaries`):
  - Per karyawan: gaji pokok, lembur, transport, tunjangan, kasbon, bonus, potongan
  - Keterangan per komponen
  - Status & periode
- **Edit Gaji** (`updateSalary`):
  - Edit semua komponen gaji per karyawan
  - Keterangan per item

#### 3.3.10 Manajemen Tugas (`AdminTaskScreen`)
- **CRUD Tugas**:
  - `getTugasList` — list tugas
  - `createTugas` — buat tugas baru (judul, deskripsi, kategori, prioritas, toko, deadline, ditugaskan ke)
  - `deleteTugas` — hapus tugas
  - `getTugasLogs` — lihat log penyelesaian + foto bukti
- **Mode Toko**: "gugur" — tugas selesai jika satu orang di toko menyelesaikan
- **Kategori**: Rutin / Non-Rutin
- **Prioritas**: Low / Medium / High / Urgent

#### 3.3.11 Manajemen Berita (`AdminNewsScreen`)
- **CRUD Berita**:
  - `getBeritaList`
  - `createBerita` (judul, isi, kategori, gambar URL, tanggal tayang/off)
  - `deleteBerita`

#### 3.3.12 Chat Admin (`AdminChatScreen` + `AdminChatViewModel`)
- Sama dengan chat karyawan — satu channel grup
- Kirim teks, file, reply
- Realtime via Pusher
- Push notification via FCM

#### 3.3.13 Laporan Tugas (`AdminLogTugasScreen`)
- List log penyelesaian tugas
- Foto bukti, catatan, status verifikasi

#### 3.3.14 Pengaturan (`AdminSettingsScreen`)
- Setting global sistem
- Mode jadwal
- Toleransi keterlambatan
- Push notification test

### 3.4 Komponen Reusable

| Komponen | Lokasi | Fungsi |
|---|---|---|
| `DragAndDrop.kt` | `ui/components/` | `LongPressDraggable`, `DropTarget`, `DraggableScreen` |
| `NotificationHelper.kt` | `api/` | Manajemen notifikasi (channel, heads-up, actions) |
| `PusherManager.kt` | `api/` | Koneksi Pusher realtime |
| `PusherForegroundService.kt` | `api/` | Foreground service untuk menjaga koneksi Pusher |
| `OutboxManager.kt` | `api/` | Offline queue untuk request yang gagal |
| `OutboxProcessor.kt` | `api/` | Auto-retry outbox saat online |
| `CacheManager.kt` | `api/` | Cache management |
| `ApkDownloader.kt` | `api/` | Download & install APK update |

---

## 4. Integrasi & Komunikasi

### 4.1 Push Notification (Firebase FCM)
- **Karyawan → Server**: Registrasi token via `registerFCMToken`
- **Server → Karyawan**: Push untuk:
  - Approval izin/lembur/kasbon
  - Tugas baru
  - Chat baru
  - Tukar shift
  - Reminder shift

### 4.2 Realtime (Pusher)
- Channel untuk chat messages
- Foreground service menjaga koneksi
- Reconnect otomatis

### 4.3 Foto & File (Google Drive)
- Upload via base64 encoded string
- Server menyimpan ke Google Drive
- Return URL publik
- Digunakan untuk: foto profil, KTP, toko, absen masuk/pulang, lembur, tugas

### 4.4 OCR KTP
- `ocrKtp` — server-side OCR via Google Drive API
- Extract data KTP otomatis

---

## 5. Model Data Lengkap

### 5.1 KaryawanItem
```kotlin
ID_Karyawan, Nama, PIN, Jabatan, Tanggal_Masuk, Status,
No_HP, Email, Toko_Default, Shift_Default,
Alamat_Lengkap, Kontak_Darurat, Nama_Kontak_Darurat,
Foto_KTP, Foto_Profil, NIK, Tempat_Lahir, Tanggal_Lahir,
Jenis_Kelamin, RT_RW, Desa, Kecamatan, Agama,
Status_Kawin, Kewarganegaraan, Profile_Token, Profil_Lengkap
```

### 5.2 TokoItem
```kotlin
ID_Toko, Nama_Toko, Alamat, Lat, Long, Radius_M,
Jam_Buka, Jam_Tutup, Foto_Toko_URL, Status
```

### 5.3 ShiftToko
```kotlin
ID_Shift, ID_Toko, Nama_Toko, Nama_Shift,
Jam_Masuk, Jam_Pulang, Toleransi_Masuk_Menit, Status, Foto_Toko_URL
```

### 5.4 JadwalKaryawanMingguan
```kotlin
ID_Jadwal, ID_Karyawan, Nama, ID_Toko, Nama_Toko,
ID_Shift, Nama_Shift, Hari_Berjalan, Tanggal_Mulai,
Tanggal_Selesai, Status
```

### 5.5 AbsenMasuk/PulangRequest
```kotlin
// Masuk
action, idKaryawan, nama, idToko, namaToko, idShift,
namaShift, fotoBase64, lat, lng, isEncrypted

// Pulang
action, idKaryawan, nama, fotoBase64, lat, lng,
isLemburMode, isEncrypted
```

### 5.6 ChatMessageItem
```kotlin
idPesan, idKaryawan, nama, pesan, tipe,
fileUrl, namaFile, replyTo, waktu
```

### 5.7 AdminSalaryItem
```kotlin
idKaryawan, nama, fotoProfil, gajiPokok, gajiLembur,
lemburHours, uangTransport, tunjangan, kasbon, bonus,
potonganLain, ketGajiPokok, ketGajiLembur, ketUangTransport,
ketTunjangan, ketKasbon, ketBonus, ketPotonganLain,
keterangan, periode, status
```

### 5.8 RaportBulananResponse
```kotlin
totalHadir, totalTelat, totalMenitTelat, totalJamKerja,
totalJamLembur, totalLembur, totalPulangCepat,
totalSakit, totalIzin, totalCuti,
detailHarian: [tanggal, toko, shift, jamMasuk, jamPulang,
  status, menitTelat, jamKerja, fotoMasuk, fotoPulang,
  durasiLembur, isSwap, swapDetail],
izinCuti: [tanggalMulai, tanggalSelesai, tipe, alasan, lampiranUrl]
```

---

## 6. API Endpoints Lengkap

### Auth & System
| Action | Fungsi |
|---|---|
| `login` | Login karyawan/admin |
| `getUserInfo` | Get profil user |
| `checkUpdate` | Cek versi terbaru APK |
| `registerFCMToken` | Registrasi token push |
| `registerFaceId` | Registrasi face descriptor |
| `syncAllData` | Full sync data |
| `getDeltas` | Delta/incremental sync |
| `getSettingGlobal` | Get pengaturan global |
| `updateSettingGlobal` | Update pengaturan |
| `pingOnline` | Heartbeat user online |

### Absensi
| Action | Fungsi |
|---|---|
| `absenMasuk` | Clock-in dengan foto + GPS |
| `absenPulang` | Clock-out dengan foto + GPS |
| `getAbsenStatus` | Status absen hari ini |
| `getAbsensiHariIniLengkap` | Semua absensi hari ini (admin) |

### Jadwal
| Action | Fungsi |
|---|---|
| `getJadwalHariIni` | Jadwal hari ini per karyawan |
| `getJadwalMingguan` | Jadwal 1 minggu per karyawan |
| `getKaryawanJadwalByDate` | Jadwal karyawan pada tanggal tertentu |
| `getAllJadwalMingguan` | Semua jadwal mingguan (admin) |
| `generateJadwalMingguan` | Auto-generate jadwal (admin) |
| `saveJadwalMingguan` | Simpan jadwal setelah edit (admin) |
| `getTemplateJadwal` | Template kebutuhan per toko |
| `saveTemplateJadwal` | Simpan template |

### Izin/Cuti
| Action | Fungsi |
|---|---|
| `ajukanIzin` | Pengajuan izin/cuti |
| `getIzinHistory` | Riwayat izin karyawan |
| `getJenisIzinAktif` | Jenis izin yang aktif |
| `getSisaKuota` | Sisa kuota izin/cuti |
| `approveIzin` | Approve/reject izin (admin) |

### Lembur
| Action | Fungsi |
|---|---|
| `ajukanLembur` | Pengajuan lembur |
| `getLemburHistory` | Riwayat lembur |
| `approveLembur` | Approve/reject lembur (admin) |

### Tukar Shift
| Action | Fungsi |
|---|---|
| `ajukanTukarShift` | Ajukan tukar shift |
| `getPendingTukarShift` | Tukar shift masuk/pending |
| `approveTukarShift` | Approve tukar (karyawan tujuan) |
| `rejectTukarShift` | Reject tukar |
| `getTukarShiftHistory` | Riwayat tukar shift |

### CRUD Toko
| Action | Fungsi |
|---|---|
| `getTokoList` | List toko |
| `saveToko` | Tambah toko |
| `updateToko` | Edit toko |
| `deleteToko` | Hapus toko |
| `uploadFotoToko` | Upload foto toko |

### CRUD Shift
| Action | Fungsi |
|---|---|
| `getAllShifts` | List semua shift |
| `saveShift` | Tambah shift |
| `updateShift` | Edit shift |
| `deleteShiftPermanent` | Hapus shift |

### CRUD Karyawan
| Action | Fungsi |
|---|---|
| `getKaryawanList` | List karyawan |
| `saveKaryawan` | Tambah karyawan |
| `updateKaryawan` | Edit karyawan |
| `deleteKaryawan` | Hapus karyawan |
| `uploadFotoProfil` | Upload foto profil |
| `uploadFotoKtp` | Upload foto KTP |
| `generateProfileToken` | Generate token profil |

### Tugas
| Action | Fungsi |
|---|---|
| `getTugasList` | List tugas |
| `createTugas` | Buat tugas baru |
| `deleteTugas` | Hapus tugas |
| `updateTugasStatus` | Update status tugas |
| `submitTugasLog` | Submit bukti tugas |
| `getTugasLogs` | Log penyelesaian tugas |

### Berita
| Action | Fungsi |
|---|---|
| `getBeritaList` | List berita |
| `createBerita` | Buat berita |
| `deleteBerita` | Hapus berita |

### Chat
| Action | Fungsi |
|---|---|
| `getChatMessages` | Load pesan (pagination) |
| `sendChatMessage` | Kirim pesan |
| `sendManualPushNotification` | Push manual (admin) |

### Gaji & Kasbon
| Action | Fungsi |
|---|---|
| `getSlipGaji` | Slip gaji karyawan |
| `getSalaries` | Semua data gaji (admin) |
| `updateSalary` | Edit gaji karyawan (admin) |
| `ajukanKasbon` | Pengajuan kasbon |
| `getKasbonHistory` | Riwayat kasbon |
| `approveKasbon` | Approve kasbon (admin) |

### Dashboard & Monitoring
| Action | Fungsi |
|---|---|
| `getDashboardData` | Statistik dashboard |
| `getMonitoringToko` | Monitoring realtime per toko |
| `getRaportBulanan` | Raport bulanan karyawan |
| `getLaporanAbsensi` | Laporan absensi periode |

### OCR
| Action | Fungsi |
|---|---|
| `ocrKtp` | OCR KTP via Google Drive |

---

## 7. Teknologi & Dependencies

### APK Admin (`absen-admin/`)
| Library | Fungsi |
|---|---|
| Jetpack Compose + Material3 | UI Framework |
| Retrofit2 + Gson | HTTP Client |
| OkHttp3 | Network layer (90s timeout) |
| Coil (AsyncImage) | Image loading |
| Firebase Messaging | Push notification |
| Pusher Java Client | Realtime events |
| Navigation Compose | Navigation |
| SharedPreferences | Session storage |

### APK Karyawan (`absen-native/`)
| Library | Fungsi |
|---|---|
| Jetpack Compose + Material3 | UI Framework |
| Retrofit2 + Gson | HTTP Client |
| Coil | Image loading |
| Firebase Messaging | Push notification |
| Pusher | Realtime |
| Room Database | Offline cache |
| CameraX | Kamera untuk selfie absen |
| Google Play Location | GPS |
| Navigation Compose | Navigation |
| Splash Screen API | Splash screen |

### Backend (`code.gs`)
| Service | Fungsi |
|---|---|
| Google Sheets API | Database |
| Google Drive API | File storage |
| Firebase Admin (HTTP) | Push notification |
| OCR (Drive API) | KTP parsing |

---

## 8. Konvensi Kode

### Penamaan File
- Screen: `Admin[Nama]Screen.kt` / `[Nama]Screen.kt`
- ViewModel: `[Nama]ViewModel.kt`
- API Model: Semua dalam `ApiService.kt`
- Komponen: `ui/components/[Nama].kt`

### Arsitektur
- **MVVM**: ViewModel menggunakan `StateFlow` untuk state management
- **Repository Pattern**: Untuk offline-first di native app
- **Composition Local**: Untuk shared state (contoh: drag & drop)

### Konvensi API
- Semua endpoint: `POST /exec` dengan JSON body `{ action: "...", ...params }`
- Response: `{ success: Boolean, data/error/message: ... }`
- Upload file: base64 encoded string

---

## 9. Cara Menambah Fitur Baru

### Langkah untuk fitur baru di Admin APK:
1. **Tambah model data** di `ApiService.kt` (Request + Response data class)
2. **Tambah endpoint** di `GasApi` interface
3. **Buat ViewModel** di `ui/viewmodels/` atau `ui/[Nama]ViewModel.kt`
4. **Buat Screen** di `ui/Admin[Nama]Screen.kt`
5. **Tambah route** di `Screen.kt` (sealed class)
6. **Daftarkan composable** di `AdminMainScreen.kt` NavHost
7. **Tambah menu** di drawer/bottom bar jika perlu
8. **Tambah handler** di `code.gs` switch-case `doPost`

### Langkah untuk fitur baru di Karyawan APK:
1. **Tambah model data** di `api/ApiService.kt`
2. **Tambah endpoint** di `GasApi` interface
3. **Buat ViewModel** di `[Nama]ViewModel.kt`
4. **Buat Screen** di `[Nama]Screen.kt`
5. **Daftarkan** di `MainActivity.kt` NavHost
6. **Tambah navigasi** di HomeScreen atau drawer
7. **Tambah handler** di `code.gs`

---

## 10. Status Fitur Saat Ini

| Fitur | Admin | Karyawan | Backend |
|---|---|---|---|
| Login/Auth | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| Absensi (Masuk/Pulang) | — | ✅ | ✅ |
| Monitor Toko | ✅ | — | ✅ |
| CRUD Toko | ✅ | — | ✅ |
| CRUD Karyawan | ✅ | — | ✅ |
| CRUD Shift | ✅ | — | ✅ |
| Jadwal (View) | — | ✅ | ✅ |
| Jadwal (Generate + D&D Edit) | ✅ | — | ✅ |
| Izin/Cuti | ✅ (approve) | ✅ (ajukan) | ✅ |
| Lembur | ✅ (approve) | ✅ (ajukan) | ✅ |
| Tukar Shift | ✅ (approve) | ✅ (ajukan) | ✅ |
| Tugas | ✅ (CRUD) | ✅ (submit) | ✅ |
| Berita | ✅ (CRUD) | ✅ (view) | ✅ |
| Chat | ✅ | ✅ | ✅ |
| Gaji | ✅ (edit) | ✅ (view) | ✅ |
| Kasbon | ✅ (approve) | ✅ (ajukan) | ✅ |
| Laporan | ✅ | ✅ (rekap) | ✅ |
| Push Notification | ✅ | ✅ | ✅ |
| Realtime (Pusher) | ✅ | ✅ | ✅ |
| OCR KTP | — | — | ✅ |
| Auto Update | — | ✅ | ✅ |
| Face ID | — | ✅ | ✅ |
| Profil Token | ✅ | — | ✅ |
