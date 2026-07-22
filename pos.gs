/**
 * ABSENSI PRO - SISTEM POS & INVENTORY MASTER
 * Arsitektur: 1 GAS (Routing) -> N File Spreadsheet (1 Sheet per Toko)
 */

const SECRET_KEY = "pinguin2025"; // Samakan dengan APK Admin

function doPost(e) {
  try {
    const jsonString = e.postData.contents;
    const requestData = JSON.parse(jsonString);
    
    // 1. Validasi Akses
    if (requestData.secret !== SECRET_KEY) {
      return responseError(401, "Unauthorized: Kunci Rahasia Salah");
    }

    // 2. Ambil Action & Parameter
    const action = requestData.action;
    const payload = requestData.payload || {};
    
    // Semua aksi (kecuali ping) wajib menyertakan ID Sheet Toko (target database)
    const targetSheetId = requestData.targetSheetId;

    switch (action) {
      case "ping":
        return responseSuccess({ message: "Sistem POS Online" });
        
      case "init_store":
        if (!targetSheetId) return responseError(400, "targetSheetId wajib diisi");
        return actionInitStore(targetSheetId, payload.namaToko);
        
      case "catat_transaksi":
        if (!targetSheetId) return responseError(400, "targetSheetId wajib diisi");
        return actionCatatTransaksi(targetSheetId, payload);
        
      case "mutasi_barang":
        // Khusus mutasi, butuh 2 ID Sheet
        if (!payload.sourceSheetId || !payload.destSheetId) {
          return responseError(400, "sourceSheetId dan destSheetId wajib diisi untuk mutasi");
        }
        return actionMutasiBarang(payload);

      case "ambil_stok":
        if (!targetSheetId) return responseError(400, "targetSheetId wajib diisi");
        return actionAmbilStok(targetSheetId);
        
      case "simpan_barang":
        if (!targetSheetId) return responseError(400, "targetSheetId wajib diisi");
        return actionTambahAtauUpdateBarang(targetSheetId, payload);

      default:
        return responseError(404, "Aksi tidak ditemukan");
    }
    
  } catch (err) {
    return responseError(500, "Terjadi kesalahan sistem: " + err.message);
  }
}

/**
 * ==========================================
 * ACTION HANDLERS
 * ==========================================
 */

// Membuat struktur tabel awal secara otomatis di sheet toko baru
function actionInitStore(sheetId, namaToko) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    
    // Fungsi pembantu untuk membuat sheet jika belum ada
    function createSheetIfNotExists(name, headers) {
      let sheet = ss.getSheetByName(name);
      if (!sheet) {
        sheet = ss.insertSheet(name);
        if (headers && headers.length > 0) {
          sheet.appendRow(headers);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e0e0e0");
          sheet.setFrozenRows(1);
        }
      }
      return sheet;
    }
    
    // 1. Sheet Barang/Stok
    createSheetIfNotExists("STOK_BARANG", ["ID_BARANG", "KODE_SKU", "NAMA_BARANG", "HARGA_BELI", "HARGA_JUAL", "STOK", "LAST_UPDATE"]);
    
    // 2. Sheet Transaksi Kasir
    createSheetIfNotExists("TRANSAKSI", ["ID_TRANSAKSI", "WAKTU", "KASIR", "TOTAL_BELANJA", "DIBAYAR", "KEMBALI", "METODE_BAYAR"]);
    
    // 3. Sheet Detail Transaksi (1 nota bisa banyak barang)
    createSheetIfNotExists("DETAIL_TRANSAKSI", ["ID_TRANSAKSI", "KODE_SKU", "NAMA_BARANG", "QTY", "HARGA_SATUAN", "SUBTOTAL"]);
    
    // 4. Sheet Mutasi (Perpindahan barang antar toko)
    createSheetIfNotExists("MUTASI_BARANG", ["ID_MUTASI", "WAKTU", "JENIS", "KODE_SKU", "QTY", "KETERANGAN", "REFERENSI_TOKO"]);
    
    // 5. Sheet Kas (Pendapatan & Pengeluaran toko)
    createSheetIfNotExists("KAS_HARIAN", ["WAKTU", "JENIS", "NOMINAL", "KETERANGAN", "SALDO_AKHIR", "PIC"]);

    // Set nama file sebagai nama toko agar mudah dikenali di Google Drive
    if (namaToko) {
      ss.rename("POS_TOKO_" + namaToko.toUpperCase());
    }
    
    // Opsional: Hapus "Sheet1" bawaan Google
    const sheet1 = ss.getSheetByName("Sheet1");
    if (sheet1) ss.deleteSheet(sheet1);
    
    return responseSuccess({ message: "Berhasil menginisialisasi struktur Sheet POS untuk Toko: " + (namaToko || sheetId) });
  } catch (err) {
    return responseError(500, "Gagal akses Spreadsheet ID. Pastikan email script memiliki izin Editor. Detail: " + err.message);
  }
}

function actionCatatTransaksi(sheetId, payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.openById(sheetId);
    const sheetStok = ss.getSheetByName("STOK_BARANG");
    const sheetTrx = ss.getSheetByName("TRANSAKSI");
    const sheetDetail = ss.getSheetByName("DETAIL_TRANSAKSI");
    const sheetKas = ss.getSheetByName("KAS_HARIAN");

    if (!sheetStok || !sheetTrx || !sheetDetail || !sheetKas) {
      return responseError(500, "Struktur sheet tidak lengkap. Silakan inisialisasi toko terlebih dahulu.");
    }

    const { idTransaksi, waktu, kasir, totalBelanja, dibayar, kembali, metodeBayar, keranjang } = payload;

    // 1. Kurangi Stok
    const stokData = sheetStok.getDataRange().getValues();
    for (let item of keranjang) {
      for (let i = 1; i < stokData.length; i++) {
        if (stokData[i][1] === item.kodeSku) {
          const currentStok = parseFloat(stokData[i][5]) || 0;
          sheetStok.getRange(i + 1, 6).setValue(currentStok - item.qty);
          break;
        }
      }
      // 2. Catat Detail Transaksi
      sheetDetail.appendRow([idTransaksi, item.kodeSku, item.namaBarang, item.qty, item.hargaSatuan, item.subtotal]);
    }

    // 3. Catat Transaksi Induk
    sheetTrx.appendRow([idTransaksi, waktu, kasir, totalBelanja, dibayar, kembali, metodeBayar]);

    // 4. Catat Pemasukan Kas
    sheetKas.appendRow([waktu, "Pemasukan", totalBelanja, "Penjualan " + idTransaksi, "", kasir]);

    return responseSuccess({ message: "Transaksi berhasil dicatat" });
  } catch (err) {
    return responseError(500, "Gagal mencatat transaksi: " + err.message);
  } finally {
    lock.releaseLock();
  }
}

function actionMutasiBarang(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const { sourceSheetId, destSheetId, idMutasi, waktu, kodeSku, qty, keterangan, pic } = payload;
    
    const ssSource = SpreadsheetApp.openById(sourceSheetId);
    const ssDest = SpreadsheetApp.openById(destSheetId);
    
    const stokSource = ssSource.getSheetByName("STOK_BARANG");
    const mutasiSource = ssSource.getSheetByName("MUTASI_BARANG");
    
    const stokDest = ssDest.getSheetByName("STOK_BARANG");
    const mutasiDest = ssDest.getSheetByName("MUTASI_BARANG");

    if (!stokSource || !stokDest) return responseError(500, "Sheet STOK_BARANG tidak ditemukan");

    // 1. Kurangi Stok Source
    let foundSource = false;
    let dataBarang = null;
    const sourceData = stokSource.getDataRange().getValues();
    for (let i = 1; i < sourceData.length; i++) {
      if (sourceData[i][1] === kodeSku) {
        dataBarang = sourceData[i];
        const currentStok = parseFloat(sourceData[i][5]) || 0;
        if (currentStok < qty) return responseError(400, "Stok tidak mencukupi di Toko Asal");
        stokSource.getRange(i + 1, 6).setValue(currentStok - qty);
        foundSource = true;
        break;
      }
    }
    
    if (!foundSource) return responseError(404, "SKU tidak ditemukan di Toko Asal");

    // 2. Catat Mutasi Keluar di Source
    mutasiSource.appendRow([idMutasi, waktu, "Keluar", kodeSku, qty, keterangan, destSheetId]);

    // 3. Tambah Stok Dest
    let foundDest = false;
    const destData = stokDest.getDataRange().getValues();
    for (let i = 1; i < destData.length; i++) {
      if (destData[i][1] === kodeSku) {
        const currentStok = parseFloat(destData[i][5]) || 0;
        stokDest.getRange(i + 1, 6).setValue(currentStok + qty);
        foundDest = true;
        break;
      }
    }

    if (!foundDest && dataBarang) {
      stokDest.appendRow([dataBarang[0], dataBarang[1], dataBarang[2], dataBarang[3], dataBarang[4], qty, waktu]);
    }

    // 4. Catat Mutasi Masuk di Dest
    mutasiDest.appendRow([idMutasi, waktu, "Masuk", kodeSku, qty, keterangan, sourceSheetId]);

    return responseSuccess({ message: "Mutasi berhasil dilakukan" });
  } catch (err) {
    return responseError(500, "Gagal mutasi: " + err.message);
  } finally {
    lock.releaseLock();
  }
}

function actionAmbilStok(sheetId) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const sheetStok = ss.getSheetByName("STOK_BARANG");
    if (!sheetStok) return responseError(404, "Sheet STOK_BARANG tidak ditemukan");
    
    const data = sheetStok.getDataRange().getValues();
    const items = [];
    for (let i = 1; i < data.length; i++) {
       const row = data[i];
       if (row[0] || row[1]) {
         items.push({
           idBarang: row[0],
           kodeSku: row[1],
           namaBarang: row[2],
           hargaBeli: row[3],
           hargaJual: row[4],
           stok: row[5],
           lastUpdate: row[6]
         });
       }
    }
    return responseSuccess({ data: items });
  } catch (err) {
    return responseError(500, err.message);
  }
}

function actionTambahAtauUpdateBarang(sheetId, payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.openById(sheetId);
    const sheetStok = ss.getSheetByName("STOK_BARANG");
    if (!sheetStok) return responseError(404, "Sheet STOK_BARANG tidak ditemukan");

    const { idBarang, kodeSku, namaBarang, hargaBeli, hargaJual, stok, waktu } = payload;
    
    const data = sheetStok.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === kodeSku) {
        if (namaBarang !== undefined) sheetStok.getRange(i + 1, 3).setValue(namaBarang);
        if (hargaBeli !== undefined) sheetStok.getRange(i + 1, 4).setValue(hargaBeli);
        if (hargaJual !== undefined) sheetStok.getRange(i + 1, 5).setValue(hargaJual);
        if (stok !== undefined) sheetStok.getRange(i + 1, 6).setValue(stok);
        sheetStok.getRange(i + 1, 7).setValue(waktu || new Date());
        found = true;
        break;
      }
    }

    if (!found) {
      sheetStok.appendRow([idBarang || ("BRG" + new Date().getTime()), kodeSku, namaBarang, hargaBeli, hargaJual, stok || 0, waktu || new Date()]);
    }
    
    return responseSuccess({ message: "Barang berhasil disimpan" });
  } catch (err) {
    return responseError(500, err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * ==========================================
 * HELPER / UTILITY
 * ==========================================
 */
function responseSuccess(data) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    ...data
  })).setMimeType(ContentService.MimeType.JSON);
}

function responseError(code, message) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "error",
    code: code,
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}

// Digunakan untuk testing dari browser biasa (Abaikan jika hanya pakai POST dari Android)
function doGet(e) {
  return ContentService.createTextOutput("POS Absensi Pro API Online.")
    .setMimeType(ContentService.MimeType.TEXT);
}
