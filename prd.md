# 📋 PRD: Sistem Absensi Karyawan Multi-Toko v3.0

## Ringkasan Eksekutif

Aplikasi absensi karyawan multi-toko berbasis Google Apps Script dengan tiga komponen utama:
- **Frontend Karyawan** (Mobile-first PWA)
- **Frontend Admin** (Dashboard web desktop)
- **Backend** (Google Apps Script + Google Sheets)

---

## 1. Arsitektur Sistem

### 1.1 Tech Stack
| Layer | Teknologi |
|-------|-----------|
| Database | Google Sheets (14 sheet) |
| Backend | Google Apps Script (Web App) |
| Storage | Google Drive (folder terstruktur) |
| Frontend Karyawan | HTML5 + Vanilla JS (PWA) |
| Frontend Admin | HTML5 + Vanilla JS |
| Auth | PIN-based + LocalStorage session |

### 1.2 Struktur Spreadsheet (`1CC10iigHkBpSpGxL_vtc_lwBAC7vIsqNLoy3pXO2MVc`)

| No | Sheet Name | Fungsi | Kolom Utama |
|----|-----------|--------|-------------|
| 1 | `MASTER_KARYAWAN` | Data karyawan | ID, Nama, PIN, Jabatan, Toko_Default, Shift_Default, Foto_URL, Status |
| 2 | `MASTER_TOKO` | Data toko/cabang | ID, Nama, Alamat, Lat, Long, Radius, Jam Buka/Tutup, Foto, Status |
| 3 | `SHIFT_TOKO` | Shift per toko | ID, ID_Toko, Nama_Shift, Jam_Masuk, Jam_Pulang, Toleransi, Status |
| 4 | `JADWAL_KARYAWAN` | Penjadwalan | ID, ID_Karyawan, ID_Toko, ID_Shift, Hari_Berjalan, Periode |
| 5 | `ABSENSI` | Log absensi | Timestamp, ID_Karyawan, Toko, Shift, Jam Masuk/Pulang, Foto, GPS, Status |
| 6 | `LEMBUR` | Pengajuan lembur | ID, ID_Karyawan, Toko, Tanggal, Durasi, Alasan, Foto, Status Approval |
| 7 | `IZIN_CUTI` | Pengajuan izin | ID, ID_Karyawan, Jenis, Periode, Jumlah Hari, Alasan, Lampiran, Status |
| 8 | `MASTER_JENIS_IZIN` | Master jenis izin | ID, Nama, Kode, Kuota, Gender, Potong Cuti, Syarat |
| 9 | `SETTING_GLOBAL` | Konfigurasi app | Parameter, Value, Keterangan |
| 10 | `LOG_ERROR` | Log error sistem | Timestamp, Error, Stack, User, Action |
| 11 | `CHAT` | Obrolan karyawan | ID_Pesan, ID_Karyawan, Pesan, Tipe, File_URL, Timestamp |
| 12 | `TUKER_SHIFT` | Tukar shift antar karyawan | ID, ID_Karyawan, Toko, Shift, Tanggal, Status |
| 13 | `TUGAS` | Penugasan karyawan | ID, ID_Toko, Judul, Deskripsi, Deadline, Prioritas, Status |
| 14 | `BERITA` | Pengumuman/berita | ID, Judul, Isi, Kategori, Gambar, Tgl_Publish, Status |

---

## 2. Fitur yang Sudah Ada (v2.0)

### 2.1 Frontend Karyawan (Mobile)
- [x] Login dengan PIN (dropdown nama + auto-fill toko/shift)
- [x] Absen Masuk (foto selfie + GPS validation)
- [x] Absen Pulang (foto selfie + hitung durasi kerja)
- [x] Mode Lembur (ajukan setelah absen masuk)
- [x] Pengajuan Izin/Cuti (Sakit, Izin, Cuti, Nikah, Melahirkan)
- [x] Jadwal Mingguan (view 7 hari)
- [x] Raport Bulanan (statistik hadir, telat, jam kerja)
- [x] Notifikasi Approval (real-time badge)
- [x] Chat antar karyawan (text + file attachment)
- [x] Tukar Shift (ajukan ke karyawan lain)
- [x] Daftar Tugas (view + selesaikan)
- [x] Berita & Pengumuman
- [x] Tutorial interaktif (PICO mascot)

### 2.2 Frontend Admin (Desktop)
- [x] Dashboard (statistik real-time)
- [x] Monitor Toko (karyawan online per toko)
- [x] Approval Lembur & Izin (approve/reject)
- [x] Laporan Absensi (Harian/Mingguan/Bulanan/Tahunan)
- [x] Export Excel/PDF
- [x] Setting Toko (CRUD + GPS picker + foto)
- [x] Setting Karyawan (CRUD + foto profil)
- [x] Setting Shift per Toko (CRUD inline)
- [x] Setting Jenis Izin (CRUD)
- [x] Setting Global (konfigurasi app)
- [x] Perhitungan Upah Bulanan (toleransi 2 hari izin)

### 2.3 Backend (GAS)
- [x] 40+ API endpoints
- [x] Upload foto ke Google Drive
- [x] Validasi GPS (radius toko)
- [x] Validasi waktu (toleransi keterlambatan)
- [x] Auto-generate ID
- [x] Error logging

---

## 3. Fitur Baru v3.0 (Yang Perlu Dikembangkan)

### 3.1 🔥 PRIORITAS TINGGI

#### 3.1.1 **Multi-User Admin dengan Hak Akses Berbeda**
```
Level Akses:
├── Super Admin (Owner)     : Full access
├── Admin Toko (Manager)    : CRUD karyawan, shift, jadwal di tokonya saja
├── Admin HR                : Approval izin/cuti, lihat laporan semua toko
└── Admin Finance           : Lihat laporan & perhitungan upah, tidak bisa edit data master
```

#### 3.1.2 **Setting Jadwal Karyawan (Grid View)**
- Tampilan grid 7 hari x N karyawan
- Drag & drop shift assignment
- Template jadwal (copy paste mingguan)
- Auto-generate jadwal rolling (shift rotation)
- Validasi: 1 karyawan tidak boleh 2 shift sehari

#### 3.1.3 **Lembur dengan Jam Selesai & Perhitungan Otomatis**
- Saat approve lembur, admin isi jam selesai
- Sistem hitung durasi & upah lembur otomatis
- Tarif lembur per jam (setting global)

#### 3.1.4 **Slip Gaji Digital**
- Generate slip gaji per karyawan per bulan
- Komponen: Gaji pokok + tunjangan + lembur - potongan (telat, bolos)
- Export PDF slip gaji
- Riwayat slip gaji (arsip)

#### 3.1.5 **Face Recognition / Liveness Detection**
- Blink detection sebelum capture foto
- Anti-spoofing (tidak bisa pakai foto statis)
- Face matching: bandingkan foto absen dengan foto profil

### 3.2 🔶 PRIORITAS MENENGAH

#### 3.2.1 **Dashboard Analytics**
- Grafik kehadiran (Chart.js)
- Heatmap keterlambatan per toko
- Trend absensi 30 hari terakhir
- Top 5 karyawan telat/ontime

#### 3.2.2 **Notifikasi Push (Web Push / Firebase)**
- Notifikasi saat ada approval masuk (admin)
- Notifikasi reminder absen (karyawan)
- Notifikasi deadline tugas
- Notifikasi tukar shift (butuh konfirmasi)

#### 3.2.3 **Multi-Shift per Hari**
- Karyawan bisa punya 2 shift (pagi + malam)
- Validasi istirahat minimal 4 jam antar shift

#### 3.2.4 **Izin Mendadak (Emergency Leave)**
- Ajukan izin setelah jam masuk (tanpa perencanaan)
- Dokumentasi wajib (foto bukti)
- Auto-mark absensi sebagai "Izin" bukan "Alpa"

#### 3.2.5 **Cuti Bersama & Libur Nasional**
- Setting hari libur nasional di kalender
- Auto-skip hari libur saat hitung hari kerja
- Notifikasi cuti bersama ke semua karyawan

### 3.3 🔹 PRIORITAS RENDAH / NICE TO HAVE

#### 3.3.1 **QR Code Check-in**
- Alternatif selain GPS (untuk toko di mall basement)
- Scan QR di lokasi toko

#### 3.3.2 **Beacon Bluetooth**
- Untuk validasi kehadiran di area toko
- Low power, lebih akurat dari GPS indoor

#### 3.3.3 **Integrasi Google Calendar**
- Sinkron jadwal shift ke Google Calendar karyawan
- Reminder otomatis 30 menit sebelum shift

#### 3.3.4 **Multi-Bahasa**
- Indonesia (default)
- English
- Bahasa daerah (Jawa, Sunda)

---

## 4. Spesifikasi Teknis Detail

### 4.1 API Endpoints (Backend GAS)

#### 4.1.1 Auth & Session
```javascript
// POST
login({ idKaryawan, pin }) → { success, user, token }
logout() → { success }
getUserInfo({ idKaryawan }) → { success, user }
refreshToken({ token }) → { success, newToken }
```

#### 4.1.2 Absensi
```javascript
// POST
absenMasuk({ idKaryawan, idToko, idShift, fotoBase64, lat, lng, faceData })
absenPulang({ idKaryawan, fotoBase64, lat, lng })
getAbsenStatus({ idKaryawan, tanggal })
getAbsenHariIni({ idKaryawan, tanggal })

// GET
getAbsensiPeriode({ idKaryawan, tglMulai, tglAkhir, mode })
getAbsensiByToko({ idToko, tanggal })
```

#### 4.1.3 Lembur (ENHANCED v3.0)
```javascript
// POST
ajukanLembur({ idKaryawan, idToko, jamMulai, perkiraanJamSelesai, alasan, fotoBase64 })
approveLembur({ idLembur, status, approvedBy, jamSelesaiAktual, tarifPerJam }) // ← NEW: jamSelesaiAktual
getLemburHistory({ idKaryawan, periode })

// GET
getLemburPeriode({ idToko, tglMulai, tglAkhir })
hitungUpahLembur({ idKaryawan, bulan, tahun }) // ← NEW
```

#### 4.1.4 Izin/Cuti
```javascript
// POST
ajukanIzin({ idKaryawan, idJenis, tglMulai, tglSelesai, alasan, lampiranBase64, emergency }) // ← NEW: emergency
approveIzin({ idIzin, status, approvedBy })
getSisaKuota({ idKaryawan, idJenis })

// GET
getIzinHistory({ idKaryawan, periode })
getIzinPeriode({ idToko, tglMulai, tglAkhir })
```

#### 4.1.5 Jadwal (ENHANCED v3.0)
```javascript
// POST
saveJadwalKaryawan({ idKaryawan, idToko, idShift, hari, tglMulai, tglSelesai })
updateJadwalKaryawan({ idJadwal, ...fields })
deleteJadwalKaryawan({ idJadwal })
generateJadwalRolling({ idToko, periodeMulai, periodeAkhir, polaShift }) // ← NEW
applyTemplateJadwal({ idToko, mingguSumber, mingguTujuan }) // ← NEW

// GET
getJadwalHariIni({ idKaryawan })
getJadwalMingguan({ idKaryawan, tanggalReferensi })
getJadwalByTokoPeriode({ idToko, tglMulai, tglAkhir }) // ← NEW
getJadwalGrid({ idToko, mingguOffset }) // ← NEW: format grid
```

#### 4.1.6 Master Data (CRUD Lengkap)
```javascript
// TOKO
getTokoList() → { success, data[] }
saveToko({ nama, alamat, lat, lng, radius, jamBuka, jamTutup, fotoBase64 })
updateToko({ idToko, ...fields })
deleteToko({ idToko }) // soft delete
deleteTokoPermanent({ idToko }) // hard delete

// SHIFT
getShiftByToko({ idToko })
getAllShifts()
saveShift({ idToko, namaShift, jamMasuk, jamPulang, toleransi })
updateShift({ idShift, ...fields })
deleteShiftPermanent({ idShift })

// KARYAWAN
getKaryawanList()
getKaryawanById({ idKaryawan })
saveKaryawan({ nama, pin, jabatan, noHP, email, tglMasuk, tokoDefault, shiftDefault, fotoBase64 })
updateKaryawan({ idKaryawan, ...fields })
deleteKaryawan({ idKaryawan }) // soft delete
uploadFotoProfil({ fotoBase64, idKaryawan })

// JENIS IZIN
getJenisIzinList()
saveJenisIzin({ nama, kode, kuotaTahun, kuotaBulan, maxHari, gender, potongCuti, syaratHari })
updateJenisIzin({ idJenis, ...fields })
deleteJenisIzin({ idJenis })
```

#### 4.1.7 Laporan & Analytics (NEW v3.0)
```javascript
// GET
getLaporanAbsensi({ mode, tglMulai, tglAkhir, idToko, idShift, idKaryawan })
getDashboardData()
getMonitoringToko()
getAbsensiHariIniLengkap({ tanggal, idToko, idShift })

// NEW v3.0
getAnalyticsKehadiran({ idToko, periode }) // ← data untuk chart
getHeatmapTelat({ idToko, bulan, tahun }) // ← data heatmap
getTrendAbsensi({ idToko, hariKeBelakang }) // ← 30 hari trend
getTopKaryawan({ kriteria, limit }) // ← top 5

// SLIP GAJI (NEW v3.0)
generateSlipGaji({ idKaryawan, bulan, tahun }) // ← generate & return PDF URL
getSlipGajiHistory({ idKaryawan }) // ← riwayat slip gaji
getPerhitunganUpah({ idKaryawan, bulan, tahun }) // ← detail perhitungan
```

#### 4.1.8 Approval & Notifikasi
```javascript
// GET
getPendingApprovals() // admin view
getMyApprovals({ idKaryawan }) // karyawan view

// POST
approveLembur({ idLembur, status, approvedBy, ... })
approveIzin({ idIzin, status, approvedBy, ... })
```

#### 4.1.9 Chat & Komunikasi
```javascript
// GET
getChatMessages({ limit, offset })

// POST
sendChatMessage({ idKaryawan, nama, pesan, tipe, fileBase64, namaFile })
```

#### 4.1.10 Tugas & Berita
```javascript
// TUGAS
getTugasList({ idKaryawan, idToko })
updateTugasStatus({ idTugas, status, idKaryawan })
createTugas({ idToko, judul, deskripsi, deadline, prioritas, ditugaskanKe }) // ← NEW

// BERITA
getBeritaList({ limit })
createBerita({ judul, isi, kategori, gambarBase64, tglPublish }) // ← NEW
updateBerita({ idBerita, ... }) // ← NEW
deleteBerita({ idBerita }) // ← NEW
```

#### 4.1.11 Tukar Shift
```javascript
// POST
ajukanTukerShift({ idKaryawan, idTokoSaya, idTokoTujuan, idKaryawanTujuan, shiftSaya, shiftTujuan, tanggal, alasan })
approveTukerShift({ idTuker, status, approvedBy }) // ← NEW: butuh approval 2 pihak
getTukerShiftHistory({ idKaryawan })
```

#### 4.1.12 Setting Global
```javascript
// GET
getSettingGlobal()

// POST
updateSettingGlobal({ parameter, value })
```

#### 4.1.13 Utility
```javascript
testConnection() // health check
uploadFotoToko({ fotoBase64, namaToko })
logError({ action, error, payload })
```

### 4.2 Struktur Data Lengkap

#### 4.2.1 MASTER_KARYAWAN (Enhanced v3.0)
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| ID_Karyawan | String | Auto-generate (K + timestamp) |
| Nama | String | Nama lengkap |
| PIN | String | 4 digit |
| Jabatan | String | Staff/Kasir/Manager/Supervisor |
| Tanggal_Masuk | Date | YYYY-MM-DD |
| Status | Enum | Aktif/Nonaktif/Cuti |
| No_HP | String | 08xxxxxxxxxx |
| Email | String | email@domain.com |
| Toko_Default | FK | ID_Toko |
| Shift_Default | FK | ID_Shift |
| Foto_URL | URL | Google Drive thumbnail |
| **Role** | **Enum** | **NEW: Karyawan/Admin_Toko/Admin_HR/Admin_Finance/Super_Admin** |
| **Gaji_Pokok** | **Number** | **NEW: nominal gaji pokok** |
| **Tunjangan** | **Number** | **NEW: nominal tunjangan** |
| **Tarif_Lembur_Per_Jam** | **Number** | **NEW: default dari setting global** |
| **NPWP** | **String** | **NEW: untuk slip gaji** |
| **No_Rekening** | **String** | **NEW: untuk transfer gaji** |
| **Bank** | **String** | **NEW: nama bank** |

#### 4.2.2 MASTER_TOKO (Enhanced v3.0)
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| ID_Toko | String | Auto-generate (T + timestamp) |
| Nama_Toko | String | Nama cabang |
| Alamat | String | Alamat lengkap |
| Lat | Float | Latitude |
| Long | Float | Longitude |
| Radius_M | Number | Meter (default 50) |
| Jam_Buka | Time | HH:mm |
| Jam_Tutup | Time | HH:mm |
| Foto_Toko_URL | URL | Thumbnail toko |
| Status | Enum | Aktif/Nonaktif |
| **ID_Admin** | **FK** | **NEW: ID karyawan yang jadi admin toko** |
| **QR_Code_URL** | **URL** | **NEW: untuk check-in alternatif** |

#### 4.2.3 ABSENSI (Enhanced v3.0)
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| Timestamp | DateTime | Auto |
| ID_Karyawan | FK | |
| Nama | String | |
| ID_Toko | FK | |
| Nama_Toko | String | |
| ID_Shift | FK | |
| Nama_Shift | String | |
| Tipe | Enum | Masuk/Pulang/Izin/Lembur |
| Jam_Masuk | Time | |
| Jam_Pulang | Time | |
| Jam_Kerja | String | Format: Xj Ym |
| Status_Masuk | Enum | Ontime/Telat/Izin |
| Menit_Telat | Number | |
| Foto_URL | URL | Foto masuk |
| Lat_Hp | Float | |
| Long_Hp | Float | |
| Jarak_M | Number | |
| Status_GPS | Enum | Valid/Invalid/Jauh |
| Face_Detected | Boolean | |
| Foto_Pulang_URL | URL | |
| **Face_Match_Score** | **Number** | **NEW: 0-100% similarity** |
| **Device_Info** | **String** | **NEW: user agent** |

#### 4.2.4 LEMBUR (Enhanced v3.0)
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| ID | String | Auto (L + timestamp) |
| ID_Karyawan | FK | |
| Nama | String | |
| ID_Toko | FK | |
| Nama_Toko | String | |
| Tanggal | Date | |
| **Jam_Mulai** | **Time** | **Waktu mulai lembur** |
| **Jam_Selesai** | **Time** | **Waktu selesai (diisi saat approve)** |
| **Perkiraan_Jam_Selesai** | **Time** | **NEW: estimasi saat ajuan** |
| Durasi_Jam | String | Xj Ym (auto-calculate) |
| Alasan | String | |
| Foto_URL | URL | |
| Status | Enum | Pending/Approved/Rejected |
| Approved_By | String | |
| Approved_At | DateTime | |
| **Tarif_Per_Jam** | **Number** | **NEW: saat approve** |
| **Total_Upah_Lembur** | **Number** | **NEW: auto-calculate** |

#### 4.2.5 NEW: SLIP_GAJI (Sheet Baru v3.0)
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| ID_Slip | String | Auto (SG + timestamp) |
| ID_Karyawan | FK | |
| Nama | String | |
| Periode_Bulan | Number | 1-12 |
| Periode_Tahun | Number | YYYY |
| Gaji_Pokok | Number | |
| Tunjangan | Number | |
| Total_Jam_Kerja | Number | |
| Total_Jam_Lembur | Number | |
| Upah_Lembur | Number | |
| **Potongan_Telat** | **Number** | **Per menit telat** |
| **Potongan_Bolos** | **Number** | **Per hari bolos** |
| **Potongan_Lain** | **Number** | |
| **Total_Gaji_Bersih** | **Number** | **Auto-calculate** |
| **Status_Slip** | **Enum** | **Draft/Approved/Dibayar** |
| **Tgl_Dibayar** | **Date** | |
| **Bukti_Transfer_URL** | **URL** | |
| **Generated_At** | **DateTime** | |
| **Generated_By** | **String** | |

#### 4.2.6 NEW: HARI_LIBUR (Sheet Baru v3.0)
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| ID_Libur | String | Auto |
| Tanggal | Date | |
| Nama_Libur | String | "Hari Raya Idul Fitri" |
| Tipe | Enum | Nasional/Cuti_Bersama/Toko_Libur |
| **Toko_Terpengaruh** | **String** | **ALL atau list ID_Toko** |
| Status | Enum | Aktif/Nonaktif |

### 4.3 Alur Bisnis (Business Logic)

#### 4.3.1 Alur Absensi Masuk
```
1. Karyawan buka tab Absensi
2. Sistem auto-start kamera (front-facing)
3. Karyawan tap capture → face detection (blink)
4. Sistem ambil GPS location
5. Validasi:
   ├── GPS aktif? → Ya/Lanjut, Tidak/Error
   ├── Dalam radius toko? → Ya/Lanjut, Tidak/Error + tampil jarak
   ├── Face detected? → Ya/Lanjut, Tidak/Retry
   ├── Sudah absen masuk hari ini? → Ya/Error, Tidak/Lanjut
   └── Jadwal hari ini? → Ya/Auto-fill, Tidak/Manual pilih
6. Simpan ke ABSENSI sheet
7. Update status di UI
8. Play sound success + PICO modal
```

#### 4.3.2 Alur Absensi Pulang
```
1. Karyawan tap "Absen Pulang" (muncul setelah masuk)
2. Sistem auto-start kamera
3. Capture + face detection
4. Validasi GPS (sama dengan masuk)
5. Hitung durasi kerja (pulang - masuk)
6. Hitung status: Normal/Lembur/Pulang Cepat
7. Update record masuk dengan jam pulang
8. Simpan record pulang
9. Update UI (sembunyikan tombol)
```

#### 4.3.3 Alur Perhitungan Upah Bulanan (v3.0)
```
Input:
- Total jam kerja (dari ABSENSI)
- Total jam lembur approved (dari LEMBUR)
- Jumlah hari izin approved (dari IZIN_CUTI)
- Jumlah hari bolos (tidak absen tanpa izin)
- Hari kerja seharusnya (dari JADWAL - HARI_LIBUR)

Rumus:
1. Hari_Kerja_Aktual = (Total_Jam_Kerja + Total_Jam_Lembur) / 9 jam
2. Selisih_Lebih = max(0, Hari_Kerja_Aktual - Hari_Kerja_Seharusnya)
3. Izin_Dihitung = min(Jumlah_Izin, 2)  // toleransi 2 hari
4. Hari_Dihitung_Gaji = Hadir + Izin_Dihitung
5. Bolos = max(0, Hari_Kerja_Seharusnya - Hari_Dihitung_Gaji)

Status Gaji:
- Bolos = 0 & Izin ≤ 2 → Gaji Penuh ✅
- Bolos = 0 & Izin > 2 → Gaji Dipotong (izin melebihi toleransi) ⚠️
- Bolos > 0 → Gaji Dipotong (bolos tidak dihitung upah) ❌

Output:
- Total Gaji Bersih = Gaji Pokok + Tunjangan + Upah Lembur - Potongan
```

#### 4.3.4 Alur Generate Slip Gaji (v3.0)
```
1. Admin pilih karyawan + periode (bulan/tahun)
2. Sistem ambil data:
   ├── Master karyawan (gaji pokok, tunjangan)
   ├── Absensi bulan tersebut
   ├── Lembur approved
   └── Izin approved
3. Hitung komponen gaji
4. Generate PDF (html2pdf.js atau server-side)
5. Simpan ke SLIP_GAJI sheet
6. Tampilkan preview di admin
7. Admin bisa: Edit/Approve/Export PDF/Mark as Paid
```

---

## 5. Spesifikasi UI/UX

### 5.1 Frontend Karyawan (Mobile PWA)

#### 5.1.1 Struktur Screen
```
├── Login Screen
│   └── Dropdown nama + auto-fill toko/shift
├── Main App (3 Tab Bottom Nav)
│   ├── Tab BERANDA
│   │   ├── Shift Info Card (hari ini)
│   │   ├── Stat Card (rekap bulan ini)
│   │   ├── Menu Grid (8 menu)
│   │   └── PICO Mascot (tutorial)
│   ├── Tab ABSENSI (FAB Center)
│   │   ├── GPS Badge
│   │   ├── Camera Container (auto-start)
│   │   ├── Form (Toko, Shift)
│   │   └── Action Buttons (Masuk/Pulang/Lembur)
│   └── Tab DATA ABSENSI
│       ├── Stat Grid (8 metrics)
│       └── Menu List (Raport, Izin, Lembur)
└── Modals
    ├── Izin/Cuti Form
    ├── Lembur Form (with camera)
    ├── Jadwal Mingguan
    ├── Chat
    ├── Tukar Shift
    ├── Tugas List
    ├── Berita List
    └── PICO Tutorial Modal
```

#### 5.1.2 Komponen UI
- **Color System**: Primary #0D8ABC, Success #34C759, Danger #FF3B30, Warning #FF9500
- **Typography**: -apple-system, Segoe UI, Roboto
- **Spacing**: 16px base margin, 12px card padding
- **Shadows**: 0 2px 12px rgba(13,138,188,0.08)
- **Border Radius**: Cards 16px, Buttons 14px, Inputs 14px
- **Animation**: slideUp 0.3s, popIn 0.25s, toastSlide 0.35s

### 5.2 Frontend Admin (Desktop)

#### 5.2.1 Layout
```
┌─────────────────────────────────────────┐
│  Sidebar (260px)    │  Topbar (sticky)  │
│  ├── Logo           │  ├── Page Title   │
│  ├── Nav Menu       │  ├── Date/Time    │
│  │   ├── Dashboard  │  └── Notif Bell   │
│  │   ├── Laporan    ├───────────────────┤
│  │   ├── ...        │                   │
│  └── User Mini      │  Content Area     │
│                     │  ├── Stats Row    │
│                     │  ├── Cards Grid   │
│                     │  ├── Tables       │
│                     │  └── Modals       │
└─────────────────────────────────────────┘
```

#### 5.2.2 Pages
| Page | URL | Fitur |
|------|-----|-------|
| Dashboard | `#dashboard` | Stats, Monitor Toko, Notif, Tabel Absensi Hari Ini |
| Laporan | `#laporan` | 4 mode (Harian/Mingguan/Bulanan/Tahunan), Filter, Export, Statistik |
| Notifikasi | `#notifikasi` | Semua notifikasi approval |
| Setting Toko | `#setting-toko` | Grid cards toko, CRUD modal, GPS picker |
| Setting Karyawan | `#setting-karyawan` | Grid cards karyawan, CRUD modal, Foto upload |
| Setting Jadwal | `#setting-jadwal` | **NEW v3.0**: Grid 7 hari, drag-drop, template, rolling |
| Setting Izin | `#setting-izin` | Tabel jenis izin, CRUD |
| Setting Global | `#setting-global` | Form konfigurasi |
| **Slip Gaji** | **#slip-gaji** | **NEW v3.0**: Generate, preview, approve, export |
| **Analytics** | **#analytics** | **NEW v3.0**: Charts, heatmaps, trends |

---

## 6. Security & Validasi

### 6.1 Validasi Wajib (Frontend + Backend)
| Field | Validasi | Error Message |
|-------|----------|---------------|
| PIN | 4 digit numeric | "PIN harus 4 angka" |
| No HP | 10-13 digit, start with 08 | "Format HP tidak valid" |
| Email | Regex email | "Email tidak valid" |
| Foto | Max 5MB, image only | "Foto max 5MB" |
| GPS | Accuracy < 100m | "GPS kurang akurat" |
| Jarak | < Radius toko | "Anda X meter dari toko" |
| Tanggal Izin | Mulai ≤ Selesai | "Tanggal tidak valid" |
| Max Hari Izin | ≤ Setting | "Maksimal X hari per ajuan" |

### 6.2 Security Measures
- **CORS**: Allow origin `*` (karena GAS web app)
- **Rate Limiting**: Max 10 API calls per menit per user
- **Input Sanitization**: Escape HTML di chat, trim semua input
- **File Validation**: Check MIME type & extension
- **PIN Encryption**: Hash PIN dengan Utilities.computeDigest (SHA-256)
- **Session Timeout**: 30 hari (localStorage), auto-logout
- **Audit Trail**: Semua action tercatat di LOG_ERROR

---

## 7. Performance & Optimization

### 7.1 Target Performance
| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| API Response Time | < 2s |
| Camera Start | < 1s |
| GPS Lock | < 5s |

### 7.2 Optimasi
- **Lazy Loading**: Images, chat history
- **Pagination**: Tabel > 50 rows
- **Caching**: Toko list, shift list, karyawan list (localStorage)
- **Image Compression**: Max 800px, quality 0.7, base64
- **Debounced Search**: Input search 300ms delay
- **Virtual Scroll**: Chat messages > 100

---

## 8. Deployment & Maintenance

### 8.1 Deployment Checklist
- [ ] Buat 14 sheet di spreadsheet (auto-create via script)
- [ ] Deploy GAS sebagai Web App (Execute as: Me, Access: Anyone)
- [ ] Setup folder Google Drive untuk foto
- [ ] Isi SETTING_GLOBAL dengan konfigurasi awal
- [ ] Test semua API endpoints
- [ ] Deploy frontend karyawan (index.html)
- [ ] Deploy frontend admin (admin.html)
- [ ] Setup SSL (auto via Google)

### 8.2 Backup Strategy
- **Daily**: Google Sheets version history (auto)
- **Weekly**: Export spreadsheet ke Drive folder "Backup"
- **Monthly**: Archive data lama (> 1 tahun) ke sheet terpisah

---

## 9. Timeline Development

| Fase | Durasi | Fitur |
|------|--------|-------|
| **Phase 1: Foundation** | 2 minggu | Refactor backend, fix bug time format, optimize API |
| **Phase 2: Core v3.0** | 3 minggu | Multi-admin, Jadwal grid, Lembur enhanced, Slip gaji |
| **Phase 3: Analytics** | 2 minggu | Dashboard charts, heatmap, trend, export enhanced |
| **Phase 4: Polish** | 1 minggu | Face recognition, push notif, QR code, testing |
| **Total** | **8 minggu** | |

---

## 10. Appendix

### 10.1 Kode Error
| Kode | Arti |
|------|------|
| E001 | Spreadsheet tidak ditemukan |
| E002 | Sheet tidak ditemukan |
| E003 | Data tidak ditemukan |
| E004 | Validasi gagal |
| E005 | GPS error |
| E006 | Kamera error |
| E007 | Upload gagal |
| E008 | Quota exceeded |

### 10.2 Changelog
- **v1.0**: Basic absensi (masuk/pulang)
- **v2.0**: Multi-toko, lembur, izin, chat, jadwal, admin dashboard
- **v3.0**: Multi-admin, jadwal grid, slip gaji, analytics, face detection
