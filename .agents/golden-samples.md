# GOLDEN SAMPLES

File ini berisi contoh penulisan kode yang dianggap baku dan bersih untuk proyek ini.
Jangan ubah pola ini kecuali jika diminta secara spesifik.

## 1. Fungsi Routing `doPost`
```javascript
function doPost(e) {
  try {
    var data;
    if (e.postData.type === "application/json") {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }

    var action = data.action;

    switch (action) {
      case 'getKinerja': 
        return jsonResponse(getKinerja(data));
      // ...kasus lainnya...
      default:
        return jsonResponse({ success: false, status: 'error', error: 'Action not found' });
    }
  } catch(err) {
    return jsonResponse({ success: false, status: 'error', error: err.toString() });
  }
}
```
**Alasan "Golden":** Menangkap semua error di level top, memisahkan logika berdasarkan `action`, dan selalu membungkus hasil dalam `jsonResponse`.

## 2. Pengecekan Kolom Spesifik di Dalam Loop
```javascript
var scoresData = scoresSheet.getDataRange().getValues();
var karyawanData = karyawanSheet.getDataRange().getValues();

for (var i = 1; i < scoresData.length; i++) { // Selalu mulai i=1 untuk skip header
  var empId = scoresData[i][1];
  var role = '';
  var empStatus = '';
  
  // Ambil detail karyawan
  for (var j = 1; j < karyawanData.length; j++) {
    if (karyawanData[j][0] == empId) { // Kolom 0 = ID Karyawan
      role = karyawanData[j][3];       // Kolom 3 = Jabatan
      empStatus = karyawanData[j][5];  // Kolom 5 = Status Aktif
      break;
    }
  }

  // Normalisasi string dari sheet
  var roleUpper = role ? role.toString().toUpperCase().trim() : '';
  var statusUpper = empStatus ? empStatus.toString().toUpperCase().trim() : '';

  if (statusUpper === 'NONAKTIF' || statusUpper === 'RESIGNED') continue;
  if (roleUpper !== 'KARYAWAN' && roleUpper !== 'ADMIN') continue;

  // Lanjut pemrosesan...
}
```
**Alasan "Golden":** Melakukan pengecekan `i=1` secara konsisten, menormalisasi input menjadi `.toUpperCase().trim()` untuk menghindari bug *case-sensitivity* atau *whitespace*, serta menangani referensi indeks kolom secara hati-hati.
