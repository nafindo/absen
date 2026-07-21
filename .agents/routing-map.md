# 🗺️ ROUTING & DATA FLOW MAP (Panduan Endpoint)

PENTING: Jangan membuat alur baru atau endpoint baru sebelum mengecek peta ini! Jika endpoint untuk tujuanmu sudah ada, cukup tambahkan atau perbaiki endpoint tersebut.

## 1. STRUKTUR UTAMA
Hanya ada 1 pintu masuk (entry point) untuk aplikasi ini:
`function doPost(e)` di `code.gs`.
Parameter routing dilempar dari aplikasi via properti JSON: `action`.

## 2. PETA ENDPOINT (ACTION ROUTES)
Di bawah ini adalah pemetaan `action` dengan fungsi `code.gs` yang menanganinya, beserta daftar Lembar Kerja (Sheet) yang disentuh:

### Autentikasi & Akun
- `login` ➡️ `login(data)` | Membaca: `MASTER_KARYAWAN`, `MASTER_TOKO`
- `getUserInfo` ➡️ `getUserInfo(data)` | Membaca: `MASTER_KARYAWAN`
- `registerFCMToken` ➡️ `registerFCMToken(data)` | Update: `MASTER_KARYAWAN` (Kolom FCM_Token)
- `registerFaceId` ➡️ `registerFaceId(data)` | Update: `MASTER_KARYAWAN`

### Kehadiran (Absensi)
- `absenMasuk` ➡️ `absenMasuk(data)` | Baca/Tulis: `ABSENSI`, `JADWAL_KARYAWAN`, `MASTER_TOKO`
- `absenPulang` ➡️ `absenPulang(data)` | Baca/Update: `ABSENSI` (Mencari row masuk yang belum pulang)
- `getAbsenStatus` ➡️ `getAbsenStatus(data)` | Membaca: `ABSENSI` (Cek status masuk hari ini)
- `getAbsensiHariIniLengkap` ➡️ `getAbsensiHariIniLengkap(data)` | Membaca: `ABSENSI` (Untuk dashboard realtime)

### Izin & Cuti
- `ajukanIzin` ➡️ `ajukanIzin(data)` | Tulis: `IZIN_CUTI`
- `getIzinHistory` ➡️ `getIzinHistory(data)` | Membaca: `IZIN_CUTI`
- `getSisaKuota` ➡️ `getSisaKuota(data)` | Membaca: `MASTER_JENIS_IZIN`, `IZIN_CUTI`

### Lembur
- `ajukanLembur` ➡️ `ajukanLembur(data)` | Tulis: `LEMBUR`
- `getLemburHistory` ➡️ `getLemburHistory(data)` | Membaca: `LEMBUR`

### Laporan Kinerja (Scorecard & Rapor)
Peringatan: Semua perhitungan di sini menggunakan konstanta kolom (contoh: `COL_KARYAWAN`, `COL_ABSENSI`) untuk mencegah bug salah indeks.
- `calculateMonthlyScores` ➡️ Melakukan agregasi data 30 hari ke `Monthly_Scores`.
- `getKinerja` ➡️ `getKinerja(data)` | Menarik skor dari `Monthly_Scores` untuk perorangan.
- `getTeamScores` ➡️ `getTeamScores(data)` | Papan peringkat toko.
- `getOwnerReport` ➡️ `getOwnerReport(data)` | Ringkasan performa tingkat atas.

### Chat & Komunikasi
- `sendChatMessage` ➡️ `sendChatMessage(data)` | Tulis: `CHAT`. Upload file/image ke Google Drive.
- `getChatMessages` ➡️ `getChatMessages(data)` | Membaca: `CHAT`

### Manajemen Penugasan & Ceklist
- `createTugas` ➡️ `createTugas(data)` | Tulis: `TUGAS`
- `updateTugasStatus` ➡️ `updateTugasStatus(data)` | Tulis Log: `LOG_TUGAS`, Update: `TUGAS`
- `submitTugasLog` ➡️ `submitTugasLog(data)` | Tulis: `LOG_TUGAS`
- `getTugasList` ➡️ `getTugasList(data)` | Membaca: `TUGAS`
- `getTugasLogs` ➡️ `getTugasLogs(data)` | Membaca: `LOG_TUGAS`
- `submitChecklistHarian` ➡️ `submitChecklistHarian(data)` | Tulis: `CEKLIST_HARIAN`, `SCORE_AUDIT`

### Skor Audit Otomatis
- `updateScoreAudit(karyawanId, karyawanNama, tokoId, type, scoreToAdd)` ➡️ Berjalan otomatis saat `absenMasuk`, `submitTugasLog`, dan `submitChecklistHarian` dipanggil. Membaca/Update/Tulis: `SCORE_AUDIT`.

## 3. ATURAN PENULISAN BARIS (APPEND ROW)
Setiap panggilan `appendRow` ke Google Sheets sudah dicocokkan 100% panjang array-nya dengan kolom sheet yang terdaftar di `SHEET_NAMES` (baris ~350).
JIKA menambahkan kolom baru di Google Sheets:
1. Tambahkan konstanta kolom baru di bagian atas file (`COL_...`).
2. Ubah `SHEET_NAMES` untuk memasukkan nama kolom baru tersebut di posisi yang tepat.
3. Tambahkan elemen kosong / isi pada semua fungsi `appendRow` yang memanggil sheet terkait agar panjang kolom tetap selaras.
