# PATTERN BAKU

Patuhi pola-pola berikut saat menulis atau memodifikasi kode:

## 1. Respons API
Semua fungsi yang dieksekusi dari `doPost` HARUS mengembalikan string JSON yang dihasilkan oleh `jsonResponse(data)`.
Contoh:
```javascript
function contohEndpoint(data) {
  try {
    // logika
    return jsonResponse({ success: true, status: 'success', data: result });
  } catch(e) {
    return jsonResponse({ success: false, status: 'error', error: e.toString() });
  }
}
```

## 2. Pengambilan Data Sheet
Gunakan `getSheetData(sheetName)` untuk membaca semua data secara cepat (sudah di-cache jika memungkinkan), atau gunakan `Sheet.getDataRange().getValues()` untuk operasi mentah yang butuh `i = 1` skip header.

## 3. Modifikasi Data Sheet
Untuk menambah baris, gunakan `appendRow(sheetName, [col1, col2, ...])`.
Untuk update, lakukan iterasi pada hasil `getValues()` atau gunakan loop pada baris aktual lalu `getRange(row, col).setValue(...)`. JANGAN mengganti seluruh data sheet sekaligus menggunakan `setValues` kecuali benar-benar diperlukan karena rawan timeout/limit.

## 4. Penanganan API & Payload (Defensive Programming)
- Jangan asumsikan struktur payload utuh dari Android (misal `namaFile` atau `tipe` bisa saja salah/kosong). Gunakan *fallback* atau `.toLowerCase()` secara defensif.
- Bungkus perintah pembagian hak akses Drive (`file.setSharing(...)`) dalam `try-catch` terpisah. Kebijakan Google Workspace klien sering kali menolak *Public Link Sharing*, yang dapat menyebabkan seluruh skrip *crash* dan membatalkan penyisipan baris jika tidak di-*catch*.
- Selalu *sanitize* string base64 yang dikirim via metode POST dengan `.replace(/ /g, '+')` untuk menghindari error *decoder* karena perubahan karakter saat transmisi jaringan.

## 5. RESPONSE JSON
- Wajib menggunakan `ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON)`.

## 4. Penanganan Tanggal
Selalu parse tanggal dari sheet menggunakan pengecekan `instanceof Date`.
```javascript
var rowDate = row[0];
var rowDateObj = (rowDate instanceof Date) ? rowDate : new Date(rowDate);
if (!isNaN(rowDateObj.getTime())) {
  // valid date
}
```

## 5. Indeks Array Dimulai dari 0
Kolom A = `row[0]`, Kolom B = `row[1]`, dst. Saat memperbarui fungsi, pastikan indeks yang ditulis benar-benar cocok dengan daftar kolom di awal file `code.gs`.
