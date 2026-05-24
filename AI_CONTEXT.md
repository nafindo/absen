# KONTEKS PROYEK ABSENSI (Untuk AI Penerus)

Dokumen ini diperbarui secara otomatis setiap kali ada perubahan penting agar AI lain/baru dapat memahami status proyek secara instan.

## Ringkasan Proyek
Aplikasi absensi karyawan berbasis web (HTML, CSS, JS) yang dikemas menggunakan **Capacitor** menjadi aplikasi Android.
- **Root Directory**: `d:\absen`
- **Output Kompilasi**: `d:\absen\recom` (dibuat via `python compile.py` sebelum disalin oleh Capacitor).
- **Proses Build Android**: 
  1. `python compile.py` (menggabungkan index.html, style.css, app.js ke folder `recom`).
  2. `npx cap sync` (atau `cmd.exe /c npx.cmd cap sync` di Windows) untuk menyalin file web ke folder Android.
  3. `gradlew installDebug` (build & install APK debug ke HP).

---

## Fitur Utama yang Aktif:
1. **Sistem PIN Karyawan**:
   - Kolom PIN berada di kolom **C** Google Sheet.
   - Karyawan login menggunakan PIN. PIN ini dimuat ke dalam `state.user.pin` dan disimpan di `localStorage` saat login sukses, sehingga mendukung verifikasi instan.

2. **Popover Profil Karyawan & Ganti PIN / FCM**:
   - Klik pada avatar atau info nama di header kiri atas akan membuka popover melayang berisi nama, jabatan, tombol **Ganti PIN**, tombol **Daftar FCM**, dan tombol **Keluar**.
   - Gaya popover dan tombol-tombol di dalamnya diselaraskan agar simetris sempurna dengan card popover (`width: 100%` dengan margin khusus).
   - Tombol **Daftar FCM** dipindahkan dari halaman Beranda ke dalam popover ini di bawah tombol Ganti PIN dengan teks yang lebih ringkas.
   - Tombol **Ganti PIN** akan membuka modal untuk mengubah PIN. PIN baru divalidasi 4-6 digit angka, diverifikasi secara lokal menggunakan PIN saat ini di `state.user.pin`, lalu dikirim ke Apps Script (`changePin`). Jika sukses, PIN baru disimpan di local storage & state.
   - Tombol **Refresh** (sinkronisasi manual) dipindahkan ke pojok kanan atas menggantikan tombol Keluar yang lama. Tombol ini membersihkan cache foto IndexedDB (`FOTO_CACHE`) dan menjalankan sinkronisasi penuh (`triggerDeltaSync(true)`) serta me-refresh data tab aktif.

3. **Bottom Nav Custom (Sidik Jari Asli)**:
   - Tombol kamera tengah (FAB) diganti dengan **Sidik Jari (Absensi)** dengan latar belakang lingkaran biru gradasi asli dan bingkai putih.
   - **Ikon Sidik Jari**: Menggunakan file gambar asli dari user (`logo-sidikjari.png`).
   - **Ukuran**: Menggunakan ukuran **46px (70% dari lingkaran)** agar tampak pas dan tidak terlalu penuh.

4. **Kamera Layar Penuh & Deteksi Wajah Otomatis (pico.js)**:
   - Ketika tab absensi diklik (atau saat klik tombol "Ulangi"), kamera akan langsung terbuka dalam mode **Overlay Layar Penuh** (fullscreen).
   - Menggunakan pustaka ringan **pico.js** dan model cascade **facefinder** (disimpan lokal secara offline) untuk deteksi wajah real-time.
   - **Jeda Pengambilan Kamera (Camera Warmup Block)**: Ketika kamera dibuka, deteksi wajah dan kotak pelacak (bounding box) hijau langsung berjalan dan mendeteksi wajah secara real-time sejak detik ke-0 (tanpa teks loading persiapan). Namun, untuk memberi waktu lensa kamera melakukan autofocus/exposure, sistem tidak akan mengambil foto (menahan auto-capture) sebelum minimal 3 detik berlalu sejak kamera dinyalakan. Jika sejak awal wajah sudah berada di posisi hijau bersih, tepat di detik ke-3 kamera akan langsung melakukan pengambilan foto secara otomatis.
   - **Tanpa Tombol Rana (Shutterless)**: Tombol ambil foto manual (`#captureBtn`) disembunyikan sepenuhnya. Kamera akan melakukan pengambilan foto secara **otomatis** jika wajah terdeteksi bersih dan stabil selama minimal 5 frame berturut-turut (~400ms) dan masa tunggu 3 detik telah terpenuhi.
   - **Kotak Bounding Box Dinamis**: Menggantikan panduan lingkaran statis lama (yang sekarang dinonaktifkan via CSS `.face-frame { display: none !important; }`). Kotak hijau neon (`#34C759` dengan efek glow) akan muncul secara dinamis mengikuti pergerakan, posisi, dan ukuran wajah.
   - **Perbaikan Pemotongan & Skala Pratinjau**:
     * Memperbaiki bug pada `ctx.drawImage(video, 0, 0)` di `capturePhoto()` dan `captureChatPhoto()` dengan menambahkan parameter lebar dan tinggi target `(w, h)` untuk menghindari pemotongan dan efek zoom 2x lipat pada hasil kanvas.
     * Mengatur elemen `#previewImg` menggunakan `object-fit: contain !important;` dan menghapus redundansi `transform: scaleX(-1);` agar hasil foto pas di dalam kotak pratinjau.

5. **Deteksi Halangan Wajah Pintar (Anti-Occlusion)**:
   - Melacak halangan wajah seperti penggunaan masker, topi, kacamata hitam, atau masker medis (biru/hijau).
   - **Kotak Bounding Box Merah**: Jika terdeteksi halangan, kotak pelacak wajah berubah menjadi merah menyala dan memunculkan teks peringatan "Harap lepas kacamata, topi, atau masker Anda!".
   - **Perhitungan Geometri Relatif**: Sampel dahi dan dagu dihitung menggunakan koordinat wajah murni sebelum terpotong oleh batas layar (*unclipped coordinates*). Jika wajah terlalu dekat atau keluar dari batas tangkapan kamera, pengecekan halangan otomatis dilewati untuk mencegah alarm palsu.
   - **Toleransi Cahaya Dinamis**: Nilai toleransi warna (*color distance* hingga 65) dan kecerahan (luma dahi-dagu hingga 70 tingkat) diperlonggar agar detektor tidak salah mendeteksi bayangan alami wajah/cahaya lampu ruangan yang dinamis sebagai masker.

6. **Perbaikan Siklus Navigasi Tab**:
   - Mengatasi bug navigasi di mana pengguna yang keluar dari tab absensi (setelah foto terambil) lalu kembali lagi langsung disodori formulir pengisian data dengan foto lama yang tersimpan.
   - Fungsi `switchTab(tab)` kini secara otomatis menyetel ulang `state.photoData = null`, menyembunyikan pratinjau foto lama, mengaktifkan video kamera kembali, dan memaksa masuk ke mode kamera fullscreen (`openCameraFS()`) setiap kali tab Absensi dibuka kembali.

7. **Penyempurnaan Form Absensi & Tombol Lembur**:
   - Layout formulir absensi (`tabAbsensi`) dipadatkan agar pas dalam satu layar (no scroll) di perangkat seluler dengan mengurangi margin, padding, serta tinggi pratinjau foto kamera (ketika tidak fullscreen) menjadi `110px` menggunakan flexbox layout.
   - Menggabungkan alur tombol absensi: tombol Absen Masuk dan Absen Pulang bergantian secara vertikal. Jika belum absen masuk, tombol Absen Masuk aktif. Setelah absen masuk berhasil, tombol Absen Masuk digantikan oleh tombol Absen Pulang.
   - Mengintegrasikan logika tombol Lembur:
     * Jika belum absen masuk: tombol Lembur dinonaktifkan (disabled) dan berlabel "MODE LEMBUR (BELUM ABSEN)".
     * Setelah absen masuk: tombol Lembur diaktifkan (enabled) dengan label "AJUKAN LEMBUR".
     * Ketika sudah mengajukan lembur (status lembur `Pending` atau `Approved`): tombol Lembur disembunyikan sepenuhnya dari laman absensi, begitu pula dengan shortcut tombol Lembur di menu beranda dashboard (`menuLembur`).
     * Status lembur dan tombol langsung diperbarui secara dinamis begitu pengajuan lembur berhasil disubmit ke server (`checkAbsenStatus` dipicu otomatis).

8. **Sistem Custom Dropdown Premium**:
   - Seluruh elemen dropdown select bawaan browser (`<select>`) digantikan dengan Custom Dropdown UI kustom.
   - Menggunakan wrapper `.custom-select-wrapper` dan pemicu `.custom-select-trigger` dengan ikon panah SVG kustom.
   - Pilihan ditampilkan di dalam panel melayang `.custom-select-options` dengan efek transisi memudar, bayangan lembut, hover animasi, dan penanda pilihan.
   - JavaScript secara otomatis menyinkronkan interaksi custom dropdown kembali ke element native `<select>` (yang disembunyikan lewat `display: none`) untuk memastikan kompatibilitas penuh dengan listener bawaan.
   - Diterapkan pada: `#loginSelect`, `#selectToko`, `#selectShift`, `#tukerKaryawan`, `#lemburToko`, `#lemburKeteranganType`.

9. **Input PIN Form Login Aktif Kembali**:
   - Kolom input password PIN (`#loginPin` berkelas `.login-input`) dimunculkan kembali pada login card di bawah dropdown pilihan nama.
   - Input PIN diatur agar hanya muncul apabila karyawan telah memilih nama dari dropdown.

10. **Transisi Layar Gelap Kamera & Anti-Glitch Tombol Play**:
    - Menghilangkan glitch tombol play default WebView saat kamera disiapkan dengan menyembunyikan video (`opacity: 0`) dan memunculkan `#cameraLoadingOverlay` (latar hitam pekat berputar "Menyiapkan Kamera...").
    - Ketika event `onplaying` pada video terpicu, video memudar masuk secara halus (`opacity: 1`) dan overlay gelap transisi dilepas.

11. **Efek Kotak Merah "Bingung" (Confused Scanner)**:
    - Mengganti 3 kotak radar putih melayang yang lama dengan **3 buah kotak merah** pemindai target (`.confused-box`) yang akan berhamburan acak.
    - Saat wajah belum terdeteksi (`dets.length === 0`), sistem secara acak menentukan posisi, ukuran, dan label eror simulasi (seperti `SCAN_ERR`, `NO_FACE`, `RETRYING`, dll.) pada setiap frame, menciptakan visual techy sistem yang sedang "bingung" mencari target.

12. **Penghapusan Dropdown Toko/Shift & Ekspansi Kamera**:
    - Menyembunyikan dropdown Toko (`#selectToko`) dan Shift (`#selectShift`) di halaman absensi (`#tabAbsensi .form-row { display: none !important; }`) karena informasi jam kerja sudah tercantum secara otomatis.
    - Menampilkan nama toko terjadwal secara dinamis di sebelah kiri panel informasi jam kerja (`#jamInfoCard`) dengan layout flexbox terpisah (nama toko di kiri bold, jam masuk/pulang di kanan).
    - Menghilangkan scrollbar vertikal pada form absensi (`overflow: hidden !important`) dan menerapkan `flex-grow: 1` pada kartu kamera (`.camera-form-card` & `.camera-container`) sehingga preview kamera otomatis memanjang mengisi seluruh area sisa layar secara presisi.
    - Mengubah pemotongan foto preview (`.preview-img`) menjadi `object-fit: cover !important` agar ukuran foto hasil tangkapan sama persis dengan preview kamera langsung.

---

## Cara Melanjutkan Chat agar Langsung Nyambung:
Jika Anda menggunakan AI baru (seperti Claude, ChatGPT, Cursor, dll.), **silakan salin pesan di bawah ini** dan kirimkan sebagai instruksi awal:

> "Halo, tolong lanjutkan pengembangan proyek absensi dari folder ini. Proyek ini menggunakan HTML/CSS/JS vanilla dengan Capacitor Android. Di dalam folder sudah ada berkas `AI_CONTEXT.md` yang menjelaskan fitur-fitur terbarunya. Silakan baca berkas tersebut agar Anda paham status terakhir proyek dan struktur build-nya sebelum kita mulai."

---

*Dokumen ini diperbarui terakhir kali pada 20 Mei 2026, pukul 22:15 WIB.*
