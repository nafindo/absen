# PROJECT GUARDIAN - STRICT RULES

Kamu sedang bekerja di proyek **Absensi & Kinerja Karyawan** berbasis **Google Apps Script (GAS)**.
Proyek ini sudah berjalan, sangat kompleks, dan komponennya saling terkoneksi.

## 🛑 ATURAN KERAS - DILARANG DILANGGAR
1. **ZERO REFACTOR**: Jangan ubah atau rapikan struktur kode yang sudah ada tanpa diminta secara eksplisit.
2. **ZERO RENAME**: Jangan ganti nama fungsi, variabel, atau parameter yang sudah ada.
3. **ZERO DELETE**: Jangan hapus kode yang masih berfungsi atau dikomentari (kecuali diminta).
4. **STRICT SCOPE**: Hanya sentuh, baca, atau ubah bagian fungsi yang secara langsung terkait dengan permintaan pengguna. Jangan mengubah hal lain sebagai "inisiatif".
5. **READ BEFORE EDIT**: Sebelum memodifikasi sebuah fungsi penting, gunakan alat pencarian untuk melihat di mana fungsi itu dipanggil untuk mencegah kerusakan berantai.

## 📚 WAJIB BACA (REFERENSI ARSITEKTUR)
Sebelum melakukan perubahan kompleks, kamu WAJIB membaca file-file berikut untuk memahami standar proyek ini:
- `routing-map.md`: Peta detail seluruh rute endpoint `doPost` dan alur datanya (Sangat Penting!).
- `architecture.md`: Struktur dasar aplikasi dan aliran data.
- `patterns.md`: Pola coding baku (penamaan, respons JSON, pengambilan data).
- `golden-samples.md`: Contoh kode standar yang sudah teruji dan rapi.

## ⚠️ JIKA RAGU
Jika kamu tidak yakin indeks kolom mana yang digunakan, **BACA FILE SUMBER DATANYA** (misal `absensi.csv` atau sheet) dan perhatikan urutan kolomnya mulai dari indeks 0. Kesalahan indeks adalah penyebab utama bug di proyek ini.

6. **BUILD APK RELEASE**: Jika diminta untuk update APK, SELALU pastikan untuk melakukan build ke versi Release (ssembleRelease), bukan versi Debug.
7. **NO GITHUB FOR CODE.GS**: Setiap ada modifikasi/perubahan pada code.gs di folder absen, JANGAN PERNAH mengupload/push file tersebut ke GitHub. Biarkan tetap lokal.
8. **MANUAL GAS UPDATE**: Setiap kali kamu mengubah code.gs secara lokal, WAJIB informasikan kepada user bagian mana saja yang diubah atau berikan instruksi lengkap agar user bisa mengcopy-paste dan mengeditnya secara manual di Google Apps Script (GAS) Editor mereka.
