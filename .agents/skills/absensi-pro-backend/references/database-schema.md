# Database Schema — Google Sheets (Absensi Pro)

Setiap tabel direpresentasikan sebagai "Sheet" di dalam Google Spreadsheet. Sistem berjalan membaca dan menulis row per row.

*Penting: Urutan kolom di dalam kode (`row[0]`, `row[1]`, dll) HARUS SAMA PERSIS dengan urutan kolom di Sheet ini.*

## Sheet: MASTER_KARYAWAN
Menyimpan data otorisasi dan profil karyawan.
| Indeks Array | Nama Kolom | Keterangan |
|--------------|------------|------------|
| 0 | ID_Karyawan | Unik (misal: KRY-001) |
| 1 | PIN / Password | - |
| 2 | Nama Lengkap | - |
| 3 | Role | `Karyawan` / `Admin` |
| 4 | ID_Toko_Default | - |
| 5 | Gaji_Pokok | - |
| 6 | Transport_Harian | Default 15000 |

## Sheet: MASTER_TOKO
Menyimpan data cabang toko.
| Indeks Array | Nama Kolom | Keterangan |
|--------------|------------|------------|
| 0 | ID_Toko | Unik |
| 1 | Nama_Toko | - |
| 2 | Alamat | - |
| 3 | Latitude | Geofence Center |
| 4 | Longitude | Geofence Center |
| 5 | Radius_Meter | Standar: 50 |
| 6 | IP_Address | (Opsional) Validasi wifi toko |

## Sheet: ABSENSI
Log presensi harian karyawan.
| Indeks Array | Nama Kolom | Keterangan |
|--------------|------------|------------|
| 0 | ID_Absen | - |
| 1 | Tanggal | Format YYYY-MM-DD |
| 2 | ID_Karyawan | - |
| 3 | ID_Toko | Toko tempat absen masuk |
| 4 | Jam_Masuk | - |
| 5 | Jam_Keluar | - |
| 6 | Lokasi_Masuk | Lat,Lng |
| 7 | Foto_Masuk | URL gambar |
| 8 | Status_Hadir | Tepat Waktu / Terlambat |
| 9 | Lembur_Jam | - |

## Sheet: TUGAS
Data master tugas.
| Indeks Array | Nama Kolom | Keterangan |
|--------------|------------|------------|
| 0 | ID_Tugas | - |
| 1 | Kategori | Toko / Rutin / Individu |
| 2 | Judul | - |
| 3 | ID_Toko | - |
| 4 | Ditugaskan_Ke | ID_Karyawan atau `ALL` |
| 5 | Status | Aktif / Selesai / Deleted |
| ... | ... | ... |
| X | Tunjangan_Rp | Nominal Insentif (tambahan terbaru) |

## Sheet: LOG_TUGAS
Log Karyawan menyelesaikan tugas.
| Indeks Array | Nama Kolom | Keterangan |
|--------------|------------|------------|
| 0 | Timestamp | Waktu selesai |
| 1 | ID_Tugas | - |
| 2 | ID_Karyawan | - |
| 3 | Foto_Bukti | URL Bukti Selesai |
| 4 | Catatan | - |
| 5 | Status_Verifikasi | Selesai / Pending |

*(Dokumen ini merupakan ringkasan. Jika menambah kolom baru, PASTIKAN menambahkan kolom tersebut di kolom paling kanan agar indeks tidak bergeser, dan update dokumen ini).*
