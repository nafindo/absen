# 📱 Mockup UI: Integrasi Poin Kinerja
Berikut adalah visualisasi tampilan integrasi Poin Kinerja pada APK Admin sesuai dengan prinsip *Zero-Risk*.

---

## 1. Menu Monitor (Tab Kinerja)

> [!NOTE]
> Ini adalah tab baru di dalam menu Monitor yang sudah ada. Fitur utama di sini adalah Leaderboard dan Ringkasan Toko.

````carousel
### 📊 Tampilan Layar Penuh

| ≡  **Monitor**                                                                 |
|:-------------------------------------------------------------------------------|
| <u>**Realtime**</u>  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  **Kinerja** (Aktif) |
|                                                                                |
| 📅 **Bulan:** &nbsp; ◄ &nbsp; **Juli 2026** &nbsp; ► &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; `[🔄 Generate Skor]` |
|                                                                                |
| **Ringkasan Per Toko**                                                         |
| ------------------------------------------------------------------------------ |
| 🏬 **Toko A** &nbsp;&nbsp; `Avg: 420` &nbsp; `⭐ A` &nbsp; \| &nbsp; 🏬 **Toko B** &nbsp;&nbsp; `Avg: 380` &nbsp; `⭐ B+` |
|                                                                                |
| **Filter Toko:** `[ Semua Toko ▾ ]`                                            |
|                                                                                |
| **🏆 Peringkat Karyawan**                                                      |
| ------------------------------------------------------------------------------ |
| **#1** 👤 **Abel** <br> 🏬 Toko A &nbsp;&nbsp;&nbsp;&nbsp; 💯 **460** / 500 &nbsp;&nbsp; `[ A+ ]` &nbsp;&nbsp; 🏆 `BONUS ELIGIBLE` |
| ------------------------------------------------------------------------------ |
| **#2** 👤 **Budi** <br> 🏬 Toko A &nbsp;&nbsp;&nbsp;&nbsp; 💯 **430** / 500 &nbsp;&nbsp; `[ A ]` &nbsp;&nbsp;&nbsp; ✅ `RETAIN` |
| ------------------------------------------------------------------------------ |
| **#3** 👤 **Citra** <br> 🏬 Toko B &nbsp;&nbsp;&nbsp;&nbsp; 💯 **410** / 500 &nbsp;&nbsp; `[ A ]` &nbsp;&nbsp;&nbsp; ✅ `RETAIN` |
| ------------------------------------------------------------------------------ |
| **#4** 👤 **Dedi** <br> 🏬 Toko B &nbsp;&nbsp;&nbsp;&nbsp; 💯 **290** / 500 &nbsp;&nbsp; `[ C ]` &nbsp;&nbsp;&nbsp; ⚠️ `WATCH` |
| ------------------------------------------------------------------------------ |
| **#5** 👤 **Eko** <br> 🏬 Toko C &nbsp;&nbsp;&nbsp;&nbsp; 💯 **180** / 500 &nbsp;&nbsp; `[ E ]` &nbsp;&nbsp;&nbsp; 🚨 `REVIEW` |

<!-- slide -->
### 🎨 Penjelasan Warna & Elemen
- **Tab Bar**: Tab `Kinerja` ditambahkan di sebelah tab `Realtime` yang sudah ada, pengguna tinggal *swipe* atau klik untuk pindah.
- **Kartu Ringkasan Toko**: Bisa di-scroll ke samping secara horizontal.
- **Badge Grade**: 
  - `A+` berwarna **Hijau Zamrud**
  - `C` berwarna **Oranye**
  - `E` berwarna **Merah Gelap**
- **Badge Rekomendasi**:
  - `BONUS ELIGIBLE` memiliki *background* hijau muda dengan ikon 🏆.
  - `WATCH` memiliki *background* kuning muda dengan ikon ⚠️.
````

---

## 2. Menu Laporan (Tab Raport Kinerja)

> [!TIP]
> Ini adalah tampilan detail performa per karyawan. Cocok untuk sesi evaluasi *one-on-one* dengan karyawan.

````carousel
### 📋 Tampilan Layar Penuh

| ≡  **Laporan & Analitik**                                                      |
|:-------------------------------------------------------------------------------|
| **Harian** &nbsp;&nbsp; **Bulanan** &nbsp;&nbsp; <u>**Raport Kinerja**</u> (Aktif) |
|                                                                                |
| 📅 **Bulan:** &nbsp; ◄ &nbsp; **Juli 2026** &nbsp; ►                           |
| 👤 **Karyawan:** `[ 👤 Abel ▾ ]`                                               |
|                                                                                |
| **Score Card**                                                                 |
| ------------------------------------------------------------------------------ |
| &nbsp;&nbsp; 🟢 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Abel**                  |
| &nbsp; **A+** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 🏬 Toko A — Juli 2026       |
| &nbsp; `460` &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 🏆 `BONUS ELIGIBLE`          |
| ------------------------------------------------------------------------------ |
|                                                                                |
| **Detail Penilaian**                                                           |
| ------------------------------------------------------------------------------ |
| **Kehadiran (50%)** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **430** / 500 |
| ██████████████████████████████████░░░░░░ (86%)                                 |
| ↳ *Hadir: 22* \| *Telat: 3* \| *Izin: 1* \| *Alpa: 0*                          |
|                                                                                |
| **Penyelesaian Tugas (50%)** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **850** / 1000 |
| ████████████████████████████████████████ (100%)                                |
| ↳ *Done: 10/10* \| *OnTime: 90%* \| *Quality: 100%*                            |
| ------------------------------------------------------------------------------ |
|                                                                                |
| **📈 Trend Kinerja (6 Bulan Terakhir)**                                        |
| ------------------------------------------------------------------------------ |
| 500 ┤ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ╭──● 460                  |
| 400 ┤ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ╭──● 410 ──● 430 ──╯                        |
| 300 ┤ ──● 380 ──╯                                                              |
| 200 ┤                                                                          |
| &nbsp;&nbsp;&nbsp;&nbsp;└─────┴────────┴────────┴────────┴────────┴──          |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Feb &nbsp;&nbsp;&nbsp;&nbsp; Mar &nbsp;&nbsp;&nbsp;&nbsp; Apr &nbsp;&nbsp;&nbsp;&nbsp; Mei &nbsp;&nbsp;&nbsp;&nbsp; Jun &nbsp;&nbsp;&nbsp;&nbsp; Jul |

<!-- slide -->
### 🎨 Penjelasan Warna & Elemen
- **Score Card**: Lingkaran besar dengan grade (A+) menggunakan warna *emerald gradient* yang mencolok.
- **Progress Bar**: Menggunakan animasi saat halaman dibuka (dari 0% ke persentase aktual). Warna *bar* mengikuti grade (misal hijau untuk nilai bagus).
- **Trend Kinerja**: Grafik garis sederhana (*line chart*) untuk melihat apakah karyawan mengalami peningkatan atau penurunan performa.
````

---

### Keuntungan UI / UX Desain Ini:
1. **Zero-Risk**: Tidak menggeser menu laporan harian atau absensi realtime. Semua fitur lama tetap utuh.
2. **Aesthetic**: Informasi yang padat (poin kehadiran & tugas) divisualisasikan dengan persentase dan progress bar agar mudah dibaca sekilas.
3. **Actionable**: Dari warna *badge* rekomendasi, Manager atau Admin langsung tahu mana karyawan yang butuh ditegur (Review/Watch) dan mana yang layak dapat bonus.
