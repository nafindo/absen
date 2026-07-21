# ARSITEKTUR SISTEM

## 1. TECH STACK
- **Backend/Database:** Google Apps Script (GAS) dengan Google Sheets sebagai Database.
- **Frontend:** Aplikasi Android (.apk) atau Web App yang melakukan HTTP POST request ke Web App URL GAS.
- **Data Transfer:** JSON.

## 2. FILE UTAMA
- `code.gs`: Adalah **SATU-SATUNYA** file backend yang menangani semua logika. Berisi ribuan baris kode yang mencakup routing (`doPost`), fungsi CRUD ke Sheet, fungsi utilitas, dan integrasi eksternal (Pusher, FCM, Drive).

## 3. ALIRAN DATA (DATA FLOW)
1. Klien mengirim permintaan HTTP POST ke fungsi `doPost(e)` di `code.gs`.
2. `doPost` mem-parsing `e.postData.contents` dan mengekstrak properti `action`.
3. Switch-case di `doPost` memanggil fungsi spesifik sesuai `action` (misalnya: `getKinerja(data)`).
4. Fungsi terkait mengambil data dari Google Sheets melalui utilitas `getSheetData(sheetName)` atau menggunakan metode bawaan `SpreadsheetApp`.
5. Data difilter dan diproses, lalu dikembalikan menggunakan fungsi `jsonResponse(obj)`.

## 4. STRUKTUR DATABASE (SHEETS)
Beberapa Sheet kunci dan index kolom (sangat rentan, hati-hati!):
- **MASTER_KARYAWAN:** Index 0 (ID), 1 (Nama), 3 (Jabatan), 5 (Status), 8 (Toko_Default).
- **ABSENSI:** Index 0 (Timestamp), 1 (ID), 7 (Tipe), 11 (StatusMasuk), 12 (MenitTelat).
- **MASTER_TOKO:** Index 0 (ID), 1 (Nama).
- **TUGAS:** Index 0 (Timestamp), 4 (Ditugaskan_Ke), 8 (Status), 10 (Deadline), 11 (Selesai_At), 12 (Dikerjakan_Oleh).
- **IZIN_CUTI:** Index 1 (ID_Karyawan), 5 (Mulai), 6 (Selesai), 10 (Status).

## 5. MEKANISME CACHE & SINKRONISASI (NATIVE APP)
Aplikasi native menggunakan Room Database (PendingSync) dan SharedPreferences (CacheManager) untuk memberikan pengalaman Offline-First dan UI yang cepat.
- **CacheManager:** Menyimpan *state* sementara (seperti `absenStatus`, `home_jadwal`, `user_info`) agar UI merespon tanpa jeda saat dibuka.
- **SyncManager:** Berjalan di *background* setiap 60 detik (saat HomeScreen aktif) untuk menarik data dari `syncAllData` dan memperbarui `CacheManager`.
- **Aturan Caching Status Absen:**
  - Status `sudah_masuk` dipertahankan lintas-hari karena mendukung **Shift Malam (Cross-midnight)**. Backend (menggunakan *lookback* 18 jam) yang berhak menentukan apakah shift tersebut sudah usang atau bisa ditutup (pulang).
  - Status `sudah_pulang` wajib divalidasi dengan tanggal `absenDate`. Saat hari berganti, status `sudah_pulang` otomatis di-reset menjadi `belum_masuk` oleh frontend (tanpa perlu menunggu respons `syncAllData`).
