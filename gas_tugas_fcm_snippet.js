/* 
PANDUAN MENGAKTIFKAN FCM TUGAS DI GOOGLE APPS SCRIPT (code.gs)
--------------------------------------------------------------

Langkah 1: Tambahkan kode helper ini di mana saja di file code.gs Anda (misalnya di bagian paling bawah)

```javascript
/**
 * Fungsi pembantu untuk menembak FCM ke Absensi Channel (Tugas)
 */
function sendNotifTugasKeKaryawan(idToko, idKaryawanTujuan, judulTugas, pesan) {
  var sheetKaryawan = getSheet('Karyawan');
  var dataKaryawan = getSheetData(sheetKaryawan);
  
  // Jika ditujukan ke "ALL" di seluruh toko
  if (idToko === "ALL" && idKaryawanTujuan === "ALL") {
    dataKaryawan.forEach(function(k) {
      if (k.Status === "Aktif") {
        sendPushNotification(k.ID_Karyawan, "Tugas Baru: " + judulTugas, pesan, "absensi_channel", { type: "tugas" });
      }
    });
    return;
  }
  
  // Jika ditujukan ke toko tertentu (Bisa lebih dari 1 toko)
  if (idToko !== "ALL" && idKaryawanTujuan === "ALL") {
    var arrToko = idToko.split(",");
    dataKaryawan.forEach(function(k) {
      if (k.Status === "Aktif" && arrToko.indexOf(k.ID_Toko) !== -1) {
        sendPushNotification(k.ID_Karyawan, "Tugas Baru: " + judulTugas, pesan, "absensi_channel", { type: "tugas" });
      }
    });
    return;
  }
  
  // Jika ditujukan ke karyawan individu (Bisa lebih dari 1 karyawan)
  if (idKaryawanTujuan !== "ALL") {
    var arrKar = idKaryawanTujuan.split(",");
    dataKaryawan.forEach(function(k) {
      if (k.Status === "Aktif" && arrKar.indexOf(k.ID_Karyawan) !== -1) {
        sendPushNotification(k.ID_Karyawan, "Tugas Baru: " + judulTugas, pesan, "absensi_channel", { type: "tugas" });
      }
    });
  }
}

function sendNotifTugasSelesaiKeAdmin(namaKaryawan, judulTugas) {
  // Kirim ke Admin. Asumsi ID Admin adalah "ADMIN" atau Anda bisa menggunakan fcm_admin khusus.
  // Jika ada function khusus untuk admin:
  sendPushNotification("ADMIN", "Tugas Selesai", namaKaryawan + " telah menyelesaikan tugas: " + judulTugas, "absensi_channel", { type: "tugas" });
}
```

Langkah 2: Temukan fungsi `createTugas` di `code.gs`. Tambahkan pemanggilan `sendNotifTugasKeKaryawan` setelah tugas berhasil disimpan.
Contoh:
```javascript
function createTugas(req) {
  // ... kode lama ...
  sheet.appendRow([idTugas, req.judul, req.deskripsi, ...]);
  
  // TAMBAHKAN INI:
  try {
    sendNotifTugasKeKaryawan(req.idToko, req.ditugaskanKe, req.judul, req.deskripsi);
  } catch(e) {
    Logger.log("Gagal kirim FCM tugas: " + e.toString());
  }
  
  return { success: true, message: "Tugas berhasil dibuat" };
}
```

Langkah 3: Temukan fungsi `submitTugasLog` atau `updateTugasStatus` di `code.gs`. Tambahkan pemanggilan notifikasi ke Admin saat status menjadi Selesai.
Contoh:
```javascript
function submitTugasLog(req) {
  // ... kode lama update tugas jadi selesai ...
  
  // TAMBAHKAN INI:
  try {
     sendNotifTugasSelesaiKeAdmin(req.idKaryawan, "Tugas " + req.idTugas); 
  } catch(e) {
     Logger.log("Gagal kirim FCM ke admin: " + e.toString());
  }
  // ... return success
}
```

Langkah 4: Pastikan `appsscript.json` Anda memiliki scope OAuth untuk FCM. (PENTING! Jika tidak ada, FCM tidak akan pernah jalan).
Buka appsscript.json di editor (via Project Settings -> Show manifest).
Pastikan list "oauthScopes" memiliki URL ini:
"https://www.googleapis.com/auth/firebase.messaging"

*/
