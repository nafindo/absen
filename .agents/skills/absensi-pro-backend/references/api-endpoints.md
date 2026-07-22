# API Endpoints — Absensi Pro (Google Apps Script)

Semua permintaan API (kecuali media) ditujukan pada SATU endpoint Google Apps Script Web App URL melalui method `POST`.
Aksi (action) dibedakan berdasarkan parameter `action` di dalam JSON Body.

Format Umum Request:
```json
{
  "action": "nama_aksi",
  "data": { ... }
}
```

Format Umum Response:
```json
{
  "success": true | false,
  "message": "Deskripsi sukses",
  "error": "Deskripsi error jika gagal",
  "data": { ... }
}
```

## Daftar Endpoint (Berdasarkan `routing-map.md`)

| Action | Kegunaan | Parameter Data Utama (Contoh) | Response Data (Contoh) |
|--------|----------|-------------------------------|------------------------|
| `login` | Autentikasi Pengguna | `{ phone, password, pin }` | `karyawan` object |
| `absen_masuk` | Absen Datang | `{ idKaryawan, idToko, lokasi, ip }` | - |
| `absen_keluar` | Absen Pulang | `{ idKaryawan, idToko, lokasi, ip }` | - |
| `createTugas` | Tambah tugas baru | `{ judul, kategori, tunjanganRp, idToko, ditugaskanKe }` | - |
| `updateTugasStatus` | Ubah status tugas | `{ idTugas, status }` | - |
| `submitChecklistHarian` | Lapor area/rak toko | `{ data: [{ rak, skor }] }` | - |
| `getDashboardData` | Mengambil statistik | - | `stats` object |
| `getKaryawan` | Ambil data karyawan | - | Array of Karyawan |
| `getSalaries` | Perhitungan gaji | `{ idKaryawan }` | Object Slip Gaji |

Untuk peta routing dan interaksi data antar sheet yang lebih lengkap, selalu mengacu pada file `../../routing-map.md` dan `../../architecture.md` yang sudah ada di `.agents/`.
