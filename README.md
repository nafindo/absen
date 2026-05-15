# 🎯 Absensi Karyawan - Frontend (GitHub Pages)

Aplikasi absensi karyawan multi-toko dengan tampilan terpisah (HTML/CSS/JS) untuk hosting di **GitHub Pages**, terhubung dengan backend **Google Apps Script**.

---

## 📁 Struktur File

```
📦 absensi-karyawan/
├── 📄 index.html          # Struktur HTML utama
├── 📁 css/
│   └── 📄 style.css       # Semua styling & tema
├── 📁 js/
│   └── 📄 app.js          # Logic JavaScript & API calls
└── 📄 README.md           # Dokumentasi ini
```

---

## 🚀 Cara Deploy ke GitHub Pages

### 1. Buat Repository GitHub
1. Login ke [GitHub](https://github.com)
2. Klik **New Repository**
3. Nama repository: `absensi-karyawan` (atau bebas)
4. **Public** (harus public untuk GitHub Pages gratis)
5. Klik **Create Repository**

### 2. Upload File
```bash
# Clone repository (ganti USERNAME dengan username GitHub Anda)
git clone https://github.com/USERNAME/absensi-karyawan.git
cd absensi-karyawan

# Copy file hasil pisahan ke sini
cp /path/to/index.html .
cp -r /path/to/css .
cp -r /path/to/js .

# Commit & push
git add .
git commit -m "Initial commit: pisah HTML/CSS/JS"
git push origin main
```

Atau upload manual via web:
- Klik **Add file** → **Upload files**
- Upload `index.html`, folder `css/`, folder `js/`

### 3. Aktifkan GitHub Pages
1. Di repository, klik **Settings**
2. Scroll ke **Pages** (sidebar kiri)
3. **Source**: Deploy from a branch
4. **Branch**: `main` / `master`, folder `/ (root)`
5. Klik **Save**
6. Tunggu 1-2 menit, lalu akses URL: `https://USERNAME.github.io/absensi-karyawan`

---

## 🔧 Konfigurasi Backend (Google Apps Script)

### Masalah CORS
Karena frontend di GitHub Pages (domain berbeda) dan backend di Google Apps Script, Anda perlu memastikan:

#### Opsi A: Modifikasi Code.gs (Rekomendasi)
Tambahkan fungsi ini di `Code.gs` Anda:

```javascript
// ============================================
// CORS HANDLER - Tambahkan di Code.gs
// ============================================
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
}

function doPost(e) {
  // Set CORS headers untuk semua response
  const output = handleApiRequest(JSON.parse(e.postData.contents));

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      "Access-Control-Allow-Origin": "*"
    });
}
```

#### Opsi B: Deploy Baru
1. Buka Google Apps Script project Anda
2. Klik **Deploy** → **New deployment**
3. Pilih type **Web app**
4. **Execute as**: Me
5. **Who has access**: **Anyone** (atau "Anyone with Google Account")
6. Klik **Deploy** dan copy URL baru
7. Update URL di `js/app.js` baris:
   ```javascript
   const APPS_SCRIPT_URL = 'URL_BARU_ANDA';
   ```

---

## 🔗 Update URL Backend

Jika URL Apps Script berubah, edit file `js/app.js`:

```javascript
// Ganti URL ini dengan deployment URL Anda
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbySMzB3SsqaMqJITxhXu1eWorAB_I5BboEcqNcncwLfSo4Iu_vDvGu50rth3IM6g2I/exec';
```

---

## ⚠️ Perbedaan dengan Versi Google Apps Script (HTML Service)

| Fitur | Apps Script HTML Service | GitHub Pages |
|-------|------------------------|--------------|
| `google.script.run` | ✅ Native | ❌ Tidak tersedia |
| CORS | Tidak perlu (same origin) | Perlu konfigurasi |
| Hosting | Google server | GitHub server |
| Custom domain | Tidak bisa (script.google.com) | Bisa (custom domain) |
| Kecepatan load | Lambat (server Google) | Cepat (CDN GitHub) |

### Yang Berubah di Frontend:
- ✅ `apiCall()` sekarang pakai `fetch()` native
- ✅ Content-Type: `text/plain` (menghindari preflight CORS)
- ✅ Response parsing handle JSONP wrapper
- ✅ Error handling lebih detail untuk network issues

---

## 🛠️ Fitur Aplikasi

- ✅ Login dengan ID & PIN
- ✅ Mode tanpa login (dropdown nama)
- ✅ Kamera selfie dengan face guide
- ✅ GPS tracking & radius validasi
- ✅ Absen Masuk / Pulang / Lembur
- ✅ Pengajuan Izin / Cuti / Sakit
- ✅ Jadwal shift mingguan
- ✅ Raport absen bulanan
- ✅ Notifikasi approval (bubble)
- ✅ PICO mascot tutorial
- ✅ In-app browser detection
- ✅ Permission help modal

---

## 📱 Tips Mobile

1. **Buka di Chrome/Safari langsung** (bukan dari WhatsApp/IG)
2. **Aktifkan GPS** dengan mode akurasi tinggi
3. **Izinkan kamera** saat pertama kali dibuka
4. **HTTPS wajib** (GitHub Pages otomatis HTTPS ✅)

---

## 🆘 Troubleshooting

### "CORS policy" error
→ Pastikan `doPost()` di Code.gs return dengan `Access-Control-Allow-Origin: *`

### "Failed to fetch"
→ Cek URL Apps Script benar & deployment masih aktif

### Kamera tidak nyala
→ Buka di browser luar (Chrome), bukan dari dalam aplikasi sosial

### Data tidak muncul
→ Cek browser console (F12) untuk detail error

---

## 📄 Lisensi

Free to use untuk project internal. Dibuat untuk **Pinguin Cell**.

---

**Butuh bantuan?** Cek console browser (F12) dan screenshot error untuk debugging lebih lanjut.
