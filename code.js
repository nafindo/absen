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
  TUKER_SHIFT: 'TUKER_SHIFT',
  TUGAS: 'TUGAS',
  BERITA: 'BERITA',
  GAJI: 'DATA_GAJI'
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
      case 'registerFCMToken': return jsonResponse(registerFCMToken(data));

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
      case 'getShiftByToko': return jsonResponse(getShiftByToko(data));
      case 'saveShift': return jsonResponse(saveShift(data));
      case 'updateShift': return jsonResponse(updateShift(data));
      case 'updateShift': return jsonResponse(updateShift(data));
      case 'deleteShiftPermanent': return jsonResponse(deleteShiftPermanent(data));

      // === CRUD KARYAWAN ===
      case 'getKaryawanList': return jsonResponse(getKaryawanList());
      case 'saveKaryawan': return jsonResponse(saveKaryawan(data));
      case 'updateKaryawan': return jsonResponse(updateKaryawan(data));
      case 'deleteKaryawan': return jsonResponse(deleteKaryawan(data));
      case 'getJadwalKaryawan': return jsonResponse(getJadwalKaryawan(data));
      case 'saveJadwalKaryawan': return jsonResponse(saveJadwalKaryawan(data));
      case 'getAllShifts': return jsonResponse(getAllShifts());
      case 'uploadFotoProfil': return jsonResponse(uploadFotoProfil(data));

      // === CRUD JENIS IZIN ===
      case 'getJenisIzinList': return jsonResponse(getJenisIzinList());
      case 'saveJenisIzin': return jsonResponse(saveJenisIzin(data));
      case 'updateJenisIzin': return jsonResponse(updateJenisIzin(data));
      case 'deleteJenisIzin': return jsonResponse(deleteJenisIzin(data));
      case 'getPendingApprovals': return jsonResponse(getPendingApprovals(data));

      // === TUKAR SHIFT ===
      case 'ajukanTukerShift': return jsonResponse(ajukanTukerShift(data));
      case 'getTukerShiftHistory': return jsonResponse(getTukerShiftHistory(data));
      case 'getPendingTukerShift': return jsonResponse(getPendingTukerShift(data));
      case 'approveTukerShift': return jsonResponse(approveTukerShift(data));
      case 'rejectTukerShift': return jsonResponse(rejectTukerShift(data));

      // === CHAT ===
      case 'getChatMessages':
      case 'getchatmessages': return jsonResponse(getChatMessages(data));
      case 'sendChatMessage':
      case 'sendchatmessage': return jsonResponse(sendChatMessage(data));

      // === TUGAS & BERITA ===
      case 'getTugasList': return jsonResponse(getTugasList(data));
      case 'updateTugasStatus': return jsonResponse(updateTugasStatus(data));
      case 'getBeritaList': return jsonResponse(getBeritaList(data));
      case 'createBerita': return jsonResponse(createBerita(data));

      // === DELTA SYNC ===
      case 'getDeltas': return jsonResponse(getDeltas(data));

      // === GAJI ===
      case 'getSlipGaji': return jsonResponse(getSlipGaji(data));
      case 'pingOnline': return jsonResponse(pingOnline(data));

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
    'MASTER_KARYAWAN': ['ID_Karyawan', 'Nama', 'PIN', 'Jabatan', 'Tanggal_Masuk', 'Status', 'No_HP', 'Email', 'Toko_Default', 'Shift_Default', 'Foto_Profil'],
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
    'TUKER_SHIFT': ['Timestamp', 'ID_Tuker', 'ID_Karyawan', 'Nama', 'ID_Toko_Saya', 'ID_Toko_Tujuan', 'ID_Karyawan_Tujuan', 'Shift_Saya', 'Shift_Tujuan', 'Tanggal', 'Alasan', 'Status', 'Approved_By', 'Approved_At'],
    'TUGAS': ['Timestamp', 'ID_Tugas', 'ID_Toko', 'Judul', 'Deskripsi', 'Deadline', 'Prioritas', 'Status', 'Dibuat_Oleh', 'Ditugaskan_Ke', 'Selesai_At'],
    'BERITA': ['Timestamp', 'ID_Berita', 'Judul', 'Isi', 'Kategori', 'Gambar_URL', 'Dibuat_Oleh', 'Tgl_Publish', 'Status']
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
      obj[h] = row[i];
    }
    return obj;
  });
}

function appendRow(sheetName, rowData) {
  const sheet = getSheet(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan');
  sheet.appendRow(rowData);
  return sheet.getLastRow();
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
function login(data) {
  const { idKaryawan, pin } = data;
  const karyawan = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
  const user = karyawan.find(k => k.ID_Karyawan === idKaryawan && k.PIN === pin && k.Status === 'Aktif');

  if (!user) {
    return { success: false, error: 'Nama atau PIN salah' };
  }

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
      fotoProfil: user.Foto_Profil || ''
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
      shiftDefault: user.Shift_Default || ''
    }
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
  const toleransiMenit = parseInt(settings.find(s => s.Parameter === 'TOLERANSI_KETERLAMBATAN_MENIT')?.Value || 15);

  const now = new Date();
  const jamMasukShift = shift ? shift.Jam_Masuk : '08:00';
  const [jamShift, menitShift] = jamMasukShift.split(':').map(Number);
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
  const safeLat = lat !== undefined ? lat : '';
  const safeLng = lng !== undefined ? lng : '';

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
  const safeLat = lat !== undefined ? lat : recordMasuk.Lat_Hp || '';
  const safeLng = lng !== undefined ? lng : recordMasuk.Long_Hp || '';

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
      try { deltas.TUKER_SHIFT = getSheetData(SHEET_NAMES.TUKER_SHIFT); } catch(e) { deltas.TUKER_SHIFT = []; }
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

  const jadwal = getSheetData(SHEET_NAMES.JADWAL_KARYAWAN).find(j =>
    j.ID_Karyawan === idKaryawan &&
    j.Hari_Berjalan.includes(hariIni) &&
    j.Status === 'Aktif' &&
    new Date() >= new Date(j.Tanggal_Mulai) &&
    new Date() <= new Date(j.Tanggal_Selesai)
  );

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
      jamMasuk: shift ? shift.Jam_Masuk : '',
      jamPulang: shift ? shift.Jam_Pulang : '',
      fotoToko: toko ? (toko.Foto_Toko_URL || toko.Foto_URL || '') : ''
    };
  }

  const finalJadwal = checkSwappedJadwal(idKaryawan, todayStr, originalJadwal);

  if (finalJadwal.libur) {
    return { success: true, jadwal: null, message: 'Tidak ada jadwal hari ini' };
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
    j.ID_Karyawan === idKaryawan && j.Status === 'Aktif'
  );

  const result = [];
  for (let i = 0; i < 7; i++) {
    const tgl = new Date(senin);
    tgl.setDate(senin.getDate() + i);
    const namaHari = hariList[i];
    const tglStr = Utilities.formatDate(tgl, 'Asia/Jakarta', 'dd MMM');

    const jadwal = jadwalAll.find(j =>
      j.Hari_Berjalan.includes(namaHari) &&
      tgl >= new Date(j.Tanggal_Mulai) &&
      tgl <= new Date(j.Tanggal_Selesai)
    );

    const tglStrForCompare = formatDate(tgl);
    const toko = jadwal ? getSheetData(SHEET_NAMES.MASTER_TOKO).find(t => t.ID_Toko === jadwal.ID_Toko) : null;
    const shift = jadwal ? getSheetData(SHEET_NAMES.SHIFT_TOKO).find(s => s.ID_Shift === jadwal.ID_Shift) : null;

    const originalJadwal = {
      libur: !jadwal,
      idToko: jadwal ? jadwal.ID_Toko : '',
      namaToko: toko ? toko.Nama_Toko : '—',
      idShift: jadwal ? jadwal.ID_Shift : '',
      namaShift: shift ? shift.Nama_Shift : '—',
      jamMasuk: shift ? shift.Jam_Masuk : '—',
      jamPulang: shift ? shift.Jam_Pulang : '—'
    };

    const finalJadwal = checkSwappedJadwal(idKaryawan, tglStrForCompare, originalJadwal);

    result.push({
      tanggal: tglStr,
      namaHari: namaHari,
      toko: finalJadwal.namaToko,
      shift: finalJadwal.namaShift,
      jamMasuk: finalJadwal.jamMasuk,
      jamPulang: finalJadwal.jamPulang,
      libur: finalJadwal.libur
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
      const swapList = getSheetData(SHEET_NAMES.TUKER_SHIFT).filter(t =>
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

      return { success: true, message: 'Lembur ' + status.toLowerCase() };
    }
  }

  return { success: false, error: 'Data lembur tidak ditemukan' };
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
      } catch (e) {
        Logger.log('Gagal mengirim push izin: ' + e.message);
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
  const tukarShift = getSheetData(SHEET_NAMES.TUKER_SHIFT).filter(t =>
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
      tipe: 'tuker_shift',
      id: t.ID_Tuker,
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
      waktu: l.Tanggal
    })),
    ...izin.map(i => ({
      tipe: 'izin',
      id: i.ID,
      nama: i.Nama,
      toko: '—',
      detail: i.Nama_Jenis + ' | ' + i.Tanggal_Mulai + (i.Tanggal_Mulai !== i.Tanggal_Selesai ? ' s/d ' + i.Tanggal_Selesai : '') + ' (' + i.Jumlah_Hari + ' hari)',
      waktu: i.Tanggal_Mulai
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

  const safeLat = lat !== undefined ? lat : '';
  const safeLng = lng !== undefined ? lng : '';

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
          sheet.getRange(i + 1, 4).setValue(lat);
      }
      if (lng !== undefined) {
          sheet.getRange(i + 1, 5).setValue(lng);
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
  return { success: true, data: shifts };
}
function getShiftByToko(data) {
  const { idToko } = data;
  const shifts = getSheetData(SHEET_NAMES.SHIFT_TOKO);
  // Jika idToko kosong, return semua shift
  if (!idToko) return { success: true, data: shifts };
  return { success: true, data: shifts.filter(s => s.ID_Toko === idToko) };
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
function saveKaryawan(data) {
  const { nama, pin, jabatan, noHP, email, tglMasuk, tokoDefault, shiftDefault, fotoUrl } = data;
  const idKaryawan = generateId('K');

  appendRow(SHEET_NAMES.MASTER_KARYAWAN, [
    idKaryawan, nama, pin || '0000', jabatan, tglMasuk || formatDate(new Date()),
    'Aktif', noHP || '', email || '', tokoDefault || '', shiftDefault || '', fotoUrl || ''
  ]);

  return { success: true, idKaryawan: idKaryawan, fotoUrl: fotoUrl };
}


// Update updateKaryawan:
function updateKaryawan(data) {
  const { idKaryawan, nama, pin, jabatan, noHP, email, status, tokoDefault, shiftDefault, fotoUrl } = data;

  const sheet = getSheet(SHEET_NAMES.MASTER_KARYAWAN);
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === idKaryawan) {
      if (nama !== undefined) sheet.getRange(i + 1, 2).setValue(nama);
      if (pin !== undefined) sheet.getRange(i + 1, 3).setValue(pin);
      if (jabatan !== undefined) sheet.getRange(i + 1, 4).setValue(jabatan);
      if (noHP !== undefined) sheet.getRange(i + 1, 7).setValue(noHP);
      if (email !== undefined) sheet.getRange(i + 1, 8).setValue(email);
      if (status !== undefined) sheet.getRange(i + 1, 6).setValue(status);
      if (tokoDefault !== undefined) sheet.getRange(i + 1, 9).setValue(tokoDefault);
      if (shiftDefault !== undefined) sheet.getRange(i + 1, 10).setValue(shiftDefault);
      if (fotoUrl !== undefined) sheet.getRange(i + 1, 11).setValue(fotoUrl);

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

  // Broadcast real-time message via Pusher WebSockets!
  try {
    triggerPusher('pinguin-chat', 'new-message', {
      tempId: data.tempId || '',
      idPesan: idPesan,
      idKaryawan: idKaryawan,
      nama: nama,
      pesan: pesan,
      tipe: tipe || 'text',
      fileUrl: fileUrl,
      namaFile: namaFile || '',
      replyTo: replyTo || '',
      waktu: formatDateTime(new Date())
    });
  } catch (e) {
    Logger.log("Pusher broadcast failed in sendChatMessage: " + e.toString());
  }

  return { success: true, idPesan: idPesan, fileUrl: fileUrl };
}

// ==================== TUKER SHIFT ====================
function ajukanTukerShift(data) {
  const { idKaryawan, nama, idTokoSaya, idTokoTujuan, idKaryawanTujuan, shiftSaya, shiftTujuan, tanggal, alasan } = data;

  if (!idKaryawan || !idTokoSaya || !idTokoTujuan || !idKaryawanTujuan || !shiftSaya || !shiftTujuan || !tanggal) {
    return { success: false, error: 'Data tidak lengkap' };
  }

  const idTuker = generateId('TS');
  appendRow(SHEET_NAMES.TUKER_SHIFT, [
    formatDateTime(new Date()),
    idTuker,
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
    Logger.log('Pusher trigger failed in ajukanTukerShift: ' + e.toString());
  }

  return { success: true, idTuker: idTuker, message: 'Pengajuan tukar shift berhasil' };
}

function getTukerShiftHistory(data) {
  const { idKaryawan } = data;
  if (!idKaryawan) return { success: false, error: 'ID Karyawan wajib diisi' };

  const tuker = getSheetData(SHEET_NAMES.TUKER_SHIFT).filter(t =>
    String(t.ID_Karyawan).trim() === String(idKaryawan).trim() ||
    String(t.ID_Karyawan_Tujuan).trim() === String(idKaryawan).trim()
  );

  return {
    success: true,
    data: tuker.map(t => ({
      id: t.ID_Tuker,
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

function getPendingTukerShift(data) {
  const { idKaryawan } = data;
  if (!idKaryawan) return { success: false, error: 'ID Karyawan wajib diisi' };

  // Ambil semua pengajuan Tukar Shift yang pending dengan tujuan idKaryawan ini
  const swapList = getSheetData(SHEET_NAMES.TUKER_SHIFT).filter(t =>
    t.ID_Karyawan_Tujuan === idKaryawan && t.Status === 'Pending'
  );

  const karyawanList = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
  const tokoList = getSheetData(SHEET_NAMES.MASTER_TOKO);
  const shiftList = getSheetData(SHEET_NAMES.SHIFT_TOKO);

  const result = swapList.map(t => {
    const requester = karyawanList.find(k => k.ID_Karyawan === t.ID_Karyawan);
    const tokoSaya = tokoList.find(tk => tk.ID_Toko === t.ID_Toko_Saya);
    const tokoTujuan = tokoList.find(tk => tk.ID_Toko === t.ID_Toko_Tujuan);
    const shiftSaya = shiftList.find(sf => sf.ID_Shift === t.Shift_Saya);
    const shiftTujuan = shiftList.find(sf => sf.ID_Shift === t.Shift_Tujuan);

    return {
      id: t.ID_Tuker,
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

function approveTukerShift(data) {
  const { idTuker, idKaryawan } = data;
  if (!idTuker || !idKaryawan) return { success: false, error: 'Parameter tidak lengkap' };

  const sheet = getSheet(SHEET_NAMES.TUKER_SHIFT);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idColIndex = headers.indexOf('ID_Tuker');
  const statusColIndex = headers.indexOf('Status');
  const appByColIndex = headers.indexOf('Approved_By');
  const appAtColIndex = headers.indexOf('Approved_At');

  let record = null;
  for (let i = 1; i < values.length; i++) {
    if (values[i][idColIndex] === idTuker) {
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

function rejectTukerShift(data) {
  const { idTuker, idKaryawan } = data;
  if (!idTuker || !idKaryawan) return { success: false, error: 'Parameter tidak lengkap' };

  const sheet = getSheet(SHEET_NAMES.TUKER_SHIFT);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idColIndex = headers.indexOf('ID_Tuker');
  const statusColIndex = headers.indexOf('Status');
  const appByColIndex = headers.indexOf('Approved_By');
  const appAtColIndex = headers.indexOf('Approved_At');

  let record = null;
  for (let i = 1; i < values.length; i++) {
    if (values[i][idColIndex] === idTuker) {
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
    const swapData = getSheetData(SHEET_NAMES.TUKER_SHIFT).find(t =>
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
    sh.appendRow(['ID_Slip', 'ID_Karyawan', 'Bulan', 'Tahun', 'Gaji_Pokok', 'Tunjangan', 'Potongan', 'Total_Bersih', 'Keterangan', 'Timestamp']);
    sh.getRange("A1:J1").setFontWeight("bold").setBackground("#f3f3f3");
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
      potongan: s.Potongan,
      totalBersih: s.Total_Bersih,
      keterangan: s.Keterangan,
      tanggal: s.Timestamp ? formatDateTime(parseDateSafe(s.Timestamp)) : ''
    }));
    return { success: true, data: formatted };
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
        // Buat header baru di kolom berikutnya
        colFCM = headers.length;
        sheet.getRange(1, colFCM + 1).setValue('FCM_Token');
      }
      
      // Cari baris karyawan
      for (let i = 1; i < allData.length; i++) {
        if (String(allData[i][0]) === String(idKaryawan)) {
          sheet.getRange(i + 1, colFCM + 1).setValue(token);
          break;
        }
      }
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
 * Kirim notifikasi ke karyawan.
 * Prioritas: FCM v1 API (untuk APK) → Webpushr (untuk Web) 
 */
function sendPushNotification(idKaryawan, title, message, channelId) {
  channelId = channelId || 'general';
  
  // 1. Coba kirim via FCM v1 API (untuk APK Android)
  const fcmToken = getFCMToken(idKaryawan);
  if (fcmToken) {
    try {
      const fcmResult = sendFCMv1(fcmToken, title, message, channelId);
      if (fcmResult.success) {
        Logger.log('[FCM] ✅ Notifikasi berhasil dikirim ke ' + idKaryawan);
        return; // Sukses, tidak perlu fallback
      } else {
        Logger.log('[FCM] ⚠️ FCM gagal untuk ' + idKaryawan + ': ' + fcmResult.error);
        // Token mungkin expired, hapus agar bisa re-register
        if (fcmResult.error && (fcmResult.error.includes('NOT_FOUND') || fcmResult.error.includes('UNREGISTERED'))) {
          PropertiesService.getScriptProperties().deleteProperty('FCM_' + idKaryawan);
          Logger.log('[FCM] Token expired dihapus untuk ' + idKaryawan);
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
function sendFCMv1(fcmToken, title, body, channelId) {
  const projectId = 'nafindo-group'; // Firebase project ID
  
  try {
    const accessToken = ScriptApp.getOAuthToken();
    
    const payload = {
      message: {
        token: fcmToken,
        notification: {
          title: title,
          body: body
        },
        android: {
          priority: 'high',
          notification: {
            channel_id: channelId,
            sound: 'default',
            default_vibrate_timings: true,
            default_light_settings: true,
            visibility: 'PUBLIC',
            notification_priority: 'PRIORITY_HIGH'
          }
        },
        data: {
          title: title,
          body: body,
          channel_id: channelId,
          click_action: 'FCM_PLUGIN_ACTIVITY'
        }
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