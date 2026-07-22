# Product Requirements Document (PRD) - Absensi Pro Admin v4.0

**Project Name:** Absensi Pro Admin
**Platform:** Android Native (Kotlin & Jetpack Compose)
**Target User:** Admin/Pemilik Bisnis
**Last Updated:** May 2026

---

## 1. Latar Belakang & Perubahan dari Versi Sebelumnya (v3.0)
Versi v4.0 lahir dari hasil penyesuaian teknis dan arsitektural selama proses pengembangan. Perubahan mendasar meliputi:
1. **Platform Shift:** Migrasi dari Hybrid (Capacitor) menjadi sepenuhnya **Android Native (Kotlin + Jetpack Compose)** untuk performa UI yang jauh lebih *smooth* dan premium.
2. **Simplifikasi Logika Klien:** Logika berat seperti algoritma penjadwalan (*auto-rolling*) dipindahkan ke sisi *Backend/Server* (Firebase/Google Apps Script). Aplikasi Admin difokuskan hanya sebagai *Client Viewer* dan *Manual Resolver*.
3. **Peningkatan UX Visual:** Pendekatan visualisasi informasi tingkat lanjut. Daripada berfokus pada teks dan angka, dashboard kini sangat mengandalkan elemen visual (Foto Toko, Avatar Karyawan, Filter Warna ON/OFF) agar status dapat dicerna dalam hitungan detik.

---

## 2. Arsitektur Sistem Terpusat
Sistem kini mengandalkan Server Terpusat yang menghubungkan **Apk Karyawan** (`absen-native`) dan **Apk Admin** (`absen-admin`):
- **Backend (Firebase / Google Apps Script):** Menyimpan seluruh data karyawan, jadwal toko, absensi real-time, foto profil, dan CCTV stream link. Menjalankan *cron jobs* untuk mendeteksi telat/alpha.
- **Apk Karyawan:** Berfungsi untuk melakukan absen (Clock-in/Clock-out).
- **Apk Admin (Native Compose):** Berfungsi memantau data secara *real-time* via `StateFlow`/`ViewModel` dan memberikan instruksi intervensi secara manual apabila ada anomali.

---

## 3. Fitur Utama & UI Guidelines

### 3.1. Dashboard Utama (Beranda Premium)
Dashboard dirancang agar semua metrik utama langsung terlihat tanpa perlu navigasi dalam.
*   **Header Eksklusif:** Menggunakan Gradient *Ocean Blue* & *Glassmorphism*, menampilkan ucapan selamat datang, total karyawan aktif, dan avatar Admin.
*   **Grid Ringkasan (Quick Stats):** Menampilkan metrik Hadir (Hijau), Izin/Sakit (Kuning), Alpha (Merah) dengan desain kartu yang *clean*.
*   **Alert Card (Tindakan Diperlukan):** Muncul secara dinamis jika ada toko yang kekurangan penjaga (misal: 1 karyawan sakit). Menampilkan Wajah/Avatar karyawan yang bermasalah dan tombol "Cari Pengganti" berwarna merah terang.
*   **Pemantauan Toko Terkini (Visual Cards):**
    *   Setiap toko ditampilkan dalam kartu (horizontal scroll) berisikan **Foto Asli Toko**.
    *   Badge *LIVE* (Hijau) atau *ALERT* (Merah) pada foto toko.
    *   Jika **Foto Toko di-tap/klik**, sistem akan memunculkan *Dialog* **LIVE CCTV** (memungkinkan admin melihat *stream* kamera secara langsung).
*   **Karyawan Hari Ini (Status ON/OFF Visual):**
    *   Maksimal 4 karyawan yang menjaga toko tersebut ditampilkan di bawah foto toko.
    *   **Status OFF (Belum Absen):** Foto karyawan di-render menjadi *Grayscale* (Hitam Putih).
    *   **Status ON (Sudah Absen):** Foto karyawan ditampilkan *Full Color* (Berwarna) dengan garis border hijau.
    *   **Status Alpha/Izin:** Avatar diganti menjadi silang merah (*Red Cross*).

### 3.2. Manajemen Konflik (Manual Backup Resolution)
Sistem *Smart Auto-Conflict Resolution* pada sisi klien dihilangkan dan diganti dengan resolusi manual yang dibantu rekomendasi sistem.
*   **Alur Penanganan:** Saat terjadi kekurangan penjaga (misal di Toko C), Admin menekan "Cari Pengganti".
*   **Auto Backup Dialog:** Muncul Bottom Sheet/Dialog yang menampilkan karyawan *idle* (sedang OFF hari ini) beserta rekomendasi. Admin cukup menekan tombol "SETUJU Pindahkan" untuk mengkonfirmasi shift sementara.
*   Pesan notifikasi darurat akan langsung didorong (Push Notification) ke Apk Karyawan yang ditunjuk.

### 3.3. Menu Cepat (Quick Actions)
Di bagian bawah dashboard, terdapat deretan tombol *Shortcut* (Jadwal, Gaji, Karyawan, Laporan) untuk navigasi kilat ke detail operasional.

### 3.4. Bottom Navigation Bar
Tetap menggunakan 5 tab navigasi standar:
1. **Home** (Dashboard utama dengan foto)
2. **Schedule** (Pengaturan jadwal & rolling bulanan)
3. **Monitor** (Peta sebaran karyawan & history GPS)
4. **Chat** (Obrolan terpusat/grup dengan karyawan)
5. **Settings** (Pengaturan aplikasi & admin)

---

## 4. Requirement Teknis Android Native
*   **UI Toolkit:** Jetpack Compose (100%).
*   **Image Loading:** *Coil* (`AsyncImage`) untuk memuat Avatar, Foto Toko secara asinkron dengan dukungan modifikasi `ColorMatrix` (Grayscale/Hitam-Putih).
*   **Arsitektur:** MVVM (Model-View-ViewModel) menggunakan Kotlin Coroutines & Flow (`StateFlow`) agar reaktif terhadap data real-time.
*   **Tema UI:** Menggunakan `MaterialTheme` (Material 3) dengan kustomisasi warna (Primary Ocean Blue, Surface Putih/Dark Mode support).
*   **Komponen Dialog:** `AlertDialog` dan `ModalBottomSheet` native compose untuk fitur CCTV dan pemilihan *Backup*.

---

## 5. Fase Pengerjaan (Milestones Berikutnya)
1.  **Fase 1 (Selesai):** Pembuatan fondasi Jetpack Compose, Layouting Dashboard Premium, visualisasi Toko, integrasi Coil Avatar Hitam-Putih, dialog CCTV, dan Mock Data (`AdminRepository`).
2.  **Fase 2 (Segera):** Penghubungan `absen-native` dan `absen-admin` ke Firebase Realtime Database/Google Apps Script (Backend). Mengganti Mock Data dengan data jaringan sungguhan.
3.  **Fase 3:** Implementasi integrasi *Push Notification* ke Karyawan jika mereka dipilih sebagai *Backup* dadakan melalui dialog Admin.
4.  **Fase 4:** Real implementasi API *Video Stream* RTSP/WebRTC ke dalam dialog CCTV.
