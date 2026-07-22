# Error Log & Pattern (Living Document)

Ini adalah catatan error dan bug yang pernah terjadi dan cara menyelesaikannya.
Setiap agen (AI) wajib menambahkan error yang berhasil diatasi ke dokumen ini.

## Daftar Error

| # | Error / Gejala | Penyebab | Solusi yang Diterapkan | File Terkait |
|---|----------------|----------|------------------------|--------------|
| 1 | APK iOS tidak bisa di-build di Github Actions (Error 66) | Environment GitHub Action (Runner) versi macOS/Xcode tidak support target iOS tanpa setup provisioning profile yang tepat atau usangnya target iOS PWA. | Disesuaikan dengan update Xcode command via `build-ios.yml` (sebelumnya) dan disarankan beralih ke Native Android (saat ini Admin app di Kotlin). | `.github/workflows` / `app.js` |
| 2 | Uang Transport tidak terhitung untuk toko beda | Logika lama hanya menghitung Uang Transport default. | Ditambahkan logika dinamis di perhitungan akhir bulan (`getSalaries`) di backend GAS. | `code.gs` |
| 3 | Tunjangan_Rp pada Tugas tidak tersimpan | Kolom `Tunjangan_Rp` belum dimasukkan ke array Data Tugas dan Admin APK belum mengirim `tunjanganRp`. | Menambah parameter `tunjanganRp` di ViewModel APK Kotlin & `code.gs` (createTugas). | `code.gs`, `AdminTaskScreen.kt` |
| 4 | Navigasi SPA putus saat API lambat | `showPage` dipanggil dengan onclick handler inline, jika error, page hang. | Implementasi event delegation di document tingkat atas dan menambahkan properti `data-page` (proses). | `admin.js`, `admin.html` |

---

## Pattern Solusi Terverifikasi
- **Pattern A**: Selalu verifikasi indeks Array kolom (0, 1, 2, dll) di fungsi-fungsi backend GAS jika menambahkan field baru. Field baru HARUS ditempatkan di akhir untuk mencegah pergeseran indeks yang menghancurkan fungsi lain.
- **Pattern B**: Hindari menaruh hard-coded credentials; semua pengaturan dinamis harus diletakkan di sheet `SETTING_GLOBAL`.
- **Pattern C**: Gunakan Event Delegation global `document.addEventListener('click', ...)` untuk mengatasi SPA navigation hang pada frontend HTML murni.
