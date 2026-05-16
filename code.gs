const SPREADSHEET_ID = '1CC10iigHkBpSpGxL_vtc_lwBAC7vIsqNLoy3pXO2MVc';
const FOLDER_ID = '1tJgsRcaRejhI6SAvDfrikvOTOEHz2CEw';

// --- MAIN HANDLERS ---
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    let result = {};
    
    switch(action) {
      case 'login':
        result = handleLogin(postData.payload);
        break;
      case 'absenMasuk':
        result = handleAbsenMasuk(postData.payload);
        break;
      case 'absenPulang':
        result = handleAbsenPulang(postData.payload);
        break;
      case 'getDashboard':
        result = handleGetDashboard();
        break;
      default:
        result = { success: false, message: 'Action not found' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET handler to test deployment
function doGet(e) {
    return ContentService.createTextOutput("Backend AntyGravity v3.0 berjalan normal.")
                         .setMimeType(ContentService.MimeType.TEXT);
}

// --- LOGIC FUNCTIONS ---
function handleLogin(payload) {
    const userId = payload.userId;
    // Mock user list (bisa diganti query ke sheet MASTER_KARYAWAN jika sheet sudah ada)
    const users = {
        "1": { idKaryawan: "K001", nama: "Ahmad R", jabatan: "Kasir", idToko: "T001", namaToko: "Toko Pusat" },
        "2": { idKaryawan: "K002", nama: "Budi S", jabatan: "Staff", idToko: "T002", namaToko: "Cabang Barat" },
        "3": { idKaryawan: "K003", nama: "Siti A", jabatan: "Manager", idToko: "T001", namaToko: "Toko Pusat" }
    };
    
    const user = users[userId];
    if (user) {
        return { success: true, user: user };
    } else {
        return { success: false, message: "Karyawan tidak ditemukan" };
    }
}

function uploadFoto(base64Data, filename) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    // Hapus prefix "data:image/jpeg;base64," jika ada
    const base64String = base64Data.split(',')[1] || base64Data;
    const decodedData = Utilities.base64Decode(base64String);
    const blob = Utilities.newBlob(decodedData, 'image/jpeg', filename);
    const file = folder.createFile(blob);
    // Set permission agar bisa diakses public (view only)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch(e) {
    return ""; // Return empty url if failed
  }
}

function handleAbsenMasuk(payload) {
    // payload: { idKaryawan, nama, idToko, namaToko, idShift, namaShift, fotoBase64, lat, lng }
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('ABSENSI');
    
    // Auto-create sheet jika belum ada (hanya untuk pengamanan)
    if (!sheet) {
        sheet = ss.insertSheet('ABSENSI');
        sheet.appendRow(["Timestamp", "ID_Karyawan", "Nama", "ID_Toko", "Nama_Toko", "ID_Shift", "Nama_Shift", "Tipe", "Jam_Masuk", "Jam_Pulang", "Jam_Kerja", "Status_Masuk", "Menit_Telat", "Foto_URL", "Lat_Hp", "Long_Hp", "Jarak_M", "Status_GPS", "Face_Detected", "Foto_Pulang_URL"]);
    }
    
    let fotoUrl = '';
    if (payload.fotoBase64) {
        const filename = 'Masuk_' + payload.idKaryawan + '_' + new Date().getTime() + '.jpg';
        fotoUrl = uploadFoto(payload.fotoBase64, filename);
    }
    
    const timestamp = new Date();
    const jamMasuk = Utilities.formatDate(timestamp, "Asia/Jakarta", "HH:mm:ss");
    
    sheet.appendRow([
        timestamp, // Timestamp
        payload.idKaryawan, // ID_Karyawan
        payload.nama, // Nama
        payload.idToko || 'T001', // ID_Toko
        payload.namaToko || 'Toko Pusat', // Nama_Toko
        payload.idShift || 'S01', // ID_Shift
        payload.namaShift || 'Pagi', // Nama_Shift
        'Masuk', // Tipe
        jamMasuk, // Jam_Masuk
        '', // Jam_Pulang
        '', // Jam_Kerja
        'Ontime', // Status_Masuk
        0, // Menit_Telat
        fotoUrl, // Foto_URL
        payload.lat || 0, // Lat_Hp
        payload.lng || 0, // Long_Hp
        0, // Jarak_M
        'Valid', // Status_GPS
        true, // Face_Detected
        '' // Foto_Pulang_URL
    ]);
    
    return { success: true, message: 'Absen masuk berhasil direkam', jamMasuk: jamMasuk };
}

function handleAbsenPulang(payload) {
    // payload: { idKaryawan, fotoBase64, lat, lng }
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('ABSENSI');
    if (!sheet) return { success: false, message: 'Sheet ABSENSI tidak ditemukan. Absen masuk terlebih dahulu.' };
    
    const data = sheet.getDataRange().getValues();
    let rowToUpdate = -1;
    
    const today = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
    // Cari baris terakhir absen masuk karyawan ini hari ini
    for (let i = data.length - 1; i > 0; i--) { 
        const row = data[i];
        if(!row[0]) continue; // Skip empty row
        const rowDate = Utilities.formatDate(new Date(row[0]), "Asia/Jakarta", "yyyy-MM-dd");
        // Kolom 1: ID_Karyawan, Kolom 7: Tipe (Masuk), Kolom 9: Jam_Pulang (harus kosong)
        if (row[1] === payload.idKaryawan && rowDate === today && row[7] === 'Masuk' && row[9] === '') {
            rowToUpdate = i + 1; // 1-indexed
            break;
        }
    }
    
    if (rowToUpdate === -1) {
        return { success: false, message: 'Data absen masuk hari ini tidak ditemukan atau Anda sudah absen pulang.' };
    }
    
    let fotoUrl = '';
    if (payload.fotoBase64) {
        const filename = 'Pulang_' + payload.idKaryawan + '_' + new Date().getTime() + '.jpg';
        fotoUrl = uploadFoto(payload.fotoBase64, filename);
    }
    
    const timestamp = new Date();
    const jamPulang = Utilities.formatDate(timestamp, "Asia/Jakarta", "HH:mm:ss");
    
    // Update data di sheet
    sheet.getRange(rowToUpdate, 10).setValue(jamPulang); // Jam_Pulang
    sheet.getRange(rowToUpdate, 20).setValue(fotoUrl); // Foto_Pulang_URL
    
    return { success: true, message: 'Absen pulang berhasil direkam', jamPulang: jamPulang };
}

function handleGetDashboard() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('ABSENSI');
    
    // Default total karyawan (Mockup 3 user seperti pada fungsi login)
    const totalKaryawan = 3; 
    
    if (!sheet) {
        return { 
            success: true, 
            stats: { hadir: 0, telat: 0, alpa: totalKaryawan, total: totalKaryawan },
            absensiHariIni: [] 
        };
    }
    
    const data = sheet.getDataRange().getValues();
    const today = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
    
    let absensiHariIni = [];
    let hadir = 0;
    let telat = 0;
    
    // Header format di sheet ABSENSI (Index):
    // 0:Timestamp, 1:ID_Karyawan, 2:Nama, 3:ID_Toko, 4:Nama_Toko, 5:ID_Shift, 6:Nama_Shift, 
    // 7:Tipe, 8:Jam_Masuk, 9:Jam_Pulang, 10:Jam_Kerja, 11:Status_Masuk
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if(!row[0]) continue;
        
        const rowDate = Utilities.formatDate(new Date(row[0]), "Asia/Jakarta", "yyyy-MM-dd");
        
        // Cek absen masuk hari ini
        if (rowDate === today && row[7] === 'Masuk') {
            hadir++;
            if (row[11] === 'Telat') telat++;
            
            absensiHariIni.push({
                nama: row[2],
                toko: row[4],
                shift: row[6],
                jamMasuk: row[8],
                jamPulang: row[9],
                status: row[11]
            });
        }
    }
    
    // Balik urutan agar yang terbaru ada di atas
    absensiHariIni.reverse();
    
    return {
        success: true,
        stats: {
            hadir: hadir,
            telat: telat,
            alpa: totalKaryawan - hadir,
            total: totalKaryawan
        },
        absensiHariIni: absensiHariIni
    };
}
