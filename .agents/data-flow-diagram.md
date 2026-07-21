# 📊 DIAGRAM ALUR DATA (DATA FLOW DIAGRAM)

Dokumen ini menjelaskan bagaimana data mengalir di dalam sistem aplikasi Absensi Pinguin Cell, mulai dari input pengguna di HP Android hingga tersimpan di Google Sheets dan didistribusikan ke admin secara real-time.

---

## 1. Diagram Alur Utama (High-Level Data Flow)

Berikut adalah visualisasi alur data saat karyawan melakukan absensi (Masuk atau Pulang):

```
[Karyawan]
   │
   ▼ (Ambil Foto Selfie & GPS)
[WebView: index.html & app.js] ──▶ (Proses Gambar: Kompres JPEG 70%, Max 800px)
   │                           ──▶ (Enkripsi: XOR dengan PIN Karyawan + Base64)
   │
   ├─► [Offline Mode] ──▶ Simpan ke [IndexedDB: OUTBOX_QUEUE] (status: "pending")
   │                                   │
   │                            (kembali online)
   │                                   ▼
   └─► [Online Mode]  ──▶ Kirim HTTP POST Request (JSON Payload)
                                   │
                                   ▼
                       [Server: doPost (code.gs)]
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼ (Simpan Data & Media)                             ▼ (Real-time Broadcast)
 ┌───────────────┐                                   ┌─────────────────────────┐
 │ Google Drive  │ (Simpan Foto Selfie)              │ Push Notification (FCM) │ ──▶ [HP Karyawan / Owner]
 └───────┬───────┘                                   └─────────────────────────┘
         │ (dapatkan URL Foto)                               ▼ (Broadcast Status)
         ▼                                           ┌─────────────────────────┐
 ┌───────────────┐                                   │  Pusher API (Websocket)  │
 │ Google Sheets │ (Tulis ke tabel ABSENSI)          └────────────┬────────────┘
 └───────────────┘                                                │
         ▲                                                        ▼
         │ (Kirim respons sukses)                    [HP Admin / Background Service]
         │                                           ┌─────────────────────────┐
         └────────────────────────────────────────── │ PinguinNotifService.java│ ──▶ [Notifikasi OS Statusbar]
                                                     └─────────────────────────┘
```

---

## 2. Rincian Alur Proses (Step-by-Step Flow)

### A. Input & Pemrosesan di HP Karyawan (Frontend)
1. **Input Foto & GPS**: Karyawan mengambil foto selfie menggunakan kamera di aplikasi dan aplikasi meminta koordinat GPS terkini.
2. **Kompresi Citra**: Gambar dikompresi ke resolusi maksimal lebar `800px` dengan kualitas JPEG `70%` (`kompresSelfie` di [app.js](file:///d:/absen/app.js)).
3. **Enkripsi Citra**: Foto yang telah dikompresi dienkripsi secara lokal menggunakan operasi XOR dengan kunci PIN karyawan (`enkripsiDekripsiFoto` di [app.js](file:///d:/absen/app.js)) lalu diubah menjadi string Base64.
4. **Strategi Caching & Database Lokal**:
   - Jika **koneksi internet terputus (Offline)**, data dibungkus dalam payload dan disimpan ke **IndexedDB** pada *objectStore* `OUTBOX_QUEUE` dengan status `"pending"`.
   - Ketika perangkat kembali terhubung ke internet, fungsi `processOutboxQueue()` akan otomatis dipanggil untuk mengirimkan antrean tersebut.
   - Status UI (seperti `state.absenStatus`) disimpan ke `localStorage` HP agar UI langsung berubah seketika tanpa jeda (Optimistic UI).

### B. Pemrosesan di Google Apps Script (Backend)
1. **Entry Point**: Seluruh request HTTP POST masuk melalui fungsi `doPost(e)` di [code.gs](file:///d:/absen/code.gs).
2. **Routing**: `doPost` mem-parsing payload JSON dan melakukan routing berdasarkan parameter `action` (misalnya: `absenMasuk` atau `absenPulang`).
3. **Penyimpanan Foto**: Server backend mendekripsi foto Base64 dan menyimpannya ke folder Google Drive khusus menggunakan `uploadFotoToDrive()`, lalu mengembalikan URL file tersebut.
4. **Validasi & Database**:
   - Validasi data dilakukan (misalnya: pengecekan radius GPS ke toko default atau toko lembur).
   - Backend menulis record absensi ke **Google Sheets** menggunakan fungsi `appendRow()`. Karena data disisipkan di baris 2 (agar data terbaru ada di atas), baris-baris berikutnya bergeser ke bawah.
5. **Respons**: Server mengirimkan kembali respons berformat JSON (`{ success: true, ... }`).

### C. Aliran Notifikasi & Broadcast Real-Time
1. **FCM (Firebase Cloud Messaging)**: `code.gs` mengirimkan notifikasi push secara langsung ke HP Karyawan/Owner untuk memberi tahu status kehadiran.
2. **Pusher Websockets**: Server `code.gs` memicu event Pusher pada channel `pinguin-chat` dengan event `absen-alert`.
3. **PinguinNotifService.java**: Di perangkat HP Admin/Owner, sebuah *Foreground Android Service* ([PinguinNotifService.java](file:///d:/absen/android/app/src/main/java/com/pinguincell/absen/PinguinNotifService.java)) selalu berjalan di latar belakang menjaga koneksi WebSocket tetap aktif ke Pusher. Begitu menerima event broadcast, service ini akan langsung memicu notifikasi system tray (status bar) Android secara native.

---

## 3. Struktur Penyimpanan Data (Storage Mapping)

| Komponen Data | Media Penyimpanan Lokal (HP) | Media Penyimpanan Utama (Cloud) |
|---|---|---|
| **Antrean Aksi (Offline)** | `IndexedDB: OUTBOX_QUEUE` | - |
| **Foto Absen (Selfie)** | Sementara di Memory (`state.photoData`) | `Google Drive` |
| **Log Kehadiran** | - | `Google Sheets` (Sheet: `ABSENSI`) |
| **Informasi Akun & Status**| `localStorage` (Cache UI) | `Google Sheets` (Sheet: `MASTER_KARYAWAN`) |
| **Notifikasi Real-time** | SQLite lokal jika ada / System Tray | `Pusher WebSocket` & `FCM` |
