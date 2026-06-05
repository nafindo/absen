// ============================================================
// CODE.GS - Google Apps Script Backend v2.1
// Aplikasi Absensi Karyawan Multi-Toko
// SPREADSHEET ID: 1CC10iigHkBpSpGxL_vtc_lwBAC7vIsqNLoy3pXO2MVc
// ============================================================

const SPREADSHEET_ID = '1CC10iigHkBpSpGxL_vtc_lwBAC7vIsqNLoy3pXO2MVc';

const SHEET_NAMES = {
  MASTER_KARYAWAN: 'MASTER_KARYAWAN',
  MASTER_TOKO: 'MASTER_TOKO',
  SHIFT_TOKO: 'SHIFT_TOKO',
  JADWAL_KARYAWAN: 'JADWAL_KARYAWAN',
  ABSENSI: 'ABSENSI',
  LEMBUR: 'LEMBUR',
  IZIN_CUTI: 'IZIN_CUTI',
  MASTER_JENIS_IZIN: 'MASTER_JENIS_IZIN',
  SETTING_GLOBAL: 'SETTING_GLOBAL',
  LOG_ERROR: 'LOG_ERROR',
  CHAT: 'CHAT',
  TUKAR_SHIFT: 'TUKAR_SHIFT',
  TUGAS: 'TUGAS',
  BERITA: 'BERITA',
  GAJI: 'DATA_GAJI',
  TEMPLATE_JADWAL: 'TEMPLATE_JADWAL'
};

// ==================== WEB APP ROUTING ====================
function doGet(e) {
  try {
    const page = e.parameter.page || 'karyawan';

    if (page === 'admin') {
      return HtmlService.createHtmlOutputFromFile('Admin')
        .setTitle('Dashboard Admin — Absensi Pro')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Absensi Karyawan Pro')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    logError('doGet', error, { page: e.parameter.page });
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
// TAMBAHKAN FUNGSI INI DI Code.gs
function handleApiRequest(payload) {
  try {
    // Memanggil fungsi doPost secara internal dengan format yang dibutuhkan
    const fakeEvent = {
      postData: {
        contents: JSON.stringify(payload)
      }
    };

    // Menangkap hasil dari doPost
    const result = doPost(fakeEvent);

    // Mengubah hasil TextOutput kembali menjadi Object JSON agar bisa dibaca UI
    return JSON.parse(result.getContent());
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch (action) {
      // === APP SYSTEM ===
      case 'checkUpdate': return jsonResponse(checkUpdate());

      // === AUTH ===
      case 'login': return jsonResponse(login(data));
      case 'getUserInfo': return jsonResponse(getUserInfo(data));
      case 'syncAllData': return jsonResponse(syncAllData(data));
      case 'registerFCMToken': return jsonResponse(registerFCMToken(data));
      case 'registerFaceId': return jsonResponse(registerFaceId(data));

      // === SETTING ===
      case 'getSettingGlobal': return jsonResponse(getSettingGlobal());
      case 'updateSettingGlobal': return jsonResponse(updateSettingGlobal(data));

      // === ABSENSI ===
      case 'absenMasuk': return jsonResponse(absenMasuk(data));
      case 'absenPulang': return jsonResponse(absenPulang(data));
      case 'getAbsenStatus': return jsonResponse(getAbsenStatus(data));

      // === LEMBUR ===
      case 'ajukanLembur': return jsonResponse(ajukanLembur(data));
      case 'getLemburHistory': return jsonResponse(getLemburHistory(data));

      // === IZIN ===
      case 'ajukanIzin': return jsonResponse(ajukanIzin(data));
      case 'getIzinHistory': return jsonResponse(getIzinHistory(data));
      case 'getSisaKuota': return jsonResponse(getSisaKuota(data));
      case 'getJenisIzinAktif': return jsonResponse(getJenisIzinAktif(data));

      // === JADWAL ===
      case 'getJadwalHariIni': return jsonResponse(getJadwalHariIni(data));
      case 'getJadwalMingguan': return jsonResponse(getJadwalMingguan(data));
      case 'getKaryawanJadwalByDate': return jsonResponse(getKaryawanJadwalByDate(data));

      // === RAPORT ===
      case 'getRaportBulanan': return jsonResponse(getRaportBulanan(data));
      case 'getRaportHarian': return jsonResponse(getRaportHarian(data));
      case 'getRaportMingguan': return jsonResponse(getRaportMingguan(data));

      // === LAPORAN ADMIN ===
      case 'getLaporanAbsensi': return jsonResponse(getLaporanAbsensi(data));
      case 'getIzinPeriode': return jsonResponse(getIzinPeriode(data));

      // === DASHBOARD ADMIN ===
      case 'getDashboardData': return jsonResponse(getDashboardData(data));
      case 'getMonitoringToko': return jsonResponse(getMonitoringToko(data));
      case 'getAbsensiHariIniLengkap': return jsonResponse(getAbsensiHariIniLengkap(data));

      // === APPROVAL ===
      case 'approveLembur': return jsonResponse(approveLembur(data));
      case 'approveIzin': return jsonResponse(approveIzin(data));
      case 'getMyApprovals': return jsonResponse(getMyApprovals(data));

      // === CRUD TOKO ===
      case 'uploadFotoToko': return jsonResponse(uploadFotoToko(data));
      case 'getTokoList': return jsonResponse(getTokoList());
      case 'saveToko': return jsonResponse(saveToko(data));
      case 'updateToko': return jsonResponse(updateToko(data));
      case 'deleteToko': return jsonResponse(deleteToko(data));
      case 'deleteTokoPermanent': return jsonResponse(deleteTokoPermanent(data));

      // === SHIFT TOKO ===
      case 'saveShift': return jsonResponse(saveShift(data));
      case 'updateShift': return jsonResponse(updateShift(data));
      case 'getShiftByToko': return jsonResponse(getShiftByToko(data));
      case 'deleteShiftPermanent': return jsonResponse(deleteShiftPermanent(data));
      case 'getAllShifts': return jsonResponse(getAllShifts());

      // === MANAJEMEN JADWAL ===
      case 'getTemplateJadwal': return jsonResponse(getTemplateJadwal());
      case 'saveTemplateJadwal': return jsonResponse(saveTemplateJadwal(data));
      case 'generateJadwalMingguan': return jsonResponse(generateJadwalMingguan(data));
      case 'getAllJadwalMingguan': return jsonResponse(getAllJadwalMingguan(data));
      case 'saveJadwalMingguan': return jsonResponse(saveJadwalMingguan(data));

      // === CRUD KARYAWAN ===
      case 'getKaryawanList': return jsonResponse(getKaryawanList());
      case 'saveKaryawan': return jsonResponse(saveKaryawan(data));
      case 'updateKaryawan': return jsonResponse(updateKaryawan(data));
      case 'deleteKaryawan': return jsonResponse(deleteKaryawan(data));
      case 'getJadwalKaryawan': return jsonResponse(getJadwalKaryawan(data));
      case 'saveJadwalKaryawan': return jsonResponse(saveJadwalKaryawan(data));
      case 'getAllShifts': return jsonResponse(getAllShifts());
      case 'uploadFotoProfil': return jsonResponse(uploadFotoProfil(data));
      case 'uploadFotoKtp': return jsonResponse(uploadFotoKtp(data));
      case 'getProfilStatus': return jsonResponse(getProfilStatus(data));
      case 'submitKaryawanProfil': return jsonResponse(submitKaryawanProfil(data));

      // === CRUD JENIS IZIN ===
      case 'getJenisIzinList': return jsonResponse(getJenisIzinList());
      case 'saveJenisIzin': return jsonResponse(saveJenisIzin(data));
      case 'updateJenisIzin': return jsonResponse(updateJenisIzin(data));
      case 'deleteJenisIzin': return jsonResponse(deleteJenisIzin(data));
      case 'getPendingApprovals': return jsonResponse(getPendingApprovals(data));

      // === TUKAR SHIFT ===
      case 'ajukanTukarShift': return jsonResponse(ajukanTukarShift(data));
      case 'getTukarShiftHistory': return jsonResponse(getTukarShiftHistory(data));
      case 'getPendingTukarShift': return jsonResponse(getPendingTukarShift(data));
      case 'approveTukarShift': return jsonResponse(approveTukarShift(data));
      case 'rejectTukarShift': return jsonResponse(rejectTukarShift(data));

      // === CHAT ===
      case 'getChatMessages':
      case 'getchatmessages': return jsonResponse(getChatMessages(data));
      case 'sendChatMessage':
      case 'sendchatmessage': return jsonResponse(sendChatMessage(data));
      case 'sendManualPushNotification': return jsonResponse(sendManualPushNotification(data));

      // === TUGAS & BERITA ===
      case 'getTugasList': return jsonResponse(getTugasList(data));
      case 'updateTugasStatus': return jsonResponse(updateTugasStatus(data));
      case 'getBeritaList': return jsonResponse(getBeritaList(data));
      case 'createBerita': return jsonResponse(createBerita(data));

      // === DELTA SYNC ===
      case 'getDeltas': return jsonResponse(getDeltas(data));

      // === GAJI ===
      case 'getSlipGaji': return jsonResponse(getSlipGaji(data));
      case 'getSalaries': return jsonResponse(getSalaries());
      case 'updateSalary': return jsonResponse(updateSalary(data));
      case 'pingOnline': return jsonResponse(pingOnline(data));

      // === OCR KTP (Server-Side via Google Drive) ===
      case 'ocrKtp': return jsonResponse(ocrKtp(data));

      default:
        return jsonResponse({ success: false, error: 'Action tidak dikenal: ' + action });
    }

  } catch (error) {
    logError('doPost', error, { data: e.postData.contents });
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== HELPER FUNCTIONS ====================
function getSheet(sheetName) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      // Auto-create sheet if not exists
      const newSheet = ss.insertSheet(sheetName);
      // Add default headers based on sheet name
      const headers = getDefaultHeaders(sheetName);
      if (headers) {
        newSheet.appendRow(headers);
        newSheet.getRange(1, 1, 1, headers.length)
          .setFontWeight('bold')
          .setBackground('#4285F4')
          .setFontColor('white');
      }
      return newSheet;
    }
    return sheet;
  } catch (e) {
    logError('getSheet', e, { sheetName });
    throw new Error('Gagal mengakses sheet: ' + sheetName);
  }
}
// ==================== FORMAT TIME ONLY (FIX 1899 BUG) ====================
function formatTimeOnly(value) {
  if (!value) return '';

  // Jika sudah string format HH:mm, kembalikan saja
  if (typeof value === 'string' && value.match(/^\d{1,2}:\d{2}$/)) {
    return value;
  }

  // Jika Date object (epoch 1899), ambil jam & menitnya saja
  if (value instanceof Date) {
    const jam = String(value.getHours()).padStart(2, '0');
    const menit = String(value.getMinutes()).padStart(2, '0');
    return jam + ':' + menit;
  }

  // Jika string ISO (1899-12-30T...), parse dan ambil jam:menit
  if (typeof value === 'string' && value.includes('T')) {
    const date = new Date(value);
    const jam = String(date.getHours()).padStart(2, '0');
    const menit = String(date.getMinutes()).padStart(2, '0');
    return jam + ':' + menit;
  }

  return String(value);
}
// ==================== GET DIRECT IMAGE URL ====================
function getDirectImageUrl(fileIdOrUrl) {
  if (!fileIdOrUrl) return '';

  // Jika sudah URL uc.id, kembalikan saja
  if (fileIdOrUrl.includes('uc?id=')) {
    // Tambah parameter untuk force download/view
    return fileIdOrUrl + '&export=view';
  }

  // Jika hanya file ID
  if (fileIdOrUrl.length < 30 && !fileIdOrUrl.includes('http')) {
    return 'https://drive.google.com/uc?id=' + fileIdOrUrl + '&export=view';
  }

  return fileIdOrUrl;
}
// ==================== UPLOAD FOTO TOKO ====================
function uploadFotoToko(data) {
  try {
    const { fotoBase64, namaToko } = data;

    if (!fotoBase64 || !fotoBase64.startsWith('data:image')) {
      return { success: false, error: 'Foto tidak valid' };
    }

    const settings = getSheetData(SHEET_NAMES.SETTING_GLOBAL);
    const folderId = settings.find(s => s.Parameter === 'FOLDER_DRIVE_ID')?.Value || '1tJgsRcaRejhI6SAvDfrikvOTOEHz2CEw';

    if (!folderId) throw new Error('Folder Drive ID belum diatur');

    const folder = DriveApp.getFolderById(folderId);
    const subFolders = folder.getFoldersByName('Foto_Toko');
    const subFolder = subFolders.hasNext() ? subFolders.next() : folder.createFolder('Foto_Toko');

    const bulanFolderName = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM');
    const bulanFolders = subFolder.getFoldersByName(bulanFolderName);
    const bulanFolder = bulanFolders.hasNext() ? bulanFolders.next() : subFolder.createFolder(bulanFolderName);

    const safeNama = (namaToko || 'toko').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const fileName = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss') + '_' + safeNama + '.jpg';

    const base64Data = fotoBase64.split(',')[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/jpeg', fileName);
    const file = bulanFolder.createFile(blob);

    // PENTING: Share publik agar bisa diakses
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Return thumbnail URL (lebih reliable)
    const fileId = file.getId();
    const thumbUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400';
    const directUrl = 'https://drive.google.com/uc?id=' + fileId + '&export=view';

    return {
      success: true,
      fotoUrl: thumbUrl,      // Untuk preview
      fileId: fileId,
      viewUrl: directUrl      // Backup
    };

  } catch (e) {
    logError('uploadFotoToko', e, data);
    return { success: false, error: 'Gagal upload: ' + e.toString() };
  }
}
function getDefaultHeaders(sheetName) {
  const headers = {
    'MASTER_KARYAWAN': ['ID_Karyawan', 'Nama', 'PIN', 'Jabatan', 'Tanggal_Masuk', 'Status', 'No_HP', 'Email', 'Toko_Default', 'Shift_Default', 'Foto_Profil', 'FCM_Token', 'Device_ID', 'Device_Name', 'Alamat_Lengkap', 'Kontak_Darurat', 'Nama_Kontak_Darurat', 'Foto_KTP', 'NIK', 'Tempat_Lahir', 'Tanggal_Lahir', 'Jenis_Kelamin', 'RT_RW', 'Desa', 'Kecamatan', 'Agama', 'Status_Kawin', 'Kewarganegaraan', 'Profil_Lengkap'],
    'MASTER_TOKO': ['ID_Toko', 'Nama_Toko', 'Alamat', 'Lat', 'Long', 'Radius_M', 'Jam_Buka', 'Jam_Tutup', 'Foto_Toko_URL', 'Status'],
    'SHIFT_TOKO': ['ID_Shift', 'ID_Toko', 'Nama_Toko', 'Nama_Shift', 'Jam_Masuk', 'Jam_Pulang', 'Toleransi_Masuk_Menit', 'Status'],
    'JADWAL_KARYAWAN': ['ID_Jadwal', 'ID_Karyawan', 'Nama', 'ID_Toko', 'Nama_Toko', 'ID_Shift', 'Nama_Shift', 'Hari_Berjalan', 'Tanggal_Mulai', 'Tanggal_Selesai', 'Status'],
    'ABSENSI': ['Timestamp', 'ID_Karyawan', 'Nama', 'ID_Toko', 'Nama_Toko', 'ID_Shift', 'Nama_Shift', 'Tipe', 'Jam_Masuk', 'Jam_Pulang', 'Jam_Kerja', 'Status_Masuk', 'Menit_Telat', 'Foto_URL', 'Lat_Hp', 'Long_Hp', 'Jarak_M', 'Status_GPS', 'Face_Detected', 'Foto_Pulang_URL'],
    'LEMBUR': ['ID', 'ID_Karyawan', 'Nama', 'ID_Toko', 'Nama_Toko', 'Tanggal', 'Jam_Mulai', 'Jam_Selesai', 'Durasi_Jam', 'Alasan', 'Foto_URL', 'Status', 'Approved_By', 'Approved_At'],
    'IZIN_CUTI': ['ID', 'ID_Karyawan', 'Nama', 'ID_Jenis_Izin', 'Nama_Jenis', 'Tanggal_Mulai', 'Tanggal_Selesai', 'Jumlah_Hari', 'Alasan', 'Lampiran_URL', 'Status', 'Approved_By', 'Approved_At'],
    'MASTER_JENIS_IZIN': ['ID_Jenis', 'Nama_Jenis', 'Kode', 'Kuota_Per_Tahun', 'Kuota_Per_Bulan', 'Maks_Hari_Sekali_Ajuan', 'Gender_Khusus', 'Potong_Cuti_Bulanan', 'Syarat_Hari_Kerja_Minimal', 'Status'],
    'SETTING_GLOBAL': ['Parameter', 'Value', 'Keterangan'],
    'LOG_ERROR': ['Timestamp', 'Error', 'Stack', 'User', 'Action', 'Payload'],
    'CHAT': ['Timestamp', 'ID_Pesan', 'ID_Karyawan', 'Nama', 'Pesan', 'Tipe', 'File_URL', 'Nama_File', 'Size_KB', 'Reply_To'],
    'TUKAR_SHIFT': ['Timestamp', 'ID_Tukar', 'ID_Karyawan', 'Nama', 'ID_Toko_Saya', 'ID_Toko_Tujuan', 'ID_Karyawan_Tujuan', 'Shift_Saya', 'Shift_Tujuan', 'Tanggal', 'Alasan', 'Status', 'Approved_By', 'Approved_At'],
    'TUGAS': ['Timestamp', 'ID_Tugas', 'ID_Toko', 'Judul', 'Deskripsi', 'Deadline', 'Prioritas', 'Status', 'Dibuat_Oleh', 'Ditugaskan_Ke', 'Selesai_At'],
    'BERITA': ['Timestamp', 'ID_Berita', 'Judul', 'Isi', 'Kategori', 'Gambar_URL', 'Dibuat_Oleh', 'Tgl_Publish', 'Status'],
    'TEMPLATE_JADWAL': ['ID_Toko', 'Nama_Toko', 'Kebutuhan_Pagi', 'Kebutuhan_Siang']
  };
  return headers[sheetName];
}

function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const defaultHeaders = getDefaultHeaders(sheetName) || headers;
  return data.slice(1).map(row => {
    const obj = {};
    const maxLen = Math.max(headers.length, defaultHeaders.length, row.length);
    for(let i=0; i<maxLen; i++) {
      let h = headers[i] || defaultHeaders[i] || ('Col' + i);
      let val = row[i];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, "Asia/Jakarta", "yyyy-MM-dd");
      }
      obj[h] = val;
    }
    return obj;
  });
}

function appendRow(sheetName, rowData) {
  const sheet = getSheet(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan');
  
  // Selalu insert di baris kedua (bawah header) agar data terbaru ada di atas
  sheet.insertRowAfter(1);
  const range = sheet.getRange(2, 1, 1, rowData.length);
  range.setValues([rowData]);
  
  // Paksa simpan saat ini juga
  SpreadsheetApp.flush();
  
  return 2;
}

function logError(action, error, payload) {
  try {
    const sheet = getSheet(SHEET_NAMES.LOG_ERROR);
    if (sheet) {
      sheet.appendRow([
        new Date(),
        error.toString(),
        error.stack || '',
        Session.getActiveUser().getEmail() || 'anonymous',
        action,
        JSON.stringify(payload).substring(0, 500)
      ]);
    }
  } catch (e) {
    console.error('Gagal log error:', e);
  }
}

function generateId(prefix) {
  return prefix + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMddHHmmss') + Math.floor(Math.random() * 1000);
}

function formatDate(date) {
  return Utilities.formatDate(date, 'Asia/Jakarta', 'yyyy-MM-dd');
}

function parseDateSafe(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }

  const str = String(dateVal).trim();
  if (!str || str === '-' || str === '—') return null;

  let d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  const parts = str.split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    } else {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function formatDateTime(date) {
  return Utilities.formatDate(date, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
}

function formatTime(date) {
  return Utilities.formatDate(date, 'Asia/Jakarta', 'HH:mm');
}

function parseKoordinat(val) {
  if (!val) return NaN;
  let str = String(val).trim();
  str = str.replace(/['"]/g, '');
  str = str.replace(/,/g, '.');
  const parts = str.split('.');
  if (parts.length > 2) {
    str = parts[0] + '.' + parts.slice(1).join('');
  }
  return parseFloat(str);
}

function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getHariIni() {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return hari[new Date().getDay()];
}

// ==================== APP SYSTEM ====================
function checkUpdate() {
  try {
    const settings = getSheetData(SHEET_NAMES.SETTING_GLOBAL);
    let apkVersion = "2.3";
    let apkUrl = "";
    
    for (let i = 0; i < settings.length; i++) {
      if (settings[i].Parameter === 'APK_VERSION') apkVersion = String(settings[i].Value);
      if (settings[i].Parameter === 'APK_UPDATE_URL') apkUrl = String(settings[i].Value);
    }
    
    return {
      success: true,
      latestVersion: apkVersion,
      updateUrl: apkUrl
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ==================== AUTH ====================

function registerFaceId(data) {
  const { idKaryawan, faceId } = data;
  if (!idKaryawan || !faceId) return { success: false, error: 'Data tidak lengkap' };
  
  const sheet = getSheet(SHEET_NAMES.MASTER_KARYAWAN);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  
  const colId = headers.indexOf('ID_Karyawan');
  const colFaceId = headers.indexOf('Face_ID');
  
  if (colFaceId === -1) return { success: false, error: 'Kolom Face_ID belum dibuat di sheet MASTER_KARYAWAN' };
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][colId] === idKaryawan) {
      sheet.getRange(i + 1, colFaceId + 1).setValue(faceId);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Karyawan tidak ditemukan' };
}

function login(data) {
  const { idKaryawan, pin, deviceId, deviceName, force } = data;
  
  const sheet = getSheet(SHEET_NAMES.MASTER_KARYAWAN);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  
  const colId = headers.indexOf('ID_Karyawan');
  const colPin = headers.indexOf('PIN');
  const colStatus = headers.indexOf('Status');
  const colDeviceId = headers.indexOf('Device_ID');
  const colDeviceName = headers.indexOf('Device_Name');

  let rowIndex = -1;
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][colId] === idKaryawan && String(allData[i][colPin]) === String(pin) && allData[i][colStatus] === 'Aktif') {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    return { success: false, error: 'Nama atau PIN salah' };
  }

  // Fitur 1 Device 1 Akun
  if (deviceId && colDeviceId !== -1 && colDeviceName !== -1) {
    const savedDeviceId = String(allData[rowIndex][colDeviceId] || '').trim();
    const savedDeviceName = String(allData[rowIndex][colDeviceName] || '').trim();
    
    // Jika sudah ada device terdaftar dan beda dengan device yg mau login
    if (savedDeviceId !== '' && savedDeviceId !== deviceId && !force) {
      return { 
        success: false, 
        requireDeviceConfirmation: true, 
        message: 'Akun Anda sudah login di perangkat: ' + (savedDeviceName || 'Unknown') + '. Apakah Anda ingin memindahkan akses ke perangkat ini?'
      };
    }
    
    // Update / Simpan device info baru
    if (savedDeviceId !== deviceId || savedDeviceName !== deviceName) {
      sheet.getRange(rowIndex + 1, colDeviceId + 1).setValue(deviceId);
      sheet.getRange(rowIndex + 1, colDeviceName + 1).setValue(deviceName || 'Unknown Device');
    }
  }

  const karyawanList = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
  const user = karyawanList.find(k => k.ID_Karyawan === idKaryawan);

  const settings = getSheetData(SHEET_NAMES.SETTING_GLOBAL);
  const kunciJadwal = settings.find(s => s.Parameter === 'KUNCI_JADWAL_KARYAWAN');
  const mode = kunciJadwal ? kunciJadwal.Value : 'LOCKED';

  return {
    success: true,
    user: {
      id: user.ID_Karyawan,
      nama: user.Nama,
      pin: user.PIN,
      jabatan: user.Jabatan,
      tokoDefault: user.Toko_Default || '',
      shiftDefault: user.Shift_Default || '',
      noHP: user.No_HP || '',
      email: user.Email || '',
      fotoProfil: user.Foto_Profil || '',
      faceId: user.Face_ID || ''
    },
    modeJadwal: mode
  };
}

function getUserInfo(data) {
  const { idKaryawan } = data;
  const karyawan = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
  const user = karyawan.find(k => k.ID_Karyawan === idKaryawan);

  if (!user) return { success: false, error: 'Karyawan tidak ditemukan' };

  return {
    success: true,
    user: {
      id: user.ID_Karyawan,
      nama: user.Nama,
      jabatan: user.Jabatan,
      tokoDefault: user.Toko_Default || '',
      shiftDefault: user.Shift_Default || '',
      fotoProfil: user.Foto_Profil || '',
      faceId: user.Face_ID || ''
    }
  };
}

function syncAllData(data) {
  const { idKaryawan, bulan, tahun, tanggalReferensi } = data;
  
  // 1. Fetch User Info
  const userInfoRes = getUserInfo({ idKaryawan });
  
  // 2. Fetch Jadwal Hari Ini
  const jadwalRes = getJadwalHariIni({ idKaryawan });
  const idToko = (jadwalRes.jadwal && jadwalRes.jadwal.idToko) ? jadwalRes.jadwal.idToko : null;
  
  // 3. Fetch Raport Bulanan
  const bln = bulan || new Date().getMonth() + 1;
  const thn = tahun || new Date().getFullYear();
  const raportRes = getRaportBulanan({ idKaryawan, bulan: bln, tahun: thn });
  
  // 4. Fetch Tugas List (menggunakan idToko dari jadwal hari ini jika ada)
  const tugasRes = getTugasList({ idKaryawan, idToko });
  
  // 5. Fetch Berita List
  const beritaRes = getBeritaList({ limit: 20 });
  
  // 6. Fetch Izin History
  const izinRes = getIzinHistory({ idKaryawan });
  
  // 7. Fetch Lembur History
  const lemburRes = getLemburHistory({ idKaryawan });
  
  // 8. Fetch Slip Gaji
  const gajiRes = getSlipGaji({ idKaryawan });
  
  // 9. Fetch Jadwal Mingguan
  const tglRef = tanggalReferensi || new Date().toISOString();
  const jadwalMingguanRes = getJadwalMingguan({ idKaryawan, tanggalReferensi: tglRef });
  
  // 10. Fetch Pending Tukar Shift
  const tukarShiftRes = getPendingTukarShift({ idKaryawan });
  
  return {
    success: true,
    userInfo: userInfoRes,
    jadwalHariIni: jadwalRes,
    raportBulanan: raportRes,
    tugasList: tugasRes,
    beritaList: beritaRes,
    izinHistory: izinRes,
    lemburHistory: lemburRes,
    slipGaji: gajiRes,
    jadwalMingguan: jadwalMingguanRes,
    pendingTukarShift: tukarShiftRes
  };
}

// ==================== SETTING GLOBAL ====================
function getSettingGlobal() {
  const settings = getSheetData(SHEET_NAMES.SETTING_GLOBAL);
  const result = {};
  settings.forEach(s => {
    result[s.Parameter] = s.Value;
  });
  return { success: true, settings: result };
}

function updateSettingGlobal(data) {
  const { parameter, value } = data;
  const sheet = getSheet(SHEET_NAMES.SETTING_GLOBAL);
  const dataRange = sheet.getDataRange().getValues();

  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === parameter) {
      sheet.getRange(i + 1, 2).setValue(value);
      return { success: true, message: 'Setting berhasil diupdate' };
    }
  }

  sheet.appendRow([parameter, value, '']);
  return { success: true, message: 'Setting berhasil ditambahkan' };
}

// ==================== ABSENSI ====================
function absenMasuk(data) {
  const { idKaryawan, nama, idToko, namaToko, idShift, namaShift, fotoBase64, lat, lng } = data;

  if (!fotoBase64) return { success: false, error: 'Foto wajib diambil' };
  if (!idToko) return { success: false, error: 'Toko harus dipilih' };
  if (!idShift) return { success: false, error: 'Shift harus dipilih' };

  // Cek sudah absen masuk hari ini
  const today = formatDate(new Date());
  const absensi = getSheetData(SHEET_NAMES.ABSENSI);
  const sudahMasuk = absensi.find(a =>
    a.ID_Karyawan === idKaryawan &&
    formatDate(new Date(a.Timestamp)) === today &&
    a.Tipe === 'Masuk'
  );

  if (sudahMasuk) {
    return { success: false, error: 'Anda sudah absen masuk hari ini' };
  }

  // Validasi GPS
  const toko = getSheetData(SHEET_NAMES.MASTER_TOKO).find(t => t.ID_Toko === idToko);
  let jarak = 0, statusGPS = 'Invalid';
  if (toko && lat && lng) {
    const parsedLat = parseKoordinat(lat);
    const parsedLng = parseKoordinat(lng);
    const tLat = parseKoordinat(toko.Lat);
    const tLng = parseKoordinat(toko.Long);
    
    if (!isNaN(parsedLat) && !isNaN(parsedLng) && !isNaN(tLat) && !isNaN(tLng)) {
      jarak = hitungJarak(parsedLat, parsedLng, tLat, tLng);
      if (jarak > parseFloat(toko.Radius_M || 50)) {
        return { success: false, error: 'Anda berada ' + Math.round(jarak) + 'm dari toko. Maksimal ' + (toko.Radius_M || 50) + 'm.' };
      }
      statusGPS = 'Valid';
    } else {
      return { success: false, error: 'Format koordinat GPS tidak valid.' };
    }
  }

  // Cek toleransi keterlambatan
  const shift = getSheetData(SHEET_NAMES.SHIFT_TOKO).find(s => s.ID_Shift === idShift);
  const settings = getSheetData(SHEET_NAMES.SETTING_GLOBAL);
  const toleransiGlobal = parseInt(settings.find(s => s.Parameter === 'TOLERANSI_KETERLAMBATAN_MENIT')?.Value || 15);
  const tokoData = getSheetData(SHEET_NAMES.MASTER_TOKO).find(t => t.ID_Toko === idToko);
  
  let toleransiMenit = toleransiGlobal;
  if (tokoData && (tokoData.Toleransi_Telat !== undefined || tokoData.Toleransi_Masuk_Menit !== undefined)) {
    toleransiMenit = parseInt(tokoData.Toleransi_Telat || tokoData.Toleransi_Masuk_Menit || toleransiGlobal);
  } else if (shift && shift.Toleransi_Masuk_Menit !== undefined && shift.Toleransi_Masuk_Menit !== '') {
    toleransiMenit = parseInt(shift.Toleransi_Masuk_Menit);
  }

  const now = new Date();
  const jamMasukShiftStr = shift ? formatTimeOnly(shift.Jam_Masuk) : '08:00';
  const [jamShift, menitShift] = jamMasukShiftStr.split(':').map(Number);
  const batasOntime = new Date(now);
  batasOntime.setHours(jamShift, menitShift + toleransiMenit, 0, 0);

  const statusMasuk = now <= batasOntime ? 'Ontime' : 'Telat';
  const menitTelat = now > batasOntime ? Math.floor((now - batasOntime) / 60000) + toleransiMenit : 0;

  // Upload foto ke Drive
  let fotoUrl = '';
  try {
    fotoUrl = uploadFotoToDrive(fotoBase64, idKaryawan, 'Masuk');
  } catch (e) {
    console.error('Gagal upload foto:', e);
  }

  // Simpan ke sheet
  const idAbsensi = generateId('A');
  const safeLat = lat ? (String(lat).startsWith("'") ? lat : "'" + lat) : '';
  const safeLng = lng ? (String(lng).startsWith("'") ? lng : "'" + lng) : '';

  appendRow(SHEET_NAMES.ABSENSI, [
    formatDateTime(now),
    idKaryawan,
    nama,
    idToko,
    namaToko,
    idShift,
    namaShift,
    'Masuk',
    formatTime(now),
    '',
    '',
    statusMasuk,
    menitTelat,
    fotoUrl,
    safeLat,
    safeLng,
    toko ? Math.round(jarak) : '',
    statusGPS,
    'Ya',
    ''
  ]);

  // Auto-close open approved permissions/leaves
  try {
    autoCloseIzin(idKaryawan, formatDate(now));
  } catch (e) {
    console.error('Gagal menjalankan auto-close izin:', e);
  }

  // Broadcast real-time notification to admins
  try {
    triggerPusher('pinguin-chat', 'absen-alert', {
      idAbsensi: idAbsensi,
      idKaryawan: idKaryawan,
      nama: nama,
      tipe: 'Masuk',
      waktu: formatTime(now),
      status: statusMasuk,
      pesan: nama + ' telah absen MASUK (' + statusMasuk + ') di ' + namaToko + ', Shift ' + namaShift
    });
  } catch (e) {
    Logger.log("Pusher broadcast failed in absenMasuk: " + e.toString());
  }

  // Kirim FCM notifikasi absen masuk ke karyawan
  try {
    sendPushNotification(idKaryawan, 'Absen Masuk ' + statusMasuk, 'Anda telah absen masuk di ' + namaToko + ', Shift ' + namaShift, 'absensi_channel');
  } catch(e) {
    Logger.log('FCM absen masuk error: ' + e.toString());
  }

  // Kirim notifikasi ke semua admin
  try {
    sendPushNotificationToAllAdmin(
      '📍 Absen Masuk',
      nama + ' absen masuk di ' + namaToko,
      'absensi_channel',
      { type: 'absen_masuk', idKaryawan: idKaryawan, toko: namaToko }
    );
  } catch(e) {
    Logger.log('FCM broadcast absen masuk ke admin error: ' + e.toString());
  }

  return {
    success: true,
    idAbsensi: idAbsensi,
    statusMasuk: statusMasuk,
    menitTelat: menitTelat,
    jamMasuk: formatTime(now),
    fotoUrl: fotoUrl
  };
}

function absenPulang(data) {
  const { idKaryawan, nama, fotoBase64, lat, lng } = data;

  if (!fotoBase64) return { success: false, error: 'Foto wajib diambil' };

  // Cek sudah absen masuk
  const today = formatDate(new Date());
  const absensi = getSheetData(SHEET_NAMES.ABSENSI);
  const recordMasuk = absensi.find(a =>
    a.ID_Karyawan === idKaryawan &&
    formatDate(new Date(a.Timestamp)) === today &&
    a.Tipe === 'Masuk'
  );

  if (!recordMasuk) {
    return { success: false, error: 'Anda belum absen masuk hari ini' };
  }

  // Cek sudah absen pulang
  const sudahPulang = absensi.find(a =>
    a.ID_Karyawan === idKaryawan &&
    formatDate(new Date(a.Timestamp)) === today &&
    a.Tipe === 'Pulang'
  );

  if (sudahPulang) {
    return { success: false, error: 'Anda sudah absen pulang hari ini' };
  }

  // Upload foto
  let fotoUrl = '';
  try {
    fotoUrl = uploadFotoToDrive(fotoBase64, idKaryawan, 'Pulang');
  } catch (e) {
    console.error('Gagal upload foto:', e);
  }

  const now = new Date();
  let jamMasuk = new Date(recordMasuk.Timestamp);
  if (isNaN(jamMasuk.getTime())) {
    jamMasuk = new Date(today + ' ' + String(recordMasuk.Jam_Masuk));
  }
  let durasiMs = now - jamMasuk;
  if (isNaN(durasiMs) || durasiMs < 0) {
    durasiMs = 0;
  }
  const durasiJam = Math.floor(durasiMs / 3600000);
  const durasiMenit = Math.floor((durasiMs % 3600000) / 60000);
  const durasiKerja = durasiJam + 'j ' + String(durasiMenit).padStart(2, '0') + 'm';

  // Update record masuk dengan jam pulang
  const sheet = getSheet(SHEET_NAMES.ABSENSI);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const colTipe = headers.indexOf('Tipe');
  const colIdKar = headers.indexOf('ID_Karyawan');
  
  for (let i = 1; i < allData.length; i++) {
    // Cari baris "Masuk" milik karyawan ini hari ini
    const rowDate = allData[i][0] instanceof Date ? formatDate(allData[i][0]) : formatDate(new Date(allData[i][0]));
    const rowTipe = colTipe >= 0 ? String(allData[i][colTipe]) : String(allData[i][7]);
    const rowIdKar = colIdKar >= 0 ? String(allData[i][colIdKar]) : String(allData[i][1]);
    
    if (rowIdKar === idKaryawan && rowDate === today && rowTipe === 'Masuk') {
      sheet.getRange(i + 1, 10).setValue(formatTime(now)); // Jam_Pulang
      sheet.getRange(i + 1, 11).setValue(durasiKerja); // Jam_Kerja
      sheet.getRange(i + 1, 20).setValue(fotoUrl); // Foto_Pulang_URL
      break;
    }
  }

  // Tambah record pulang agar sesuai dengan rancangan sheet awal
  const safeLat = lat ? (String(lat).startsWith("'") ? lat : "'" + lat) : recordMasuk.Lat_Hp || '';
  const safeLng = lng ? (String(lng).startsWith("'") ? lng : "'" + lng) : recordMasuk.Long_Hp || '';

  appendRow(SHEET_NAMES.ABSENSI, [
    formatDateTime(now),
    idKaryawan,
    nama,
    recordMasuk.ID_Toko || '',
    recordMasuk.Nama_Toko || '',
    recordMasuk.ID_Shift || '',
    recordMasuk.Nama_Shift || '',
    'Pulang',
    recordMasuk.Jam_Masuk || '',
    formatTime(now),
    durasiKerja,
    recordMasuk.Status_Masuk || '',
    recordMasuk.Menit_Telat || '0',
    recordMasuk.Foto_URL || '',
    safeLat,
    safeLng,
    recordMasuk.Jarak_M || '',
    recordMasuk.Status_GPS || '',
    'Ya',
    fotoUrl
  ]);

  // Broadcast real-time notification to admins
  try {
    triggerPusher('pinguin-chat', 'absen-alert', {
      idKaryawan: idKaryawan,
      nama: nama,
      tipe: 'Pulang',
      waktu: formatTime(now),
      status: 'Ontime',
      namaToko: recordMasuk.Nama_Toko || '',
      namaShift: recordMasuk.Nama_Shift || '',
      pesan: nama + ' telah absen PULANG di ' + (recordMasuk.Nama_Toko || '') + ', Shift ' + (recordMasuk.Nama_Shift || '') + '. Durasi kerja: ' + durasiKerja
    });
  } catch (e) {
    Logger.log("Pusher broadcast failed in absenPulang: " + e.toString());
  }

  // Kirim FCM notifikasi absen pulang ke karyawan
  try {
    sendPushNotification(idKaryawan, 'Absen Pulang', 'Anda telah absen pulang. Durasi kerja: ' + durasiKerja, 'absensi_channel');
  } catch(e) {
    Logger.log('FCM absen pulang error: ' + e.toString());
  }

  // Kirim notifikasi ke semua admin
  try {
    sendPushNotificationToAllAdmin(
      '🏠 Absen Pulang',
      nama + ' absen pulang',
      'absensi_channel',
      { type: 'absen_pulang', idKaryawan: idKaryawan }
    );
  } catch(e) {
    Logger.log('FCM broadcast absen pulang ke admin error: ' + e.toString());
  }

  // SISTEM GANDA: Hitung ulang lembur yang sudah Approved saat karyawan pulang
  try {
    recalculateApprovedLembur(idKaryawan, today, formatTime(now));
  } catch (e) {
    Logger.log('Gagal recalculate lembur saat pulang: ' + e.toString());
  }

  return {
    success: true,
    jamPulang: formatTime(now),
    durasiKerja: durasiKerja
  };
}

/**
 * SISTEM GANDA - Dipanggil saat karyawan absen pulang.
 * Mengecek apakah ada lembur Approved hari itu, lalu hitung ulang G, H, I.
 */
function recalculateApprovedLembur(idKaryawan, tanggal, jamPulangReal) {
  const lemburSheet = getSheet(SHEET_NAMES.LEMBUR);
  const lemburData = lemburSheet.getDataRange().getValues();
  
  for (let i = 1; i < lemburData.length; i++) {
    const rowIdKar = String(lemburData[i][1]);
    const rowTanggal = lemburData[i][5] instanceof Date ? formatDate(lemburData[i][5]) : String(lemburData[i][5]);
    const rowStatus = String(lemburData[i][11]);
    
    if (rowIdKar === idKaryawan && rowTanggal === tanggal && rowStatus === 'Approved') {
      // Hitung ulang durasi dengan data absensi terbaru (sudah ada jam pulang)
      const calc = calculateLemburDuration(idKaryawan, tanggal);
      
      if (calc.success) {
        lemburSheet.getRange(i + 1, 7).setValue(calc.jamMasukReal);      // Jam_Mulai
        lemburSheet.getRange(i + 1, 8).setValue(calc.jamPulangReal || jamPulangReal); // Jam_Selesai
        lemburSheet.getRange(i + 1, 9).setValue(calc.durasiString);      // Durasi_Jam
        Logger.log('Lembur ID ' + lemburData[i][0] + ' berhasil dihitung ulang saat pulang: ' + calc.durasiString);
      }
      break; // Hanya 1 lembur per hari per karyawan
    }
  }
}

// ==================== DELTA SYNC ====================
function getDeltas(data) {
  const syncType = data.syncType || 'full';
  const deltas = {};
  const now = new Date();
  const today = formatDate(now);
  
  try {
    // === HOT DATA (setiap 15 detik) ===
    try {
      const absensi = getSheetData(SHEET_NAMES.ABSENSI);
      if (syncType === 'full') {
        const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        deltas.ABSENSI = absensi.filter(a => {
          try { return new Date(a.Timestamp) >= cutoff; } catch(e) { return false; }
        });
      } else {
        deltas.ABSENSI = absensi.filter(a => {
          try { return formatDate(new Date(a.Timestamp)) === today; } catch(e) { return false; }
        });
      }
    } catch(e) { deltas.ABSENSI = []; }
    
    try {
      const lembur = getSheetData(SHEET_NAMES.LEMBUR);
      const monthPrefix = today.substring(0, 7);
      deltas.LEMBUR = lembur.filter(l => {
        const tgl = l.Tanggal instanceof Date ? formatDate(l.Tanggal) : String(l.Tanggal || '');
        return tgl.startsWith(monthPrefix);
      });
    } catch(e) { deltas.LEMBUR = []; }
    
    // === WARM DATA (setiap 2 menit) ===
    if (syncType === 'warm' || syncType === 'full') {
      try { deltas.JADWAL_KARYAWAN = getSheetData(SHEET_NAMES.JADWAL_KARYAWAN); } catch(e) { deltas.JADWAL_KARYAWAN = []; }
      try { deltas.IZIN_CUTI = getSheetData(SHEET_NAMES.IZIN_CUTI); } catch(e) { deltas.IZIN_CUTI = []; }
      try { deltas.TUKAR_SHIFT = getSheetData(SHEET_NAMES.TUKAR_SHIFT); } catch(e) { deltas.TUKAR_SHIFT = []; }
      try { deltas.TUGAS = getSheetData(SHEET_NAMES.TUGAS); } catch(e) { deltas.TUGAS = []; }
      try { deltas.BERITA = getSheetData(SHEET_NAMES.BERITA); } catch(e) { deltas.BERITA = []; }
      
      try {
        const chat = getSheetData(SHEET_NAMES.CHAT);
        deltas.CHAT = chat.slice(-100);
      } catch(e) { deltas.CHAT = []; }
    }
    
    // === COLD DATA (setiap 5 menit / refresh manual) ===
    if (syncType === 'full') {
      try { deltas.MASTER_KARYAWAN = getSheetData(SHEET_NAMES.MASTER_KARYAWAN); } catch(e) { deltas.MASTER_KARYAWAN = []; }
      try { deltas.MASTER_TOKO = getSheetData(SHEET_NAMES.MASTER_TOKO); } catch(e) { deltas.MASTER_TOKO = []; }
      try { deltas.SHIFT_TOKO = getSheetData(SHEET_NAMES.SHIFT_TOKO); } catch(e) { deltas.SHIFT_TOKO = []; }
      try { deltas.MASTER_JENIS_IZIN = getSheetData(SHEET_NAMES.MASTER_JENIS_IZIN); } catch(e) { deltas.MASTER_JENIS_IZIN = []; }
      try { deltas.SETTING_GLOBAL = getSheetData(SHEET_NAMES.SETTING_GLOBAL); } catch(e) { deltas.SETTING_GLOBAL = []; }
    }
    
    return {
      success: true,
      deltas: deltas,
      serverTime: formatDateTime(now),
      syncType: syncType
    };
  } catch (e) {
    return { success: false, error: 'getDeltas error: ' + e.toString() };
  }
}

function getAbsenStatus(data) {
  const { idKaryawan } = data;
  const today = formatDate(new Date());
  const absensi = getSheetData(SHEET_NAMES.ABSENSI);

  const masuk = absensi.find(a =>
    a.ID_Karyawan === idKaryawan &&
    formatDate(new Date(a.Timestamp)) === today &&
    a.Tipe === 'Masuk'
  );

  const pulang = absensi.find(a =>
    a.ID_Karyawan === idKaryawan &&
    formatDate(new Date(a.Timestamp)) === today &&
    a.Tipe === 'Pulang'
  );

  let shiftDetail = null;
  if (masuk) {
    const shifts = getSheetData(SHEET_NAMES.SHIFT_TOKO);
    shiftDetail = shifts.find(s => s.ID_Shift === masuk.ID_Shift);
  }

  // Dapatkan lembur hari ini
  let lemburData = null;
  try {
    const lemburSheet = getSheetData(SHEET_NAMES.LEMBUR);
    lemburData = lemburSheet.find(l =>
      l.ID_Karyawan === idKaryawan &&
      formatDate(new Date(l.Tanggal)) === today
    ) || null;
  } catch (e) {
    Logger.log('getAbsenStatus lembur fetch error: ' + e.message);
  }

  if (pulang) return { status: 'sudah_pulang', data: pulang, shift: shiftDetail, lembur: lemburData };
  if (masuk) return { status: 'sudah_masuk', data: masuk, shift: shiftDetail, lembur: lemburData };
  return { status: 'belum_masuk', shift: shiftDetail, lembur: lemburData };
}

// ==================== LEMBUR ====================
function ajukanLembur(data) {
  const { idKaryawan, nama, idToko, namaToko, jamMulai, alasan, fotoBase64 } = data;

  // Cek sudah absen masuk
  const today = formatDate(new Date());
  const absensi = getSheetData(SHEET_NAMES.ABSENSI);
  const sudahMasuk = absensi.find(a =>
    a.ID_Karyawan === idKaryawan &&
    formatDate(new Date(a.Timestamp)) === today &&
    a.Tipe === 'Masuk'
  );

  if (!sudahMasuk) {
    return { success: false, error: 'Anda harus absen masuk terlebih dahulu' };
  }

  // Upload foto
  let fotoUrl = '';
  try {
    fotoUrl = uploadFotoToDrive(fotoBase64, idKaryawan, 'Lembur');
  } catch (e) {
    console.error('Gagal upload foto lembur:', e);
  }

  const idLembur = generateId('L');
  appendRow(SHEET_NAMES.LEMBUR, [
    idLembur,
    idKaryawan,
    nama,
    idToko,
    namaToko,
    today,
    jamMulai,
    '',
    '',
    alasan,
    fotoUrl,
    'Pending',
    '',
    ''
  ]);

  // Broadcast real-time notification to admins
  try {
    triggerPusher('pinguin-chat', 'lembur-alert', {
      idLembur: idLembur,
      idKaryawan: idKaryawan,
      nama: nama,
      tanggal: today,
      status: 'Pending',
      pesan: nama + ' mengajukan LEMBUR mulai jam ' + jamMulai
    });
  } catch (e) {
    Logger.log("Pusher broadcast failed in ajukanLembur: " + e.toString());
  }

  // Kirim FCM notifikasi pengajuan lembur
  try {
    sendPushNotification(idKaryawan, 'Pengajuan Lembur Terkirim', 'Pengajuan lembur Anda pada ' + today + ' berhasil dikirim.', 'aktivitas_umum_channel');
  } catch(e) {
    Logger.log('FCM ajukan lembur error: ' + e.toString());
  }

  // Kirim notifikasi ke semua admin
  try {
    const tanggal = today;
    sendPushNotificationToAllAdmin(
      '⏰ Pengajuan Lembur',
      nama + ' mengajukan lembur',
      'lembur_channel',
      { type: 'lembur', idKaryawan: idKaryawan, tanggal: tanggal }
    );
  } catch(e) {
    Logger.log('FCM broadcast ajukan lembur ke admin error: ' + e.toString());
  }

  return { success: true, idLembur: idLembur, message: 'Pengajuan lembur berhasil dikirim' };
}

// ==================== IZIN ====================
function ajukanIzin(data) {
  const { idKaryawan, nama, idJenisIzin, namaJenis, tglMulai, tglSelesai, alasan, lampiranBase64 } = data;

  // Validasi kuota
  const jenisIzin = getSheetData(SHEET_NAMES.MASTER_JENIS_IZIN).find(j => j.ID_Jenis === idJenisIzin);
  if (!jenisIzin) return { success: false, error: 'Jenis izin tidak valid' };

  // Jika tglSelesai tidak diisi, kita biarkan kosong/open-ended
  const finalTglSelesai = tglSelesai || '';

  const start = parseDateSafe(tglMulai);
  const end = finalTglSelesai ? parseDateSafe(finalTglSelesai) : null;
  let jumlahHari = 1;
  if (start && end) {
    jumlahHari = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }

  if (finalTglSelesai && jenisIzin.Maks_Hari_Sekali_Ajuan && jumlahHari > parseInt(jenisIzin.Maks_Hari_Sekali_Ajuan)) {
    return { success: false, error: 'Maksimal ' + jenisIzin.Maks_Hari_Sekali_Ajuan + ' hari per pengajuan' };
  }

  // Validasi sisa kuota sebelum memproses (Kecuali Sakit karena auto-close)
  if (jenisIzin.Kode !== 'sakit') {
    try {
      const kuotaRes = getSisaKuota({ idKaryawan });
      if (kuotaRes.success) {
        const kuotaInfo = kuotaRes.kuota[jenisIzin.Kode];
        if (kuotaInfo && kuotaInfo.sisa !== null) {
          if (jumlahHari > kuotaInfo.sisa) {
            return { success: false, error: 'Kuota tidak mencukupi. Sisa kuota Anda: ' + kuotaInfo.sisa + ' hari.' };
          }
        }
      }
    } catch (e) {
      console.error('Gagal validasi sisa kuota:', e);
    }
  }

  // Upload lampiran jika ada
  let lampiranUrl = '';
  if (lampiranBase64) {
    try {
      lampiranUrl = uploadFileToDrive(lampiranBase64, idKaryawan, 'Izin');
    } catch (e) {
      console.error('Gagal upload lampiran:', e);
    }
  }

  const idIzin = generateId('I');
  appendRow(SHEET_NAMES.IZIN_CUTI, [
    idIzin,
    idKaryawan,
    nama,
    idJenisIzin,
    namaJenis,
    tglMulai,
    finalTglSelesai,
    finalTglSelesai ? jumlahHari : '',
    alasan,
    lampiranUrl,
    'Pending',
    '',
    ''
  ]);
  // Broadcast real-time notification to admins
  try {
    triggerPusher('pinguin-chat', 'izin-alert', {
      idIzin: idIzin,
      idKaryawan: idKaryawan,
      nama: nama,
      jenisIzin: namaJenis,
      status: 'Pending',
      pesan: nama + ' mengajukan izin: ' + namaJenis + ' (Mulai: ' + tglMulai + ')'
    });
  } catch (e) {
    Logger.log("Pusher broadcast failed in ajukanIzin: " + e.toString());
  }

  // Kirim FCM notifikasi pengajuan izin
  try {
    sendPushNotification(idKaryawan, 'Pengajuan Izin Terkirim', 'Pengajuan ' + namaJenis + ' Anda berhasil dikirim.', 'aktivitas_umum_channel');
  } catch(e) {
    Logger.log('FCM ajukan izin error: ' + e.toString());
  }

  // Kirim notifikasi ke semua admin
  try {
    const jenisIzin = namaJenis;
    sendPushNotificationToAllAdmin(
      '📋 Pengajuan Izin',
      nama + ' mengajukan ' + jenisIzin,
      'izin_channel',
      { type: 'izin', idKaryawan: idKaryawan, jenis: jenisIzin }
    );
  } catch(e) {
    Logger.log('FCM broadcast ajukan izin ke admin error: ' + e.toString());
  }

  return { success: true, idIzin: idIzin, message: 'Pengajuan izin berhasil dikirim' };
}

function autoCloseIzin(idKaryawan, checkInDateStr) {
  try {
    const sheet = getSheet(SHEET_NAMES.IZIN_CUTI);
    if (!sheet) return;
    const values = sheet.getDataRange().getValues();

    // Hitung tanggal kemarin
    const checkInDate = new Date(checkInDateStr);
    const yesterday = new Date(checkInDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const tglSelesaiKemarin = formatDate(yesterday);

    for (let i = 1; i < values.length; i++) {
      const rowIdKaryawan = values[i][1];
      const rowTglMulai = values[i][5];
      const rowTglSelesai = values[i][6];
      const rowStatus = values[i][10];

      // Jika karyawan cocok, status Approved, dan tanggal selesai masih kosong atau '-'
      if (rowIdKaryawan === idKaryawan && rowStatus === 'Approved' && (!rowTglSelesai || rowTglSelesai === '' || rowTglSelesai === '-')) {
        // Update Tanggal Selesai (Kolom 7 = G)
        sheet.getRange(i + 1, 7).setValue(tglSelesaiKemarin);

        // Hitung jumlah hari
        let tglMulaiFormatted = rowTglMulai;
        if (rowTglMulai instanceof Date) {
          tglMulaiFormatted = formatDate(rowTglMulai);
        }

        const start = parseDateSafe(tglMulaiFormatted);
        const end = parseDateSafe(tglSelesaiKemarin);
        let countDays = 1;
        if (start && end) {
          countDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        }

        // Update Jumlah Hari (Kolom 8 = H)
        sheet.getRange(i + 1, 8).setValue(countDays > 0 ? countDays : 1);

        console.log('[AUTO-CLOSE] Berhasil menutup izin ' + values[i][0] + ' s.d tanggal ' + tglSelesaiKemarin + ' (' + countDays + ' hari)');
      }
    }
  } catch (e) {
    console.error('[AUTO-CLOSE] Gagal menutup izin:', e);
  }
} function getSisaKuota(data) {
  const { idKaryawan } = data;
  const jenisIzin = getSheetData(SHEET_NAMES.MASTER_JENIS_IZIN);
  const izinApproved = getSheetData(SHEET_NAMES.IZIN_CUTI).filter(i =>
    i.ID_Karyawan === idKaryawan && (i.Status === 'Approved' || i.Status === 'Pending')
  );

  const tahunIni = new Date().getFullYear();
  const bulanIni = new Date().getMonth() + 1;

  // 1. Hitung total penggunaan Cuti & Izin yang memotong Cuti Bulanan
  // ID_Jenis Cuti biasanya JI001. Mari kita cari jenis izin Cuti dari master
  const cutiMaster = jenisIzin.find(j => j.Kode === 'cuti') || { ID_Jenis: 'JI001', Kuota_Per_Bulan: 2 };
  const limitCutiBulanan = parseInt(cutiMaster.Kuota_Per_Bulan) || 2;

  // Hitung jumlah hari Cuti yang terpakai
  const usedCutiBulanIni = izinApproved
    .filter(i => {
      if (i.ID_Jenis_Izin !== cutiMaster.ID_Jenis) return false;
      const tgl = parseDateSafe(i.Tanggal_Mulai);
      return tgl && tgl.getMonth() + 1 === bulanIni && tgl.getFullYear() === tahunIni;
    })
    .reduce((sum, i) => sum + (parseInt(i.Jumlah_Hari) || 0), 0);

  // Hitung jumlah hari Izin (dan jenis lain yang memotong Cuti Bulanan) yang terpakai
  const usedPotongCutiBulanIni = izinApproved
    .filter(i => {
      const master = jenisIzin.find(j => j.ID_Jenis === i.ID_Jenis_Izin);
      const tgl = parseDateSafe(i.Tanggal_Mulai);
      return master && (master.Potong_Cuti_Bulanan === 'Ya' || master.Potong_Cuti_Bulanan === 'Yes') &&
        tgl && tgl.getMonth() + 1 === bulanIni && tgl.getFullYear() === tahunIni;
    })
    .reduce((sum, i) => sum + (parseInt(i.Jumlah_Hari) || 0), 0);

  const totalSharedUsedBulanIni = usedCutiBulanIni + usedPotongCutiBulanIni;

  const result = {};
  jenisIzin.forEach(j => {
    let sisa = null;

    if (j.Kode === 'cuti' || j.Potong_Cuti_Bulanan === 'Ya' || j.Potong_Cuti_Bulanan === 'Yes') {
      // Menggunakan shared pool (Kuota Cuti Bulanan)
      sisa = Math.max(0, limitCutiBulanan - totalSharedUsedBulanIni);
    } else {
      // Menggunakan kuota masing-masing
      if (j.Kuota_Per_Tahun) {
        const terpakai = izinApproved
          .filter(i => {
            if (i.ID_Jenis_Izin !== j.ID_Jenis) return false;
            const tgl = parseDateSafe(i.Tanggal_Mulai);
            return tgl && tgl.getFullYear() === tahunIni;
          })
          .reduce((sum, i) => sum + (parseInt(i.Jumlah_Hari) || 0), 0);
        sisa = Math.max(0, parseInt(j.Kuota_Per_Tahun) - terpakai);
      }
      if (j.Kuota_Per_Bulan) {
        const terpakai = izinApproved
          .filter(i => {
            if (i.ID_Jenis_Izin !== j.ID_Jenis) return false;
            const tgl = parseDateSafe(i.Tanggal_Mulai);
            return tgl && tgl.getMonth() + 1 === bulanIni && tgl.getFullYear() === tahunIni;
          })
          .reduce((sum, i) => sum + (parseInt(i.Jumlah_Hari) || 0), 0);
        sisa = Math.max(0, parseInt(j.Kuota_Per_Bulan) - terpakai);
      }
    }

    result[j.Kode] = {
      nama: j.Nama_Jenis,
      sisa: sisa,
      potongCuti: (j.Potong_Cuti_Bulanan === 'Ya' || j.Potong_Cuti_Bulanan === 'Yes')
    };
  });

  return {
    success: true,
    kuota: result,
    detailUsage: {
      cuti: usedCutiBulanIni,
      izinPotong: usedPotongCutiBulanIni,
      totalShared: totalSharedUsedBulanIni,
      limit: limitCutiBulanan
    }
  };
}

function getJenisIzinAktif(data) {
  try {
    const { idKaryawan } = data;
    const jenisIzin = getSheetData(SHEET_NAMES.MASTER_JENIS_IZIN);

    // Ambil yang statusnya Aktif
    const aktif = jenisIzin.filter(j => j.Status === 'Aktif');

    // Cek data karyawan untuk validasi hari kerja minimal & gender jika ada
    const karyawan = getSheetData(SHEET_NAMES.MASTER_KARYAWAN).find(k => k.ID_Karyawan === idKaryawan);

    let hariKerja = 999; // Default jika tidak ada info masuk
    if (karyawan && karyawan.Tanggal_Masuk) {
      const tglMasuk = new Date(karyawan.Tanggal_Masuk);
      const selisihMs = new Date() - tglMasuk;
      hariKerja = Math.floor(selisihMs / (1000 * 60 * 60 * 24));
    }

    let genderKaryawan = '';
    if (karyawan) {
      // Cari properti gender atau jenis kelamin secara case-insensitive
      for (let key in karyawan) {
        if (key.toLowerCase().includes('gender') || key.toLowerCase().includes('kelamin')) {
          genderKaryawan = karyawan[key];
          break;
        }
      }
    }

    const filtered = aktif.filter(j => {
      // 1. Cek syarat hari kerja minimal
      const syarat = parseInt(j.Syarat_Hari_Kerja_Minimal) || 0;
      if (hariKerja < syarat) return false;

      // 2. Cek syarat gender khusus
      const genderKhusus = j.Gender_Khusus;
      if (genderKhusus && genderKhusus !== 'Semua' && genderKaryawan) {
        if (genderKhusus.toLowerCase() !== genderKaryawan.toLowerCase()) {
          return false;
        }
      }
      return true;
    });

    return { success: true, data: filtered };
  } catch (e) {
    console.error('Gagal getJenisIzinAktif:', e);
    return { success: false, error: e.toString() };
  }
}

// ==================== JADWAL ====================
function getJadwalHariIni(data) {
  const { idKaryawan } = data;
  const hariIni = getHariIni();
  const todayStr = formatDate(new Date());

  const fallbackJadwal = { libur: true, idToko: '', namaToko: '—', idShift: '', namaShift: '—', jamMasuk: '—', jamPulang: '—' };

  const jadwal = getSheetData(SHEET_NAMES.JADWAL_KARYAWAN).find(j => {
    if (j.ID_Karyawan !== idKaryawan) return false;
    if (!j.Hari_Berjalan.includes(hariIni)) return false;
    
    const tglMulaiDate = parseDateSafe(j.Tanggal_Mulai);
    const tglSelesaiDate = parseDateSafe(j.Tanggal_Selesai);
    const tglMulai = tglMulaiDate ? formatDate(tglMulaiDate) : '2000-01-01';
    const tglSelesai = tglSelesaiDate ? formatDate(tglSelesaiDate) : '2099-12-31';
    return todayStr >= tglMulai && todayStr <= tglSelesai;
  });

  let originalJadwal = fallbackJadwal;
  if (jadwal) {
    const toko = getSheetData(SHEET_NAMES.MASTER_TOKO).find(t => t.ID_Toko === jadwal.ID_Toko);
    const shift = getSheetData(SHEET_NAMES.SHIFT_TOKO).find(s => s.ID_Shift === jadwal.ID_Shift);
    originalJadwal = {
      libur: false,
      idToko: jadwal.ID_Toko,
      namaToko: toko ? toko.Nama_Toko : jadwal.Nama_Toko,
      idShift: jadwal.ID_Shift,
      namaShift: shift ? shift.Nama_Shift : jadwal.Nama_Shift,
      jamMasuk: shift ? formatTimeOnly(shift.Jam_Masuk) : '',
      jamPulang: shift ? formatTimeOnly(shift.Jam_Pulang) : '',
      fotoToko: toko ? (toko.Foto_Toko_URL || toko.Foto_URL || '') : ''
    };
  }

  const finalJadwal = checkSwappedJadwal(idKaryawan, todayStr, originalJadwal);

  if (finalJadwal.libur) {
    return { success: true, jadwal: null, absen: null, message: 'Tidak ada jadwal hari ini' };
  }
  
  // Fetch Absensi for today
  const absensiData = getSheetData(SHEET_NAMES.ABSENSI);
  const masuk = absensiData.find(a => a.ID_Karyawan === idKaryawan && (a.Timestamp instanceof Date ? formatDate(a.Timestamp) : formatDate(new Date(a.Timestamp))) === todayStr && a.Tipe === 'Masuk');
  const pulang = absensiData.find(a => a.ID_Karyawan === idKaryawan && (a.Timestamp instanceof Date ? formatDate(a.Timestamp) : formatDate(new Date(a.Timestamp))) === todayStr && a.Tipe === 'Pulang');

  let jamMasukReal = '';
  let statusMasukReal = '';
  let jamPulangReal = '';
  
  if (masuk) {
      jamMasukReal = formatTimeOnly(masuk.Jam_Masuk);
      statusMasukReal = masuk.Status_Masuk || '';
      if (masuk.Jam_Pulang && String(masuk.Jam_Pulang).trim() !== '') {
          jamPulangReal = formatTimeOnly(masuk.Jam_Pulang);
      }
  }
  if (pulang) {
      jamPulangReal = formatTimeOnly(pulang.Jam_Pulang);
  }

  return {
    success: true,
    jadwal: {
      idToko: finalJadwal.idToko,
      namaToko: finalJadwal.namaToko,
      idShift: finalJadwal.idShift,
      namaShift: finalJadwal.namaShift,
      jamMasuk: finalJadwal.jamMasuk,
      jamPulang: finalJadwal.jamPulang,
      fotoToko: finalJadwal.fotoToko || ''
    },
    absen: {
      jamMasuk: jamMasukReal,
      jamPulang: jamPulangReal,
      statusMasuk: statusMasukReal
    }
  };
}

function getJadwalMingguan(data) {
  const { idKaryawan, tanggalReferensi } = data;
  const ref = tanggalReferensi ? new Date(tanggalReferensi) : new Date();

  // Hitung Senin minggu ini
  const day = ref.getDay();
  const diff = ref.getDate() - day + (day === 0 ? -6 : 1);
  const senin = new Date(ref.setDate(diff));

  const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const jadwalAll = getSheetData(SHEET_NAMES.JADWAL_KARYAWAN).filter(j =>
    j.ID_Karyawan === idKaryawan && (j.Status === 'Aktif' || j.Status === 'Normal' || j.Status === 'Diperbantukan')
  );

  const result = [];
  for (let i = 0; i < 7; i++) {
    const tgl = new Date(senin);
    tgl.setDate(senin.getDate() + i);
    const namaHari = hariList[i];
    const tglStr = Utilities.formatDate(tgl, 'Asia/Jakarta', 'dd MMM');
    const tglStrForCompare = formatDate(tgl); // yyyy-MM-dd

    const jadwal = jadwalAll.find(j => {
      let matchHari = false;
      if (j.Hari_Berjalan === 'Senin-Minggu') matchHari = true;
      else if (j.Hari_Berjalan.includes(namaHari)) matchHari = true;
      
      if (!matchHari) return false;

      const tMulai = Utilities.formatDate(new Date(j.Tanggal_Mulai), 'Asia/Jakarta', 'yyyy-MM-dd');
      const tSelesai = Utilities.formatDate(new Date(j.Tanggal_Selesai), 'Asia/Jakarta', 'yyyy-MM-dd');
      return tglStrForCompare >= tMulai && tglStrForCompare <= tSelesai;
    });

    const toko = jadwal ? getSheetData(SHEET_NAMES.MASTER_TOKO).find(t => t.ID_Toko === jadwal.ID_Toko) : null;
    const shift = jadwal ? getSheetData(SHEET_NAMES.SHIFT_TOKO).find(s => s.ID_Shift === jadwal.ID_Shift) : null;

    const originalJadwal = {
      libur: !jadwal,
      idToko: jadwal ? jadwal.ID_Toko : '',
      namaToko: toko ? toko.Nama_Toko : '—',
      idShift: jadwal ? jadwal.ID_Shift : '',
      namaShift: shift ? shift.Nama_Shift : '—',
      jamMasuk: shift ? formatTimeOnly(shift.Jam_Masuk) : '—',
      jamPulang: shift ? formatTimeOnly(shift.Jam_Pulang) : '—',
      status: jadwal ? jadwal.Status : 'Normal'
    };

    const finalJadwal = checkSwappedJadwal(idKaryawan, tglStrForCompare, originalJadwal);

    result.push({
      tanggal: tglStr,
      namaHari: namaHari,
      toko: finalJadwal.namaToko,
      shift: finalJadwal.namaShift,
      jamMasuk: finalJadwal.jamMasuk,
      jamPulang: finalJadwal.jamPulang,
      libur: finalJadwal.libur,
      status: finalJadwal.status
    });
  }

  return { success: true, minggu: result };
}

function getKaryawanJadwalByDate(data) {
  try {
    const { idKaryawan, tanggal } = data;
    if (!idKaryawan || !tanggal) return { success: false, error: 'Parameter tidak lengkap' };

    // Parse tanggal ke string format YYYY-MM-DD
    const targetDateStr = formatDate(new Date(tanggal));
    const targetDateObj = new Date(targetDateStr);

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const namaHari = dayNames[targetDateObj.getDay()];

    const jadwalAll = getSheetData(SHEET_NAMES.JADWAL_KARYAWAN).filter(j =>
      j.ID_Karyawan === idKaryawan && j.Status === 'Aktif'
    );

    const jadwal = jadwalAll.find(j => {
      if (!j.Tanggal_Mulai || !j.Tanggal_Selesai) return false;
      const mulaiStr = formatDate(new Date(j.Tanggal_Mulai));
      const selesaiStr = formatDate(new Date(j.Tanggal_Selesai));

      // Cocokkan hari berjalan
      const cocokHari = j.Hari_Berjalan.includes(namaHari);
      // Cocokkan range tanggal
      const cocokRange = targetDateStr >= mulaiStr && targetDateStr <= selesaiStr;

      return cocokHari && cocokRange;
    });

    if (!jadwal) {
      const fallbackJadwal = { libur: true, idToko: '', namaToko: '—', idShift: '', namaShift: '—', jamMasuk: '—', jamPulang: '—' };
      const finalJadwal = checkSwappedJadwal(idKaryawan, targetDateStr, fallbackJadwal);
      return {
        success: true,
        libur: finalJadwal.libur,
        idToko: finalJadwal.idToko,
        namaToko: finalJadwal.namaToko,
        idShift: finalJadwal.idShift,
        namaShift: finalJadwal.namaShift,
        jamMasuk: finalJadwal.jamMasuk,
        jamPulang: finalJadwal.jamPulang
      };
    }

    const toko = getSheetData(SHEET_NAMES.MASTER_TOKO).find(t => t.ID_Toko === jadwal.ID_Toko);
    const shift = getSheetData(SHEET_NAMES.SHIFT_TOKO).find(s => s.ID_Shift === jadwal.ID_Shift);

    const originalJadwal = {
      libur: false,
      idToko: jadwal.ID_Toko,
      namaToko: toko ? toko.Nama_Toko : '—',
      idShift: jadwal.ID_Shift,
      namaShift: shift ? shift.Nama_Shift : '—',
      jamMasuk: shift ? formatTimeOnly(shift.Jam_Masuk) : '—',
      jamPulang: shift ? formatTimeOnly(shift.Jam_Pulang) : '—'
    };

    const finalJadwal = checkSwappedJadwal(idKaryawan, targetDateStr, originalJadwal);

    return {
      success: true,
      libur: finalJadwal.libur,
      idToko: finalJadwal.idToko,
      namaToko: finalJadwal.namaToko,
      idShift: finalJadwal.idShift,
      namaShift: finalJadwal.namaShift,
      jamMasuk: finalJadwal.jamMasuk,
      jamPulang: finalJadwal.jamPulang
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ==================== RAPORT ====================
function getRaportHarian(data) {
  const { idKaryawan, tanggal } = data;
  const tgl = tanggal || formatDate(new Date());

  const absensi = getSheetData(SHEET_NAMES.ABSENSI).filter(a =>
    a.ID_Karyawan === idKaryawan &&
    formatDate(new Date(a.Timestamp)) === tgl
  );

  return formatRaport(absensi, 'harian');
}

function getRaportMingguan(data) {
  const { idKaryawan, tanggalMulai } = data;
  const mulai = tanggalMulai ? new Date(tanggalMulai) : new Date();
  const akhir = new Date(mulai);
  akhir.setDate(mulai.getDate() + 6);

  const absensi = getSheetData(SHEET_NAMES.ABSENSI).filter(a => {
    const tgl = new Date(a.Timestamp);
    return a.ID_Karyawan === idKaryawan && tgl >= mulai && tgl <= akhir;
  });

  return formatRaport(absensi, 'mingguan');
}

function getRaportBulanan(data) {
  const { idKaryawan, bulan, tahun } = data;
  const bln = bulan || new Date().getMonth() + 1;
  const thn = tahun || new Date().getFullYear();

  const absensi = getSheetData(SHEET_NAMES.ABSENSI).filter(a => {
    const tgl = parseDateSafe(a.Timestamp);
    return tgl &&
      String(a.ID_Karyawan) === String(idKaryawan) &&
      tgl.getMonth() + 1 === parseInt(bln) &&
      tgl.getFullYear() === parseInt(thn);
  });

  return formatRaport(absensi, 'bulanan', parseInt(bln), parseInt(thn), idKaryawan);
}

function formatRaport(absensi, mode, bln, thn, idKaryawan) {
  const totalHadir = absensi.filter(a => a.Tipe === 'Masuk').length;
  const totalTelat = absensi.filter(a => a.Status_Masuk === 'Telat').length;
  const totalMenitTelat = absensi.reduce((sum, a) => sum + (parseInt(a.Menit_Telat) || 0), 0);

  // Hitung jam kerja total
  let totalJamKerja = 0;
  absensi.forEach(a => {
    if (a.Jam_Kerja) {
      const match = a.Jam_Kerja.match(/(\d+)j\s*(\d*)m?/);
      if (match) {
        totalJamKerja += parseInt(match[1]) + (parseInt(match[2]) || 0) / 60;
      }
    }
  });

  // Determine relevant employee ID and time bounds
  const empId = idKaryawan || absensi[0]?.ID_Karyawan;
  const now = new Date();
  const targetBln = bln || (absensi[0] ? new Date(absensi[0].Timestamp).getMonth() + 1 : now.getMonth() + 1);
  const targetThn = thn || (absensi[0] ? new Date(absensi[0].Timestamp).getFullYear() : now.getFullYear());

  // Helper untuk hitung menit dari "HH:mm" atau "HH:mm:ss"
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const parts = String(timeStr).split(':');
    if (parts.length < 2) return null;
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  };

  // Hitung Pulang Cepat
  const shifts = getSheetData(SHEET_NAMES.SHIFT_TOKO) || [];
  let totalPulangCepat = 0;
  absensi.filter(a => a.Tipe === 'Masuk' && a.Jam_Pulang).forEach(a => {
    const shift = shifts.find(s => String(s.ID_Shift) === String(a.ID_Shift));
    if (shift && shift.Jam_Pulang) {
      const realMin = timeToMinutes(a.Jam_Pulang);
      const shiftMin = timeToMinutes(shift.Jam_Pulang);
      if (realMin !== null && shiftMin !== null && realMin < shiftMin) {
        totalPulangCepat++;
      }
    }
  });

  // Hitung lembur untuk bulan dan tahun berjalan
  let totalLembur = 0;
  let totalJamLembur = 0;

  if (empId) {
    const lemburList = getSheetData(SHEET_NAMES.LEMBUR).filter(l =>
      String(l.ID_Karyawan) === String(empId) &&
      l.Status === 'Approved'
    );

    // Filter lembur berdasarkan bulan/tahun
    const lemburBulanIni = lemburList.filter(l => {
      if (!l.Tanggal) return false;
      const tgl = parseDateSafe(l.Tanggal);
      return tgl && tgl.getMonth() + 1 === targetBln && tgl.getFullYear() === targetThn;
    });

    totalLembur = lemburBulanIni.length;
    totalJamLembur = lemburBulanIni.reduce((sum, l) => {
      if (l.Durasi_Jam) {
        const match = l.Durasi_Jam.match(/(\d+)j\s*(\d*)m?/);
        if (match) return sum + parseInt(match[1]) + (parseInt(match[2]) || 0) / 60;
      }
      return sum;
    }, 0);
  }

  // Hitung Izin, Sakit, Cuti dari SHEET_NAMES.IZIN_CUTI
  let totalSakit = 0;
  let totalIzin = 0;
  let totalCuti = 0;
  let izinCutiList = [];

  if (empId) {
    izinCutiList = getSheetData(SHEET_NAMES.IZIN_CUTI).filter(i =>
      String(i.ID_Karyawan) === String(empId) &&
      i.Status === 'Approved'
    );

    izinCutiList.forEach(i => {
      if (!i.Tanggal_Mulai) return;
      const tgl = parseDateSafe(i.Tanggal_Mulai);
      if (tgl && tgl.getMonth() + 1 === targetBln && tgl.getFullYear() === targetThn) {
        const namaJenis = String(i.Nama_Jenis).toLowerCase();
        const jmlHari = parseInt(i.Jumlah_Hari) || 1;

        if (namaJenis.indexOf('sakit') !== -1) {
          totalSakit += jmlHari;
        } else if (namaJenis.indexOf('cuti') !== -1) {
          totalCuti += jmlHari;
        } else {
          totalIzin += jmlHari;
        }
      }
    });
  }

  // Detail harian
  const detailHarian = absensi.filter(a => a.Tipe === 'Masuk').map(a => {
    const tglStr = formatDate(new Date(a.Timestamp));
    let durasiLembur = '';
    let isSwap = false;
    let swapDetail = '';

    if (empId) {
      // 1. Cek Lembur
      const lemburList = getSheetData(SHEET_NAMES.LEMBUR).filter(l =>
        String(l.ID_Karyawan) === String(empId) &&
        l.Status === 'Approved'
      );
      const lemburHariIni = lemburList.find(l => {
        if (!l.Tanggal) return false;
        return formatDate(parseDateSafe(l.Tanggal)) === tglStr;
      });
      if (lemburHariIni) {
        durasiLembur = lemburHariIni.Durasi_Jam || '';
      }

      // 2. Cek Tukar Shift
      const swapList = getSheetData(SHEET_NAMES.TUKAR_SHIFT).filter(t =>
        (String(t.ID_Karyawan) === String(empId) || String(t.ID_Karyawan_Tujuan) === String(empId)) &&
        t.Status === 'Approved'
      );
      const swapHariIni = swapList.find(t => {
        if (!t.Tanggal) return false;
        return formatDate(parseDateSafe(t.Tanggal)) === tglStr;
      });
      if (swapHariIni) {
        isSwap = true;
        swapDetail = String(swapHariIni.ID_Karyawan) === String(empId)
          ? `Tukar shift`
          : `Tukar shift dengan ${swapHariIni.Nama}`;
      }
    }

    return {
      tanggal: tglStr,
      toko: a.Nama_Toko,
      shift: a.Nama_Shift,
      jamMasuk: a.Jam_Masuk,
      jamPulang: a.Jam_Pulang || '-',
      status: a.Status_Masuk,
      menitTelat: a.Menit_Telat || 0,
      jamKerja: a.Jam_Kerja || '-',
      fotoMasuk: a.Foto_URL,
      fotoPulang: a.Foto_Pulang_URL || '',
      durasiLembur: durasiLembur,
      isSwap: isSwap,
      swapDetail: swapDetail
    };
  });

  const izinCutiMapped = empId ? izinCutiList.map(i => {
    let tglMulaiStr = '';
    let tglSelesaiStr = '';
    try {
      tglMulaiStr = i.Tanggal_Mulai instanceof Date
        ? formatDate(i.Tanggal_Mulai)
        : formatDate(parseDateSafe(i.Tanggal_Mulai));
    } catch (e) { }
    try {
      tglSelesaiStr = i.Tanggal_Selesai instanceof Date
        ? formatDate(i.Tanggal_Selesai)
        : formatDate(parseDateSafe(i.Tanggal_Selesai));
    } catch (e) { }
    if (!tglSelesaiStr || tglSelesaiStr === '-' || tglSelesaiStr === '—') {
      tglSelesaiStr = tglMulaiStr;
    }
    return {
      tanggalMulai: tglMulaiStr,
      tanggalSelesai: tglSelesaiStr,
      tipe: i.Nama_Jenis_Izin || 'Izin',
      alasan: i.Alasan || '',
      lampiranUrl: i.Lampiran_URL || ''
    };
  }) : [];

  return {
    success: true,
    mode: mode,
    totalHadir: totalHadir,
    totalTelat: totalTelat,
    totalMenitTelat: totalMenitTelat,
    totalJamKerja: Math.round(totalJamKerja * 10) / 10,
    totalJamLembur: Math.round(totalJamLembur * 10) / 10,
    totalLembur: totalLembur,
    totalPulangCepat: totalPulangCepat,
    totalSakit: totalSakit,
    totalIzin: totalIzin,
    totalCuti: totalCuti,
    detailHarian: detailHarian,
    izinCuti: izinCutiMapped
  };
}

// ==================== LAPORAN ADMIN LENGKAP ====================
function getLaporanAbsensi(data) {
  const { mode, tanggal, tanggalMulai, tanggalAkhir, bulan, tahun, idToko, idShift, idKaryawan } = data;
  const absensi = getSheetData(SHEET_NAMES.ABSENSI);
  const lembur = getSheetData(SHEET_NAMES.LEMBUR);
  let result = [];

  if (mode === 'harian') {
    const tgl = tanggal || formatDate(new Date());
    result = absensi.filter(a => formatDate(new Date(a.Timestamp)) === tgl && a.Tipe === 'Masuk');
  } else if (mode === 'mingguan') {
    const mulai = tanggalMulai ? new Date(tanggalMulai) : new Date();
    const akhir = tanggalAkhir ? new Date(tanggalAkhir) : new Date(mulai.getTime() + 6 * 86400000);
    result = absensi.filter(a => {
      const tgl = new Date(a.Timestamp);
      return tgl >= mulai && tgl <= akhir && a.Tipe === 'Masuk';
    });
  } else if (mode === 'bulanan') {
    const bln = bulan || new Date().getMonth() + 1;
    const thn = tahun || new Date().getFullYear();
    result = absensi.filter(a => {
      const tgl = new Date(a.Timestamp);
      return tgl.getMonth() + 1 === parseInt(bln) && tgl.getFullYear() === parseInt(thn) && a.Tipe === 'Masuk';
    });
  } else if (mode === 'tahunan') {
    const thn = tahun || new Date().getFullYear();
    result = absensi.filter(a => {
      const tgl = new Date(a.Timestamp);
      return tgl.getFullYear() === parseInt(thn) && a.Tipe === 'Masuk';
    });
  }

  // Filter tambahan
  if (idToko) result = result.filter(a => a.ID_Toko === idToko);
  if (idShift) result = result.filter(a => a.ID_Shift === idShift);
  if (idKaryawan) result = result.filter(a => a.ID_Karyawan === idKaryawan);

  result = result.map(a => {
    const lemburData = lembur.find(l =>
      l.ID_Karyawan === a.ID_Karyawan &&
      l.Tanggal === formatDate(new Date(a.Timestamp)) &&
      l.Status === 'Approved'
    );
    const pendingLembur = lembur.find(l =>
      l.ID_Karyawan === a.ID_Karyawan &&
      l.Tanggal === formatDate(new Date(a.Timestamp)) &&
      l.Status === 'Pending'
    );
    return {
      tanggal: formatDate(new Date(a.Timestamp)),
      nama: a.Nama,
      toko: a.Nama_Toko,
      shift: a.Nama_Shift,
      jamMasuk: a.Jam_Masuk,
      jamPulang: a.Jam_Pulang || '—',
      durasiKerja: a.Jam_Kerja || '—',
      durasiLembur: lemburData ? lemburData.Durasi_Jam : '—',
      status: a.Status_Masuk,
      menitTelat: a.Menit_Telat || 0,
      statusLembur: lemburData ? 'Approved' : (pendingLembur ? 'Pending' : '—'),
      tokoLembur: lemburData ? lemburData.Nama_Toko : (pendingLembur ? pendingLembur.Nama_Toko : '—'),
      fotoMasuk: a.Foto_URL || '',
      fotoPulang: a.Foto_Pulang_URL || '',
      fotoLembur: lemburData ? lemburData.Foto_URL : (pendingLembur ? pendingLembur.Foto_URL : ''),
      idKaryawan: a.ID_Karyawan
    };
  });

  return { success: true, mode: mode, data: result };
}

// ==================== DASHBOARD ADMIN ====================
function getDashboardData(data) {
  const today = formatDate(new Date());
  const absensi = getSheetData(SHEET_NAMES.ABSENSI);
  const karyawan = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
  const lembur = getSheetData(SHEET_NAMES.LEMBUR);
  const izin = getSheetData(SHEET_NAMES.IZIN_CUTI);

  const absenHariIni = absensi.filter(a => formatDate(new Date(a.Timestamp)) === today);
  const hadir = absenHariIni.filter(a => a.Tipe === 'Masuk').length;
  const telat = absenHariIni.filter(a => a.Status_Masuk === 'Telat').length;
  const pendingLembur = lembur.filter(l => l.Status === 'Pending').length;
  const pendingIzin = izin.filter(i => i.Status === 'Pending').length;

  return {
    success: true,
    stats: {
      totalKaryawan: karyawan.filter(k => k.Status === 'Aktif').length,
      hadirHariIni: hadir,
      pendingApproval: pendingLembur + pendingIzin,
      telatHariIni: telat
    }
  };
}

function getMonitoringToko(data) {
  const today = formatDate(new Date());
  const tokoList = getSheetData(SHEET_NAMES.MASTER_TOKO) || [];
  const absensi = getSheetData(SHEET_NAMES.ABSENSI) || [];
  const jadwal = getSheetData(SHEET_NAMES.JADWAL_KARYAWAN) || [];
  const karyawan = getSheetData(SHEET_NAMES.MASTER_KARYAWAN) || [];
  const hariIni = getHariIni();

  const result = tokoList.map(t => {
    const karyawanJadwal = jadwal.filter(j =>
      j.ID_Toko === t.ID_Toko &&
      (j.Hari_Berjalan || '').includes(hariIni) &&
      j.Status === 'Aktif'
    );

    const karyawanOnline = karyawanJadwal.map(j => {
      const k = karyawan.find(kar => kar.ID_Karyawan === j.ID_Karyawan);
      const absen = absensi.find(a =>
        a.ID_Karyawan === j.ID_Karyawan &&
        formatDate(new Date(a.Timestamp)) === today &&
        a.Tipe === 'Masuk'
      );

      return {
        nama: k ? k.Nama : j.ID_Karyawan,
        status: absen ? (absen.Status_Masuk === 'Telat' ? 'telat' : 'hadir') : 'belum',
        menitTelat: absen ? (parseInt(absen.Menit_Telat) || 0) : 0
      };
    });

    return {
      idToko: t.ID_Toko,
      namaToko: t.Nama_Toko,
      fotoUrl: t.Foto_Toko_URL || '',
      jamBuka: formatTimeOnly(t.Jam_Buka),   // <-- FIX
      jamTutup: formatTimeOnly(t.Jam_Tutup), // <-- FIX
      totalKaryawan: karyawanJadwal.length,
      totalOnline: karyawanOnline.filter(k => k.status !== 'belum').length,
      karyawan: karyawanOnline
    };
  });

  return { success: true, toko: result };
}

function getAbsensiHariIniLengkap(data) {
  const { tanggal, idToko, idShift } = data || {};
  const tgl = tanggal || formatDate(new Date());

  const absensi = getSheetData(SHEET_NAMES.ABSENSI);
  const lembur = getSheetData(SHEET_NAMES.LEMBUR);

  let result = absensi.filter(a =>
    formatDate(new Date(a.Timestamp)) === tgl &&
    a.Tipe === 'Masuk'
  );

  if (idToko) result = result.filter(a => a.ID_Toko === idToko);
  if (idShift) result = result.filter(a => a.ID_Shift === idShift);

  result = result.map(a => {
    const lemburData = lembur.find(l =>
      l.ID_Karyawan === a.ID_Karyawan &&
      l.Tanggal === tgl
    );

    return {
      tanggal: tgl,
      nama: a.Nama,
      toko: a.Nama_Toko,
      shift: a.Nama_Shift,
      jamMasuk: a.Jam_Masuk,
      jamPulang: a.Jam_Pulang,
      durasiKerja: a.Jam_Kerja,
      durasiLembur: lemburData ? lemburData.Durasi_Jam : '—',
      status: a.Status_Masuk,
      menitTelat: a.Menit_Telat,
      statusLembur: lemburData ? lemburData.Status : '—',
      tokoLembur: lemburData ? lemburData.Nama_Toko : '—',
      fotoMasuk: a.Foto_URL,
      fotoPulang: a.Foto_Pulang_URL || '',
      fotoLembur: lemburData ? lemburData.Foto_URL : ''
    };
  });

  return { success: true, data: result };
}

// ==================== LEMBUR MATH HELPER ====================
function calculateLemburDuration(idKaryawan, tanggal) {
  try {
    const absensi = getSheetData(SHEET_NAMES.ABSENSI);
    const recordMasuk = absensi.find(a =>
      a.ID_Karyawan === idKaryawan &&
      a.Tipe === 'Masuk' &&
      formatDate(new Date(a.Timestamp)) === tanggal
    );

    if (!recordMasuk) return { success: false, error: 'Data absensi masuk tidak ditemukan' };

    const rawJamMasuk = recordMasuk.Jam_Masuk;
    const jamMasukRealStr = rawJamMasuk instanceof Date 
      ? String(rawJamMasuk.getHours()).padStart(2,'0') + ':' + String(rawJamMasuk.getMinutes()).padStart(2,'0')
      : String(rawJamMasuk || '');
    
    let rawJamPulang = recordMasuk.Jam_Pulang || '';

    // Jika Jam_Pulang kosong di baris Masuk, cari dari baris Pulang
    if (!rawJamPulang) {
      const recordPulang = absensi.find(a =>
        a.ID_Karyawan === idKaryawan &&
        a.Tipe === 'Pulang' &&
        formatDate(new Date(a.Timestamp)) === tanggal
      );
      if (recordPulang) {
        rawJamPulang = recordPulang.Jam_Pulang || '';
      }
    }

    const jamPulangRealStr = rawJamPulang instanceof Date 
      ? String(rawJamPulang.getHours()).padStart(2,'0') + ':' + String(rawJamPulang.getMinutes()).padStart(2,'0')
      : String(rawJamPulang || '');

    if (!jamMasukRealStr) return { success: false, error: 'Jam masuk real belum tercatat' };

    const idShift = recordMasuk.ID_Shift;
    const shifts = getSheetData(SHEET_NAMES.SHIFT_TOKO);
    const shift = shifts.find(s => s.ID_Shift === idShift);

    if (!shift) return { success: false, error: 'Shift tidak ditemukan' };

    const jamMasukShiftStr = shift.Jam_Masuk;
    const jamPulangShiftStr = shift.Jam_Pulang;

    const parseTime = (timeStr, baseDateStr) => {
      if (!timeStr) return null;
      const parts = String(timeStr).split(':');
      if (parts.length < 2) return null;
      return new Date(baseDateStr + ' ' + parts[0] + ':' + parts[1] + ':00');
    };

    const baseDate = tanggal;
    const jamMasukReal = parseTime(jamMasukRealStr, baseDate);
    const jamMasukShift = parseTime(jamMasukShiftStr, baseDate);
    const jamPulangShift = parseTime(jamPulangShiftStr, baseDate);
    const jamPulangReal = parseTime(jamPulangRealStr, baseDate);

    if (!jamMasukReal || !jamMasukShift) return { success: false, error: 'Gagal memproses jam masuk' };

    let durasiAwalMs = 0;
    let durasiAkhirMs = 0;

    // A. Early Check-In Overtime (Jam masuk absen lebih awal >= 30 menit dari jam masuk shift toko)
    const selisihAwalMs = jamMasukShift - jamMasukReal;
    if (selisihAwalMs >= 30 * 60 * 1000) {
      durasiAwalMs = selisihAwalMs;
    }

    // B. Late Checkout Overtime (Jam pulang shift sampai jam pulang absen real)
    if (jamPulangReal && jamPulangShift) {
      const selisihAkhirMs = jamPulangReal - jamPulangShift;
      if (selisihAkhirMs > 0) {
        durasiAkhirMs = selisihAkhirMs;
      }
    }

    const totalDurasiMs = durasiAwalMs + durasiAkhirMs;
    const totalMenit = Math.round(totalDurasiMs / 60000);
    const durasiJam = Math.floor(totalMenit / 60);
    const durasiMenit = totalMenit % 60;

    return {
      success: true,
      jamMasukReal: jamMasukRealStr,
      jamPulangReal: jamPulangRealStr || '',
      jamMasukShift: jamMasukShiftStr,
      jamPulangShift: jamPulangShiftStr,
      durasiString: durasiJam + 'j ' + String(durasiMenit).padStart(2, '0') + 'm'
    };

  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ==================== APPROVAL ====================
function approveLembur(data) {
  const { idLembur, status, approvedBy } = data;

  const sheet = getSheet(SHEET_NAMES.LEMBUR);
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === idLembur) {
      sheet.getRange(i + 1, 12).setValue(status);
      sheet.getRange(i + 1, 13).setValue(approvedBy);
      sheet.getRange(i + 1, 14).setValue(formatDateTime(new Date()));

      if (status === 'Approved') {
        const idKaryawan = allData[i][1];
        const tanggalLembur = formatDate(new Date(allData[i][5]));

        const calc = calculateLemburDuration(idKaryawan, tanggalLembur);
        if (calc.success) {
          sheet.getRange(i + 1, 7).setValue("'" + calc.jamMasukReal); // Force text
          sheet.getRange(i + 1, 8).setValue("'" + (calc.jamPulangReal || '-')); // Force text
          sheet.getRange(i + 1, 9).setValue(calc.durasiString);
        } else {
          // Fallback kalkulasi lama jika absensi tidak ditemukan
          const jamMulai = allData[i][6];
          const jamSelesai = formatTime(new Date());
          sheet.getRange(i + 1, 8).setValue(jamSelesai);

          let start;
          if (jamMulai instanceof Date) {
            start = new Date(2000, 0, 1, jamMulai.getHours(), jamMulai.getMinutes());
          } else {
            const parts = String(jamMulai).split(':');
            if (parts.length >= 2) {
              start = new Date(2000, 0, 1, parseInt(parts[0], 10), parseInt(parts[1], 10));
            } else {
              start = new Date(2000, 0, 1, 0, 0);
            }
          }

          const now = new Date();
          const end = new Date(2000, 0, 1, now.getHours(), now.getMinutes());

          let durasiMs = end - start;
          if (isNaN(durasiMs) || durasiMs < 0) {
            durasiMs = 0;
          }
          const durasiJam = Math.floor(durasiMs / 3600000);
          const durasiMenit = Math.floor((durasiMs % 3600000) / 60000);
          sheet.getRange(i + 1, 9).setValue(durasiJam + 'j ' + String(durasiMenit).padStart(2, '0') + 'm');
        }
      }

      // Broadcast real-time ke APK karyawan via Pusher WebSocket
      try {
        const idKaryawan = allData[i][1];
        const ket = allData[i][10] || '';
        triggerPusher('pinguin-chat', 'lembur-alert', {
          idKaryawan: idKaryawan,
          nama: allData[i][2],
          status: status,
          idLembur: idLembur,
          pesan: status === 'Approved' 
            ? 'Pengajuan lembur Anda (' + ket + ') telah disetujui'
            : 'Pengajuan lembur Anda (' + ket + ') ditolak'
        });
      } catch (e) {
        Logger.log('Gagal mengirim push lembur: ' + e.message);
      }

      // Kirim FCM notifikasi lembur disetujui
      try {
        sendPushNotification(allData[i][1], 'Lembur Disetujui ✅', 'Pengajuan lembur Anda telah disetujui.', 'aktivitas_umum_channel');
      } catch(e) {
        Logger.log('FCM approve lembur error: ' + e.toString());
      }

      return { success: true, message: 'Lembur ' + status.toLowerCase() };
    }
  }

  return { success: false, error: 'Data lembur tidak ditemukan' };
}

function autoResolveJadwalHarian(idKaryawan, tglMulai, tglSelesai) {
  const sheet = getSheet(SHEET_NAMES.JADWAL_KARYAWAN);
  let allData = sheet.getDataRange().getValues();
  if (allData.length <= 1) return;
  
  const targetDates = [];
  let d = new Date(tglMulai);
  const end = new Date(tglSelesai);
  while (d <= end) {
    targetDates.push(Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd'));
    d.setDate(d.getDate() + 1);
  }
  
  const karyawanList = getSheetData(SHEET_NAMES.MASTER_KARYAWAN).filter(k => k.Status === 'Aktif');
  const tokoList = getSheetData(SHEET_NAMES.MASTER_TOKO).filter(t => t.Status === 'Aktif');
  const templateList = getSheetData(SHEET_NAMES.TEMPLATE_JADWAL);
  
  const isAdminOrKepala = (idK) => {
    const kData = karyawanList.find(k => k.ID_Karyawan === idK);
    const jabatan = kData ? String(kData.Jabatan).toLowerCase() : '';
    return jabatan.includes('admin') || jabatan.includes('kepala');
  };
  
  targetDates.forEach(dateStr => {
    let todaysJadwalIndices = [];
    for (let i = 1; i < allData.length; i++) {
      const rStartStr = Utilities.formatDate(new Date(allData[i][8]), 'Asia/Jakarta', 'yyyy-MM-dd');
      if (rStartStr === dateStr) {
        todaysJadwalIndices.push(i);
        
        // Update status for the sick person
        if (allData[i][1] === idKaryawan) {
          allData[i][10] = 'Cuti/Absen';
          sheet.getRange(i + 1, 11).setValue('Cuti/Absen');
        }
      }
    }
    
    let deficitPagi = [];
    let surplusPagi = [];
    let deficitSiang = [];
    let surplusSiang = [];
    
    tokoList.forEach(toko => {
      const tmpl = templateList.find(t => t.ID_Toko === toko.ID_Toko) || { Kebutuhan_Pagi: 1, Kebutuhan_Siang: 1 };
      const butuhPagi = parseInt(tmpl.Kebutuhan_Pagi) || 1;
      const butuhSiang = parseInt(tmpl.Kebutuhan_Siang) || 1;
      
      let pagiNormal = todaysJadwalIndices.filter(i => allData[i][3] === toko.ID_Toko && (allData[i][10] === 'Normal' || allData[i][10] === 'Diperbantukan') && allData[i][6].toLowerCase().includes('pagi'));
      let siangNormal = todaysJadwalIndices.filter(i => allData[i][3] === toko.ID_Toko && (allData[i][10] === 'Normal' || allData[i][10] === 'Diperbantukan') && allData[i][6].toLowerCase().includes('siang'));
      
      if (pagiNormal.length < butuhPagi) deficitPagi.push({ id: toko.ID_Toko, deficit: butuhPagi - pagiNormal.length });
      if (pagiNormal.length > butuhPagi) surplusPagi.push({ id: toko.ID_Toko, surplus: pagiNormal.length - butuhPagi, indices: pagiNormal });
      
      if (siangNormal.length < butuhSiang) deficitSiang.push({ id: toko.ID_Toko, deficit: butuhSiang - siangNormal.length });
      if (siangNormal.length > butuhSiang) surplusSiang.push({ id: toko.ID_Toko, surplus: siangNormal.length - butuhSiang, indices: siangNormal });
    });
    
    deficitPagi.forEach(def => {
      while (def.deficit > 0 && surplusPagi.length > 0) {
        const sur = surplusPagi[0];
        let candIndex = sur.indices.find(idx => allData[idx][10] === 'Normal' && !isAdminOrKepala(allData[idx][1]));
        if (candIndex !== undefined) {
          allData[candIndex][3] = def.id;
          const defToko = tokoList.find(t => t.ID_Toko === def.id);
          allData[candIndex][4] = defToko.Nama_Toko;
          allData[candIndex][10] = 'Diperbantukan';
          
          sheet.getRange(candIndex + 1, 4).setValue(def.id);
          sheet.getRange(candIndex + 1, 5).setValue(defToko.Nama_Toko);
          sheet.getRange(candIndex + 1, 11).setValue('Diperbantukan');
          
          def.deficit--;
          sur.surplus--;
          sur.indices = sur.indices.filter(idx => idx !== candIndex);
          if (sur.surplus <= 0) surplusPagi.shift();
          
          try {
            sendPushNotification(allData[candIndex][1], 'Jadwal Anda Diubah 🔄', `Anda diperbantukan ke ${defToko.Nama_Toko} pada ${dateStr} karena ada rekan yang izin/sakit.`, 'aktivitas_umum_channel');
          } catch(e){}
        } else {
          surplusPagi.shift();
        }
      }
    });
    
    deficitSiang.forEach(def => {
      while (def.deficit > 0 && surplusSiang.length > 0) {
        const sur = surplusSiang[0];
        let candIndex = sur.indices.find(idx => allData[idx][10] === 'Normal' && !isAdminOrKepala(allData[idx][1]));
        if (candIndex !== undefined) {
          allData[candIndex][3] = def.id;
          const defToko = tokoList.find(t => t.ID_Toko === def.id);
          allData[candIndex][4] = defToko.Nama_Toko;
          allData[candIndex][10] = 'Diperbantukan';
          
          sheet.getRange(candIndex + 1, 4).setValue(def.id);
          sheet.getRange(candIndex + 1, 5).setValue(defToko.Nama_Toko);
          sheet.getRange(candIndex + 1, 11).setValue('Diperbantukan');
          
          def.deficit--;
          sur.surplus--;
          sur.indices = sur.indices.filter(idx => idx !== candIndex);
          if (sur.surplus <= 0) surplusSiang.shift();
          
          try {
            sendPushNotification(allData[candIndex][1], 'Jadwal Anda Diubah 🔄', `Anda diperbantukan ke ${defToko.Nama_Toko} pada ${dateStr} karena ada rekan yang izin/sakit.`, 'aktivitas_umum_channel');
          } catch(e){}
        } else {
          surplusSiang.shift();
        }
      }
    });
  });
}

function approveIzin(data) {
  const { idIzin, status, approvedBy } = data;

  const sheet = getSheet(SHEET_NAMES.IZIN_CUTI);
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === idIzin) {
      sheet.getRange(i + 1, 11).setValue(status);
      sheet.getRange(i + 1, 12).setValue(approvedBy);
      sheet.getRange(i + 1, 13).setValue(formatDateTime(new Date()));

      // Broadcast real-time ke APK karyawan via Pusher WebSocket
      try {
        const idKaryawan = allData[i][1];
        const jenisIzin = allData[i][4] || 'Izin/Cuti';
        triggerPusher('pinguin-chat', 'izin-alert', {
          idKaryawan: idKaryawan,
          nama: allData[i][2],
          status: status,
          idIzin: idIzin,
          pesan: 'Pengajuan ' + jenisIzin + ' Anda telah ' + (status === 'Approved' ? 'disetujui' : 'ditolak')
        });
        
        // AUTO-RESOLVE Jika disetujui
        if (status === 'Approved') {
          const tglMulai = allData[i][5];
          const tglSelesai = allData[i][6];
          autoResolveJadwalHarian(idKaryawan, tglMulai, tglSelesai);
        }
      } catch (e) {
        Logger.log('Gagal mengirim push izin atau auto-resolve: ' + e.message);
      }

      // Kirim FCM notifikasi izin disetujui
      try {
        sendPushNotification(allData[i][1], 'Izin/Cuti Disetujui ✅', 'Pengajuan izin/cuti Anda telah disetujui.', 'aktivitas_umum_channel');
      } catch(e) {
        Logger.log('FCM approve izin error: ' + e.toString());
      }

      return { success: true, message: 'Izin ' + status.toLowerCase() };
    }
  }

  return { success: false, error: 'Data izin tidak ditemukan' };
}

// ==================== MY APPROVALS (KARYAWAN) ====================
function getMyApprovals(data) {
  const { idKaryawan } = data;
  const lembur = getSheetData(SHEET_NAMES.LEMBUR).filter(l =>
    l.ID_Karyawan === idKaryawan && l.Status !== 'Pending'
  );
  const izin = getSheetData(SHEET_NAMES.IZIN_CUTI).filter(i =>
    i.ID_Karyawan === idKaryawan && i.Status !== 'Pending'
  );
  const tukarShift = getSheetData(SHEET_NAMES.TUKAR_SHIFT).filter(t =>
    t.ID_Karyawan === idKaryawan && t.Status !== 'Pending'
  );

  const result = [
    ...lembur.map(l => ({
      tipe: 'lembur',
      id: l.ID,
      status: l.Status,
      tanggal: l.Tanggal,
      nama: l.Nama,
      approvedAt: l.Approved_At
    })),
    ...izin.map(i => ({
      tipe: 'izin',
      id: i.ID,
      status: i.Status,
      tanggal: i.Tanggal_Mulai,
      nama: i.Nama,
      approvedAt: i.Approved_At
    })),
    ...tukarShift.map(t => ({
      tipe: 'tukar_shift',
      id: t.ID_Tukar,
      status: t.Status,
      tanggal: t.Tanggal,
      nama: t.Nama,
      approvedAt: t.Approved_At
    }))
  ].sort((a, b) => new Date(b.approvedAt || 0) - new Date(a.approvedAt || 0));

  return { success: true, data: result.slice(0, 5) };
}
// ==================== ADMIN PENDING APPROVALS ====================
function getPendingApprovals(data) {
  const lembur = getSheetData(SHEET_NAMES.LEMBUR).filter(l => l.Status === 'Pending');
  const izin = getSheetData(SHEET_NAMES.IZIN_CUTI).filter(i => i.Status === 'Pending');

  const result = [
    ...lembur.map(l => ({
      tipe: 'lembur',
      id: l.ID,
      nama: l.Nama,
      toko: l.Nama_Toko,
      detail: l.Alasan || 'Pengajuan lembur',
      waktu: l.Tanggal,
      fotoUrl: l.Foto_URL || ''
    })),
    ...izin.map(i => ({
      tipe: 'izin',
      id: i.ID,
      nama: i.Nama,
      toko: '—',
      detail: i.Nama_Jenis + ' | ' + i.Tanggal_Mulai + (i.Tanggal_Mulai !== i.Tanggal_Selesai ? ' s/d ' + i.Tanggal_Selesai : '') + ' (' + i.Jumlah_Hari + ' hari)',
      waktu: i.Tanggal_Mulai,
      fotoUrl: i.Lampiran_URL || ''
    }))
  ];

  return { success: true, data: result };
}
// ==================== CRUD TOKO ====================
function getTokoList() {
  return { success: true, data: getSheetData(SHEET_NAMES.MASTER_TOKO) };
}

function saveToko(data) {
  const { nama, alamat, lat, lng, radius, jamBuka, jamTutup, fotoUrl } = data;
  const idToko = generateId('T');

  const safeLat = lat ? (String(lat).startsWith("'") ? lat : "'" + lat) : '';
  const safeLng = lng ? (String(lng).startsWith("'") ? lng : "'" + lng) : '';

  appendRow(SHEET_NAMES.MASTER_TOKO, [
    idToko, nama, alamat, safeLat, safeLng, radius || 50, jamBuka || '08:00', jamTutup || '22:00', fotoUrl || '', 'Aktif'
  ]);

  return { success: true, idToko: idToko, message: 'Toko berhasil ditambahkan' };
}

function updateToko(data) {
  const { idToko, nama, alamat, lat, lng, radius, jamBuka, jamTutup, fotoUrl, status } = data;

  const sheet = getSheet(SHEET_NAMES.MASTER_TOKO);
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === idToko) {
      if (nama !== undefined) sheet.getRange(i + 1, 2).setValue(nama);
      if (alamat !== undefined) sheet.getRange(i + 1, 3).setValue(alamat);
      if (lat !== undefined) {
          const safeLat = lat ? (String(lat).startsWith("'") ? lat : "'" + lat) : '';
          sheet.getRange(i + 1, 4).setValue(safeLat);
      }
      if (lng !== undefined) {
          const safeLng = lng ? (String(lng).startsWith("'") ? lng : "'" + lng) : '';
          sheet.getRange(i + 1, 5).setValue(safeLng);
      }
      if (radius !== undefined) sheet.getRange(i + 1, 6).setValue(radius);
      if (jamBuka !== undefined) sheet.getRange(i + 1, 7).setValue(jamBuka);
      if (jamTutup !== undefined) sheet.getRange(i + 1, 8).setValue(jamTutup);
      if (fotoUrl !== undefined) sheet.getRange(i + 1, 9).setValue(fotoUrl);
      if (status !== undefined) sheet.getRange(i + 1, 10).setValue(status);
      return { success: true, message: 'Toko berhasil diupdate' };
    }
  }

  return { success: false, error: 'Toko tidak ditemukan' };
}

function deleteToko(data) {
  const { idToko } = data;
  return updateToko({ idToko: idToko, status: 'Nonaktif' });
}
// ==================== DELETE TOKO PERMANEN ====================
function deleteTokoPermanent(data) {
  const { idToko } = data;

  const sheet = getSheet(SHEET_NAMES.MASTER_TOKO);
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === idToko) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Toko dihapus permanen' };
    }
  }

  return { success: false, error: 'Toko tidak ditemukan' };
}
function getAllShifts() {
  const shifts = getSheetData(SHEET_NAMES.SHIFT_TOKO);
  const tokos = getSheetData(SHEET_NAMES.MASTER_TOKO);
  const formattedShifts = shifts.map(s => {
    const toko = tokos.find(t => t.ID_Toko === s.ID_Toko);
    return {
      ...s,
      Jam_Masuk: formatTimeOnly(s.Jam_Masuk),
      Jam_Pulang: formatTimeOnly(s.Jam_Pulang),
      Foto_Toko_URL: toko ? toko.Foto_Toko_URL : ''
    };
  });
  return { success: true, data: formattedShifts };
}
function getShiftByToko(data) {
  const { idToko } = data;
  const shifts = getSheetData(SHEET_NAMES.SHIFT_TOKO);
  const tokos = getSheetData(SHEET_NAMES.MASTER_TOKO);
  const formattedShifts = shifts.map(s => {
    const toko = tokos.find(t => t.ID_Toko === s.ID_Toko);
    return {
      ...s,
      Jam_Masuk: formatTimeOnly(s.Jam_Masuk),
      Jam_Pulang: formatTimeOnly(s.Jam_Pulang),
      Foto_Toko_URL: toko ? toko.Foto_Toko_URL : ''
    };
  });
  if (!idToko) return { success: true, data: formattedShifts };
  return { success: true, data: formattedShifts.filter(s => s.ID_Toko === idToko) };
}

function saveShift(data) {
  const { idToko, namaToko, namaShift, jamMasuk, jamPulang, toleransi } = data;
  const idShift = generateId('S');

  appendRow(SHEET_NAMES.SHIFT_TOKO, [
    idShift, idToko, namaToko, namaShift, jamMasuk, jamPulang, toleransi || 15, 'Aktif'
  ]);

  return { success: true, idShift: idShift };
}
// ==================== DELETE SHIFT PERMANEN ====================
function deleteShiftPermanent(data) {
  const { idShift } = data;

  const sheet = getSheet(SHEET_NAMES.SHIFT_TOKO);
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === idShift) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Shift dihapus permanen' };
    }
  }

  return { success: false, error: 'Shift tidak ditemukan' };
}
function updateShift(data) {
  const { idShift, namaShift, jamMasuk, jamPulang, toleransi, status } = data;

  const sheet = getSheet(SHEET_NAMES.SHIFT_TOKO);
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === idShift) {
      if (namaShift !== undefined) sheet.getRange(i + 1, 4).setValue(namaShift);
      if (jamMasuk !== undefined) sheet.getRange(i + 1, 5).setValue(jamMasuk);
      if (jamPulang !== undefined) sheet.getRange(i + 1, 6).setValue(jamPulang);
      if (toleransi !== undefined) sheet.getRange(i + 1, 7).setValue(toleransi);
      if (status !== undefined) sheet.getRange(i + 1, 8).setValue(status);
      return { success: true, message: 'Shift berhasil diupdate' };
    }
  }

  return { success: false, error: 'Shift tidak ditemukan' };
}
// ==================== CRUD KARYAWAN ====================
// TAMBAHKAN DI Code.gs — fungsi untuk cek dan fix header
function ensureKaryawanFotoColumn() {
  const sheet = getSheet(SHEET_NAMES.MASTER_KARYAWAN);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Jika belum ada kolom Foto_Profil atau Foto_URL, tambahkan Foto_Profil
  if (!headers.includes('Foto_Profil') && !headers.includes('Foto_URL')) {
    const nextCol = headers.length + 1;
    sheet.getRange(1, nextCol).setValue('Foto_Profil');
    sheet.getRange(1, nextCol).setFontWeight('bold').setBackground('#4285F4').setFontColor('white');
  }

  // Jika belum ada kolom Face_ID, tambahkan
  if (!headers.includes('Face_ID')) {
    const nextCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, nextCol).setValue('Face_ID');
    sheet.getRange(1, nextCol).setFontWeight('bold').setBackground('#4285F4').setFontColor('white');
  }
  
  return 'OK';
}
// ==================== UPLOAD FOTO PROFIL ====================
function uploadFotoProfil(data) {
  try {
    const { fotoBase64, idKaryawan } = data;

    if (!fotoBase64 || !fotoBase64.startsWith('data:image')) {
      return { success: false, error: 'Foto tidak valid' };
    }

    const settings = getSheetData(SHEET_NAMES.SETTING_GLOBAL);
    const folderId = settings.find(s => s.Parameter === 'FOLDER_DRIVE_ID')?.Value || '1tJgsRcaRejhI6SAvDfrikvOTOEHz2CEw';

    if (!folderId) throw new Error('Folder Drive ID belum diatur');

    const folder = DriveApp.getFolderById(folderId);
    const subFolders = folder.getFoldersByName('Foto_Profil');
    const subFolder = subFolders.hasNext() ? subFolders.next() : folder.createFolder('Foto_Profil');

    const safeName = (idKaryawan || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss') + '_' + safeName + '.jpg';

    const base64Data = fotoBase64.split(',')[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/jpeg', fileName);
    const file = subFolder.createFile(blob);

    // Share publik
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const thumbUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400';

    return {
      success: true,
      fotoUrl: thumbUrl,
      fileId: fileId
    };

  } catch (e) {
    logError('uploadFotoProfil', e, data);
    return { success: false, error: 'Gagal upload: ' + e.toString() };
  }
}
function getKaryawanList() {
  return { success: true, data: getSheetData(SHEET_NAMES.MASTER_KARYAWAN) };
}

// Update saveKaryawan:
function ensureKaryawanExtraColumns() {
  const sheet = getSheet(SHEET_NAMES.MASTER_KARYAWAN);
  if (!sheet) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const required = ['Alamat_Lengkap', 'Kontak_Darurat', 'Nama_Kontak_Darurat', 'Foto_KTP', 'NIK', 'Tempat_Lahir', 'Tanggal_Lahir', 'Jenis_Kelamin', 'RT_RW', 'Desa', 'Kecamatan', 'Agama', 'Status_Kawin', 'Kewarganegaraan', 'Profil_Lengkap'];
  let added = false;
  required.forEach(col => {
    if (!headers.includes(col)) {
      sheet.insertColumnAfter(headers.length);
      sheet.getRange(1, headers.length + 1).setValue(col);
      headers.push(col);
      added = true;
    }
  });
}

function saveKaryawan(data) {
  const { nama, pin, jabatan, noHP, email, tglMasuk, tokoDefault, shiftDefault, fotoUrl, alamatLengkap, kontakDarurat, namaKontakDarurat, fotoKtp } = data;
  const idKaryawan = generateId('K');
  ensureKaryawanExtraColumns();

  appendRow(SHEET_NAMES.MASTER_KARYAWAN, [
    idKaryawan, nama, pin || '0000', jabatan, tglMasuk || formatDate(new Date()),
    'Aktif', noHP || '', email || '', tokoDefault || '', shiftDefault || '', fotoUrl || '',
    '', '', '', // Placeholder for FCM_Token, Device_ID, Device_Name
    alamatLengkap || '', kontakDarurat || '', namaKontakDarurat || '', fotoKtp || ''
  ]);

  return { success: true, idKaryawan: idKaryawan, fotoUrl: fotoUrl };
}


// Update updateKaryawan:
function updateKaryawan(data) {
  const { idKaryawan, nama, pin, jabatan, noHP, email, status, tokoDefault, shiftDefault, fotoUrl, alamatLengkap, kontakDarurat, namaKontakDarurat, fotoKtp, tglMasuk } = data;

  ensureKaryawanExtraColumns();
  const sheet = getSheet(SHEET_NAMES.MASTER_KARYAWAN);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === idKaryawan) {
      if (nama !== undefined) sheet.getRange(i + 1, 2).setValue(nama);
      if (pin !== undefined) sheet.getRange(i + 1, 3).setValue(pin);
      if (jabatan !== undefined) sheet.getRange(i + 1, 4).setValue(jabatan);
      if (tglMasuk !== undefined) sheet.getRange(i + 1, 5).setValue(tglMasuk);
      if (status !== undefined) sheet.getRange(i + 1, 6).setValue(status);
      if (noHP !== undefined) sheet.getRange(i + 1, 7).setValue(noHP);
      if (email !== undefined) sheet.getRange(i + 1, 8).setValue(email);
      if (tokoDefault !== undefined) sheet.getRange(i + 1, 9).setValue(tokoDefault);
      if (shiftDefault !== undefined) sheet.getRange(i + 1, 10).setValue(shiftDefault);
      
      if (fotoUrl !== undefined) { let c = headers.indexOf('Foto_Profil'); if(c !== -1) sheet.getRange(i+1, c+1).setValue(fotoUrl); else sheet.getRange(i+1, 11).setValue(fotoUrl); }
      if (alamatLengkap !== undefined) { let c = headers.indexOf('Alamat_Lengkap'); if(c !== -1) sheet.getRange(i+1, c+1).setValue(alamatLengkap); }
      if (kontakDarurat !== undefined) { let c = headers.indexOf('Kontak_Darurat'); if(c !== -1) sheet.getRange(i+1, c+1).setValue(kontakDarurat); }
      if (namaKontakDarurat !== undefined) { let c = headers.indexOf('Nama_Kontak_Darurat'); if(c !== -1) sheet.getRange(i+1, c+1).setValue(namaKontakDarurat); }
      if (fotoKtp !== undefined) { let c = headers.indexOf('Foto_KTP'); if(c !== -1) sheet.getRange(i+1, c+1).setValue(fotoKtp); }

      return { success: true, message: 'Karyawan berhasil diupdate' };
    }
  }

  return { success: false, error: 'Karyawan tidak ditemukan' };
}

function deleteKaryawan(data) {
  const { idKaryawan } = data;
  return updateKaryawan({ idKaryawan: idKaryawan, status: 'Nonaktif' });
}
// ==================== UPDATE JADWAL KARYAWAN ====================
function updateJadwalKaryawan(data) {
  const { idJadwal, idToko, namaToko, idShift, namaShift, hari, tglMulai, tglSelesai, status } = data;

  const sheet = getSheet(SHEET_NAMES.JADWAL_KARYAWAN);
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === idJadwal) {
      if (idToko !== undefined) sheet.getRange(i + 1, 4).setValue(idToko);
      if (namaToko !== undefined) sheet.getRange(i + 1, 5).setValue(namaToko);
      if (idShift !== undefined) sheet.getRange(i + 1, 6).setValue(idShift);
      if (namaShift !== undefined) sheet.getRange(i + 1, 7).setValue(namaShift);
      if (hari !== undefined) sheet.getRange(i + 1, 8).setValue(hari);
      if (tglMulai !== undefined) sheet.getRange(i + 1, 9).setValue(tglMulai);
      if (tglSelesai !== undefined) sheet.getRange(i + 1, 10).setValue(tglSelesai);
      if (status !== undefined) sheet.getRange(i + 1, 11).setValue(status);
      return { success: true, message: 'Jadwal berhasil diupdate' };
    }
  }

  return { success: false, error: 'Jadwal tidak ditemukan' };
}
// TAMBAH di Code.gs (opsional, untuk performa)
function getJadwalByTokoPeriode(data) {
  const { idToko, tanggalMulai, tanggalAkhir } = data;
  const jadwal = getSheetData(SHEET_NAMES.JADWAL_KARYAWAN).filter(j => {
    return j.ID_Toko === idToko &&
      j.Status === 'Aktif' &&
      new Date(j.Tanggal_Mulai) <= new Date(tanggalAkhir) &&
      new Date(j.Tanggal_Selesai) >= new Date(tanggalMulai);
  });
  return { success: true, data: jadwal };
}
// ==================== DELETE JADWAL KARYAWAN ====================
function deleteJadwalKaryawan(data) {
  const { idJadwal } = data;

  const sheet = getSheet(SHEET_NAMES.JADWAL_KARYAWAN);
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === idJadwal) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Jadwal dihapus permanen' };
    }
  }

  return { success: false, error: 'Jadwal tidak ditemukan' };
}
function getJadwalKaryawan(data) {
  const { idKaryawan } = data;
  const jadwal = getSheetData(SHEET_NAMES.JADWAL_KARYAWAN).filter(j => j.ID_Karyawan === idKaryawan);
  return { success: true, data: jadwal };
}

function saveJadwalKaryawan(data) {
  const { idKaryawan, idToko, namaToko, idShift, namaShift, hari, tglMulai, tglSelesai } = data;
  const idJadwal = generateId('J');

  appendRow(SHEET_NAMES.JADWAL_KARYAWAN, [
    idJadwal, idKaryawan, '', idToko, namaToko, idShift, namaShift, hari,
    tglMulai || formatDate(new Date()), tglSelesai || '2099-12-31', 'Aktif'
  ]);

    // Broadcast notifikasi perubahan jadwal
    try {
      triggerPusher('pinguin-chat', 'jadwal-alert', {
        idKaryawan: idKaryawan,
        pesan: 'Jadwal Anda tanggal ' + (tglMulai || formatDate(new Date())) + ' - ' + (tglSelesai || 'seterusnya') + ' telah dirubah'
      });
    } catch (e) { Logger.log('Pusher jadwal error: ' + e.toString()); }

  return { success: true, idJadwal: idJadwal };
}

// ==================== CRUD JENIS IZIN ====================
function getJenisIzinList() {
  return { success: true, data: getSheetData(SHEET_NAMES.MASTER_JENIS_IZIN) };
}

function saveJenisIzin(data) {
  const { nama, kode, kuotaTahun, kuotaBulan, maxHari, gender, potongCuti, syaratHari } = data;
  const idJenis = generateId('JI');

  appendRow(SHEET_NAMES.MASTER_JENIS_IZIN, [
    idJenis, nama, kode, kuotaTahun || '', kuotaBulan || '', maxHari || 3,
    gender || 'Semua', potongCuti || 'Tidak', syaratHari || 90, 'Aktif'
  ]);

  return { success: true, idJenis: idJenis };
}

function updateJenisIzin(data) {
  const { idJenis, nama, kode, kuotaTahun, kuotaBulan, maxHari, gender, potongCuti, syaratHari, status } = data;

  const sheet = getSheet(SHEET_NAMES.MASTER_JENIS_IZIN);
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === idJenis) {
      if (nama !== undefined) sheet.getRange(i + 1, 2).setValue(nama);
      if (kode !== undefined) sheet.getRange(i + 1, 3).setValue(kode);
      if (kuotaTahun !== undefined) sheet.getRange(i + 1, 4).setValue(kuotaTahun);
      if (kuotaBulan !== undefined) sheet.getRange(i + 1, 5).setValue(kuotaBulan);
      if (maxHari !== undefined) sheet.getRange(i + 1, 6).setValue(maxHari);
      if (gender !== undefined) sheet.getRange(i + 1, 7).setValue(gender);
      if (potongCuti !== undefined) sheet.getRange(i + 1, 8).setValue(potongCuti);
      if (syaratHari !== undefined) sheet.getRange(i + 1, 9).setValue(syaratHari);
      if (status !== undefined) sheet.getRange(i + 1, 10).setValue(status);
      return { success: true, message: 'Jenis izin diupdate' };
    }
  }

  return { success: false, error: 'Jenis izin tidak ditemukan' };
}

function deleteJenisIzin(data) {
  const { idJenis } = data;
  return updateJenisIzin({ idJenis: idJenis, status: 'Nonaktif' });
}

// ==================== DRIVE UPLOAD ====================
function uploadFotoToDrive(base64Data, idKaryawan, tipe) {
  try {
    const settings = getSheetData(SHEET_NAMES.SETTING_GLOBAL);
    const folderId = settings.find(s => s.Parameter === 'FOLDER_DRIVE_ID')?.Value || '1tJgsRcaRejhI6SAvDfrikvOTOEHz2CEw';

    if (!folderId) throw new Error('Folder Drive ID belum diatur');

    const folder = DriveApp.getFolderById(folderId);
    const subFolderName = 'Foto_' + tipe;
    const subFolders = folder.getFoldersByName(subFolderName);
    const subFolder = subFolders.hasNext() ? subFolders.next() : folder.createFolder(subFolderName);

    const bulanFolderName = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM');
    const bulanFolders = subFolder.getFoldersByName(bulanFolderName);
    const bulanFolder = bulanFolders.hasNext() ? bulanFolders.next() : subFolder.createFolder(bulanFolderName);

    const fileName = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd') + '_' + idKaryawan + '_' + tipe + '.jpg';
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data.split(',')[1]), 'image/jpeg', fileName);
    const file = bulanFolder.createFile(blob);

    return 'https://drive.google.com/uc?id=' + file.getId();
  } catch (e) {
    logError('uploadFotoToDrive', e, { idKaryawan, tipe });
    return '';
  }
}

function uploadFileToDrive(base64Data, idKaryawan, tipe) {
  try {
    const settings = getSheetData(SHEET_NAMES.SETTING_GLOBAL);
    const folderId = settings.find(s => s.Parameter === 'FOLDER_DRIVE_ID')?.Value || '1tJgsRcaRejhI6SAvDfrikvOTOEHz2CEw';

    if (!folderId) throw new Error('Folder Drive ID belum diatur');

    const folder = DriveApp.getFolderById(folderId);
    const subFolderName = 'Lampiran_' + tipe;
    const subFolders = folder.getFoldersByName(subFolderName);
    const subFolder = subFolders.hasNext() ? subFolders.next() : folder.createFolder(subFolderName);

    let mimeType = 'application/pdf';
    let ext = '.pdf';
    let cleanBase64 = base64Data;

    if (base64Data.indexOf(';base64,') !== -1) {
      const parts = base64Data.split(';base64,');
      cleanBase64 = parts[1];
      mimeType = parts[0].split(':')[1] || 'application/pdf';
      if (mimeType.includes('image/')) {
        ext = '.' + mimeType.split('/')[1];
      }
    } else if (base64Data.indexOf(',') !== -1) {
      cleanBase64 = base64Data.split(',')[1];
    }

    const fileName = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd') + '_' + idKaryawan + '_' + tipe;
    const blob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), mimeType, fileName + ext);
    const file = subFolder.createFile(blob);

    return 'https://drive.google.com/uc?id=' + file.getId();
  } catch (e) {
    logError('uploadFileToDrive', e, { idKaryawan, tipe });
    return '';
  }
}
function getIzinPeriode(data) {
  try {
    const { idKaryawan, tanggalMulai, tanggalAkhir, bulan, tahun, mode } = data;

    if (!idKaryawan) {
      return { success: false, error: 'ID Karyawan wajib diisi' };
    }

    // Ambil semua izin Approved untuk karyawan ini
    const allIzin = getSheetData(SHEET_NAMES.IZIN_CUTI) || [];
    let izin = allIzin.filter(i =>
      String(i.ID_Karyawan).trim() === String(idKaryawan).trim() &&
      String(i.Status).trim() === 'Approved'
    );

    // Filter berdasarkan periode
    if (mode === 'harian') {
      const tgl = tanggalMulai || formatDate(new Date());
      izin = izin.filter(i => {
        if (!i.Tanggal_Mulai) return false;
        return formatDate(new Date(i.Tanggal_Mulai)) === tgl;
      });

    } else if (mode === 'mingguan') {
      if (tanggalMulai && tanggalAkhir) {
        const mulai = new Date(tanggalMulai);
        const akhir = new Date(tanggalAkhir);
        izin = izin.filter(i => {
          if (!i.Tanggal_Mulai) return false;
          const tgl = new Date(i.Tanggal_Mulai);
          return tgl >= mulai && tgl <= akhir;
        });
      }

    } else if (mode === 'bulanan') {
      if (bulan && tahun) {
        const bln = parseInt(bulan);
        const thn = parseInt(tahun);
        izin = izin.filter(i => {
          if (!i.Tanggal_Mulai) return false;
          const tgl = new Date(i.Tanggal_Mulai);
          return tgl.getMonth() + 1 === bln && tgl.getFullYear() === thn;
        });
      }

    } else if (mode === 'tahunan') {
      const thn = parseInt(tahun || new Date().getFullYear());
      izin = izin.filter(i => {
        if (!i.Tanggal_Mulai) return false;
        return new Date(i.Tanggal_Mulai).getFullYear() === thn;
      });
    }

    // Hitung total hari dengan aman (handle string/number/empty)
    const totalHari = izin.reduce((sum, i) => {
      const hari = parseInt(i.Jumlah_Hari);
      return sum + (isNaN(hari) ? 0 : hari);
    }, 0);

    return {
      success: true,
      totalIzin: totalHari,
      jumlahRecord: izin.length,
      detail: izin
    };

  } catch (e) {
    logError('getIzinPeriode', e, data);
    return { success: false, error: 'Server error: ' + e.toString() };
  }
}
// ==================== CHAT ====================
function getChatMessages(data) {
  const { limit = 50, offset = 0 } = data || {};
  const chat = getSheetData(SHEET_NAMES.CHAT);
  // Sort by timestamp descending, then reverse for chronological display
  const sorted = chat.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
  const limited = sorted.slice(offset, offset + limit);

  return {
    success: true,
    data: limited.reverse().map(c => ({
      idPesan: c.ID_Pesan,
      idKaryawan: c.ID_Karyawan,
      nama: c.Nama,
      pesan: c.Pesan,
      tipe: c.Tipe || 'text',
      fileUrl: c.File_URL || '',
      namaFile: c.Nama_File || '',
      replyTo: c.Reply_To || c.replyTo || null,
      waktu: formatDateTime(new Date(c.Timestamp))
    }))
  };
}

// ==================== ONLINE PRESENCE ====================
function pingOnline(data) {
  try {
    const { idKaryawan, nama } = data;
    if (!idKaryawan || !nama) return { success: false, error: 'Data tidak lengkap' };
    
    const props = PropertiesService.getScriptProperties();
    props.setProperty('ping_' + idKaryawan + '_' + nama, new Date().getTime().toString());
    
    const allProps = props.getProperties();
    const now = new Date().getTime();
    const activeNames = [];
    
    for (let key in allProps) {
      if (key.startsWith('ping_')) {
        const ts = parseInt(allProps[key]);
        if (now - ts < 5 * 60 * 1000) {
          const parts = key.split('_');
          if (parts.length >= 3) {
            activeNames.push(parts.slice(2).join('_'));
          }
        } else {
          props.deleteProperty(key);
        }
      }
    }
    
    return { success: true, activeUsers: activeNames };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function sendChatMessage(data) {
  const { idKaryawan, nama, pesan, tipe, fileBase64, namaFile, replyTo } = data;
  if (!idKaryawan || (!pesan && !fileBase64)) {
    return { success: false, error: 'Data tidak lengkap' };
  }

  let fileUrl = '';
  let sizeKB = 0;

  // Handle file upload if present
  if (fileBase64 && (tipe === 'image' || tipe === 'file')) {
    try {
      const folderType = tipe === 'image' ? 'Chat_Images' : 'Chat_Files';
      const mimeType = tipe === 'image' ? 'image/jpeg' : 'application/octet-stream';
      const ext = tipe === 'image' ? '.jpg' : (namaFile.match(/\.[^.]+$/) || ['.bin'])[0];

      const settings = getSheetData(SHEET_NAMES.SETTING_GLOBAL);
      const folderSetting = settings.find(s => s.Parameter === 'FOLDER_DRIVE_ID');
      const folderId = (folderSetting ? folderSetting.Value : '') || '1tJgsRcaRejhI6SAvDfrikvOTOEHz2CEw';
      
      Logger.log('[CHAT_UPLOAD] folderType=' + folderType + ', folderId=' + folderId + ', namaFile=' + namaFile + ', base64Length=' + (fileBase64 ? fileBase64.length : 0));

      if (folderId) {
        const folder = DriveApp.getFolderById(folderId);
        const subFolders = folder.getFoldersByName(folderType);
        const subFolder = subFolders.hasNext() ? subFolders.next() : folder.createFolder(folderType);

        // Sub-folder per bulan agar mudah dihapus jika memori penuh
        const bulanFolderName = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM');
        const bulanFolders = subFolder.getFoldersByName(bulanFolderName);
        const bulanFolder = bulanFolders.hasNext() ? bulanFolders.next() : subFolder.createFolder(bulanFolderName);

        const fileName = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss') + '_' + idKaryawan + ext;
        const base64Data = fileBase64.split(',')[1] || fileBase64;
        const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
        const file = bulanFolder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fileUrl = 'https://drive.google.com/uc?id=' + file.getId();
        sizeKB = Math.round(base64Data.length * 0.75 / 1024);
        Logger.log('[CHAT_UPLOAD] SUCCESS fileUrl=' + fileUrl + ', sizeKB=' + sizeKB);
      } else {
        Logger.log('[CHAT_UPLOAD] FAILED: FOLDER_DRIVE_ID kosong atau tidak ditemukan di SETTING_GLOBAL');
      }
    } catch (e) {
      Logger.log('[CHAT_UPLOAD] ERROR: ' + e.toString());
      logError('sendChatMessage_upload', e, data);
    }
  }

  const idPesan = generateId('CH');
  appendRow(SHEET_NAMES.CHAT, [
    formatDateTime(new Date()),
    idPesan,
    idKaryawan,
    nama,
    pesan,
    tipe || 'text',
    fileUrl,
    namaFile || '',
    sizeKB,
    replyTo || ''
  ]);

  // Kirim FCM ke semua karyawan kecuali pengirim
  try {
    const allKaryawan = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
    // Cari foto profil pengirim
    const sender = allKaryawan.find(k => String(k.ID_Karyawan) === String(idKaryawan));
    const senderFoto = sender ? (sender.Foto_Profil || '') : '';

    const targetKaryawan = allKaryawan.filter(k => k.Status === 'Aktif' && String(k.ID_Karyawan) !== String(idKaryawan));
    
    Logger.log('[FCM Chat] Mengirim notifikasi ke ' + targetKaryawan.length + ' karyawan aktif');
    
    targetKaryawan.forEach(k => {
      try {
        sendPushNotification(
            k.ID_Karyawan, 
            'Pesan dari ' + nama, 
            pesan || 'Mengirim file', 
            'pesan_chat_channel',
            { 
                sender_id: idKaryawan,
                sender_name: nama,
                sender_foto: senderFoto,
                pesan: pesan || 'Mengirim file'
            }
        );
      } catch(e) {
        Logger.log('[FCM Chat] Gagal kirim ke ' + k.ID_Karyawan + ' (' + k.Nama + '): ' + e.toString());
      }
    });
  } catch(e) {
    Logger.log('FCM chat broadcast error: ' + e.toString());
  }

  return { success: true, idPesan: idPesan, fileUrl: fileUrl };
}

// ==================== TUKAR SHIFT ====================
function ajukanTukarShift(data) {
  const { idKaryawan, nama, idTokoSaya, idTokoTujuan, idKaryawanTujuan, shiftSaya, shiftTujuan, tanggal, alasan } = data;

  if (!idKaryawan || !idTokoSaya || !idTokoTujuan || !idKaryawanTujuan || !shiftSaya || !shiftTujuan || !tanggal) {
    return { success: false, error: 'Data tidak lengkap' };
  }

  const idTukar = generateId('TS');
  appendRow(SHEET_NAMES.TUKAR_SHIFT, [
    formatDateTime(new Date()),
    idTukar,
    idKaryawan,
    nama,
    idTokoSaya,
    idTokoTujuan,
    idKaryawanTujuan,
    shiftSaya,
    shiftTujuan,
    tanggal,
    alasan || '',
    'Pending',
    '',
    ''
  ]);

  // Broadcast real-time swap shift request via Pusher WebSocket
  try {
    triggerPusher('pinguin-chat', 'swap-shift-alert', {
      targetId: idKaryawanTujuan,
      requesterName: nama
    });
  } catch (e) {
    Logger.log('Pusher trigger failed in ajukanTukarShift: ' + e.toString());
  }

  // Kirim FCM notifikasi ke target tukar shift
  try {
    sendPushNotification(idKaryawanTujuan, 'Permintaan Tukar Shift', nama + ' mengajukan tukar shift dengan Anda pada tanggal ' + tanggal, 'aktivitas_umum_channel');
  } catch(e) {
    Logger.log('FCM ajukan tukar shift error: ' + e.toString());
  }

  // Kirim notifikasi ke semua admin
  try {
    let namaTarget = idKaryawanTujuan;
    try {
      const targetKaryawan = getSheetData(SHEET_NAMES.MASTER_KARYAWAN).find(k => k.ID_Karyawan === idKaryawanTujuan);
      if (targetKaryawan) {
        namaTarget = targetKaryawan.Nama || targetKaryawan.nama || idKaryawanTujuan;
      }
    } catch(err) {
      Logger.log('Gagal mencari nama target: ' + err.toString());
    }

    const idTarget = idKaryawanTujuan;

    sendPushNotificationToAllAdmin(
      '⇆ Pengajuan Tukar Shift',
      nama + ' mengajukan tukar shift dengan ' + namaTarget,
      'shift_channel',
      { type: 'tukar_shift', idKaryawan: idKaryawan, idTarget: idTarget }
    );
  } catch(e) {
    Logger.log('FCM broadcast ajukan tukar shift ke admin error: ' + e.toString());
  }

  return { success: true, idTukar: idTukar, message: 'Pengajuan tukar shift berhasil' };
}

function getTukarShiftHistory(data) {
  const { idKaryawan } = data;
  if (!idKaryawan) return { success: false, error: 'ID Karyawan wajib diisi' };

  const tukar = getSheetData(SHEET_NAMES.TUKAR_SHIFT).filter(t =>
    String(t.ID_Karyawan).trim() === String(idKaryawan).trim() ||
    String(t.ID_Karyawan_Tujuan).trim() === String(idKaryawan).trim()
  );

  return {
    success: true,
    data: tukar.map(t => ({
      id: t.ID_Tukar,
      status: t.Status,
      tanggal: t.Tanggal,
      tokoSaya: t.ID_Toko_Saya,
      tokoTujuan: t.ID_Toko_Tujuan,
      shiftSaya: t.Shift_Saya,
      shiftTujuan: t.Shift_Tujuan,
      alasan: t.Alasan,
      tanggalPengajuan: formatDateTime(new Date(t.Timestamp))
    }))
  };
}

function getPendingTukarShift(data) {
  const { idKaryawan } = data;
  if (!idKaryawan) return { success: false, error: 'ID Karyawan wajib diisi' };

  const karyawanList = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);

  // Ambil semua pengajuan Tukar Shift yang pending untuk karyawan ini (sebagai tujuan)
  const swapList = getSheetData(SHEET_NAMES.TUKAR_SHIFT).filter(t =>
    t.Status === 'Pending' && t.ID_Karyawan_Tujuan === idKaryawan
  );

  const tokoList = getSheetData(SHEET_NAMES.MASTER_TOKO);
  const shiftList = getSheetData(SHEET_NAMES.SHIFT_TOKO);

  const result = swapList.map(t => {
    const requester = karyawanList.find(k => k.ID_Karyawan === t.ID_Karyawan);
    const tokoSaya = tokoList.find(tk => tk.ID_Toko === t.ID_Toko_Saya);
    const tokoTujuan = tokoList.find(tk => tk.ID_Toko === t.ID_Toko_Tujuan);
    const shiftSaya = shiftList.find(sf => sf.ID_Shift === t.Shift_Saya);
    const shiftTujuan = shiftList.find(sf => sf.ID_Shift === t.Shift_Tujuan);

    return {
      id: t.ID_Tukar,
      idKaryawanSaya: t.ID_Karyawan,
      namaSaya: t.Nama,
      fotoSaya: requester ? (requester.Foto_Profil || requester.Foto_URL || '') : '',
      jabatanSaya: requester ? (requester.Jabatan || 'Karyawan') : 'Karyawan',
      idTokoSaya: t.ID_Toko_Saya,
      namaTokoSaya: tokoSaya ? tokoSaya.Nama_Toko : 'Toko A',
      idTokoTujuan: t.ID_Toko_Tujuan,
      namaTokoTujuan: tokoTujuan ? tokoTujuan.Nama_Toko : 'Toko B',
      shiftSaya: t.Shift_Saya,
      namaShiftSaya: shiftSaya ? shiftSaya.Nama_Shift : 'Shift A',
      jamMasukSaya: shiftSaya ? formatTimeOnly(shiftSaya.Jam_Masuk) : '—',
      jamPulangSaya: shiftSaya ? formatTimeOnly(shiftSaya.Jam_Pulang) : '—',
      shiftTujuan: t.Shift_Tujuan,
      namaShiftTujuan: shiftTujuan ? shiftTujuan.Nama_Shift : 'Shift B',
      jamMasukTujuan: shiftTujuan ? formatTimeOnly(shiftTujuan.Jam_Masuk) : '—',
      jamPulangTujuan: shiftTujuan ? formatTimeOnly(shiftTujuan.Jam_Pulang) : '—',
      tanggal: t.Tanggal,
      alasan: t.Alasan
    };
  });

  return { success: true, data: result };
}

function approveTukarShift(data) {
  const { idTukar, idKaryawan } = data;
  if (!idTukar || !idKaryawan) return { success: false, error: 'Parameter tidak lengkap' };

  const sheet = getSheet(SHEET_NAMES.TUKAR_SHIFT);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idColIndex = headers.indexOf('ID_Tukar');
  const statusColIndex = headers.indexOf('Status');
  const appByColIndex = headers.indexOf('Approved_By');
  const appAtColIndex = headers.indexOf('Approved_At');

  let record = null;
  for (let i = 1; i < values.length; i++) {
    if (values[i][idColIndex] === idTukar) {
      sheet.getRange(i + 1, statusColIndex + 1).setValue('Approved');
      sheet.getRange(i + 1, appByColIndex + 1).setValue(idKaryawan);
      sheet.getRange(i + 1, appAtColIndex + 1).setValue(formatDateTime(new Date()));

      // Ambil detail baris data
      record = {};
      headers.forEach((h, idx) => {
        record[h] = values[i][idx];
      });
      break;
    }
  }

  if (!record) return { success: false, error: 'Pengajuan tidak ditemukan' };

  // === Lakukan penukaran jadwal aktual di database ===
  try {
    const jadSheet = getSheet(SHEET_NAMES.JADWAL_KARYAWAN);
    const jadValues = jadSheet.getDataRange().getValues();
    
    let indexSaya = -1;
    let indexTujuan = -1;
    const targetDateStr = record.Tanggal;
    
    for (let i = 1; i < jadValues.length; i++) {
      const rDateStr = Utilities.formatDate(new Date(jadValues[i][8]), 'Asia/Jakarta', 'yyyy-MM-dd');
      if (rDateStr === targetDateStr) {
        if (jadValues[i][1] === record.ID_Karyawan) indexSaya = i;
        if (jadValues[i][1] === record.ID_Karyawan_Tujuan) indexTujuan = i;
      }
    }
    
    if (indexSaya !== -1 && indexTujuan !== -1) {
      const idSaya = jadValues[indexSaya][1];
      const namaSaya = jadValues[indexSaya][2];
      const idTujuan = jadValues[indexTujuan][1];
      const namaTujuan = jadValues[indexTujuan][2];
      
      jadSheet.getRange(indexSaya + 1, 2).setValue(idTujuan);
      jadSheet.getRange(indexSaya + 1, 3).setValue(namaTujuan);
      
      jadSheet.getRange(indexTujuan + 1, 2).setValue(idSaya);
      jadSheet.getRange(indexTujuan + 1, 3).setValue(namaSaya);
    }
  } catch(e) {
    Logger.log('Gagal menukar jadwal: ' + e.toString());
  }

  // Kirim notifikasi balik ke yang mengajukan (requester)
  try {
    const approver = getSheetData(SHEET_NAMES.MASTER_KARYAWAN).find(k => k.ID_Karyawan === idKaryawan);
    const approverName = approver ? approver.Nama : 'Rekan Anda';
    sendPushNotification(
      record.ID_Karyawan,
      'Tukar Shift Disetujui! ⇆',
      approverName + ' menyetujui ajukan tukar shift Anda pada tanggal ' + record.Tanggal + '.'
    );
  } catch (e) {
    Logger.log('Gagal kirim notif persetujuan: ' + e.toString());
  }

  return { success: true, message: 'Pertukaran shift berhasil disetujui' };
}

function rejectTukarShift(data) {
  const { idTukar, idKaryawan } = data;
  if (!idTukar || !idKaryawan) return { success: false, error: 'Parameter tidak lengkap' };

  const sheet = getSheet(SHEET_NAMES.TUKAR_SHIFT);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idColIndex = headers.indexOf('ID_Tukar');
  const statusColIndex = headers.indexOf('Status');
  const appByColIndex = headers.indexOf('Approved_By');
  const appAtColIndex = headers.indexOf('Approved_At');

  let record = null;
  for (let i = 1; i < values.length; i++) {
    if (values[i][idColIndex] === idTukar) {
      sheet.getRange(i + 1, statusColIndex + 1).setValue('Rejected');
      sheet.getRange(i + 1, appByColIndex + 1).setValue(idKaryawan);
      sheet.getRange(i + 1, appAtColIndex + 1).setValue(formatDateTime(new Date()));

      // Ambil detail baris data
      record = {};
      headers.forEach((h, idx) => {
        record[h] = values[i][idx];
      });
      break;
    }
  }

  if (!record) return { success: false, error: 'Pengajuan tidak ditemukan' };

  // Kirim notifikasi balik ke yang mengajukan (requester)
  try {
    const approver = getSheetData(SHEET_NAMES.MASTER_KARYAWAN).find(k => k.ID_Karyawan === idKaryawan);
    const approverName = approver ? approver.Nama : 'Rekan Anda';
    sendPushNotification(
      record.ID_Karyawan,
      'Tukar Shift Ditolak ⇆',
      approverName + ' menolak ajukan tukar shift Anda pada tanggal ' + record.Tanggal + '.'
    );
  } catch (e) {
    Logger.log('Gagal kirim notif penolakan: ' + e.toString());
  }

  return { success: true, message: 'Pertukaran shift berhasil ditolak' };
}

function checkSwappedJadwal(idKaryawan, tanggalStr, originalJadwal) {
  try {
    const formattedTargetDate = formatDate(new Date(tanggalStr));
    const swapData = getSheetData(SHEET_NAMES.TUKAR_SHIFT).find(t =>
      String(t.Status).trim() === 'Approved' &&
      (formatDate(parseDateSafe(t.Tanggal)) === formattedTargetDate || String(t.Tanggal).trim() === formattedTargetDate) &&
      (String(t.ID_Karyawan) === String(idKaryawan) || String(t.ID_Karyawan_Tujuan) === String(idKaryawan))
    );

    if (!swapData) return originalJadwal;

    let targetTokoId = '';
    let targetShiftId = '';

    if (String(swapData.ID_Karyawan) === String(idKaryawan)) {
      targetTokoId = swapData.ID_Toko_Tujuan;
      targetShiftId = swapData.Shift_Tujuan;
    } else {
      targetTokoId = swapData.ID_Toko_Saya;
      targetShiftId = swapData.Shift_Saya;
    }

    const toko = getSheetData(SHEET_NAMES.MASTER_TOKO).find(t => t.ID_Toko === targetTokoId);
    const shift = getSheetData(SHEET_NAMES.SHIFT_TOKO).find(s => s.ID_Shift === targetShiftId);

    return {
      libur: false,
      idToko: targetTokoId,
      namaToko: toko ? (toko.Nama_Toko + ' ⇆') : 'Toko ⇆',
      idShift: targetShiftId,
      namaShift: shift ? (shift.Nama_Shift + ' ⇆') : 'Shift ⇆',
      jamMasuk: shift ? formatTimeOnly(shift.Jam_Masuk) : '—',
      jamPulang: shift ? formatTimeOnly(shift.Jam_Pulang) : '—',
      fotoToko: toko ? (toko.Foto_Toko_URL || toko.Foto_URL || '') : '',
      swapped: true
    };
  } catch (e) {
    return originalJadwal;
  }
}

// ==================== DATA HISTORY (IZIN & LEMBUR) ====================
function getAbsenHariIni(data) {
  const { idKaryawan, tanggal } = data;
  if (!idKaryawan) return { success: false, error: 'ID Karyawan wajib diisi' };

  const tgl = tanggal || formatDate(new Date());
  const absensi = getSheetData(SHEET_NAMES.ABSENSI);

  const masuk = absensi.find(a =>
    a.ID_Karyawan === idKaryawan &&
    formatDate(new Date(a.Timestamp)) === tgl &&
    a.Tipe === 'Masuk'
  );

  const pulang = absensi.find(a =>
    a.ID_Karyawan === idKaryawan &&
    formatDate(new Date(a.Timestamp)) === tgl &&
    a.Tipe === 'Pulang'
  );

  return {
    success: true,
    data: {
      jamMasuk: masuk ? formatTimeOnly(masuk.Jam_Masuk) : '',
      jamPulang: pulang ? formatTimeOnly(pulang.Jam_Pulang) : '',
      statusMasuk: masuk ? masuk.Status_Masuk : ''
    }
  };
}

function getIzinHistory(data) {
  const { idKaryawan } = data;
  if (!idKaryawan) return { success: false, error: 'ID Karyawan wajib diisi' };

  const izin = getSheetData(SHEET_NAMES.IZIN_CUTI).filter(i => String(i.ID_Karyawan).trim() === String(idKaryawan).trim());

  return {
    success: true,
    data: izin.map(i => ({
      id: i.ID,
      jenis: i.Nama_Jenis,
      status: i.Status,
      tglMulai: i.Tanggal_Mulai ? formatDate(parseDateSafe(i.Tanggal_Mulai)) : '',
      tglSelesai: i.Tanggal_Selesai ? formatDate(parseDateSafe(i.Tanggal_Selesai)) : '',
      alasan: i.Alasan,
      tanggalPengajuan: i.Timestamp ? formatDateTime(parseDateSafe(i.Timestamp)) : (i.Tanggal_Mulai ? formatDate(parseDateSafe(i.Tanggal_Mulai)) : ''),
      approvedAt: i.Approved_At ? formatDateTime(parseDateSafe(i.Approved_At)) : ''
    }))
  };
}

function getLemburHistory(data) {
  const { idKaryawan } = data;
  if (!idKaryawan) return { success: false, error: 'ID Karyawan wajib diisi' };

  const lembur = getSheetData(SHEET_NAMES.LEMBUR).filter(l => String(l.ID_Karyawan).trim() === String(idKaryawan).trim());

  return {
    success: true,
    data: lembur.map(l => ({
      id: l.ID,
      toko: l.Nama_Toko,
      status: l.Status,
      tanggal: l.Tanggal ? formatDate(parseDateSafe(l.Tanggal)) : '',
      alasan: l.Alasan,
      tanggalPengajuan: l.Timestamp ? formatDateTime(parseDateSafe(l.Timestamp)) : (l.Tanggal ? formatDate(parseDateSafe(l.Tanggal)) : ''),
      approvedAt: l.Approved_At ? formatDateTime(parseDateSafe(l.Approved_At)) : ''
    }))
  };
}

// ==================== TUGAS ====================
function getTugasList(data) {
  const { idKaryawan, idToko } = data || {};
  let tugas = getSheetData(SHEET_NAMES.TUGAS).filter(t => t.Status !== 'Deleted');

  if (idKaryawan) {
    tugas = tugas.filter(t => t.Ditugaskan_Ke === idKaryawan || t.Ditugaskan_Ke === 'ALL');
  }
  if (idToko) {
    tugas = tugas.filter(t => t.ID_Toko === idToko || t.ID_Toko === 'ALL');
  }

  return {
    success: true,
    data: tugas.map(t => ({
      id: t.ID_Tugas,
      judul: t.Judul,
      deskripsi: t.Deskripsi,
      deadline: t.Deadline,
      prioritas: t.Prioritas,
      status: t.Status,
      ditugaskanKe: t.Ditugaskan_Ke
    }))
  };
}

function updateTugasStatus(data) {
  const { idTugas, status, idKaryawan } = data;

  const sheet = getSheet(SHEET_NAMES.TUGAS);
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][1] === idTugas) {
      sheet.getRange(i + 1, 8).setValue(status);
      if (status === 'Selesai') {
        sheet.getRange(i + 1, 11).setValue(formatDateTime(new Date()));
      }

      // Broadcast notifikasi tugas
      try {
        triggerPusher('pinguin-chat', 'tugas-alert', {
          idTugas: idTugas,
          idKaryawan: idKaryawan,
          status: status,
          judul: allData[i][3] || 'Tugas',
          pesan: 'Tugas "' + (allData[i][3] || '') + '" telah di-' + status.toLowerCase()
        });
      } catch (e) { Logger.log('Pusher tugas error: ' + e.toString()); }

      return { success: true, message: 'Status tugas diupdate' };
    }
  }

  return { success: false, error: 'Tugas tidak ditemukan' };
}

// ==================== BERITA ====================
function getBeritaList(data) {
  const { limit = 10 } = data || {};
  const berita = getSheetData(SHEET_NAMES.BERITA)
    .filter(b => b.Status === 'Aktif')
    .sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp))
    .slice(0, limit);

  return {
    success: true,
    data: berita.map(b => ({
      id: b.ID_Berita,
      judul: b.Judul,
      isi: b.Isi,
      kategori: b.Kategori,
      gambarUrl: b.Gambar_URL || '',
      tglPublish: b.Tgl_Publish || formatDate(new Date(b.Timestamp))
    }))
  };
}

function createBerita(data) {
  const { judul, isi, kategori, gambarUrl, dibuatOleh } = data;
  if (!judul || !isi) return { success: false, error: 'Judul dan isi wajib diisi' };

  const idBerita = generateId('BR');
  appendRow(SHEET_NAMES.BERITA, [
    formatDateTime(new Date()),
    idBerita,
    judul,
    isi,
    kategori || 'Umum',
    gambarUrl || '',
    dibuatOleh || '',
    formatDate(new Date()),
    'Aktif'
  ]);

    // Broadcast notifikasi berita baru
    try {
      triggerPusher('pinguin-chat', 'berita-alert', {
        idBerita: idBerita,
        judul: judul,
        kategori: kategori || 'Umum',
        pesan: judul
      });
    } catch (e) { Logger.log('Pusher berita error: ' + e.toString()); }

  return { success: true, idBerita: idBerita, message: 'Berita berhasil dipublikasi' };
}

// ==================== INIT SPREADSHEET ====================
function initSpreadsheet() {
  // Sheet akan auto-create di getSheet() jika belum ada
  // Ini hanya untuk inisialisasi default settings

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  if (!ss.getSheetByName(SHEET_NAMES.GAJI)) {
    const sh = ss.insertSheet(SHEET_NAMES.GAJI);
    sh.appendRow([
      'ID_Slip', 'ID_Karyawan', 'Bulan', 'Tahun', 'Status_Slip', 
      'Gaji_Pokok', 'Ket_Gaji_Pokok', 'Tarif_Lembur', 'Jam_Lembur', 'Total_Lembur', 'Ket_Lembur',
      'Bonus', 'Ket_Bonus', 'Uang_Transport', 'Ket_Uang_Transport',
      'Tunjangan', 'Ket_Tunjangan', 'Kasbon', 'Ket_Kasbon',
      'Potongan_Lain', 'Ket_Potongan_Lain', 'Keterangan_Umum', 'Total_Bersih', 'Timestamp'
    ]);
    sh.getRange("A1:X1").setFontWeight("bold").setBackground("#f3f3f3");
  }

  const settingSheet = getSheet(SHEET_NAMES.SETTING_GLOBAL);
  const existing = settingSheet.getDataRange().getValues();

  if (existing.length <= 1) {
    const defaults = [
      ['NAMA_APP', 'Absensi Karyawan Pro', 'Nama aplikasi'],
      ['LOGO_URL', '', 'URL logo'],
      ['FOLDER_DRIVE_ID', '', 'ID folder Google Drive'],
      ['TOLERANSI_KETERLAMBATAN_MENIT', '15', 'Toleransi keterlambatan'],
      ['KUNCI_JADWAL_KARYAWAN', 'LOCKED', 'LOCKED atau OPEN'],
      ['TIMEZONE', 'Asia/Jakarta', 'Zona waktu'],
      ['MAX_FOTO_SIZE_MB', '2', 'Maks ukuran foto'],
      ['FACE_DETECTION_MODE', 'BLINK', 'NONE/FACE_ONLY/BLINK'],
      ['GPS_VALIDATION', 'STRICT', 'STRICT/LENIENT/OFF'],
      ['THEME_COLOR_PRIMARY', '#1a73e8', 'Warna tema utama (Google Blue)'],
      ['THEME_COLOR_SECONDARY', '#34a853', 'Warna sukses']
    ];
    defaults.forEach(s => settingSheet.appendRow(s));
  }

  return 'Spreadsheet berhasil diinisialisasi! Sheet yang dibuat: ' + Object.values(SHEET_NAMES).join(', ');
}

// ==================== GAJI ====================
function getSlipGaji(data) {
  const idKaryawan = data.idKaryawan;
  if (!idKaryawan) return { success: false, error: 'ID Karyawan wajib diisi' };
  try {
    const sheetData = getSheetData(SHEET_NAMES.GAJI) || [];
    const slip = sheetData.filter(s => String(s.ID_Karyawan) === String(idKaryawan));
    const formatted = slip.map(s => ({
      idSlip: s.ID_Slip,
      bulan: s.Bulan,
      tahun: s.Tahun,
      gajiPokok: s.Gaji_Pokok,
      tunjangan: s.Tunjangan,
      potongan: parseFloat(s.Kasbon || 0) + parseFloat(s.Potongan_Lain || 0),
      totalBersih: s.Total_Bersih,
      keterangan: s.Keterangan_Umum || s.Keterangan,
      tanggal: s.Timestamp ? formatDateTime(parseDateSafe(s.Timestamp)) : ''
    }));
    return { success: true, data: formatted };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function getSalaries() {
  try {
    const list = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
    let lemburData = [];
    try {
      lemburData = getSheetData(SHEET_NAMES.LEMBUR) || [];
    } catch(e) {}

    const now = new Date();
    const isDraftPeriod = now.getDate() >= 25;
    let activeMonth = now.getMonth() + 1;
    let activeYear = now.getFullYear();

    if (!isDraftPeriod) {
      activeMonth -= 1;
      if (activeMonth === 0) {
        activeMonth = 12;
        activeYear -= 1;
      }
    }

    const lemburHoursMap = {};
    lemburData.forEach(l => {
      if (l.Status === 'Approved' && l.ID_Karyawan) {
        const tgl = parseDateSafe(l.Tanggal);
        if (tgl && (tgl.getMonth() + 1) === activeMonth && tgl.getFullYear() === activeYear) {
          const id = String(l.ID_Karyawan).trim().toLowerCase();
          const hrs = parseDurasiJam(l.Durasi_Jam);
          lemburHoursMap[id] = (lemburHoursMap[id] || 0) + hrs;
        }
      }
    });

    const filteredList = list.filter(k => {
      const jb = String(k.Jabatan || '').trim().toLowerCase();
      const st = String(k.Status || '').trim().toLowerCase();
      if (jb === 'owner') return false;
      if (st === 'nonaktif' || st === 'off' || st === 'tidak aktif' || st === '') return false;
      return true;
    });

    let gajiData = [];
    try {
      gajiData = getSheetData(SHEET_NAMES.GAJI) || [];
    } catch(e) {}

    const gajiSheet = getSheet(SHEET_NAMES.GAJI);
    
    // Check missing headers in GAJI sheet
    const headersGAJI = gajiSheet.getDataRange().getValues()[0] || [];
    const getOrAddGajiCol = (colName) => {
      let colIdx = headersGAJI.indexOf(colName) + 1;
      if (colIdx === 0) {
        const nextCol = gajiSheet.getLastColumn() + 1;
        gajiSheet.getRange(1, nextCol).setValue(colName);
        headersGAJI.push(colName);
        colIdx = nextCol;
      }
      return colIdx;
    };
    
    // Ensure essential columns exist
    getOrAddGajiCol('ID_Slip'); getOrAddGajiCol('ID_Karyawan'); getOrAddGajiCol('Bulan'); getOrAddGajiCol('Tahun'); getOrAddGajiCol('Status_Slip');
    getOrAddGajiCol('Gaji_Pokok'); getOrAddGajiCol('Ket_Gaji_Pokok'); getOrAddGajiCol('Tarif_Lembur'); getOrAddGajiCol('Jam_Lembur'); getOrAddGajiCol('Total_Lembur'); getOrAddGajiCol('Ket_Lembur');
    getOrAddGajiCol('Bonus'); getOrAddGajiCol('Ket_Bonus'); getOrAddGajiCol('Uang_Transport'); getOrAddGajiCol('Ket_Uang_Transport');
    getOrAddGajiCol('Tunjangan'); getOrAddGajiCol('Ket_Tunjangan'); getOrAddGajiCol('Kasbon'); getOrAddGajiCol('Ket_Kasbon');
    getOrAddGajiCol('Potongan_Lain'); getOrAddGajiCol('Ket_Potongan_Lain'); getOrAddGajiCol('Keterangan_Umum'); getOrAddGajiCol('Total_Bersih'); getOrAddGajiCol('Timestamp');

    const data = filteredList.map(k => {
      const idK = String(k.ID_Karyawan).trim().toLowerCase();
      
      let slip = gajiData.find(g => String(g.ID_Karyawan).trim().toLowerCase() === idK && parseInt(g.Bulan) === activeMonth && parseInt(g.Tahun) === activeYear);
      
      const gp = k.Gaji_Pokok ? parseFloat(k.Gaji_Pokok) : 0;
      const glRate = k.Gaji_Lembur ? parseFloat(k.Gaji_Lembur) : 0; 
      const lemburHours = lemburHoursMap[idK] || 0; 

      if (!slip && isDraftPeriod) {
        // Auto-generate draft
        const newIdSlip = `SLIP-${activeYear}-${activeMonth}-${k.ID_Karyawan}`;
        const newRowValues = [];
        headersGAJI.forEach(h => {
          if (h === 'ID_Slip') newRowValues.push(newIdSlip);
          else if (h === 'ID_Karyawan') newRowValues.push(k.ID_Karyawan);
          else if (h === 'Bulan') newRowValues.push(activeMonth);
          else if (h === 'Tahun') newRowValues.push(activeYear);
          else if (h === 'Status_Slip') newRowValues.push('Draft');
          else if (h === 'Gaji_Pokok') newRowValues.push(gp);
          else if (h === 'Tarif_Lembur') newRowValues.push(glRate);
          else if (h === 'Jam_Lembur') newRowValues.push(lemburHours);
          else if (h === 'Total_Lembur') newRowValues.push(0); // Optional
          else if (h === 'Timestamp') newRowValues.push(new Date());
          else if (['Bonus', 'Uang_Transport', 'Tunjangan', 'Kasbon', 'Potongan_Lain', 'Total_Bersih'].includes(h)) newRowValues.push(0);
          else newRowValues.push('');
        });
        if (gajiSheet) gajiSheet.appendRow(newRowValues);
        
        slip = {
          ID_Karyawan: k.ID_Karyawan, Bulan: activeMonth, Tahun: activeYear, Status_Slip: 'Draft',
          Gaji_Pokok: gp, Ket_Gaji_Pokok: '', Tarif_Lembur: glRate, Jam_Lembur: lemburHours, 
          Bonus: 0, Ket_Bonus: '', Uang_Transport: 0, Ket_Uang_Transport: '',
          Tunjangan: 0, Ket_Tunjangan: '', Kasbon: 0, Ket_Kasbon: '',
          Potongan_Lain: 0, Ket_Potongan_Lain: '', Keterangan_Umum: ''
        };
      }

      const s = slip || {};
      
      return {
        idKaryawan: k.ID_Karyawan,
        nama: k.Nama,
        fotoProfil: k.Foto_Profil || '',
        gajiPokok: parseFloat(s.Gaji_Pokok) || gp,
        gajiLembur: parseFloat(s.Tarif_Lembur) || glRate,
        lemburHours: parseFloat(s.Jam_Lembur) || lemburHours,
        uangTransport: parseFloat(s.Uang_Transport) || 0,
        tunjangan: parseFloat(s.Tunjangan) || 0,
        kasbon: parseFloat(s.Kasbon) || 0,
        bonus: parseFloat(s.Bonus) || 0,
        potonganLain: parseFloat(s.Potongan_Lain) || 0,
        ketGajiPokok: s.Ket_Gaji_Pokok || '',
        ketGajiLembur: s.Ket_Lembur || '',
        ketUangTransport: s.Ket_Uang_Transport || '',
        ketTunjangan: s.Ket_Tunjangan || '',
        ketKasbon: s.Ket_Kasbon || '',
        ketBonus: s.Ket_Bonus || '',
        ketPotonganLain: s.Ket_Potongan_Lain || '',
        keterangan: s.Keterangan_Umum || '',
        periode: (s.Status_Slip === 'Fixed' || !isDraftPeriod) ? 'Fixed' : 'Draft',
        status: k.Status || 'Aktif'
      };
    });
    
    if (isDraftPeriod) {
       SpreadsheetApp.flush();
    }
    return { success: true, data: data, isDraftPeriod, activeMonth, activeYear };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// Helper untuk parsing durasi jam "2j 30m" atau "2.5"
function parseDurasiJam(str) {
  if (!str) return 0;
  if (typeof str === 'number') return str;
  const num = parseFloat(str);
  if (!isNaN(num) && String(num) === String(str).trim()) {
    return num;
  }
  const match = String(str).match(/(\d+)\s*j\s*(\d+)\s*m/i);
  if (match) {
    const jam = parseInt(match[1], 10);
    const menit = parseInt(match[2], 10);
    return jam + (menit / 60.0);
  }
  const matchJamOnly = String(str).match(/(\d+)\s*j/i);
  if (matchJamOnly) {
    return parseInt(matchJamOnly[1], 10);
  }
  return 0;
}

function updateSalary(data) {
  const { idKaryawan, gajiPokok, gajiLembur, lemburHours, totalLembur, uangTransport, tunjangan, kasbon, bonus, potonganLain, ketGajiPokok, ketGajiLembur, ketUangTransport, ketTunjangan, ketKasbon, ketBonus, ketPotonganLain, keterangan, periode, status } = data;
  if (!idKaryawan) return { success: false, error: 'ID Karyawan wajib diisi' };

  try {
    const now = new Date();
    const isDraftPeriod = now.getDate() >= 25;
    if (!isDraftPeriod) {
       return { success: false, error: 'Gaji berstatus Fixed (Terkunci). Anda hanya bisa menyimpan gaji dari tanggal 25 hingga akhir bulan.' };
    }
    
    let activeMonth = now.getMonth() + 1;
    let activeYear = now.getFullYear();

    const sheet = getSheet(SHEET_NAMES.GAJI);
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    
    const getOrAddCol = (colName) => {
      let colIdx = headers.indexOf(colName) + 1;
      if (colIdx === 0) {
        const nextCol = sheet.getLastColumn() + 1;
        sheet.getRange(1, nextCol).setValue(colName);
        headers.push(colName);
        colIdx = nextCol;
      }
      return colIdx;
    };
    
    const colId = getOrAddCol('ID_Karyawan');
    const colBln = getOrAddCol('Bulan');
    const colThn = getOrAddCol('Tahun');
    const colStatus = getOrAddCol('Status_Slip');
    
    for (let i = 1; i < allData.length; i++) {
      if (String(allData[i][colId-1]).trim().toLowerCase() === String(idKaryawan).trim().toLowerCase() && 
          parseInt(allData[i][colBln-1]) === activeMonth && parseInt(allData[i][colThn-1]) === activeYear) {
          
          if (allData[i][colStatus-1] === 'Fixed') return { success: false, error: 'Data slip ini sudah Fixed.' };
          
          let rowData = allData[i];
          const getVal = (colName) => parseFloat(rowData[getOrAddCol(colName) - 1]) || 0;
          
          let curGp = gajiPokok !== undefined ? parseFloat(gajiPokok) : getVal('Gaji_Pokok');
          let curRate = gajiLembur !== undefined ? parseFloat(gajiLembur) : getVal('Tarif_Lembur');
          let curJam = lemburHours !== undefined ? parseFloat(lemburHours) : getVal('Jam_Lembur');
          let curUt = uangTransport !== undefined ? parseFloat(uangTransport) : getVal('Uang_Transport');
          let curTj = tunjangan !== undefined ? parseFloat(tunjangan) : getVal('Tunjangan');
          let curKb = kasbon !== undefined ? parseFloat(kasbon) : getVal('Kasbon');
          let curBns = bonus !== undefined ? parseFloat(bonus) : getVal('Bonus');
          let curPot = potonganLain !== undefined ? parseFloat(potonganLain) : getVal('Potongan_Lain');
          
          let curTotalLembur = totalLembur !== undefined ? parseFloat(totalLembur) : (curRate * curJam);
          let totalBersih = curGp + curTotalLembur + curUt + curTj + curBns - curKb - curPot;
          
          if (gajiPokok !== undefined) sheet.getRange(i + 1, getOrAddCol('Gaji_Pokok')).setValue(gajiPokok);
          if (gajiLembur !== undefined) sheet.getRange(i + 1, getOrAddCol('Tarif_Lembur')).setValue(gajiLembur);
          if (lemburHours !== undefined) sheet.getRange(i + 1, getOrAddCol('Jam_Lembur')).setValue(lemburHours);
          sheet.getRange(i + 1, getOrAddCol('Total_Lembur')).setValue(curTotalLembur);
          if (uangTransport !== undefined) sheet.getRange(i + 1, getOrAddCol('Uang_Transport')).setValue(uangTransport);
          if (tunjangan !== undefined) sheet.getRange(i + 1, getOrAddCol('Tunjangan')).setValue(tunjangan);
          if (kasbon !== undefined) sheet.getRange(i + 1, getOrAddCol('Kasbon')).setValue(kasbon);
          if (bonus !== undefined) sheet.getRange(i + 1, getOrAddCol('Bonus')).setValue(bonus);
          if (potonganLain !== undefined) sheet.getRange(i + 1, getOrAddCol('Potongan_Lain')).setValue(potonganLain);
          
          if (ketGajiPokok !== undefined) sheet.getRange(i + 1, getOrAddCol('Ket_Gaji_Pokok')).setValue(ketGajiPokok);
          if (ketGajiLembur !== undefined) sheet.getRange(i + 1, getOrAddCol('Ket_Lembur')).setValue(ketGajiLembur);
          if (ketUangTransport !== undefined) sheet.getRange(i + 1, getOrAddCol('Ket_Uang_Transport')).setValue(ketUangTransport);
          if (ketTunjangan !== undefined) sheet.getRange(i + 1, getOrAddCol('Ket_Tunjangan')).setValue(ketTunjangan);
          if (ketKasbon !== undefined) sheet.getRange(i + 1, getOrAddCol('Ket_Kasbon')).setValue(ketKasbon);
          if (ketBonus !== undefined) sheet.getRange(i + 1, getOrAddCol('Ket_Bonus')).setValue(ketBonus);
          if (ketPotonganLain !== undefined) sheet.getRange(i + 1, getOrAddCol('Ket_Potongan_Lain')).setValue(ketPotonganLain);
          
          if (keterangan !== undefined) sheet.getRange(i + 1, getOrAddCol('Keterangan_Umum')).setValue(keterangan);
          sheet.getRange(i + 1, getOrAddCol('Total_Bersih')).setValue(totalBersih);
          
          SpreadsheetApp.flush();
          return { success: true, message: 'Gaji karyawan berhasil diperbarui di slip bulan ini.' };
      }
    }
    return { success: false, error: 'Slip gaji periode aktif tidak ditemukan untuk karyawan ini. Silakan muat ulang halaman Manajemen Gaji.' };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}


// ==================== PUSH NOTIFICATION (FCM v1 API + WEBPUSHR FALLBACK) ====================

/**
 * Simpan FCM token karyawan ke Sheet MASTER_KARYAWAN + PropertiesService
 */
function registerFCMToken(data) {
  const { idKaryawan, token } = data;
  if (!idKaryawan || !token) return { success: false, error: 'idKaryawan dan token wajib diisi' };
  
  try {
    // Simpan ke PropertiesService (cache cepat)
    PropertiesService.getScriptProperties().setProperty('FCM_' + idKaryawan, token);
    
    // Simpan juga ke sheet MASTER_KARYAWAN kolom FCM_Token agar terlihat
    const sheet = getSheet(SHEET_NAMES.MASTER_KARYAWAN);
    if (sheet) {
      const allData = sheet.getDataRange().getValues();
      const headers = allData[0];
      
      // Cari atau buat kolom FCM_Token
      let colFCM = headers.indexOf('FCM_Token');
      if (colFCM === -1) {
        colFCM = headers.length;
        sheet.getRange(1, colFCM + 1).setValue('FCM_Token');
      }
      
      // Cari baris karyawan
      let found = false;
      for (let i = 1; i < allData.length; i++) {
        if (String(allData[i][0]).trim().toLowerCase() === String(idKaryawan).trim().toLowerCase()) {
          sheet.getRange(i + 1, colFCM + 1).setValue(token);
          found = true;
          break;
        }
      }
      if (!found) {
        Logger.log('[FCM] ID ' + idKaryawan + ' tidak ditemukan di sheet MASTER_KARYAWAN. Token hanya tersimpan di PropertiesService.');
      }
      SpreadsheetApp.flush();
    }
    
    Logger.log('[FCM] Token disimpan untuk ' + idKaryawan);
    return { success: true, message: 'FCM token berhasil disimpan' };
  } catch (e) {
    return { success: false, error: 'Gagal simpan token: ' + e.message };
  }
}

/**
 * Ambil FCM token karyawan (PropertiesService → Sheet fallback)
 */
function getFCMToken(idKaryawan) {
  try {
    // Coba dari PropertiesService dulu (cepat)
    const cached = PropertiesService.getScriptProperties().getProperty('FCM_' + idKaryawan);
    if (cached) return cached;
    
    // Fallback: baca dari sheet MASTER_KARYAWAN
    const sheet = getSheet(SHEET_NAMES.MASTER_KARYAWAN);
    if (sheet) {
      const allData = sheet.getDataRange().getValues();
      const headers = allData[0];
      const colFCM = headers.indexOf('FCM_Token');
      if (colFCM >= 0) {
        for (let i = 1; i < allData.length; i++) {
          if (String(allData[i][0]) === String(idKaryawan)) {
            const token = String(allData[i][colFCM] || '').trim();
            if (token) {
              // Cache ke PropertiesService untuk akses cepat berikutnya
              PropertiesService.getScriptProperties().setProperty('FCM_' + idKaryawan, token);
              return token;
            }
          }
        }
      }
    }
    return '';
  } catch (e) {
    return '';
  }
}

/**
 * Hapus token FCM karyawan dari sheet MASTER_KARYAWAN jika tidak valid/expired
 */
function clearFCMTokenFromSheet(idKaryawan) {
  try {
    const sheet = getSheet(SHEET_NAMES.MASTER_KARYAWAN);
    if (sheet) {
      const allData = sheet.getDataRange().getValues();
      const headers = allData[0];
      const colFCM = headers.indexOf('FCM_Token');
      if (colFCM >= 0) {
        for (let i = 1; i < allData.length; i++) {
          if (String(allData[i][0]) === String(idKaryawan)) {
            sheet.getRange(i + 1, colFCM + 1).setValue('');
            Logger.log('[FCM] Token dikosongkan di sheet untuk ' + idKaryawan);
            break;
          }
        }
      }
    }
  } catch(e) {
    Logger.log('Gagal mengosongkan token FCM di sheet: ' + e.toString());
  }
}

/**
 * Kirim notifikasi ke karyawan.
 * Prioritas: FCM v1 API (untuk APK) → Webpushr (untuk Web) 
 */
function sendPushNotification(idKaryawan, title, message, channelId, extraData = {}) {
  channelId = channelId || 'general';
  
  // 1. Coba kirim via FCM v1 API (untuk APK Android)
  const fcmToken = getFCMToken(idKaryawan);
  if (fcmToken) {
    try {
      const fcmResult = sendFCMv1(fcmToken, title, message, channelId, extraData);
      if (fcmResult.success) {
        Logger.log('[FCM] ✅ Notifikasi berhasil dikirim ke ' + idKaryawan);
        return; // Sukses, tidak perlu fallback
      } else {
        Logger.log('[FCM] ⚠️ FCM gagal untuk ' + idKaryawan + ': ' + fcmResult.error);
        // Token mungkin expired, hapus agar bisa re-register
        if (fcmResult.error && (fcmResult.error.includes('NOT_FOUND') || fcmResult.error.includes('UNREGISTERED'))) {
          PropertiesService.getScriptProperties().deleteProperty('FCM_' + idKaryawan);
          Logger.log('[FCM] Token expired dihapus untuk ' + idKaryawan);
          try {
            clearFCMTokenFromSheet(idKaryawan);
          } catch(e) {
            Logger.log('Gagal hapus token dari sheet: ' + e.message);
          }
        }
      }
    } catch (e) {
      Logger.log('[FCM] ❌ Exception saat kirim FCM ke ' + idKaryawan + ': ' + e.message);
    }
  }
  
  // 2. Fallback ke Webpushr (untuk user Web/PWA)
  sendWebpushrFallback(idKaryawan, title, message);
}

/**
 * Kirim notifikasi via Firebase Cloud Messaging HTTP v1 API
 * Menggunakan ScriptApp.getOAuthToken() untuk autentikasi
 */
function sendFCMv1(fcmToken, title, body, channelId, extraData = {}) {
  const projectId = 'nafindo-group'; // Firebase project ID
  
  try {
    const accessToken = ScriptApp.getOAuthToken();
    
    // Gabungkan data bawaan dengan extraData
    const dataPayload = {
      title: title,
      body: body,
      channel_id: channelId,
      click_action: 'FCM_PLUGIN_ACTIVITY',
      ...extraData
    };
    
    // Konversi semua value di dataPayload menjadi string (FCM mensyaratkan data payload value berupa string)
    for (let key in dataPayload) {
        if (dataPayload[key] !== null && dataPayload[key] !== undefined) {
            dataPayload[key] = String(dataPayload[key]);
        } else {
            delete dataPayload[key];
        }
    }
    
    const payload = {
      message: {
        token: fcmToken,
        android: {
          priority: 'high'
        },
        data: dataPayload
      }
    };
    
    const url = 'https://fcm.googleapis.com/v1/projects/' + projectId + '/messages:send';
    
    const options = {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log('[FCM] Response [' + responseCode + ']: ' + responseText);
    
    if (responseCode === 200) {
      return { success: true };
    } else {
      return { success: false, error: responseText };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Fallback: Kirim notifikasi via Webpushr (untuk user Web/PWA)
 */
function sendWebpushrFallback(idKaryawan, title, message) {
  let webpushrKey = '4390bcc206161515a39ead22f9c1cf46';
  let webpushrAuthToken = '121398';

  try {
    const settings = getSheetData(SHEET_NAMES.SETTING_GLOBAL);
    if (settings && settings.length > 0) {
      const keyRow = settings.find(s => s.Key === 'WEBPUSHR_KEY' || s.Kunci === 'WEBPUSHR_KEY');
      const tokenRow = settings.find(s => s.Key === 'WEBPUSHR_TOKEN' || s.Kunci === 'WEBPUSHR_TOKEN');
      if (keyRow && keyRow.Value) webpushrKey = keyRow.Value;
      if (tokenRow && tokenRow.Value) webpushrAuthToken = tokenRow.Value;
    }
  } catch (e) {
    Logger.log('Gagal memuat setting Webpushr: ' + e.message);
  }

  try {
    const payload = {
      title: title,
      message: message,
      target_url: 'https://nafindo.github.io/absen/',
      sid: String(idKaryawan)
    };

    const options = {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'webpushrKey': webpushrKey,
        'webpushrAuthToken': webpushrAuthToken
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch('https://api.webpushr.com/v1/notification/send/sid', options);
    Logger.log('[WEBPUSHR] Response for ' + idKaryawan + ': ' + response.getContentText());
  } catch (e) {
    Logger.log('[WEBPUSHR] Error for ' + idKaryawan + ': ' + e.message);
  }
}

// ==================== REAL-TIME WEBSOCKET PUSHER TRIGGER ====================
function triggerPusher(channel, eventName, dataObj) {
  const appId = "2157387";
  const key = "3c015a6e56c1e4beb0ea";
  const secret = "03e4b6e13039837e93fb";
  const cluster = "ap1";

  try {
    const body = JSON.stringify({
      name: eventName,
      channels: [channel],
      data: JSON.stringify(dataObj)
    });

    const bodyMd5 = MD5(body);
    const timestamp = Math.floor(new Date().getTime() / 1000);

    const path = `/apps/${appId}/events`;
    const queryString = `auth_key=${key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}`;

    const signString = `POST\n${path}\n${queryString}`;
    const signature = bytesToHex(Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_256, signString, secret));

    const url = `https://api-${cluster}.pusher.com${path}?${queryString}&auth_signature=${signature}`;

    const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: body,
      muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(url, options);
    Logger.log("[PUSHER] Broadcast Result: " + res.getContentText());
  } catch (e) {
    Logger.log("[PUSHER] Broadcast Error: " + e.toString());
  }
}

function MD5(input) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, input, Utilities.Charset.UTF_8);
  return bytesToHex(rawHash);
}

function bytesToHex(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    let byteVal = bytes[i];
    if (byteVal < 0) byteVal += 256;
    let byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = '0' + byteHex;
    hex += byteHex;
  }
  return hex;
}

/**
 * Mengirim notifikasi push ke seluruh Admin dan Owner yang aktif.
 */
function sendPushNotificationToAllAdmin(title, message, channelId, extraData) {
  channelId = channelId || 'general';
  extraData = extraData || {};
  
  // ID pengirim (agar pengirim tidak menerima notif dari dirinya sendiri)
  const excludeId = extraData.idKaryawan ? String(extraData.idKaryawan).trim().toLowerCase() : null;

  try {
    if (extraData.idKaryawan && !extraData.sender_foto) {
      const karyawanInfo = getSheetData(SHEET_NAMES.MASTER_KARYAWAN).find(k => k.ID_Karyawan === extraData.idKaryawan);
      if (karyawanInfo && (karyawanInfo.Foto_Profil || karyawanInfo.Foto_URL)) {
        extraData.sender_foto = karyawanInfo.Foto_Profil || karyawanInfo.Foto_URL;
      }
    }
  } catch(e) {
    Logger.log('[FCM Admin] Gagal melampirkan foto profil: ' + e.toString());
  }

  try {
    const allKaryawan = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
    
    // 1. Kirim ke semua Admin / Owner aktif di MASTER_KARYAWAN (kecuali pengirim)
    allKaryawan.forEach(k => {
      const jabatan = String(k.Jabatan || '').trim().toLowerCase();
      const status = String(k.Status || '').trim().toLowerCase();
      const idK = String(k.ID_Karyawan || '').trim().toLowerCase();
      
      // Skip pengirim agar tidak dapat notif dari dirinya sendiri
      if (excludeId && idK === excludeId) {
        Logger.log('[FCM Admin] Skip pengirim: ' + k.Nama + ' (' + k.ID_Karyawan + ')');
        return;
      }
      
      if ((jabatan === 'admin' || jabatan === 'owner') && status === 'aktif') {
        try {
          sendPushNotification(k.ID_Karyawan, title, message, channelId, extraData);
          Logger.log('[FCM Admin] Berhasil memicu notifikasi untuk admin: ' + k.Nama + ' (' + k.ID_Karyawan + ')');
        } catch (e) {
          Logger.log('[FCM Admin] Gagal memicu notifikasi untuk admin ' + k.Nama + ': ' + e.toString());
        }
      }
    });
  } catch (e) {
    Logger.log('[FCM Admin] Gagal membaca data MASTER_KARYAWAN: ' + e.toString());
  }
}

/**
 * Mengirim notifikasi push manual ke satu karyawan atau melakukan broadcast.
 */
function sendManualPushNotification(data) {
  const { targetId, targetRole, title, message, channelId } = data;
  
  if (!title || !message) {
    return { success: false, error: 'Title dan message wajib diisi' };
  }

  const chanId = channelId || 'general';
  let sentCount = 0;

  // Kasus 1: Kirim ke satu karyawan spesifik
  if (targetId && targetId !== 'ALL') {
    try {
      sendPushNotification(targetId, title, message, chanId);
      sentCount = 1;
      return { success: true, message: 'Notifikasi berhasil dikirim ke karyawan ' + targetId, sentCount: sentCount };
    } catch (e) {
      return { success: false, error: 'Gagal mengirim notifikasi ke ' + targetId + ': ' + e.toString() };
    }
  }

  // Kasus 2: Broadcast ke banyak karyawan (ALL atau tidak ada targetId)
  try {
    const allKaryawan = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
    
    allKaryawan.forEach(k => {
      const status = String(k.Status || '').trim().toLowerCase();
      const role = String(k.Jabatan || '').trim().toLowerCase();
      
      // Cek keaktifan
      if (status === 'aktif') {
        // Jika ada filter role (jabatan), pastikan cocok
        if (targetRole && targetRole !== 'ALL') {
          const filterRole = String(targetRole).trim().toLowerCase();
          if (role !== filterRole) {
            return; // Skip jika jabatan tidak sesuai
          }
        }
        
        try {
          sendPushNotification(k.ID_Karyawan, title, message, chanId);
          sentCount++;
        } catch (e) {
          Logger.log('Gagal broadcast notifikasi ke ' + k.Nama + ': ' + e.toString());
        }
      }
    });

    return { 
      success: true, 
      message: 'Broadcast notifikasi berhasil dikirim ke ' + sentCount + ' karyawan', 
      sentCount: sentCount 
    };
  } catch (e) {
    return { success: false, error: 'Gagal melakukan broadcast: ' + e.toString() };
  }
}

// ==================== MANAJEMEN JADWAL AUTO-ROLLING ====================

function getTemplateJadwal() {
  const templates = getSheetData(SHEET_NAMES.TEMPLATE_JADWAL);
  const tokoList = getSheetData(SHEET_NAMES.MASTER_TOKO).filter(t => t.Status === 'Aktif');
  
  let result = [];
  tokoList.forEach(toko => {
    let t = templates.find(temp => temp.ID_Toko === toko.ID_Toko);
    if (!t) {
      t = {
        ID_Toko: toko.ID_Toko,
        Nama_Toko: toko.Nama_Toko,
        Kebutuhan_Pagi: "1",
        Kebutuhan_Siang: "1"
      };
    } else {
      t.Nama_Toko = toko.Nama_Toko;
    }
    result.push(t);
  });
  
  return { success: true, data: result };
}

function saveTemplateJadwal(data) {
  const { templates } = data; // Array of {ID_Toko, Kebutuhan_Pagi, Kebutuhan_Siang}
  const sheet = getSheet(SHEET_NAMES.TEMPLATE_JADWAL);
  
  // Hapus semua data kecuali header
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }
  
  if (templates && templates.length > 0) {
    const rows = templates.map(t => [t.ID_Toko, t.Nama_Toko, t.Kebutuhan_Pagi || 1, t.Kebutuhan_Siang || 1]);
    sheet.getRange(2, 1, rows.length, 4).setValues(rows);
  }
  
  return { success: true, message: 'Template jadwal berhasil disimpan' };
}

function getMingguKe(tanggalStr) {
  // Hitung minggu ke berapa sejak Epoch untuk rotasi round-robin
  const date = new Date(tanggalStr);
  const diff = date.getTime() - new Date('2023-01-01').getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

function generateJadwalMingguan(data) {
  const { tanggalMulai, tanggalSelesai } = data;
  
  const karyawanList = getSheetData(SHEET_NAMES.MASTER_KARYAWAN).filter(k => k.Status === 'Aktif');
  const tokoList = getSheetData(SHEET_NAMES.MASTER_TOKO).filter(t => t.Status === 'Aktif');
  const templateList = getSheetData(SHEET_NAMES.TEMPLATE_JADWAL);
  const cutiList = getSheetData(SHEET_NAMES.IZIN_CUTI).filter(c => c.Status === 'Disetujui' || c.Status === 'Pending');
  const shiftList = getSheetData(SHEET_NAMES.SHIFT_TOKO).filter(s => s.Status === 'Aktif');
  
  const mingguKe = getMingguKe(tanggalMulai);
  const targetStart = new Date(tanggalMulai).getTime();
  const targetEnd = new Date(tanggalSelesai).getTime();
  
  let jadwalGenerated = [];
  let warnings = [];
  
  // Lakukan iterasi per hari selama 7 hari
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDate = new Date(targetStart + dayOffset * 24 * 60 * 60 * 1000);
    const currentDateStr = Utilities.formatDate(currentDate, 'Asia/Jakarta', 'yyyy-MM-dd');
    const hariIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][currentDate.getDay()];
    
    let excessPool = []; // Menyimpan karyawan sehat yang kelebihan
    let shortages = []; // Menyimpan data defisit toko
    
    // 1. Alokasi Default per Toko (Berdasarkan Kebutuhan)
    tokoList.forEach(toko => {
      let karyawans = karyawanList.filter(k => k.Toko_Default === toko.ID_Toko).sort((a, b) => a.ID_Karyawan.localeCompare(b.ID_Karyawan));
      
      const tmpl = templateList.find(t => t.ID_Toko === toko.ID_Toko) || { Kebutuhan_Pagi: 1, Kebutuhan_Siang: 1 };
      const butuhPagi = parseInt(tmpl.Kebutuhan_Pagi) || 1;
      const butuhSiang = parseInt(tmpl.Kebutuhan_Siang) || 1;
      
      const shiftsToko = shiftList.filter(s => s.ID_Toko === toko.ID_Toko);
      let shiftPagi = shiftsToko.find(s => s.Nama_Shift.toLowerCase().includes('pagi')) || shiftsToko[0];
      let shiftSiang = shiftsToko.find(s => s.Nama_Shift.toLowerCase().includes('siang')) || shiftsToko[1] || shiftsToko[0];
      
      if (karyawans.length > 0) {
        // Pisahkan admin dan non-admin agar admin diprioritaskan diam di toko
        let admins = [];
        let nonAdmins = [];
        karyawans.forEach(k => {
          if (String(k.Jabatan || '').trim().toLowerCase() === 'admin') {
            admins.push(k);
          } else {
            nonAdmins.push(k);
          }
        });
        
        // Susun ulang: Admin selalu di depan (prioritas isi shift utama toko)
        let sortedKaryawans = admins.concat(nonAdmins);
        
        // Buat daftar kebutuhan shift berdasarkan target
        let requiredShifts = [];
        for (let i = 0; i < butuhPagi; i++) requiredShifts.push({ type: 'Pagi', data: shiftPagi });
        for (let i = 0; i < butuhSiang; i++) requiredShifts.push({ type: 'Siang', data: shiftSiang });
        
        // Rotasi HANYA pada target shift agar Pagi/Siang berganti tiap minggu
        let shiftAmountShifts = mingguKe % (requiredShifts.length || 1);
        const rotatedShifts = requiredShifts.slice(shiftAmountShifts).concat(requiredShifts.slice(0, shiftAmountShifts));
        
        let assignedIndex = 0;
        
        sortedKaryawans.forEach(k => {
          // Cek cuti
          const isCuti = cutiList.some(c => {
            if (c.ID_Karyawan !== k.ID_Karyawan) return false;
            const cStart = new Date(c.Tanggal_Mulai).getTime();
            const cEnd = new Date(c.Tanggal_Selesai).getTime();
            return (cStart <= currentDate.getTime() && cEnd >= currentDate.getTime());
          });
          
          if (isCuti) {
            jadwalGenerated.push({
              ID_Jadwal: generateId('JDW'),
              ID_Karyawan: k.ID_Karyawan,
              Nama: k.Nama,
              ID_Toko: toko.ID_Toko,
              Nama_Toko: toko.Nama_Toko,
              ID_Shift: '',
              Nama_Shift: 'Cuti/Libur',
              Hari_Berjalan: hariIndo,
              Tanggal_Mulai: currentDateStr,
              Tanggal_Selesai: currentDateStr,
              Status: 'Cuti/Absen'
            });
            return; // Lanjut ke karyawan berikutnya (TIDAK mengambil kuota shift)
          }
          
          // Alokasi normal ke shift
          if (assignedIndex < rotatedShifts.length) {
            const shiftTarget = rotatedShifts[assignedIndex];
            assignedIndex++;
            
            jadwalGenerated.push({
              ID_Jadwal: generateId('JDW'),
              ID_Karyawan: k.ID_Karyawan,
              Nama: k.Nama,
              ID_Toko: toko.ID_Toko,
              Nama_Toko: toko.Nama_Toko,
              ID_Shift: shiftTarget.data ? shiftTarget.data.ID_Shift : '',
              Nama_Shift: shiftTarget.data ? shiftTarget.data.Nama_Shift : shiftTarget.type,
              Hari_Berjalan: hariIndo,
              Tanggal_Mulai: currentDateStr,
              Tanggal_Selesai: currentDateStr,
              Status: 'Normal'
            });
          } else {
            // Karyawan sisa dimasukkan ke Excess Pool
            excessPool.push({
              karyawan: k,
              tokoAsal: toko,
              shiftSiangDefault: shiftSiang,
              shiftPagiDefault: shiftPagi
            });
          }
        });
        
        // Catat kekurangan (defisit) dari sisa target yang belum terisi
        for (let i = assignedIndex; i < rotatedShifts.length; i++) {
          const type = rotatedShifts[i].type;
          let existingShortage = shortages.find(s => s.toko.ID_Toko === toko.ID_Toko && s.jenis === type);
          if (existingShortage) {
            existingShortage.butuh++;
          } else {
            shortages.push({ toko: toko, jenis: type, targetShift: rotatedShifts[i].data, butuh: 1 });
          }
        }
      } else {
        // Toko sama sekali tidak punya karyawan
        shortages.push({ toko: toko, jenis: 'Pagi', targetShift: shiftPagi, butuh: butuhPagi });
        shortages.push({ toko: toko, jenis: 'Siang', targetShift: shiftSiang, butuh: butuhSiang });
      }
    });
    
    // Acak/Rotasi excessPool agar karyawan backup berganti shift (Pagi/Siang) tiap minggunya
    if (excessPool.length > 0) {
      let excessShiftAmount = mingguKe % excessPool.length;
      excessPool = excessPool.slice(excessShiftAmount).concat(excessPool.slice(0, excessShiftAmount));
    }
    
    // 2. Fase Auto-Backup: Tarik dari Excess Pool
    shortages.forEach(shortage => {
      while (shortage.butuh > 0 && excessPool.length > 0) {
        // Cari volunteer yang BUKAN admin (karena admin tidak boleh dipindah toko)
        let volunteerIndex = excessPool.findIndex(v => {
          const jab = String(v.karyawan.Jabatan || '').trim().toLowerCase();
          return jab !== 'admin';
        });
        
        if (volunteerIndex === -1) {
          // Semua sisa karyawan di excess pool adalah admin, tidak bisa ditarik
          break;
        }
        
        let volunteer = excessPool.splice(volunteerIndex, 1)[0]; 
        
        jadwalGenerated.push({
          ID_Jadwal: generateId('JDW'),
          ID_Karyawan: volunteer.karyawan.ID_Karyawan,
          Nama: volunteer.karyawan.Nama,
          ID_Toko: shortage.toko.ID_Toko,
          Nama_Toko: shortage.toko.Nama_Toko,
          ID_Shift: shortage.targetShift ? shortage.targetShift.ID_Shift : '',
          Nama_Shift: shortage.targetShift ? shortage.targetShift.Nama_Shift : shortage.jenis,
          Hari_Berjalan: hariIndo,
          Tanggal_Mulai: currentDateStr,
          Tanggal_Selesai: currentDateStr,
          Status: 'Diperbantukan'
        });
        
        shortage.butuh--;
      }
    });
    
    // 3. Kembalikan sisa excess ke toko asalnya (Sebar rata antara Pagi & Siang)
    let excessPagiCount = 0;
    let excessSiangCount = 0;
    
    excessPool.forEach(volunteer => {
      let assignedShift, assignedShiftName;
      if (excessPagiCount <= excessSiangCount) {
        assignedShift = volunteer.shiftPagiDefault;
        assignedShiftName = 'Pagi';
        excessPagiCount++;
      } else {
        assignedShift = volunteer.shiftSiangDefault;
        assignedShiftName = 'Siang';
        excessSiangCount++;
      }
      
      jadwalGenerated.push({
        ID_Jadwal: generateId('JDW'),
        ID_Karyawan: volunteer.karyawan.ID_Karyawan,
        Nama: volunteer.karyawan.Nama,
        ID_Toko: volunteer.tokoAsal.ID_Toko,
        Nama_Toko: volunteer.tokoAsal.Nama_Toko,
        ID_Shift: assignedShift ? assignedShift.ID_Shift : '',
        Nama_Shift: assignedShift ? assignedShift.Nama_Shift : assignedShiftName,
        Hari_Berjalan: hariIndo,
        Tanggal_Mulai: currentDateStr,
        Tanggal_Selesai: currentDateStr,
        Status: 'Standby / Kelebihan'
      });
    });
    
    // 4. Warning final jika ada toko yg MASIH defisit
    shortages.forEach(s => {
      if (s.butuh > 0) {
        warnings.push(`(${currentDateStr}) Toko ${s.toko.Nama_Toko} tidak memiliki penjaga ${s.jenis.toUpperCase()}.`);
      }
    });
    
  } // Selesai Loop 7 Hari

  // 5. Kembalikan data (Tanpa auto-save)
  // Penghapusan data lama dan penyimpanan data baru HANYA akan dilakukan saat
  // user menekan tombol 'Simpan Jadwal' yang memanggil fungsi saveJadwalMingguan.
  
  return { 
    success: true, 
    message: 'Jadwal Mingguan berhasil di-generate. (Tekan Simpan untuk memasukkan ke database)',
    warnings: warnings,
    data: jadwalGenerated
  };
}

function getAllJadwalMingguan(data) {
  const { tanggalMulai, tanggalSelesai } = data;
  const sheet = getSheet(SHEET_NAMES.JADWAL_KARYAWAN);
  const allData = sheet.getDataRange().getValues();
  
  if (allData.length <= 1) return { success: true, data: [] };
  
  const headers = allData[0];
  const targetStartStr = tanggalMulai;
  const targetEndStr = tanggalSelesai;
  
  let result = [];
  for (let i = 1; i < allData.length; i++) {
    const row = allData[i];
    const rStartStr = Utilities.formatDate(new Date(row[8]), 'Asia/Jakarta', 'yyyy-MM-dd');
    
    // Cek apakah ada di range mingguan ini
    if (rStartStr >= targetStartStr && rStartStr <= targetEndStr) {
      let obj = {};
      headers.forEach((h, index) => {
        let val = row[index];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, 'Asia/Jakarta', 'yyyy-MM-dd');
        }
        obj[h] = val;
      });
      result.push(obj); // Allow multiple records per employee (1 per day)
    }
  }
  
  return { success: true, data: result };
}

function saveJadwalMingguan(data) {
  const { jadwalList, tanggalMulai, tanggalSelesai } = data;
  if (!jadwalList || !tanggalMulai) {
    return { success: false, error: 'Data tidak lengkap' };
  }
  
  const targetStartStr = tanggalMulai;
  let targetEndStr = tanggalSelesai;
  
  if (!targetEndStr) {
    const d = new Date(tanggalMulai);
    d.setDate(d.getDate() + 6);
    targetEndStr = Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd');
  }
  
  const sheet = getSheet(SHEET_NAMES.JADWAL_KARYAWAN);
  let allData = sheet.getDataRange().getValues();
  
  // Filter out jadwal in the same week range
  let rowsToKeep = [];
  for (let i = 1; i < allData.length; i++) {
    const rStartStr = Utilities.formatDate(new Date(allData[i][8]), 'Asia/Jakarta', 'yyyy-MM-dd');
    // Jika berada di luar range minggu ini, simpan
    if (rStartStr < targetStartStr || rStartStr > targetEndStr) {
      rowsToKeep.push(allData[i]);
    }
  }
  
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }
  
  if (rowsToKeep.length > 0) {
    sheet.getRange(2, 1, rowsToKeep.length, rowsToKeep[0].length).setValues(rowsToKeep);
  }
  
  // Append new generated
  if (jadwalList.length > 0) {
    const newRows = jadwalList.map(j => [
      j.ID_Jadwal || generateId('JDW'), 
      j.ID_Karyawan, 
      j.Nama, 
      j.ID_Toko, 
      j.Nama_Toko, 
      j.ID_Shift, 
      j.Nama_Shift, 
      j.Hari_Berjalan, 
      j.Tanggal_Mulai, 
      j.Tanggal_Selesai, 
      j.Status
    ]);
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
  
  return { success: true, message: 'Jadwal berhasil disimpan!' };
}

// ==================== FCM DEBUG UTILITIES ====================

/**
 * Test kirim FCM langsung ke token tertentu.
 * Jalankan dari Apps Script Editor untuk debugging.
 * Cek hasilnya di Logger (View → Logs) atau Execution Log.
 */
function testFCM() {
  // Ganti dengan token FCM dari HP yang mau ditest
  const testToken = getFCMToken('K20260529093651363'); // Alfi
  
  if (!testToken) {
    Logger.log('❌ Token FCM tidak ditemukan untuk karyawan ini!');
    Logger.log('Pastikan karyawan sudah login di APK dan token terdaftar.');
    return;
  }
  
  Logger.log('📱 Token ditemukan: ' + testToken.substring(0, 30) + '...');
  
  const result = sendFCMv1(
    testToken,
    'Test Notifikasi FCM',
    'Ini test dari Apps Script Editor - ' + new Date().toLocaleString('id-ID'),
    'pesan_chat_channel',
    { 
      sender_name: 'System Test',
      pesan: 'Test FCM berhasil!',
      sender_foto: ''
    }
  );
  
  Logger.log('📤 Hasil kirim FCM: ' + JSON.stringify(result));
  
  if (result.success) {
    Logger.log('✅ FCM berhasil dikirim! Cek notifikasi di HP.');
  } else {
    Logger.log('❌ FCM GAGAL: ' + result.error);
    Logger.log('💡 Jika error 401/403, tambahkan scope firebase.messaging di appsscript.json');
  }
}

/**
 * Cek apakah token FCM tersimpan untuk semua karyawan aktif.
 */
function testListFCMTokens() {
  const allKaryawan = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
  const aktif = allKaryawan.filter(k => k.Status === 'Aktif');
  
  Logger.log('=== Daftar Token FCM Karyawan Aktif ===');
  aktif.forEach(k => {
    const token = getFCMToken(k.ID_Karyawan);
    const status = token ? '✅ Ada (' + token.substring(0, 20) + '...)' : '❌ KOSONG';
    Logger.log(k.Nama + ' (' + k.ID_Karyawan + '): ' + status);
  });
}

function uploadFotoKtp(data) {
  try {
    const { fotoBase64, namaKaryawan } = data;

    if (!fotoBase64 || !fotoBase64.startsWith('data:image')) {
      return { success: false, error: 'Foto tidak valid' };
    }

    const settings = getSheetData(SHEET_NAMES.SETTING_GLOBAL);
    const folderId = settings.find(s => s.Parameter === 'FOLDER_DRIVE_ID')?.Value || '1tJgsRcaRejhI6SAvDfrikvOTOEHz2CEw';

    if (!folderId) throw new Error('Folder Drive ID belum diatur');

    const folder = DriveApp.getFolderById(folderId);
    const subFolders = folder.getFoldersByName('Foto_KTP');
    const subFolder = subFolders.hasNext() ? subFolders.next() : folder.createFolder('Foto_KTP');

    const bulanFolderName = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM');
    const bulanFolders = subFolder.getFoldersByName(bulanFolderName);
    const bulanFolder = bulanFolders.hasNext() ? bulanFolders.next() : subFolder.createFolder(bulanFolderName);

    const safeNama = (namaKaryawan || 'ktp').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const fileName = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss') + '_' + safeNama + '_KTP.jpg';

    const base64Data = fotoBase64.split(',')[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/jpeg', fileName);
    const file = bulanFolder.createFile(blob);

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const thumbUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400';
    const directUrl = 'https://drive.google.com/uc?id=' + fileId + '&export=view';

    return {
      success: true,
      fotoUrl: thumbUrl,
      fileId: fileId,
      viewUrl: directUrl
    };

  } catch (e) {
    logError('uploadFotoKtp', e, data);
    return { success: false, error: 'Gagal upload KTP: ' + e.toString() };
  }
}

// ==================== PROFIL KARYAWAN ====================
function getProfilStatus(data) {
  const { idKaryawan } = data;
  if (!idKaryawan) return { success: false, error: 'ID Karyawan tidak valid' };

  const sheet = getSheet(SHEET_NAMES.MASTER_KARYAWAN);
  if (!sheet) return { success: false, error: 'Sheet tidak ditemukan' };

  ensureKaryawanExtraColumns();
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  
  const idIdx = headers.indexOf('ID_Karyawan');
  if (idIdx === -1) return { success: false, error: 'Kolom ID_Karyawan tidak ditemukan' };

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][idIdx] === idKaryawan) {
      let rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = allData[i][idx] || '';
      });
      
      const isComplete = rowObj['Profil_Lengkap'] === true || rowObj['Profil_Lengkap'] === 'TRUE';
      return { 
        success: true, 
        isComplete: isComplete, 
        employeeData: rowObj
      };
    }
  }

  return { success: false, error: 'Karyawan tidak ditemukan' };
}

function submitKaryawanProfil(data) {
  try {
    const { 
      idKaryawan, nama, pin, noHP, email,
      alamatLengkap, kontakDarurat, namaKontakDarurat, 
      fotoKtpUrl, nik, tempatLahir, tglLahir, jenisKelamin, 
      rtrw, desa, kecamatan, agama, statusKawin, kewarganegaraan 
    } = data;

    ensureKaryawanExtraColumns();
    const sheet = getSheet(SHEET_NAMES.MASTER_KARYAWAN);
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];

    let found = false;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === idKaryawan) {
        found = true;
        
        const updateField = (colName, val) => {
          if (val !== undefined && val !== null && val !== "") {
            let c = headers.indexOf(colName);
            if (c !== -1) {
              sheet.getRange(i+1, c+1).setValue(val);
            }
          }
        };

        updateField('Nama', nama);
        updateField('PIN', pin);
        updateField('No_HP', noHP);
        updateField('Email', email);
        updateField('Alamat_Lengkap', alamatLengkap);
        updateField('Kontak_Darurat', kontakDarurat);
        updateField('Nama_Kontak_Darurat', namaKontakDarurat);
        updateField('Foto_KTP', fotoKtpUrl);
        updateField('NIK', nik);
        updateField('Tempat_Lahir', tempatLahir);
        updateField('Tanggal_Lahir', tglLahir);
        updateField('Jenis_Kelamin', jenisKelamin);
        updateField('RT_RW', rtrw);
        updateField('Desa', desa);
        updateField('Kecamatan', kecamatan);
        updateField('Agama', agama);
        updateField('Status_Kawin', statusKawin);
        updateField('Kewarganegaraan', kewarganegaraan);
        
        // Kunci Profil
        updateField('Profil_Lengkap', true);

        return { success: true, message: 'Profil berhasil disimpan' };
      }
    }

    if (!found) return { success: false, error: 'Karyawan tidak ditemukan' };

  } catch (e) {
    logError('submitKaryawanProfil', e, data);
    return { success: false, error: 'Gagal submit profil: ' + e.toString() };
  }
}

// ==================== OCR KTP via Google Drive ====================
// Menggunakan Google Drive OCR (mesin yang sama dengan Google Lens)
// PENTING: Aktifkan "Drive API" di Services (menu + di sidebar Apps Script Editor)
function ocrKtp(data) {
  try {
    const { fotoBase64 } = data;
    if (!fotoBase64 || !fotoBase64.startsWith('data:image')) {
      return { success: false, error: 'Foto tidak valid' };
    }

    const base64Data = fotoBase64.split(',')[1];
    const mimeType = fotoBase64.split(';')[0].split(':')[1] || 'image/jpeg';
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, 'ktp_ocr_temp.jpg');

    let text = "";
    let fileId = "";

    if (typeof Drive === 'undefined') {
      return { success: false, error: 'Drive API belum diaktifkan. Admin harus mengaktifkan "Drive API" di Services pada Apps Script Editor.' };
    }

    // Cek versi Drive API yang aktif di Services Apps Script
    if (Drive.Files && typeof Drive.Files.create === 'function') {
      // === JIKA MENGGUNAKAN DRIVE API V3 ===
      try {
        var resource = {
          name: 'OCR_KTP_TEMP_' + new Date().getTime(),
          mimeType: 'application/vnd.google-apps.document' // Memicu OCR otomatis di v3
        };
        var file = Drive.Files.create(resource, blob);
        fileId = file.id;
        
        var textBlob = Drive.Files.export(fileId, 'text/plain');
        text = textBlob.getDataAsString();
      } catch (e3) {
        if (fileId) {
          try { DriveApp.getFileById(fileId).setTrashed(true); } catch(err){}
        }
        return { success: false, error: 'OCR v3 gagal: ' + e3.toString() };
      }
    } else if (Drive.Files && typeof Drive.Files.insert === 'function') {
      // === JIKA MENGGUNAKAN DRIVE API V2 (LAMA) ===
      try {
        var resource = {
          title: 'OCR_KTP_TEMP_' + new Date().getTime(),
          mimeType: mimeType
        };

        var file = Drive.Files.insert(resource, blob, {
          ocr: true,
          ocrLanguage: 'id'
        });
        fileId = file.id;

        var exportUrl = file.exportLinks && file.exportLinks['text/plain'];
        if (exportUrl) {
          var response = UrlFetchApp.fetch(exportUrl, {
            headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
            muteHttpExceptions: true
          });
          text = response.getContentText();
        } else {
          throw new Error("Tidak ada link export text/plain");
        }
      } catch (e2) {
        if (fileId) {
          try { DriveApp.getFileById(fileId).setTrashed(true); } catch(err){}
        }
        return { success: false, error: 'OCR v2 gagal: ' + e2.toString() };
      }
    } else {
      return { success: false, error: 'Drive API terdeteksi, tetapi format tidak dikenali.' };
    }

    // Hapus file temporary jika sukses
    if (fileId) {
      try {
        DriveApp.getFileById(fileId).setTrashed(true);
      } catch (cleanupError) {
        console.log("Gagal menghapus file temp: " + cleanupError.toString());
      }
    }

    if (!text || text.trim().length < 5) {
      return { success: false, error: 'Tidak ada teks yang terbaca dari gambar. Pastikan foto KTP jelas, tegak, dan tidak buram.' };
    }

    return {
      success: true,
      text: text.trim()
    };

  } catch (e) {
    logError('ocrKtp', e, { hasPhoto: !!data.fotoBase64 });
    return { success: false, error: 'OCR gagal sistem: ' + e.toString() };
  }
}
