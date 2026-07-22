---
name: absensi-pro-backend
description: |
  Backend developer for Absensi Pro — a multi-store attendance system 
  with 10+ employee devices and multiple admin devices. 
  Handles attendance tracking, shift scheduling, store management, 
  employee management, real-time notifications, and reporting.
  Use when user asks to "fix the backend", "update the API", 
  "modify attendance logic", "change store settings", 
  "update shift schedule", "fix bug in backend", 
  "add feature to backend", or "refactor code.gs".
metadata:
  project: Absensi Pro
  version: "3.0"
  total_lines: "7500+"
  devices: "10+ employee, 3 admin"
  stack: "Google Apps Script (GAS) / Vanilla JS / HTML / CSS / Kotlin (Android)"
---

# Absensi Pro — Backend Developer Skill

## 📋 ARSITEKTUR SISTEM (GOOGLE APPS SCRIPT)

### Struktur File Utama (WAJIB DIKETAHUI)
Backend utama tidak dipecah menjadi multiple file di GitHub, melainkan bersatu di dalam file `code.gs`.
- **`code.gs`**: Pusat logika aplikasi, rute API (`doPost`), validasi, integrasi database sheet.
- **`app.js` & `index.html`**: Frontend Karyawan (SPA dengan Vanilla JS).
- **`admin.js` & `admin.html`**: Frontend Web Admin.
- **`absen-admin/`**: Native Android APK Kotlin untuk Admin.

### Database Schema (Google Sheets)
Sistem menggunakan Google Sheets sebagai Database. Setiap "Sheet" mewakili tabel.
- `MASTER_KARYAWAN` — Data Karyawan, Toko Default, Level Akses.
- `MASTER_TOKO` — Data Toko, Koordinat Geofence, IP Address, dll.
- `ABSENSI` — Data absensi harian (Masuk/Keluar).
- `SHIFT_TOKO` — Jadwal Karyawan per Toko.
- `LOG_TUGAS` & `TUGAS` — Sistem Penugasan dan Checklist Harian.
- `KINERJA_KARYAWAN` — Rekap skor kinerja harian/bulanan.

### API Endpoints (Ringkasan)
API menggunakan satu URL Endpoint GAS (URL Web App), dan routing ditentukan oleh body request parameter `action`.

| Action (Endpoint) | Fungsi Utama | Lokasi di `code.gs` |
|-------------------|--------------|---------------------|
| `login` | Autentikasi user | `login(data)` |
| `absen_masuk` / `absen_keluar` | Absensi, pengecekan geofence & IP | `absenMasuk(data)` / `absenKeluar(data)` |
| `submitChecklistHarian` | Laporan ceklist kebersihan/stok | `submitChecklistHarian(data)` |
| `createTugas` | Penambahan tugas dengan insentif | `createTugas(data)` |

*(Rute lengkap ada di file `.agents/routing-map.md`)*

---

## 🛡️ ATURAN KRITIS (JANGAN LANGGAR)

### 1. STRICT SCOPE EDITING (Aturan Utama)
- **ZERO REFACTOR**: Jangan ubah atau rapikan struktur kode yang sudah ada tanpa diminta secara eksplisit.
- **ZERO RENAME**: Jangan ganti nama fungsi, variabel, atau parameter yang sudah ada.
- **ZERO DELETE**: Jangan hapus kode yang masih berfungsi atau dikomentari (kecuali diminta).
- Hanya sentuh, baca, atau ubah bagian fungsi yang secara langsung terkait dengan permintaan pengguna.

### 2. BACKUP & SAFETY (Prosedur Update GAS)
- **NO GITHUB FOR CODE.GS**: Setiap ada modifikasi/perubahan pada `code.gs` di folder absen, JANGAN PERNAH meng-upload/push file tersebut ke GitHub. Biarkan tetap lokal.
- **MANUAL GAS UPDATE**: Setiap kali mengubah `code.gs` secara lokal, WAJIB informasikan kepada user bagian mana saja yang diubah atau berikan instruksi lengkap agar user bisa meng-copy-paste dan mengeditnya secara manual di Google Apps Script (GAS) Editor mereka.

### 3. DEPENDENCY & INDEX CHECK
- Sebelum melakukan modifikasi fungsi kompleks, gunakan alat pencarian untuk melihat di mana fungsi itu dipanggil.
- **Kesalahan Indeks Kolom Array adalah penyebab utama bug!** Selalu pastikan indeks (misal `row[0]`, `row[1]`) sesuai dengan struktur kolom di Sheet sumber. Baca file sumber (atau lihat `architecture.md` / `patterns.md` di root `.agents/`).

### 4. KONSISTENSI KODING
- Parameter request dan response harus dalam bentuk JSON terserialisasi.
- Respon sukses: `{ success: true, message: '...', data: {...} }`
- Respon error: `{ success: false, error: '...' }`
- Selalu gunakan `LockService.getScriptLock()` untuk mencegah Race Condition saat *write* ke Sheet.

---

## 🔧 WORKFLOW KETIKA USER MINTA EDIT

### Langkah 1: Klarifikasi (WAJIB)
Tanyakan sebelum mulai:
1. "Fungsi/Action mana di `code.gs` yang mau diedit?"
2. "Apa tujuan perubahan ini dan adakah kolom baru di Sheet?"

### Langkah 2: Analisis Dampak
Cek:
- [ ] File/Fungsi mana yang akan berubah di `code.gs`.
- [ ] Dampaknya ke Frontend (Web Karyawan, Web Admin, APK Android).
- [ ] Adakah kolom yang bergeser posisinya? (SANGAT FATAL).

### Langkah 3: Eksekusi & Laporan
Setelah selesai, tampilkan blok kode khusus kepada user:
```javascript
// GANTI BLOK KODE INI DI BARIS XXX code.gs DI EDITOR GAS ANDA:
function yangDiubah() {
   ...
}
```

---

## 🐛 ERROR LOG & PATTERN

### Error yang Sering Terjadi:
| # | Error | Penyebab | Solusi |
|---|-------|----------|--------|
| 1 | Kesalahan Indeks | User menambah kolom baru di Spreadsheet | Selalu konfirmasi indeks array (`row[X]`) setiap modifikasi. |
| 2 | Karyawan salah toko saat absen | IP Address atau GPS tidak match / geofence bocor | Cek radius Geofence (default 30-100m) dan IP match logic di `absenMasuk()`. |
| 3 | Race Condition Absensi | Banyak device absen bersamaan | Terapkan `LockService` dengan timeout minimal 10-15 detik di GAS. |

---

## 🔄 PROTOKOL MULTI-SESI

Jika konteks hilang atau memulai sesi baru, berikan laporan ke AI:
`"Kita sedang mengerjakan Absensi Pro. Fokus di fungsi [nama_fungsi] dalam file code.gs. Tujuan: [tujuan]"`

---

## 📎 REFERENSI PENTING

- `../../architecture.md` — Struktur dasar aplikasi dan aliran data.
- `../../patterns.md` — Pola coding baku (penamaan, respons JSON, pengambilan data).
- `../../routing-map.md` — Peta detail seluruh rute endpoint doPost dan alur datanya.
- `../../golden-samples.md` — Contoh kode standar yang teruji.
- `references/api-endpoints.md` — Endpoint spesifik yang digunakan.
- `references/error-log.md` — Riwayat bug/error yang pernah terjadi (Living Document).
