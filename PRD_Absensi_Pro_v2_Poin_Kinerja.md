# PRD Komprehensif - Absensi Pro (Pinguin Cell)
### Versi: 2.0 | Tanggal: 12 Juli 2026
### Fitur Baru: Sistem Poin & Review Kinerja (Zero-Risk Integration)
### Berdasarkan: Analisis kode aktual folder d:\absen

---

## 1. Gambaran Umum Sistem

**Absensi Pro** adalah sistem manajemen kehadiran karyawan multi-toko yang terdiri dari **3 layer**:

| Layer | Teknologi | Lokasi |
|---|---|---|
| **Backend** | Google Apps Script (GAS) + Google Sheets | code.gs |
| **APK Admin** | Kotlin + Jetpack Compose | absen-admin/ |
| **APK Karyawan** | Kotlin + Jetpack Compose | absen-native/ |

### Arsitektur

```
+----------+     +----------+     +----------+
| Karyawan |---->|   GAS    |<----|  Admin   |
|  (APK)   |     | (code.gs)|     |  (APK)   |
+----------+     |    |     |     +----------+
                 | Google Sheets  |
                 | Google Drive   |
                 | Firebase FCM   |
                 | Pusher         |
                 +----------+
```

### Backend: Google Apps Script

- **Base URL**: https://script.google.com/macros/s/.../exec
- **Spreadsheet ID**: 1CC10iigHkBpSpGxL_vtc_lwBAC7vIsqNLoy3pXO2MVc
- **Komunikasi**: REST API via POST /exec dengan JSON { action: "namaAction", ...params }
- **Timeout**: 90 detik (OkHttp client)

### Sheet Database

| Sheet | Fungsi |
|---|---|---|
| MASTER_KARYAWAN | Data karyawan (ID, Nama, PIN, Jabatan, Foto, KTP, dll) |
| MASTER_TOKO | Data toko (ID, Nama, Alamat, Lat/Long, Radius, Jam, Foto) |
| SHIFT_TOKO | Shift per toko (ID, Nama Shift, Jam Masuk/Pulang, Toleransi) |
| JADWAL_KARYAWAN | Jadwal mingguan per karyawan |
| TEMPLATE_JADWAL | Template kebutuhan karyawan per toko (Pagi/Siang) |
| ABSENSI | Log absensi masuk/pulang |
| LEMBUR | Pengajuan & histori lembur |
| IZIN_CUTI | Pengajuan & histori izin/cuti |
| MASTER_JENIS_IZIN | Master jenis izin (Sakit, Cuti, dll) |
| TUKAR_SHIFT | Pengajuan tukar shift antar karyawan |
| TUGAS | Data tugas/task management |
| LOG_TUGAS | Log penyelesaian tugas dengan foto bukti |
| BERITA | Berita/pengumuman |
| DATA_GAJI | Data gaji karyawan |
| DATA_KASBON | Data kasbon karyawan |
| CHAT | Pesan chat grup |
| SETTING_GLOBAL | Pengaturan sistem (mode jadwal, toleransi, dll) |
| LOG_ERROR | Log error backend |

---

## 2. APK Karyawan (absen-native/)

### 2.1 Autentikasi & Keamanan

| Fitur | Detail |
|---|---|---|
| **Login** | ID Karyawan + PIN 6-digit |
| **Device Lock** | Satu akun hanya bisa login di satu device. deviceId & deviceName dikirim saat login. |
| **Force Login** | Parameter force: true untuk override device lock |
| **Face ID** | Registrasi wajah via registerFaceId (encrypted face descriptor) |
| **FCM Token** | Token Firebase didaftarkan via registerFCMToken untuk push notification |
| **Auto Update** | checkUpdate mengecek versi terbaru, jika ada -> paksa download APK |
| **Splash Screen** | Cek session & auto-login dari SharedPreferences |

### 2.2 Navigasi

**Bottom Navigation Bar** (5 tab):
1. **Beranda** (HomeScreen)
2. **Absen** (AbsensiScreen)
3. **Tugas** (TugasScreen)
4. **Chat** (ChatScreen)
5. **Profil/Lainnya** (drawer menu)

**Menu Drawer/Tambahan**:
- Jadwal Mingguan
- Rekap Bulanan
- Gaji & Slip Gaji
- Izin/Cuti
- Lembur
- Tukar Shift
- Berita
- **Poin & Kinerja** (BARU - Zero Risk)
- Pengaturan

### 2.3 Fitur Detail

#### 2.3.1 Beranda (HomeScreen)
- Salam + nama karyawan + foto profil
- Info jadwal hari ini (toko, shift, jam masuk/pulang)
- Status absensi hari ini (sudah masuk/belum, jam masuk, jam pulang)
- Quick actions: Absen, Izin, Lembur
- Notifikasi tugas pending
- **Widget Poin Bulanan** (BARU): Total poin bulan ini, grade, dan rekomendasi

#### 2.3.2 Absensi (AbsensiScreen + AbsensiViewModel)
- **Absen Masuk** (absenMasuk):
  - Foto selfie wajah (kamera depan)
  - Validasi GPS lokasi (lat/lng)
  - Validasi di dalam radius toko
  - Data terenkripsi (isEncrypted: true)
  - Kirim: ID Karyawan, Nama, ID Toko, Nama Toko, ID Shift, Nama Shift, foto base64, lat, lng
- **Absen Pulang** (absenPulang):
  - Foto selfie
  - GPS lokasi
  - Mode lembur opsional (isLemburMode)
- **Offline Support**: Outbox pattern - jika gagal kirim, disimpan lokal dan retry otomatis

#### 2.3.3 Jadwal Mingguan (JadwalScreen + JadwalViewModel)
- Tampil jadwal 7 hari (Senin-Minggu)
- Per hari: toko, shift, jam masuk/pulang, status libur
- Navigasi minggu berikut/sebelum
- Data dari getJadwalMingguan

#### 2.3.4 Rekap Bulanan (RekapScreen + RekapViewModel)
- **Raport Bulanan** (getRaportBulanan):
  - Total: Hadir, Telat, Menit Telat, Jam Kerja, Jam Lembur, Lembur, Pulang Cepat, Sakit, Izin, Cuti
  - Detail harian: tanggal, toko, shift, jam masuk/pulang, status, menit telat, jam kerja, foto masuk/pulang, durasi lembur, info swap
  - Daftar izin/cuti: tanggal, tipe, alasan, lampiran

#### 2.3.5 Pengajuan Izin/Cuti (AjukanIzinScreen + IzinScreen)
- **Ajukan Izin** (ajukanIzin):
  - Pilih jenis izin dari master (getJenisIzinAktif)
  - Tanggal mulai & selesai
  - Alasan
  - Lampiran foto (base64)
- **Riwayat Izin** (getIzinHistory):
  - List dengan status: Pending/Disetujui/Ditolak

#### 2.3.6 Pengajuan Lembur (AjukanLemburScreen + LemburScreen)
- **Ajukan Lembur** (ajukanLembur):
  - Pilih toko
  - Alasan
  - Foto bukti (base64)
- **Riwayat Lembur** (getLemburHistory):
  - List dengan status approval

#### 2.3.7 Tukar Shift (TukarShiftScreen + TukarShiftViewModel)
- **Ajukan Tukar** (ajukanTukarShift):
  - Pilih karyawan tujuan
  - Info shift saya vs shift tujuan (toko, shift, tanggal)
  - Alasan
- **Pending Tukar Shift** (getPendingTukarShift):
  - List pengajuan masuk
  - Approve/Reject oleh karyawan tujuan
- **Validasi**: Cek jadwal karyawan pada tanggal tertentu via getKaryawanJadwalByDate

#### 2.3.8 Tugas (TugasScreen + TugasViewModel)
- **List Tugas** (getTugasList):
  - Filter by toko/karyawan
  - Kategori: Rutin/Non-Rutin
  - Prioritas: Low/Medium/High/Urgent
  - Status: Pending/In Progress/Done
- **Update Status** (updateTugasStatus)
- **Submit Bukti** (submitTugasLog):
  - Foto bukti
  - Catatan
- **Mode Toko**: "gugur" - tugas selesai jika satu orang di toko tersebut menyelesaikan

#### 2.3.9 Berita (BeritaScreen + BeritaViewModel)
- **List Berita** (getBeritaList):
  - Judul, isi, kategori, gambar
  - Tanggal tayang & off
- Tampilan card dengan gambar

#### 2.3.10 Chat Grup (ChatScreen + ChatViewModel)
- **Pesan Grup** - semua karyawan + admin satu channel
- **Kirim Pesan** (sendChatMessage):
  - Teks biasa
  - File/gambar (base64)
  - Reply to (quote pesan)
- **Load Pesan** (getChatMessages): limit + offset pagination
- **Online Status** (pingOnline): ping periodik, tampilkan user online
- **Realtime**: Pusher channel untuk notifikasi pesan baru
- **Push Notification**: Firebase FCM

#### 2.3.11 Gaji (GajiScreen + GajiViewModel)
- **Slip Gaji** (getSlipGaji):
  - Bulan/tahun, gaji pokok, tunjangan, potongan, total bersih
  - Keterangan

#### 2.3.12 Poin & Kinerja (PoinKinerjaScreen + PoinKinerjaViewModel) - BARU
- **Score Card Bulanan** (getMyScorecard):
  - Total Poin (0-500), Grade (A+/A/B+/B/C/D/E), Rekomendasi
  - Breakdown: Poin Kehadiran (0-500, bobot 50%), Poin Tugas (0-1000, bobot 50%)
  - Detail kehadiran: Hadir tepat waktu, terlambat ringan, terlambat berat, izin, alpa
  - Detail tugas: Completion Rate, On-Time Rate, Quality Rate
- **Trend 6 Bulan Terakhir**: Grafik pergerakan poin dan grade
- **Riwayat Bulanan**: Tabel periode, kehadiran, tugas, total, grade
- **Ranking Toko**: Peringkat karyawan di toko yang sama
- **Rekomendasi**: BONUS_ELIGIBLE, RETAIN, WATCH, REVIEW, NOT_RECOMMENDED

---

## 3. APK Admin (absen-admin/)

### 3.1 Autentikasi
- Login dengan ID Admin + PIN
- Session disimpan di SharedPreferences
- Splash screen dengan auto-login

### 3.2 Navigasi

**Bottom Bar** (4 tab):
1. **Beranda** (AdminDashboardScreen)
2. **Monitor** (AdminMonitorScreen)
3. **Quick Action FAB** (tengah)
4. **Laporan** (AdminReportScreen)
5. **Lainnya** (Profile/menu)

**Drawer Menu** (side navigation):
- Manajemen Toko
- Manajemen Karyawan
- Manajemen Shift
- Manajemen Jadwal
- Manajemen Gaji
- Manajemen Tugas
- Manajemen Berita
- **Poin & Kinerja** (BARU - Zero Risk)
- Pengaturan Aplikasi
- Keluar Akun

### 3.3 Fitur Detail

#### 3.3.1 Dashboard (AdminDashboardScreen)
- **Statistik** (getDashboardData):
  - Total karyawan
  - Hadir hari ini
  - Telat hari ini
  - Pending approval
  - Izin hari ini
- Card visual dengan ikon & warna
- Quick actions
- **Widget Ringkasan Poin** (BARU): Jumlah karyawan per grade, rekomendasi

#### 3.3.2 Monitor Toko (AdminMonitorScreen)
- **Data Real-time** (getMonitoringToko):
  - Per toko: nama, foto, jam buka/tutup
  - Total karyawan vs online
  - Status karyawan: Hadir/Telat/Belum Masuk
  - Lokasi GPS karyawan (lat/lng)
  - Menit keterlambatan
- Peta/visualisasi per toko

#### 3.3.3 Laporan (AdminReportScreen)
- **Absensi Lengkap** (getAbsensiHariIniLengkap):
  - Filter: tanggal, toko, shift
  - Data: nama, toko, shift, jam masuk/pulang, durasi kerja, durasi lembur, status, menit telat, foto masuk/pulang/lembur
- **Raport Bulanan Per Karyawan** (getRaportBulanan)
- **Laporan Izin** (getIzinPeriode)

#### 3.3.4 Approval (AdminApprovalScreen)
- **Pending Approvals** (getPendingApprovals):
  - Tipe: Lembur, Izin, Kasbon, Tukar Shift
  - Detail: nama, toko, waktu, nominal
  - Foto bukti
- **Aksi**:
  - approveLembur / reject
  - approveIzin / reject
  - approveKasbon (+ nominal disetujui, keterangan)
  - Tukar Shift approve/reject

#### 3.3.5 Manajemen Toko (AdminStoreScreen + AdminTokoFormScreen)
- **CRUD Toko**:
  - getTokoList - list semua toko
  - saveToko - tambah toko baru (nama, alamat, lat/lng, radius GPS, jam buka/tutup, foto)
  - updateToko - edit toko
  - deleteToko - hapus toko (soft delete / permanent)
  - uploadFotoToko - upload foto toko (base64 -> Google Drive)

#### 3.3.6 Manajemen Karyawan (AdminEmployeeScreen + KaryawanFormScreen)
- **CRUD Karyawan**:
  - getKaryawanList - list semua karyawan
  - saveKaryawan - tambah karyawan baru
  - updateKaryawan - edit karyawan
  - deleteKaryawan - hapus karyawan
- **Data Karyawan**:
  - ID, Nama, PIN, Jabatan, No HP, Email
  - Tanggal Masuk, Status (Aktif/Nonaktif)
  - Toko Default, Shift Default
  - NIK, Tempat/Tanggal Lahir, Jenis Kelamin
  - Alamat: RT/RW, Desa, Kecamatan
  - Agama, Status Kawin, Kewarganegaraan
  - Kontak Darurat (Nama + Nomor)
- **Upload Foto**:
  - uploadFotoProfil - foto profil (base64 -> Drive)
  - uploadFotoKtp - foto KTP (base64 -> Drive, bisa OCR)
- **Profil Lengkap**:
  - generateProfileToken - buat link profil yang bisa diisi karyawan sendiri
  - Token-based self-service profil

#### 3.3.7 Manajemen Shift (AdminShiftScreen + AdminShiftFormScreen)
- **CRUD Shift**:
  - getAllShifts - list semua shift
  - saveShift - tambah shift (toko, nama, jam masuk/pulang, toleransi menit)
  - updateShift - edit shift
  - deleteShiftPermanent - hapus shift
- **Relasi**: Setiap shift terikat ke satu toko

#### 3.3.8 Manajemen Jadwal (AdminJadwalScreen + JadwalViewModel)

**Tab 1: Jadwal Mingguan (Matrix Grid)**
- **Generate Otomatis** (generateJadwalMingguan):
  - Input: tanggal mulai & selesai (1 minggu)
  - Auto-rolling: distribusi karyawan ke toko & shift berdasarkan template
- **Tampilan Matrix Grid**:
  - Baris: hari (Senin-Minggu)
  - Kolom: per toko, dibagi Pagi & Siang
  - Warna berbeda per toko (6 palet: biru, hijau, kuning, merah, ungu, pink)
  - Foto + nama karyawan dalam sel
  - 2 foto per baris dalam sel, overflow ke baris baru
- **Drag & Drop Edit**:
  - Long press (~500ms) -> drag karyawan
  - Drop ke sel lain dalam **hari yang sama** saja
  - Anti-duplikat: orang yang sama tidak bisa di slot yang sudah ada
  - Menggunakan detectDragGesturesAfterLongPress
  - Composable: LongPressDraggable, DropTarget, DraggableScreen
- **AllDay Button**: Copy jadwal Senin ke semua hari (Selasa-Minggu)
- **Simpan** (saveJadwalMingguan): kirim seluruh jadwal ke server
- **Navigasi Minggu**: tombol sebelum/sesudah untuk navigasi antar minggu
- **Scroll**: horizontal + vertical dalam satu container

**Tab 2: Template Kebutuhan Karyawan (AdminJadwalKaryawanTab)**
- Template per toko: kebutuhan Pagi & Siang
- getTemplateJadwal / saveTemplateJadwal

**Tab 3: Penempatan (AdminPenempatanTab)**
- Assign karyawan ke toko default

#### 3.3.9 Manajemen Gaji (AdminSalaryScreen + AdminSalaryDetailScreen)
- **List Gaji** (getSalaries):
  - Per karyawan: gaji pokok, lembur, transport, tunjangan, kasbon, bonus, potongan
  - Keterangan per komponen
  - Status & periode
- **Edit Gaji** (updateSalary):
  - Edit semua komponen gaji per karyawan
  - Keterangan per item

#### 3.3.10 Manajemen Tugas (AdminTaskScreen)
- **CRUD Tugas**:
  - getTugasList - list tugas
  - createTugas - buat tugas baru (judul, deskripsi, kategori, prioritas, toko, deadline, ditugaskan ke)
  - deleteTugas - hapus tugas
  - getTugasLogs - lihat log penyelesaian + foto bukti
- **Mode Toko**: "gugur" - tugas selesai jika satu orang di toko menyelesaikan
- **Kategori**: Rutin / Non-Rutin
- **Prioritas**: Low / Medium / High / Urgent

#### 3.3.11 Manajemen Berita (AdminNewsScreen)
- **CRUD Berita**:
  - getBeritaList
  - createBerita (judul, isi, kategori, gambar URL, tanggal tayang/off)
  - deleteBerita

#### 3.3.12 Chat Admin (AdminChatScreen + AdminChatViewModel)
- Sama dengan chat karyawan - satu channel grup
- Kirim teks, file, reply
- Realtime via Pusher
- Push notification via FCM

#### 3.3.13 Laporan Tugas (AdminLogTugasScreen)
- List log penyelesaian tugas
- Foto bukti, catatan, status verifikasi

#### 3.3.14 Poin & Kinerja (AdminPoinKinerjaScreen + AdminPoinKinerjaViewModel) - BARU

**Tab 1: Dashboard Poin (PoinDashboardTab)**
- **Ringkasan Owner** (getOwnerReport):
  - Total karyawan, rata-rata poin, distribusi grade
  - Jumlah per rekomendasi: BONUS_ELIGIBLE, RETAIN, WATCH, REVIEW, NOT_RECOMMENDED
  - Top 10 Performer
  - Red Flags (WATCH, REVIEW, NOT_RECOMMENDED)
- **Grafik Distribusi**: Pie chart grade, bar chart trend

**Tab 2: Kinerja Tim (TeamKinerjaTab)**
- **List Karyawan per Toko** (getTeamScores):
  - Filter: toko, bulan/tahun
  - Ranking: rank, nama, kehadiran, tugas, total, grade, rekomendasi
  - Export ke CSV/Excel
- **Detail Karyawan**: Drill-down ke scorecard individu

**Tab 3: Kalkulasi (KalkulasiTab)**
- **Trigger Manual** (triggerMonthlyCalculation):
  - Pilih periode (bulan/tahun)
  - Kalkulasi ulang untuk semua karyawan atau per karyawan
  - Progress bar & log
- **Audit Trail** (getScoreAudit):
  - Log semua aksi kalkulasi: waktu, actor, aksi, perubahan score

---

## 4. Integrasi & Komunikasi

### 4.1 Push Notification (Firebase FCM)
- **Karyawan -> Server**: Registrasi token via registerFCMToken
- **Server -> Karyawan**: Push untuk:
  - Approval izin/lembur/kasbon
  - Tugas baru
  - Chat baru
  - Tukar shift
  - Reminder shift
  - **Notifikasi Grade Baru** (BARU): Push saat scorecard bulanan tersedia

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
- ocrKtp - server-side OCR via Google Drive API
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

### 5.9 ScoreCardItem (BARU)
```kotlin
scoreId, employeeId, storeId, yearMonth,
attendanceScore (0-500), taskScore (0-1000), totalScore (0-500),
grade (A+/A/B+/B/C/D/E),
recommendation (BONUS_ELIGIBLE/RETAIN/WATCH/REVIEW/NOT_RECOMMENDED),
generatedAt, status (ACTIVE/ARCHIVED)
```

### 5.10 ScoreAuditItem (BARU)
```kotlin
auditId, timestamp, action (GENERATE/RECALCULATE/VIEW/EXPORT),
employeeId, yearMonth, oldScore, newScore, triggeredBy
```

### 5.11 TeamScoreItem (BARU)
```kotlin
employeeId, employeeName, storeId,
attendanceScore, taskScore, totalScore, grade, recommendation, rank
```

---

## 6. API Endpoints Lengkap

### Auth & System
| Action | Fungsi |
|---|---|
| login | Login karyawan/admin |
| getUserInfo | Get profil user |
| checkUpdate | Cek versi terbaru APK |
| registerFCMToken | Registrasi token push |
| registerFaceId | Registrasi face descriptor |
| syncAllData | Full sync data |
| getDeltas | Delta/incremental sync |
| getSettingGlobal | Get pengaturan global |
| updateSettingGlobal | Update pengaturan |
| pingOnline | Heartbeat user online |

### Absensi
| Action | Fungsi |
|---|---|
| absenMasuk | Clock-in dengan foto + GPS |
| absenPulang | Clock-out dengan foto + GPS |
| getAbsenStatus | Status absen hari ini |
| getAbsensiHariIniLengkap | Semua absensi hari ini (admin) |

### Jadwal
| Action | Fungsi |
|---|---|
| getJadwalHariIni | Jadwal hari ini per karyawan |
| getJadwalMingguan | Jadwal 1 minggu per karyawan |
| getKaryawanJadwalByDate | Jadwal karyawan pada tanggal tertentu |
| getAllJadwalMingguan | Semua jadwal mingguan (admin) |
| generateJadwalMingguan | Auto-generate jadwal (admin) |
| saveJadwalMingguan | Simpan jadwal setelah edit (admin) |
| getTemplateJadwal | Template kebutuhan per toko |
| saveTemplateJadwal | Simpan template |

### Izin/Cuti
| Action | Fungsi |
|---|---|
| ajukanIzin | Pengajuan izin/cuti |
| getIzinHistory | Riwayat izin karyawan |
| getJenisIzinAktif | Jenis izin yang aktif |
| getSisaKuota | Sisa kuota izin/cuti |
| approveIzin | Approve/reject izin (admin) |

### Lembur
| Action | Fungsi |
|---|---|
| ajukanLembur | Pengajuan lembur |
| getLemburHistory | Riwayat lembur |
| approveLembur | Approve/reject lembur (admin) |

### Tukar Shift
| Action | Fungsi |
|---|---|
| ajukanTukarShift | Ajukan tukar shift |
| getPendingTukarShift | Tukar shift masuk/pending |
| approveTukarShift | Approve tukar (karyawan tujuan) |
| rejectTukarShift | Reject tukar |
| getTukarShiftHistory | Riwayat tukar shift |

### CRUD Toko
| Action | Fungsi |
|---|---|
| getTokoList | List toko |
| saveToko | Tambah toko |
| updateToko | Edit toko |
| deleteToko | Hapus toko |
| uploadFotoToko | Upload foto toko |

### CRUD Shift
| Action | Fungsi |
|---|---|
| getAllShifts | List semua shift |
| saveShift | Tambah shift |
| updateShift | Edit shift |
| deleteShiftPermanent | Hapus shift |

### CRUD Karyawan
| Action | Fungsi |
|---|---|
| getKaryawanList | List karyawan |
| saveKaryawan | Tambah karyawan |
| updateKaryawan | Edit karyawan |
| deleteKaryawan | Hapus karyawan |
| uploadFotoProfil | Upload foto profil |
| uploadFotoKtp | Upload foto KTP |
| generateProfileToken | Generate token profil |

### Tugas
| Action | Fungsi |
|---|---|
| getTugasList | List tugas |
| createTugas | Buat tugas baru |
| deleteTugas | Hapus tugas |
| updateTugasStatus | Update status tugas |
| submitTugasLog | Submit bukti tugas |
| getTugasLogs | Log penyelesaian tugas |

### Berita
| Action | Fungsi |
|---|---|
| getBeritaList | List berita |
| createBerita | Buat berita |
| deleteBerita | Hapus berita |

### Chat
| Action | Fungsi |
|---|---|
| getChatMessages | Load pesan (pagination) |
| sendChatMessage | Kirim pesan |
| sendManualPushNotification | Push manual (admin) |

### Gaji & Kasbon
| Action | Fungsi |
|---|---|
| getSlipGaji | Slip gaji karyawan |
| getSalaries | Semua data gaji (admin) |
| updateSalary | Edit gaji karyawan (admin) |
| ajukanKasbon | Pengajuan kasbon |
| getKasbonHistory | Riwayat kasbon |
| approveKasbon | Approve kasbon (admin) |

### Dashboard & Monitoring
| Action | Fungsi |
|---|---|
| getDashboardData | Statistik dashboard |
| getMonitoringToko | Monitoring realtime per toko |
| getRaportBulanan | Raport bulanan karyawan |
| getLaporanAbsensi | Laporan absensi periode |

### OCR
| Action | Fungsi |
|---|---|
| ocrKtp | OCR KTP via Google Drive |

### Poin & Kinerja (BARU - Zero Risk)
| Action | Fungsi | Akses |
|---|---|---|
| getMyScorecard | Scorecard karyawan (kehadiran + tugas + grade + rekomendasi) | Karyawan |
| getTeamScores | Ranking karyawan per toko | Manager/Admin |
| getOwnerReport | Dashboard summary semua toko | Owner/Admin |
| getScoreTrend | Trend 6 bulan terakhir | Karyawan/Admin |
| calculateMonthlyScores | Kalkulasi poin bulanan (cron/manual) | System/Admin |
| recalculateScore | Kalkulasi ulang per karyawan | Admin |
| exportScorecard | Export scorecard ke CSV/Excel | Admin |
| getScoreAudit | Audit trail kalkulasi | Admin |
| triggerMonthlyCalculation | Trigger manual kalkulasi | Admin |

---

## 7. Teknologi & Dependencies

### APK Admin (absen-admin/)
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
| **MPAndroidChart** | **(BARU)** Grafik trend poin |
| **Apache POI** | **(BARU)** Export Excel |

### APK Karyawan (absen-native/)
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
| **MPAndroidChart** | **(BARU)** Grafik trend poin |

### Backend (code.gs)
| Service | Fungsi |
|---|---|
| Google Sheets API | Database |
| Google Drive API | File storage |
| Firebase Admin (HTTP) | Push notification |
| OCR (Drive API) | KTP parsing |

---

## 8. Konvensi Kode

### Penamaan File
- Screen: Admin[Nama]Screen.kt / [Nama]Screen.kt
- ViewModel: [Nama]ViewModel.kt
- API Model: Semua dalam ApiService.kt
- Komponen: ui/components/[Nama].kt

### Arsitektur
- **MVVM**: ViewModel menggunakan StateFlow untuk state management
- **Repository Pattern**: Untuk offline-first di native app
- **Composition Local**: Untuk shared state (contoh: drag & drop)

### Konvensi API
- Semua endpoint: POST /exec dengan JSON body { action: "...", ...params }
- Response: { success: Boolean, data/error/message: ... }
- Upload file: base64 encoded string

---

## 9. Cara Menambah Fitur Baru

### Langkah untuk fitur baru di Admin APK:
1. **Tambah model data** di ApiService.kt (Request + Response data class)
2. **Tambah endpoint** di GasApi interface
3. **Buat ViewModel** di ui/viewmodels/ atau ui/[Nama]ViewModel.kt
4. **Buat Screen** di ui/Admin[Nama]Screen.kt
5. **Tambah route** di Screen.kt (sealed class)
6. **Daftarkan composable** di AdminMainScreen.kt NavHost
7. **Tambah menu** di drawer/bottom bar jika perlu
8. **Tambah handler** di code.gs switch-case doPost

### Langkah untuk fitur baru di Karyawan APK:
1. **Tambah model data** di api/ApiService.kt
2. **Tambah endpoint** di GasApi interface
3. **Buat ViewModel** di [Nama]ViewModel.kt
4. **Buat Screen** di [Nama]Screen.kt
5. **Daftarkan** di MainActivity.kt NavHost
6. **Tambah navigasi** di HomeScreen atau drawer
7. **Tambah handler** di code.gs

---

## 10. Status Fitur Saat Ini

| Fitur | Admin | Karyawan | Backend |
|---|---|---|---|
| Login/Auth | OK | OK | OK |
| Dashboard | OK | OK | OK |
| Absensi (Masuk/Pulang) | - | OK | OK |
| Monitor Toko | OK | - | OK |
| CRUD Toko | OK | - | OK |
| CRUD Karyawan | OK | - | OK |
| CRUD Shift | OK | - | OK |
| Jadwal (View) | - | OK | OK |
| Jadwal (Generate + D&D Edit) | OK | - | OK |
| Izin/Cuti | OK (approve) | OK (ajukan) | OK |
| Lembur | OK (approve) | OK (ajukan) | OK |
| Tukar Shift | OK (approve) | OK (ajukan) | OK |
| Tugas | OK (CRUD) | OK (submit) | OK |
| Berita | OK (CRUD) | OK (view) | OK |
| Chat | OK | OK | OK |
| Gaji | OK (edit) | OK (view) | OK |
| Kasbon | OK (approve) | OK (ajukan) | OK |
| Laporan | OK | OK (rekap) | OK |
| Push Notification | OK | OK | OK |
| Realtime (Pusher) | OK | OK | OK |
| OCR KTP | - | - | OK |
| Auto Update | - | OK | OK |
| Face ID | - | OK | OK |
| Profil Token | OK | - | OK |
| **Poin & Kinerja** | **OK (dashboard)** | **OK (scorecard)** | **OK (kalkulasi)** |

---

# ============================================
# BAGIAN BARU: SISTEM POIN & REVIEW KINERJA
# ============================================
# Semua bagian di bawah ini adalah TAMBAHAN
# Tidak mengubah sistem existing
# Bisa di-disable kapan saja tanpa ganggu sistem
# ============================================

---

## 11. PRINSIP ZERO-RISK INTEGRATION

### 11.1 Aturan Dasar
1. **READ-ONLY dari Sheet existing** - Hanya SELECT/READ dari Absensi, Tugas, Karyawan. TIDAK PERNAH INSERT/UPDATE/DELETE ke Sheet existing.
2. **WRITE hanya ke Sheet BARU** - Semua hasil kalkulasi disimpan di Sheet baru (MONTHLY_SCORES, SCORE_AUDIT). Jika fitur dihapus, Sheet baru dihapus = sistem aman.
3. **TIDAK ADA perubahan endpoint existing** - doPost() yang lama tetap sama. Fitur poin pakai endpoint TERPISAH (bisa di-disable).
4. **TIDAK ADA perubahan UI existing** - Screen absensi/tugas tetap sama. Screen poin adalah screen BARU.
5. **BISA DI-DISABLE kapan saja** - Hapus menu "Poin & Kinerja" dari sidebar = fitur hilang, sistem absensi + tugas tetap jalan normal.
6. **TIDAK ADA cron job yang ganggu existing** - Cron job poin berjalan terpisah. Jika gagal, sistem absensi tetap jalan.

### 11.2 Cara Disable (Jika Ada Masalah)
1. Hapus menu "Poin & Kinerja" dari sidebar karyawan & admin
2. Hapus file PoinKinerja.gs (jika deploy terpisah)
3. Hapus trigger cron: ScriptApp.getProjectTriggers() -> delete trigger calculateMonthlyScores
4. Sistem absensi + tugas TETAP JALAN NORMAL

---

## 12. ARSITEKTUR DATA (Sheet Baru SAJA)

### 12.1 Sheet yang Sudah Ada (READ-ONLY)

| Sheet | Digunakan Untuk | Kolom Dibaca |
|---|---|---|
| MASTER_KARYAWAN | ID, Nama, Toko, Status | ID_Karyawan, Nama, Toko_Default, Status |
| ABSENSI | Kehadiran, status, tanggal | ID_Karyawan, Tanggal, Status |
| LOG_TUGAS | Penyelesaian tugas | ID_Karyawan, ID_Tugas, Status, Deadline, Submitted_At |
| TUGAS | Data tugas | ID_Tugas, Kategori, Prioritas, Poin |

**TIDAK BOLEH INSERT/UPDATE/DELETE ke Sheet ini!**
**TIDAK BOLEH TAMBAH/HAPUS KOLOM!**
**TIDAK BOLEH UBAH NAMA SHEET!**

### 12.2 Sheet BARU (Write-Only untuk Poin)

#### Sheet 1: MONTHLY_SCORES (Hasil Kalkulasi)
| Kolom | Nama | Keterangan |
|---|---|---|
| A | score_id | Auto: SCR-YYYYMM-EMPID |
| B | employee_id | FK - READ dari MASTER_KARYAWAN |
| C | store_id | FK - READ dari MASTER_KARYAWAN |
| D | year_month | YYYY-MM |
| E | attendance_score | 0-500, hasil kalkulasi dari ABSENSI |
| F | task_score | 0-1000, hasil kalkulasi dari LOG_TUGAS |
| G | total_score | 0-500, hasil normalisasi 50:50 |
| H | grade | A+/A/B+/B/C/D/E |
| I | recommendation | BONUS_ELIGIBLE/RETAIN/WATCH/REVIEW/NOT_RECOMMENDED |
| J | generated_at | Timestamp |
| K | status | ACTIVE/ARCHIVED |

#### Sheet 2: SCORE_AUDIT (Audit Trail)
| Kolom | Nama | Keterangan |
|---|---|---|
| A | audit_id | Auto |
| B | timestamp | Waktu aksi |
| C | action | GENERATE/RECALCULATE/VIEW/EXPORT |
| D | employee_id | ID karyawan |
| E | year_month | Periode |
| F | old_score | Score lama (jika recalculate) |
| G | new_score | Score baru (jika recalculate) |
| H | triggered_by | SYSTEM / OWNER / MANAGER |

---

## 13. SISTEM KALKULASI POIN

### 13.1 Alur Kalkulasi

```
Step 1: CRON JOB jalan (tanggal 1, jam 01:00)
Step 2: Baca Sheet "ABSENSI" (READ-ONLY)
        -> Hitung: Hadir, Terlambat, Izin, Alpa
        -> Kalkulasi: Attendance Score (0-500)
Step 3: Baca Sheet "LOG_TUGAS" + "TUGAS" (READ-ONLY)
        -> Hitung: Completion Rate, On-Time Rate, Quality Rate
        -> Kalkulasi: Task Score (0-1000)
Step 4: Normalisasi 50:50
        -> Total Score (0-500)
        -> Grade (A+ sampai E)
        -> Recommendation
Step 5: Simpan ke Sheet "MONTHLY_SCORES" (WRITE - Sheet BARU)
Step 6: Tampilkan di UI "Poin & Kinerja" (Screen BARU)
```

### 13.2 Formula Kalkulasi

#### A. ATTENDANCE SCORE (0-500) - dari Sheet "ABSENSI"

| Kondisi | Poin |
|---|---|
| Hadir Tepat Waktu | +15 poin/hari |
| Terlambat <=15 menit | +8 poin/hari |
| Terlambat >15 menit | +3 poin/hari |
| Izin (dengan bukti) | +10 poin/hari |
| Alpa | -20 poin/hari |
| Full Month Bonus | +50 poin |
| Perfect Month Bonus | +50 poin (di atas Full Month) |

```
Attendance_Raw = SUM(poin harian) + bonus
Attendance_Raw = MIN(500, MAX(0, Attendance_Raw))
```

#### B. TASK SCORE (0-1000) - dari Sheet "LOG_TUGAS" + "TUGAS"

```
Completion Rate = Selesai / Assigned x 100%
On-Time Rate    = On-Time / Selesai x 100%
Quality Rate    = Approved / Submitted x 100%

Base Score      = MIN(Completion Rate, 100%) x 600
On-Time Bonus   = On-Time Rate x 200
Quality Bonus   = Quality Rate x 200

Task_Raw = Base + On-Time + Quality
Task_Raw = MIN(1000, MAX(0, Task_Raw))
```

#### C. TOTAL SCORE (0-500)

```
Attendance_Pct = Attendance_Raw / 500 x 100%
Task_Pct       = Task_Raw / 1000 x 100%

Total_Pct = (Attendance_Pct x 0.50) + (Task_Pct x 0.50)
Total_Score = Total_Pct x 5  // skala 0-500
```

#### D. GRADE

| Grade | Range |
|---|---|
| A+ | >= 450 |
| A | 400-449 |
| B+ | 350-399 |
| B | 300-349 |
| C | 250-299 |
| D | 200-249 |
| E | < 200 |

#### E. RECOMMENDATION

| Rekomendasi | Kondisi |
|---|---|
| BONUS_ELIGIBLE | A+ 2 bulan berturut + Attendance >= 80% |
| RETAIN | Grade >= B+ 3 bulan berturut |
| WATCH | Grade B/C atau turun 2 bulan |
| REVIEW | Grade D atau Attendance < 60% |
| NOT_RECOMMENDED | Grade E 2 bulan berturut |

---

## 14. BACKEND - FILE TERPISAH

### 14.1 Struktur File

```
project/
|
+-- Code.gs              <- FILE EXISTING (JANGAN UBAH!)
|   +-- doPost()         <- Endpoint absensi, tugas, chat, dll.
|   +-- clockIn()        <- Function absensi
|   +-- getTasks()       <- Function tugas
|   +-- ...              <- Semua function existing
|
+-- PoinKinerja.gs       <- FILE BARU (Tambahkan ke project)
|   +-- doPostPoin()     <- Endpoint terpisah untuk poin
|   +-- calculateMonthlyScores()  <- Kalkulasi otomatis
|   +-- getMyScorecard() <- Ambil scorecard karyawan
|   +-- getTeamScores()  <- Ambil semua score tim
|   +-- getOwnerReport() <- Dashboard owner
|   +-- ...              <- Helper functions
```

### 14.2 File Baru: PoinKinerja.gs

```javascript
// ============================================
// FILE: PoinKinerja.gs (BARU - Tambah ke project)
// ============================================
// FILE INI TERPISAH dari Code.gs existing
// Jika ada error di file ini, Code.gs existing tetap jalan
// ============================================

/**
 * POST handler untuk Poin & Kinerja (terpisah dari doPost existing)
 */
function doPostPoin(e) {
  var action = e.parameter.action;

  if (action == 'calculateMonthlyScores') return calculateMonthlyScores(e);
  if (action == 'recalculateScore') return recalculateScore(e);
  if (action == 'getMyScorecard') return getMyScorecard(e);
  if (action == 'getTeamScores') return getTeamScores(e);
  if (action == 'getOwnerReport') return getOwnerReport(e);
  if (action == 'getScoreTrend') return getScoreTrend(e);
  if (action == 'getScoreAudit') return getScoreAudit(e);
  if (action == 'exportScorecard') return exportScorecard(e);
  if (action == 'triggerMonthlyCalculation') return triggerMonthlyCalculation(e);

  return jsonResponsePoin({status: 'error', message: 'Unknown action: ' + action});
}

/**
 * JSON response helper (terpisah, tidak ganggu existing)
 */
function jsonResponsePoin(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get spreadsheet (sama spreadsheet, sheet berbeda)
 */
function getSpreadsheetPoin() {
  // Ganti dengan ID spreadsheet Anda
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ============================================
// KALKULASI UTAMA (CRON JOB)
// ============================================

/**
 * Kalkulasi score bulanan untuk SEMUA karyawan
 * Jalan otomatis tanggal 1 jam 01:00 via cron
 * Baca dari Sheet existing, tulis ke Sheet MONTHLY_SCORES (BARU)
 */
function calculateMonthlyScores(e) {
  try {
    var yearMonth = e && e.parameter && e.parameter.year_month 
      ? e.parameter.year_month 
      : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');

    var ss = getSpreadsheetPoin();

    // READ dari Sheet existing (TIDAK DIUBAH!)
    var absensiSheet = ss.getSheetByName('ABSENSI');
    var logTugasSheet = ss.getSheetByName('LOG_TUGAS');
    var tugasSheet = ss.getSheetByName('TUGAS');
    var karyawanSheet = ss.getSheetByName('MASTER_KARYAWAN');

    // WRITE ke Sheet baru
    var scoresSheet = ss.getSheetByName('MONTHLY_SCORES');
    if (!scoresSheet) {
      scoresSheet = ss.insertSheet('MONTHLY_SCORES');
      scoresSheet.appendRow([
        'score_id', 'employee_id', 'store_id', 'year_month',
        'attendance_score', 'task_score', 'total_score', 'grade', 'recommendation',
        'generated_at', 'status'
      ]);
    }

    var karyawanData = karyawanSheet.getDataRange().getValues();
    var generated = 0;
    var errors = [];

    for (var i = 1; i < karyawanData.length; i++) {
      try {
        var employeeId = karyawanData[i][0];  // kolom A: ID_Karyawan
        var employeeName = karyawanData[i][1]; // kolom B: Nama
        var storeId = karyawanData[i][8];     // kolom I: Toko_Default (sesuaikan)
        var status = karyawanData[i][5];      // kolom F: Status (sesuaikan)

        // Skip karyawan non-aktif
        if (status == 'NONAKTIF' || status == 'RESIGNED') continue;

        // === KALKULASI ATTENDANCE (baca dari ABSENSI) ===
        var attScore = calculateAttendanceFromSheet(absensiSheet, employeeId, yearMonth);

        // === KALKULASI TASK (baca dari LOG_TUGAS + TUGAS) ===
        var taskScore = calculateTaskFromSheet(logTugasSheet, tugasSheet, employeeId, yearMonth);

        // === NORMALISASI 50:50 ===
        var attPct = (attScore.raw / 500) * 100;
        var taskPct = (taskScore.raw / 1000) * 100;
        var totalPct = (attPct * 0.50) + (taskPct * 0.50);
        var totalScore = totalPct * 5; // skala 0-500

        // === GRADE ===
        var grade = getGrade(totalScore);

        // === RECOMMENDATION ===
        var recommendation = getRecommendation(employeeId, grade, attPct, yearMonth, scoresSheet);

        // === SIMPAN KE Sheet BARU ===
        var scoreId = 'SCR-' + yearMonth.replace('-', '') + '-' + employeeId;

        var existingRow = findExistingScore(scoresSheet, employeeId, yearMonth);

        if (existingRow > 0) {
          scoresSheet.getRange(existingRow, 5).setValue(attScore.raw);
          scoresSheet.getRange(existingRow, 6).setValue(taskScore.raw);
          scoresSheet.getRange(existingRow, 7).setValue(totalScore);
          scoresSheet.getRange(existingRow, 8).setValue(grade);
          scoresSheet.getRange(existingRow, 9).setValue(recommendation);
          scoresSheet.getRange(existingRow, 10).setValue(new Date());
        } else {
          scoresSheet.appendRow([
            scoreId, employeeId, storeId, yearMonth,
            attScore.raw, taskScore.raw, totalScore, grade, recommendation,
            new Date(), 'ACTIVE'
          ]);
        }

        generated++;

      } catch (empError) {
        errors.push({employee_id: karyawanData[i][0], error: empError.toString()});
      }
    }

    logScoreAudit('SYSTEM', 'GENERATE', '', yearMonth, '', '', 'Generated ' + generated + ' scores');

    return jsonResponsePoin({
      status: 'success',
      year_month: yearMonth,
      generated_count: generated,
      errors: errors
    });

  } catch (error) {
    return jsonResponsePoin({status: 'error', message: error.toString()});
  }
}

/**
 * Kalkulasi Attendance dari Sheet "ABSENSI" (READ-ONLY)
 */
function calculateAttendanceFromSheet(absensiSheet, employeeId, yearMonth) {
  var absensiData = absensiSheet.getDataRange().getValues();

  var totalPoints = 0;
  var hadirTepat = 0;
  var terlambatRingan = 0;
  var terlambatBerat = 0;
  var izin = 0;
  var alpa = 0;
  var lateCount = 0;

  for (var i = 1; i < absensiData.length; i++) {
    var row = absensiData[i];

    // SESUAIKAN nomor kolom dengan struktur Sheet ABSENSI Anda!
    var rowEmployeeId = row[1];  // kolom B: ID_Karyawan
    var rowDate = row[3];         // kolom D: Tanggal
    var rowStatus = row[6];      // kolom G: Status

    var rowYearMonth = '';
    if (rowDate instanceof Date) {
      rowYearMonth = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), 'yyyy-MM');
    } else {
      rowYearMonth = rowDate.toString().substring(0, 7);
    }

    if (rowEmployeeId == employeeId && rowYearMonth == yearMonth) {
      var status = rowStatus ? rowStatus.toString().toUpperCase().trim() : '';

      if (status == 'HADIR' || status == 'HADIR_TEPAT' || status == 'TEPAT_WAKTU') {
        totalPoints += 15;
        hadirTepat++;
      } else if (status == 'TERLAMBAT_RINGAN' || status == 'TERLAMBAT') {
        totalPoints += 8;
        terlambatRingan++;
        lateCount++;
      } else if (status == 'TERLAMBAT_BERAT') {
        totalPoints += 3;
        terlambatBerat++;
        lateCount++;
      } else if (status == 'IZIN' || status == 'SAKIT' || status == 'CUTI') {
        totalPoints += 10;
        izin++;
      } else if (status == 'ALPA' || status == 'TANPA_KETERANGAN') {
        totalPoints -= 20;
        alpa++;
      }
    }
  }

  // Full Month Bonus
  if (alpa == 0 && izin <= 2 && lateCount <= 2 && hadirTepat > 0) {
    totalPoints += 50;
  }

  // Perfect Month
  var totalHari = hadirTepat + terlambatRingan + terlambatBerat + izin + alpa;
  if (totalHari > 0 && hadirTepat == totalHari) {
    totalPoints += 50;
  }

  totalPoints = Math.max(0, Math.min(500, totalPoints));

  return {
    raw: totalPoints,
    hadir_tepat: hadirTepat,
    terlambat_ringan: terlambatRingan,
    terlambat_berat: terlambatBerat,
    izin: izin,
    alpa: alpa,
    late_count: lateCount
  };
}

/**
 * Kalkulasi Task dari Sheet "LOG_TUGAS" + "TUGAS" (READ-ONLY)
 */
function calculateTaskFromSheet(logTugasSheet, tugasSheet, employeeId, yearMonth) {
  var logData = logTugasSheet.getDataRange().getValues();

  var totalAssigned = 0;
  var totalSelesai = 0;
  var totalOnTime = 0;
  var totalSubmitted = 0;
  var totalApproved = 0;

  for (var i = 1; i < logData.length; i++) {
    var row = logData[i];

    // SESUAIKAN nomor kolom dengan struktur Sheet LOG_TUGAS Anda!
    var rowEmployeeId = row[2];   // kolom C: ID_Karyawan
    var rowAssignedAt = row[4];   // kolom E: Assigned_At
    var rowStatus = row[6];       // kolom G: Status
    var rowSubmittedAt = row[7];  // kolom H: Submitted_At
    var rowDeadline = row[5];     // kolom F: Deadline

    var rowYearMonth = '';
    if (rowAssignedAt instanceof Date) {
      rowYearMonth = Utilities.formatDate(rowAssignedAt, Session.getScriptTimeZone(), 'yyyy-MM');
    } else {
      rowYearMonth = rowAssignedAt.toString().substring(0, 7);
    }

    if (rowEmployeeId == employeeId && rowYearMonth == yearMonth) {
      totalAssigned++;
      var status = rowStatus ? rowStatus.toString().toUpperCase().trim() : '';

      if (status == 'SUBMITTED' || status == 'APPROVED' || status == 'AUTO_APPROVED') {
        totalSelesai++;
        totalSubmitted++;

        if (rowSubmittedAt && rowDeadline) {
          var submittedDate = rowSubmittedAt instanceof Date ? rowSubmittedAt : new Date(rowSubmittedAt);
          var deadlineDate = rowDeadline instanceof Date ? rowDeadline : new Date(rowDeadline);
          if (submittedDate <= deadlineDate) {
            totalOnTime++;
          }
        }
      }

      if (status == 'APPROVED') {
        totalApproved++;
      }

      if (status == 'REJECTED') {
        totalSubmitted++;
      }
    }
  }

  var completionRate = totalAssigned > 0 ? (totalSelesai / totalAssigned) : 0;
  var onTimeRate = totalSelesai > 0 ? (totalOnTime / totalSelesai) : 0;
  var qualityRate = totalSubmitted > 0 ? (totalApproved / totalSubmitted) : 0;

  var baseScore = Math.min(completionRate, 1.0) * 600;
  var onTimeBonus = onTimeRate * 200;
  var qualityBonus = qualityRate * 200;

  var taskRaw = baseScore + onTimeBonus + qualityBonus;
  taskRaw = Math.max(0, Math.min(1000, taskRaw));

  return {
    raw: taskRaw,
    completion_rate: completionRate * 100,
    ontime_rate: onTimeRate * 100,
    quality_rate: qualityRate * 100,
    total_assigned: totalAssigned,
    total_selesai: totalSelesai,
    total_ontime: totalOnTime,
    total_approved: totalApproved
  };
}

/**
 * Get Grade dari Total Score
 */
function getGrade(totalScore) {
  if (totalScore >= 450) return 'A+';
  if (totalScore >= 400) return 'A';
  if (totalScore >= 350) return 'B+';
  if (totalScore >= 300) return 'B';
  if (totalScore >= 250) return 'C';
  if (totalScore >= 200) return 'D';
  return 'E';
}

/**
 * Get Recommendation
 */
function getRecommendation(employeeId, grade, attPct, yearMonth, scoresSheet) {
  var scoresData = scoresSheet.getDataRange().getValues();
  var prevGrades = [];

  for (var i = 1; i < scoresData.length; i++) {
    if (scoresData[i][1] == employeeId && scoresData[i][3] != yearMonth) {
      prevGrades.push({
        year_month: scoresData[i][3],
        grade: scoresData[i][7]
      });
    }
  }

  prevGrades.sort(function(a, b) { return b.year_month.localeCompare(a.year_month); });

  var lastGrade = prevGrades.length > 0 ? prevGrades[0].grade : '';
  var secondLastGrade = prevGrades.length > 1 ? prevGrades[1].grade : '';

  if (grade == 'A+' && lastGrade == 'A+' && attPct >= 80) {
    return 'BONUS_ELIGIBLE';
  }
  if ((grade == 'A+' || grade == 'A' || grade == 'B+') && 
      (lastGrade == 'A+' || lastGrade == 'A' || lastGrade == 'B+') &&
      (secondLastGrade == 'A+' || secondLastGrade == 'A' || secondLastGrade == 'B+')) {
    return 'RETAIN';
  }
  if (grade == 'B' || grade == 'C' || (lastGrade != '' && isLowerGrade(grade, lastGrade))) {
    return 'WATCH';
  }
  if (grade == 'D' || attPct < 60) {
    return 'REVIEW';
  }
  if (grade == 'E' || (lastGrade == 'E' && grade == 'E')) {
    return 'NOT_RECOMMENDED';
  }

  return 'RETAIN';
}

function isLowerGrade(current, previous) {
  var grades = ['E', 'D', 'C', 'B', 'B+', 'A', 'A+'];
  return grades.indexOf(current) < grades.indexOf(previous);
}

function findExistingScore(scoresSheet, employeeId, yearMonth) {
  var scoresData = scoresSheet.getDataRange().getValues();
  for (var i = 1; i < scoresData.length; i++) {
    if (scoresData[i][1] == employeeId && scoresData[i][3] == yearMonth) {
      return i + 1;
    }
  }
  return 0;
}

// ============================================
// API ENDPOINTS untuk UI
// ============================================

function getMyScorecard(e) {
  try {
    var employeeId = e.parameter.employee_id;
    var yearMonth = e.parameter.year_month || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');

    var ss = getSpreadsheetPoin();
    var scoresSheet = ss.getSheetByName('MONTHLY_SCORES');
    var karyawanSheet = ss.getSheetByName('MASTER_KARYAWAN');

    if (!scoresSheet) {
      return jsonResponsePoin({status: 'error', message: 'MONTHLY_SCORES not found. Run calculation first.'});
    }

    var scoresData = scoresSheet.getDataRange().getValues();
    var karyawanData = karyawanSheet.getDataRange().getValues();

    var scoreRow = null;
    for (var i = 1; i < scoresData.length; i++) {
      if (scoresData[i][1] == employeeId && scoresData[i][3] == yearMonth) {
        scoreRow = scoresData[i];
        break;
      }
    }

    if (!scoreRow) {
      return jsonResponsePoin({status: 'error', message: 'Scorecard not found for ' + yearMonth});
    }

    var employeeName = '';
    var storeId = '';
    for (var j = 1; j < karyawanData.length; j++) {
      if (karyawanData[j][0] == employeeId) {
        employeeName = karyawanData[j][1];
        storeId = karyawanData[j][8]; // sesuaikan kolom
        break;
      }
    }

    var trend = [];
    for (var k = 1; k < scoresData.length; k++) {
      if (scoresData[k][1] == employeeId) {
        trend.push({
          year_month: scoresData[k][3],
          total_score: scoresData[k][6],
          grade: scoresData[k][7]
        });
      }
    }
    trend.sort(function(a, b) { return a.year_month.localeCompare(b.year_month); });

    return jsonResponsePoin({
      status: 'success',
      employee: {
        id: employeeId,
        name: employeeName,
        store_id: storeId
      },
      scorecard: {
        year_month: scoreRow[3],
        attendance_score: scoreRow[4],
        task_score: scoreRow[5],
        total_score: scoreRow[6],
        grade: scoreRow[7],
        recommendation: scoreRow[8],
        generated_at: scoreRow[9]
      },
      trend: trend.slice(-6) // 6 bulan terakhir
    });

  } catch (error) {
    return jsonResponsePoin({status: 'error', message: error.toString()});
  }
}

function getTeamScores(e) {
  try {
    var storeId = e.parameter.store_id;
    var yearMonth = e.parameter.year_month || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');

    var ss = getSpreadsheetPoin();
    var scoresSheet = ss.getSheetByName('MONTHLY_SCORES');
    var karyawanSheet = ss.getSheetByName('MASTER_KARYAWAN');

    if (!scoresSheet) {
      return jsonResponsePoin({status: 'error', message: 'MONTHLY_SCORES not found'});
    }

    var scoresData = scoresSheet.getDataRange().getValues();
    var karyawanData = karyawanSheet.getDataRange().getValues();

    var teamScores = [];

    for (var i = 1; i < scoresData.length; i++) {
      if (scoresData[i][2] == storeId && scoresData[i][3] == yearMonth) {
        var empName = '';
        for (var j = 1; j < karyawanData.length; j++) {
          if (karyawanData[j][0] == scoresData[i][1]) {
            empName = karyawanData[j][1];
            break;
          }
        }

        teamScores.push({
          employee_id: scoresData[i][1],
          employee_name: empName,
          attendance_score: scoresData[i][4],
          task_score: scoresData[i][5],
          total_score: scoresData[i][6],
          grade: scoresData[i][7],
          recommendation: scoresData[i][8]
        });
      }
    }

    teamScores.sort(function(a, b) { return b.total_score - a.total_score; });

    for (var k = 0; k < teamScores.length; k++) {
      teamScores[k].rank = k + 1;
    }

    return jsonResponsePoin({
      status: 'success',
      store_id: storeId,
      year_month: yearMonth,
      total_employees: teamScores.length,
      scores: teamScores
    });

  } catch (error) {
    return jsonResponsePoin({status: 'error', message: error.toString()});
  }
}

function getOwnerReport(e) {
  try {
    var yearMonth = e.parameter.year_month || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');

    var ss = getSpreadsheetPoin();
    var scoresSheet = ss.getSheetByName('MONTHLY_SCORES');
    var karyawanSheet = ss.getSheetByName('MASTER_KARYAWAN');

    if (!scoresSheet) {
      return jsonResponsePoin({status: 'error', message: 'MONTHLY_SCORES not found'});
    }

    var scoresData = scoresSheet.getDataRange().getValues();
    var karyawanData = karyawanSheet.getDataRange().getValues();

    var summary = {
      total_karyawan: 0,
      avg_score: 0,
      a_plus: 0, a: 0, b_plus: 0, b: 0, c: 0, d: 0, e: 0,
      bonus_eligible: 0,
      retain: 0,
      watch: 0,
      review: 0,
      not_recommended: 0
    };

    var allScores = [];
    var totalScoreSum = 0;

    for (var i = 1; i < scoresData.length; i++) {
      if (scoresData[i][3] == yearMonth && scoresData[i][10] == 'ACTIVE') {
        summary.total_karyawan++;
        totalScoreSum += scoresData[i][6];

        var grade = scoresData[i][7];
        var rec = scoresData[i][8];

        if (grade == 'A+') summary.a_plus++;
        else if (grade == 'A') summary.a++;
        else if (grade == 'B+') summary.b_plus++;
        else if (grade == 'B') summary.b++;
        else if (grade == 'C') summary.c++;
        else if (grade == 'D') summary.d++;
        else if (grade == 'E') summary.e++;

        if (rec == 'BONUS_ELIGIBLE') summary.bonus_eligible++;
        else if (rec == 'RETAIN') summary.retain++;
        else if (rec == 'WATCH') summary.watch++;
        else if (rec == 'REVIEW') summary.review++;
        else if (rec == 'NOT_RECOMMENDED') summary.not_recommended++;

        var empName = '';
        var storeId = '';
        for (var j = 1; j < karyawanData.length; j++) {
          if (karyawanData[j][0] == scoresData[i][1]) {
            empName = karyawanData[j][1];
            storeId = karyawanData[j][8];
            break;
          }
        }

        allScores.push({
          employee_id: scoresData[i][1],
          employee_name: empName,
          store_id: storeId,
          total_score: scoresData[i][6],
          grade: grade,
          recommendation: rec
        });
      }
    }

    summary.avg_score = summary.total_karyawan > 0 ? Math.round(totalScoreSum / summary.total_karyawan) : 0;

    allScores.sort(function(a, b) { return b.total_score - a.total_score; });

    return jsonResponsePoin({
      status: 'success',
      year_month: yearMonth,
      summary: summary,
      all_scores: allScores,
      top_performers: allScores.slice(0, 10),
      red_flags: allScores.filter(function(s) { return s.recommendation == 'WATCH' || s.recommendation == 'REVIEW' || s.recommendation == 'NOT_RECOMMENDED'; })
    });

  } catch (error) {
    return jsonResponsePoin({status: 'error', message: error.toString()});
  }
}

// ============================================
// AUDIT LOG
// ============================================

function logScoreAudit(actor, action, employeeId, yearMonth, oldScore, newScore, reason) {
  try {
    var ss = getSpreadsheetPoin();
    var auditSheet = ss.getSheetByName('SCORE_AUDIT');

    if (!auditSheet) {
      auditSheet = ss.insertSheet('SCORE_AUDIT');
      auditSheet.appendRow(['audit_id', 'timestamp', 'action', 'employee_id', 'year_month', 'old_score', 'new_score', 'triggered_by']);
    }

    auditSheet.appendRow([
      'AUD-' + new Date().getTime(),
      new Date(),
      action,
      employeeId,
      yearMonth,
      oldScore,
      newScore,
      actor
    ]);

  } catch (e) {
    Logger.log('Audit log error: ' + e);
  }
}

// ============================================
// CRON JOB SETUP
// ============================================

/**
 * Setup cron job untuk kalkulasi bulanan
 * Jalankan INI SEKALI untuk setup trigger
 */
function setupPoinCronJob() {
  // Hapus trigger lama jika ada
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == 'calculateMonthlyScores') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Buat trigger baru: tanggal 1, jam 01:00
  ScriptApp.newTrigger('calculateMonthlyScores')
    .timeBased()
    .onMonthDay(1)
    .atHour(1)
    .nearMinute(0)
    .create();

  Logger.log('Poin Kinerja cron job setup complete!');
  Logger.log('Trigger: Setiap tanggal 1 jam 01:00');
}

/**
 * Trigger manual untuk testing
 * Bisa dijalankan dari Apps Script editor
 */
function triggerMonthlyCalculation() {
  var result = calculateMonthlyScores({parameter: {}});
  Logger.log(result.getContent());
}
```

---

## 15. FRONTEND - SCREEN BARU (Tidak Ganggu Screen Existing)

### 15.1 Menu Sidebar (Tambahkan, tidak ubah yang ada)

```html
<!-- TAMBAHKAN INI ke sidebar karyawan (TIDAK UBAH yang ada) -->

<!-- EXISTING MENU (JANGAN UBAH) -->
<nav class="sidebar">
  <a href="#absensi" class="menu-item">
    <i class="icon-camera"></i> Absensi
  </a>
  <a href="#jadwal" class="menu-item">
    <i class="icon-calendar"></i> Jadwal
  </a>
  <a href="#chat" class="menu-item">
    <i class="icon-chat"></i> Chat
  </a>
  <a href="#tugas" class="menu-item">
    <i class="icon-tasks"></i> Tugas
  </a>
  <a href="#setting" class="menu-item">
    <i class="icon-settings"></i> Setting
  </a>

  <!-- NEW: Poin & Kinerja (TAMBAH INI SAJA) -->
  <div class="menu-divider"></div>
  <a href="#poin-kinerja" class="menu-item menu-new" id="menu-poin-kinerja">
    <i class="icon-chart"></i> 
    <span>Poin & Kinerja</span>
    <span class="badge badge-new">NEW</span>
  </a>
</nav>
```

### 15.2 Screen Poin & Kinerja - Karyawan

```html
<!-- SCREEN: Poin & Kinerja (Karyawan) -->
<div id="screen-poin-kinerja" class="screen hidden">

  <!-- Header -->
  <div class="poin-header">
    <h2>Poin & Kinerja</h2>
    <select id="poin-month-select">
      <option value="2026-07">Juli 2026</option>
      <option value="2026-06">Juni 2026</option>
      <option value="2026-05">Mei 2026</option>
    </select>
  </div>

  <!-- Score Card -->
  <div class="score-card">
    <div class="score-circle grade-a-plus">
      <span class="score-grade">A+</span>
      <span class="score-total">480</span>
      <span class="score-max">/ 500</span>
    </div>
    <div class="score-info">
      <p class="score-recommendation recommendation-bonus">
        BONUS ELIGIBLE
      </p>
      <p class="score-date">Periode: Juli 2026</p>
    </div>
  </div>

  <!-- Breakdown -->
  <div class="score-breakdown">
    <h3>Breakdown Score</h3>

    <div class="breakdown-item">
      <div class="breakdown-label">
        <span>Kehadiran</span>
        <span class="breakdown-weight">50%</span>
      </div>
      <div class="breakdown-bar">
        <div class="breakdown-fill" style="width: 92%"></div>
      </div>
      <div class="breakdown-value">
        <span>460 / 500</span>
        <span class="breakdown-pct">92%</span>
      </div>
      <div class="breakdown-detail">
        Hadir: 26 | Izin: 2 | Alpa: 0 | Terlambat: 2
      </div>
    </div>

    <div class="breakdown-item">
      <div class="breakdown-label">
        <span>Tugas</span>
        <span class="breakdown-weight">50%</span>
      </div>
      <div class="breakdown-bar">
        <div class="breakdown-fill" style="width: 100%"></div>
      </div>
      <div class="breakdown-value">
        <span>1000 / 1000</span>
        <span class="breakdown-pct">100%</span>
      </div>
      <div class="breakdown-detail">
        Completion: 100% | On-Time: 100% | Quality: 100%
      </div>
    </div>
  </div>

  <!-- Trend Chart -->
  <div class="score-trend">
    <h3>Trend 6 Bulan Terakhir</h3>
    <canvas id="trend-chart"></canvas>
  </div>

  <!-- History Table -->
  <div class="score-history">
    <h3>Riwayat Bulanan</h3>
    <table class="history-table">
      <thead>
        <tr>
          <th>Bulan</th>
          <th>Kehadiran</th>
          <th>Tugas</th>
          <th>Total</th>
          <th>Grade</th>
        </tr>
      </thead>
      <tbody id="history-tbody">
        <!-- Diisi oleh JavaScript -->
      </tbody>
    </table>
  </div>

</div>
```

### 15.3 Screen Poin & Kinerja - Manager/Owner

```html
<!-- SCREEN: Poin & Kinerja - Team (Manager/Owner) -->
<div id="screen-team-kinerja" class="screen hidden">

  <div class="poin-header">
    <h2>Kinerja Tim</h2>
    <div class="filter-bar">
      <select id="team-store-select">
        <option value="all">Semua Toko</option>
        <option value="toko-a">Toko A</option>
        <option value="toko-b">Toko B</option>
      </select>
      <select id="team-month-select">
        <option value="2026-07">Juli 2026</option>
        <option value="2026-06">Juni 2026</option>
      </select>
      <button id="btn-export-team" class="btn-export">Export</button>
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="summary-cards">
    <div class="summary-card card-green">
      <span class="summary-number">5</span>
      <span class="summary-label">Bonus Eligible</span>
    </div>
    <div class="summary-card card-blue">
      <span class="summary-number">28</span>
      <span class="summary-label">Retain</span>
    </div>
    <div class="summary-card card-yellow">
      <span class="summary-number">7</span>
      <span class="summary-label">Watch</span>
    </div>
    <div class="summary-card card-red">
      <span class="summary-number">2</span>
      <span class="summary-label">Review</span>
    </div>
  </div>

  <!-- Team Table -->
  <div class="team-table-container">
    <table class="team-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Karyawan</th>
          <th>Kehadiran</th>
          <th>Tugas</th>
          <th>Total</th>
          <th>Grade</th>
          <th>Rekomendasi</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody id="team-tbody">
        <!-- Diisi oleh JavaScript -->
      </tbody>
    </table>
  </div>

</div>
```

### 15.4 JavaScript untuk Poin & Kinerja (Tambah file baru)

```javascript
// ============================================
// FILE: poin-kinerja.js (BARU - tambah ke project)
// ============================================

const POIN_API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

const PoinKinerja = {

  // Current user info (ambil dari session/login yang sudah ada)
  currentUser: null,

  init() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.bindEvents();
  },

  bindEvents() {
    // Menu click
    document.getElementById('menu-poin-kinerja').addEventListener('click', () => {
      this.showScreen('poin-kinerja');
      this.loadMyScorecard();
    });

    // Month selector change
    document.getElementById('poin-month-select').addEventListener('change', (e) => {
      this.loadMyScorecard(e.target.value);
    });
  },

  showScreen(screenId) {
    // Sembunyikan semua screen (yang existing + yang baru)
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-' + screenId).classList.remove('hidden');
  },

  async loadMyScorecard(yearMonth) {
    try {
      const month = yearMonth || this.getCurrentYearMonth();

      const response = await fetch(POIN_API_URL + '?action=getMyScorecard' + 
        '&employee_id=' + encodeURIComponent(this.currentUser.id) +
        '&year_month=' + encodeURIComponent(month));

      const data = await response.json();

      if (data.status === 'success') {
        this.renderScorecard(data.scorecard);
        this.renderTrend(data.trend);
        this.renderHistory(data.trend);
      } else {
        this.showError(data.message);
      }

    } catch (error) {
      this.showError('Gagal memuat scorecard: ' + error.message);
    }
  },

  renderScorecard(scorecard) {
    // Update score circle
    const gradeEl = document.querySelector('.score-grade');
    const totalEl = document.querySelector('.score-total');
    const recEl = document.querySelector('.score-recommendation');

    gradeEl.textContent = scorecard.grade;
    gradeEl.className = 'score-grade grade-' + scorecard.grade.toLowerCase().replace('+', '-plus');
    totalEl.textContent = Math.round(scorecard.total_score);

    recEl.textContent = this.getRecommendationEmoji(scorecard.recommendation) + ' ' + scorecard.recommendation;
    recEl.className = 'score-recommendation recommendation-' + scorecard.recommendation.toLowerCase().replace('_', '-');

    // Update breakdown
    document.querySelector('.breakdown-item:nth-child(1) .breakdown-fill').style.width = (scorecard.attendance_score / 500 * 100) + '%';
    document.querySelector('.breakdown-item:nth-child(2) .breakdown-fill').style.width = (scorecard.task_score / 1000 * 100) + '%';
  },

  renderTrend(trend) {
    // Gunakan Chart.js atau canvas manual
    const canvas = document.getElementById('trend-chart');
    const ctx = canvas.getContext('2d');

    // Simple line chart
    // ... (implementasi chart)
  },

  renderHistory(trend) {
    const tbody = document.getElementById('history-tbody');
    tbody.innerHTML = trend.map(t => `
      <tr>
        <td>${this.formatMonth(t.year_month)}</td>
        <td>${t.attendance_score || '-'}</td>
        <td>${t.task_score || '-'}</td>
        <td><strong>${Math.round(t.total_score)}</strong></td>
        <td><span class="badge-grade grade-${t.grade.toLowerCase().replace('+', '-plus')}">${t.grade}</span></td>
      </tr>
    `).join('');
  },

  getRecommendationEmoji(rec) {
    const emojis = {
      'BONUS_ELIGIBLE': '🏆',
      'RETAIN': '✅',
      'WATCH': '⚠️',
      'REVIEW': '🚨',
      'NOT_RECOMMENDED': '❌'
    };
    return emojis[rec] || '';
  },

  getCurrentYearMonth() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  },

  formatMonth(yearMonth) {
    const [year, month] = yearMonth.split('-');
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return months[parseInt(month)] + ' ' + year;
  },

  showError(message) {
    // Tampilkan error toast/alert
    alert(message);
  }
};

// Initialize saat DOM ready
document.addEventListener('DOMContentLoaded', () => {
  PoinKinerja.init();
});
```

---

## 16. CSS untuk Poin & Kinerja (Tambah file baru atau append)

```css
/* ============================================ */
/* FILE: poin-kinerja.css (BARU - tambah ke project) */
/* ============================================ */

/* Score Circle */
.score-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  margin-bottom: 20px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid rgba(255,255,255,0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.score-grade {
  font-size: 32px;
  font-weight: bold;
}

.score-total {
  font-size: 24px;
  font-weight: bold;
}

.score-max {
  font-size: 14px;
  opacity: 0.8;
}

/* Grade Colors */
.grade-a-plus { background: linear-gradient(135deg, #11998e, #38ef7d); }
.grade-a { background: linear-gradient(135deg, #56ab2f, #a8e063); }
.grade-b-plus { background: linear-gradient(135deg, #f7971e, #ffd200); }
.grade-b { background: linear-gradient(135deg, #f6d365, #fda085); }
.grade-c { background: linear-gradient(135deg, #ff9966, #ff5e62); }
.grade-d { background: linear-gradient(135deg, #eb3349, #f45c43); }
.grade-e { background: linear-gradient(135deg, #8e0e00, #1f1c18); }

/* Breakdown */
.breakdown-item {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.breakdown-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 500;
}

.breakdown-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.breakdown-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.breakdown-value {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6c757d;
}

/* Recommendation Badges */
.recommendation-bonus { background: #d4edda; color: #155724; }
.recommendation-retain { background: #d1ecf1; color: #0c5460; }
.recommendation-watch { background: #fff3cd; color: #856404; }
.recommendation-review { background: #f8d7da; color: #721c24; }
.recommendation-not-recommended { background: #f5c6cb; color: #721c24; }

/* Team Table */
.team-table {
  width: 100%;
  border-collapse: collapse;
}

.team-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

.team-table td {
  padding: 12px;
  border-bottom: 1px solid #e9ecef;
}

.table-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
}

.badge-grade {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.badge-rec {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.summary-card {
  padding: 16px;
  border-radius: 12px;
  text-align: center;
}

.summary-number {
  display: block;
  font-size: 32px;
  font-weight: bold;
  color: white;
}

.summary-label {
  font-size: 12px;
  color: rgba(255,255,255,0.9);
}

.card-green { background: linear-gradient(135deg, #11998e, #38ef7d); }
.card-blue { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.card-yellow { background: linear-gradient(135deg, #f6d365, #fda085); }
.card-red { background: linear-gradient(135deg, #ff9966, #ff5e62); }
```

---

## 17. IMPLEMENTATION CHECKLIST (Zero Risk)

### Phase 1: Backend (PoinKinerja.gs) - 1 Hari
- [ ] Buat file baru PoinKinerja.gs (JANGAN ubah Code.gs existing)
- [ ] Copy-paste semua function dari section 14
- [ ] SESUAIKAN NOMOR KOLOM dengan struktur Sheet Anda (lihat catatan di bawah)
- [ ] Buat Sheet MONTHLY_SCORES dan SCORE_AUDIT manual di spreadsheet
- [ ] Test function calculateMonthlyScores() dengan data dummy
- [ ] Test function getMyScorecard() dengan Postman

### Phase 2: Frontend (HTML/CSS/JS) - 1 Hari
- [ ] Tambah menu "Poin & Kinerja" di sidebar (copy-paste dari section 15.1)
- [ ] Buat screen poin-kinerja (copy-paste dari section 15.2)
- [ ] Tambah file poin-kinerja.js (copy-paste dari section 15.4)
- [ ] Tambah file poin-kinerja.css (copy-paste dari section 16)
- [ ] Test buka screen Poin & Kinerja

### Phase 3: Integrasi - 1 Hari
- [ ] Hubungkan frontend dengan backend (ganti YOUR_SCRIPT_ID)
- [ ] Test end-to-end: login -> buka Poin & Kinerja -> lihat scorecard
- [ ] Test dengan data real (1 karyawan)
- [ ] Jika error, cek console log

### Phase 4: Deployment - 1 Hari
- [ ] Deploy PoinKinerja.gs sebagai web app terpisah (atau gabung)
- [ ] Setup cron job: jalankan setupPoinCronJob() sekali
- [ ] Monitor 1 minggu
- [ ] Jika ada masalah: hapus menu "Poin & Kinerja" dari sidebar = fitur hilang, sistem aman

---

## 18. CATATAN PENTING: SESUAIKAN KOLOM!

### Anda HARUS sesuaikan nomor kolom di PoinKinerja.gs dengan struktur Sheet Anda!

```javascript
// ============================================
// SESUAIKAN INI dengan struktur Sheet Anda!
// ============================================

// Sheet "ABSENSI" - sesuaikan nomor kolom:
var rowEmployeeId = row[1];  // kolom B = index 1
var rowDate = row[3];         // kolom D = index 3
var rowStatus = row[6];      // kolom G = index 6

// Jika struktur Sheet Anda BEDA, ubah nomor index-nya!
// Contoh: jika status di kolom H (index 7):
// var rowStatus = row[7];

// Sheet "LOG_TUGAS" - sesuaikan nomor kolom:
var rowEmployeeId = row[2];   // kolom C = index 2
var rowAssignedAt = row[4];   // kolom E = index 4
var rowStatus = row[6];       // kolom G = index 6
var rowSubmittedAt = row[7];  // kolom H = index 7
var rowDeadline = row[5];     // kolom F = index 5

// Sheet "MASTER_KARYAWAN" - sesuaikan nomor kolom:
var employeeId = karyawanData[i][0];   // kolom A = index 0
var employeeName = karyawanData[i][1]; // kolom B = index 1
var storeId = karyawanData[i][8];      // kolom I = index 8
var role = karyawanData[i][3];         // kolom D = index 3
var status = karyawanData[i][5];       // kolom F = index 5
```

### Cara Cek Nomor Kolom:
1. Buka spreadsheet Anda
2. Lihat Sheet "ABSENSI" - catat: status ada di kolom mana?
3. Lihat Sheet "LOG_TUGAS" - catat: status, deadline, submitted_at ada di kolom mana?
4. Lihat Sheet "MASTER_KARYAWAN" - catat: store_id, role, status ada di kolom mana?
5. Ubah nomor index di PoinKinerja.gs sesuai catatan Anda

---

## 19. CARA DISABLE (Jika Ada Masalah)

Jika fitur ini bermasalah, cukup lakukan ini:

1. Hapus menu "Poin & Kinerja" dari sidebar HTML
2. Hapus file PoinKinerja.gs (jika deploy terpisah)
3. Hapus trigger cron: ScriptApp.getProjectTriggers() -> delete trigger calculateMonthlyScores
4. Sistem absensi + tugas Anda TETAP JALAN NORMAL

---

## 20. RINGKASAN PERUBAHAN

| Komponen | Sebelum | Sesudah | Status |
|----------|---------|---------|--------|
| Sheet | 17 sheet | 19 sheet (+2 baru) | Tambah |
| File Code.gs | 1 file | 2 file (+1 baru) | Tambah |
| Endpoint | ~45 endpoint | ~54 endpoint (+9 baru) | Tambah |
| Cron Job | ~3 cron | ~4 cron (+1 baru) | Tambah |
| Menu Karyawan | 9 menu | 10 menu (+1 baru) | Tambah |
| Menu Admin | 10 menu | 11 menu (+1 baru) | Tambah |
| Screen Karyawan | ~12 screen | ~13 screen (+1 baru) | Tambah |
| Screen Admin | ~14 screen | ~15 screen (+1 baru) | Tambah |
| CSS/JS | existing | + poin-kinerja.js, + poin-kinerja.css | Tambah |
| Dependency | existing | + MPAndroidChart, + Apache POI | Tambah |

Tidak ada yang diubah atau dihapus dari sistem existing.

---

## 21. TESTING CHECKLIST

- [ ] Test 1: Buka screen Poin & Kinerja -> lihat scorecard -> tidak error
- [ ] Test 2: Jalankan calculateMonthlyScores() manual -> score tersimpan di MONTHLY_SCORES
- [ ] Test 3: Ganti bulan di dropdown -> score berubah sesuai bulan
- [ ] Test 4: Buka screen Kinerja Tim (manager) -> lihat semua karyawan -> tidak error
- [ ] Test 5: Buka Dashboard Owner -> lihat summary -> tidak error
- [ ] Test 6: Cron job jalan otomatis tanggal 1 -> score generate otomatis
- [ ] Test 7: Hapus menu Poin & Kinerja dari sidebar -> sistem absensi tetap jalan

---

*End of PRD Absensi Pro v2.0 - Poin & Kinerja*
*Absensi Pro (C) 2026*
*Total: 21 sections, 2 new sheets, 1 new file, 9 new endpoints, 1 new cron job, 2 new screens*
