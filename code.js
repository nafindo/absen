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
  LOG_TUGAS: 'LOG_TUGAS',
  BERITA: 'BERITA',
  GAJI: 'DATA_GAJI',
  TEMPLATE_JADWAL: 'TEMPLATE_JADWAL',
  KASBON: 'DATA_KASBON',
  CEKLIST_HARIAN: 'CEKLIST_HARIAN',
  SCORE_AUDIT: 'SCORE_AUDIT'
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
      case 'updateFotoProfil': return jsonResponse(updateFotoProfil(data));

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
      case 'getKinerja': return jsonResponse(getKinerja(data));
      case 'calculateMonthlyScores': return calculateMonthlyScores(data);
      case 'getMyScorecard': return getMyScorecard(data);
      case 'getTeamScores': return getTeamScores(data);
      case 'getOwnerReport': return getOwnerReport(data);

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
      case 'approveKasbon': return jsonResponse(approveKasbon(data));
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
      case 'generateProfileToken': return jsonResponse(generateProfileToken(data));

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
      case 'deleteChatMessage':
      case 'deletechatmessage': return jsonResponse(deleteChatMessage(data));
      case 'pinChatMessage':
      case 'pinchatmessage': return jsonResponse(pinChatMessage(data));
      case 'reactChatMessage':
      case 'reactchatmessage': return jsonResponse(reactChatMessage(data));
      case 'sendManualPushNotification': return jsonResponse(sendManualPushNotification(data));

      // === TUGAS & BERITA ===
      case 'getTugasList': return jsonResponse(getTugasList(data));
      case 'updateTugasStatus': return jsonResponse(updateTugasStatus(data));
      case 'getBeritaList': return jsonResponse(getBeritaList(data));
      case 'createBerita': return jsonResponse(createBerita(data));
      case 'deleteBerita': return jsonResponse(deleteBerita(data));
      case 'createTugas': return jsonResponse(createTugas(data));
      case 'deleteTugas': return jsonResponse(deleteTugas(data));
      case 'submitTugasLog': return jsonResponse(submitTugasLog(data));
      case 'getTugasLogs': return jsonResponse(getTugasLogs(data));

      // === CEKLIST HARIAN ===
      case 'submitChecklistHarian': return jsonResponse(submitChecklistHarian(data));
      case 'getChecklistHarian': return jsonResponse(getChecklistHarian(data));

      // === DELTA SYNC ===
      case 'getDeltas': return jsonResponse(getDeltas(data));

      // === GAJI ===
      case 'getSlipGaji': return jsonResponse(getSlipGaji(data));
      case 'getSalaries': return jsonResponse(getSalaries());
      case 'generateDummyGaji': return jsonResponse(generateDummyGaji(data));
      case 'updateSalary': return jsonResponse(updateSalary(data));
      case 'pingOnline': return jsonResponse(pingOnline(data));
      case 'ajukanKasbon': return jsonResponse(ajukanKasbon(data));
      case 'getKasbonHistory': return jsonResponse(getKasbonHistory(data));

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
    const folderId = settings.find(s => String(s.Parameter || '').trim().toUpperCase() === 'FOLDER_DRIVE_ID')?.Value || '1eteic6bmF5kV64ZNcJqN6aw2sUqtDYim';

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

const COL_KARYAWAN = {
  ID: 0, NAMA: 1, PIN: 2, JABATAN: 3, TANGGAL_MASUK: 4, STATUS: 5,
  NO_HP: 6, EMAIL: 7, TOKO_DEFAULT: 8, SHIFT_DEFAULT: 9, FOTO_PROFIL: 10,
  FCM_TOKEN: 11, DEVICE_ID: 12, DEVICE_NAME: 13, ALAMAT_LENGKAP: 14,
  KONTAK_DARURAT: 15, NAMA_KONTAK_DARURAT: 16, FOTO_KTP: 17, NIK: 18,
  TEMPAT_LAHIR: 19, TANGGAL_LAHIR: 20, JENIS_KELAMIN: 21, RT_RW: 22,
  DESA: 23, KECAMATAN: 24, AGAMA: 25, STATUS_KAWIN: 26, KEWARGANEGARAAN: 27,
  PROFIL_LENGKAP: 28
};

const COL_ABSENSI = {
  TIMESTAMP: 0, ID_KARYAWAN: 1, NAMA: 2, ID_TOKO: 3, NAMA_TOKO: 4,
  ID_SHIFT: 5, NAMA_SHIFT: 6, TIPE: 7, JAM_MASUK: 8, JAM_PULANG: 9,
  JAM_KERJA: 10, STATUS_MASUK: 11, MENIT_TELAT: 12, FOTO_URL: 13,
  LAT_HP: 14, LONG_HP: 15, JARAK_M: 16, STATUS_GPS: 17, FACE_DETECTED: 18,
  FOTO_PULANG_URL: 19
};

const COL_IZIN = {
  ID: 0, ID_KARYAWAN: 1, NAMA: 2, ID_JENIS_IZIN: 3, NAMA_JENIS: 4,
  TANGGAL_MULAI: 5, TANGGAL_SELESAI: 6, JUMLAH_HARI: 7, ALASAN: 8,
  LAMPIRAN_URL: 9, STATUS: 10, APPROVED_BY: 11, APPROVED_AT: 12
};

const COL_LEMBUR = {
  ID: 0, ID_KARYAWAN: 1, NAMA: 2, ID_TOKO: 3, NAMA_TOKO: 4, TANGGAL: 5,
  JAM_MULAI: 6, JAM_SELESAI: 7, DURASI_JAM: 8, ALASAN: 9, FOTO_URL: 10,
  STATUS: 11, APPROVED_BY: 12, APPROVED_AT: 13
};

const COL_TUGAS = {
  TIMESTAMP: 0, ID_TUGAS: 1, KATEGORI_TUGAS: 2, ID_TOKO: 3, DITUGASKAN_KE: 4,
  JUDUL: 5, DESKRIPSI: 6, PRIORITAS: 7, STATUS: 8, DIBUAT_OLEH: 9,
  DEADLINE: 10, SELESAI_AT: 11, DIKERJAKAN_OLEH: 12, FOTO_URL: 13, KETERANGAN: 14
};

const COL_LOG_TUGAS = {
  TIMESTAMP: 0, ID_LOG: 1, ID_TUGAS: 2, ID_KARYAWAN: 3, ID_TOKO: 4,
  FOTO_BUKTI: 5, CATATAN: 6, STATUS_VERIFIKASI: 7
};

const COL_TOKO = {
  ID: 0, NAMA: 1, ALAMAT: 2, LAT: 3, LONG: 4, RADIUS_M: 5, JAM_BUKA: 6,
  JAM_TUTUP: 7, FOTO_URL: 8, STATUS: 9
};

const COL_SHIFT = {
  ID: 0, ID_TOKO: 1, NAMA_TOKO: 2, NAMA_SHIFT: 3, JAM_MASUK: 4,
  JAM_PULANG: 5, TOLERANSI_MENIT: 6, STATUS: 7
};

const COL_JADWAL = {
  ID: 0, ID_KARYAWAN: 1, NAMA: 2, ID_TOKO: 3, NAMA_TOKO: 4, ID_SHIFT: 5,
  NAMA_SHIFT: 6, HARI_BERJALAN: 7, TANGGAL_MULAI: 8, TANGGAL_SELESAI: 9, STATUS: 10
};

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
    'CHAT': ['Timestamp', 'ID_Pesan', 'ID_Karyawan', 'Nama', 'Pesan', 'Tipe', 'File_URL', 'Nama_File', 'Size_KB', 'Reply_To', 'Is_Deleted', 'Is_Pinned', 'Reactions'],
    'TUKAR_SHIFT': ['Timestamp', 'ID_Tukar', 'ID_Karyawan', 'Nama', 'ID_Toko_Saya', 'ID_Toko_Tujuan', 'ID_Karyawan_Tujuan', 'Shift_Saya', 'Shift_Tujuan', 'Tanggal', 'Alasan', 'Status', 'Approved_By', 'Approved_At'],
    'TUGAS': ['Timestamp', 'ID_Tugas', 'Kategori_Tugas', 'ID_Toko', 'Ditugaskan_Ke', 'Judul', 'Deskripsi', 'Prioritas', 'Status', 'Dibuat_Oleh', 'Deadline', 'Selesai_At', 'Dikerjakan_Oleh', 'Foto_URL', 'Keterangan'],
    'LOG_TUGAS': ['Timestamp', 'ID_Log', 'ID_Tugas', 'ID_Karyawan', 'ID_Toko', 'Foto_Bukti', 'Catatan', 'Status_Verifikasi'],
    'BERITA': ['Timestamp', 'ID_Berita', 'Judul', 'Isi', 'Kategori', 'Gambar_URL', 'Tgl_Tayang', 'Tgl_Off', 'Dibuat_Oleh', 'Tgl_Publish', 'Status'],
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
        const lowerH = h.toLowerCase();
        if (val.getFullYear() === 1899) {
          val = Utilities.formatDate(val, "Asia/Jakarta", "HH:mm");
        } else {
          const hasTime = val.getHours() !== 0 || val.getMinutes() !== 0 || val.getSeconds() !== 0;
          if (lowerH.includes('timestamp') || lowerH.includes('_at') || lowerH.includes('waktu') || hasTime) {
            val = Utilities.formatDate(val, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
          } else {
            val = Utilities.formatDate(val, "Asia/Jakarta", "yyyy-MM-dd");
          }
        }
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

function parseTimestampSafe(val) {
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) return val;
  }
  let str = String(val).trim();
  if (str.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    str = str.replace(' ', 'T');
  } else if (str.match(/^\d{2}\/\d{2}\/\d{4}/)) { 
    const parts = str.split(' ')[0].split('/');
    const time = str.split(' ')[1] || '00:00:00';
    str = `${parts[2]}-${parts[1]}-${parts[0]}T${time}`;
  }
  let d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  return new Date(); 
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

function updateFotoProfil(data) {
  const { idKaryawan, fotoBase64 } = data;
  if (!idKaryawan || !fotoBase64) return { success: false, error: 'Data tidak lengkap' };
  
  let fotoUrl = '';
  try {
    fotoUrl = uploadFotoToDrive(fotoBase64, idKaryawan, 'Profil');
  } catch (e) {
    return { success: false, error: 'Gagal mengunggah foto: ' + e.toString() };
  }
  
  const sheet = getSheet(SHEET_NAMES.MASTER_KARYAWAN);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const colIdKar = headers.indexOf('ID_Karyawan');
  const colFoto = headers.indexOf('Foto_Profil'); // index 10
  
  if (colIdKar === -1 || colFoto === -1) return { success: false, error: 'Kolom tidak ditemukan di MASTER_KARYAWAN' };
  
  let found = false;
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][colIdKar]) === String(idKaryawan)) {
      sheet.getRange(i + 1, colFoto + 1).setValue(fotoUrl);
      found = true;
      break;
    }
  }
  
  if (!found) return { success: false, error: 'Karyawan tidak ditemukan' };
  return { success: true, message: 'Foto profil berhasil diperbarui', fotoUrl: fotoUrl };
}

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

// ==================== HELPER ABSENSI ====================
function getActiveShift(idKaryawan, absensiData) {
  const now = new Date();
  const maxLookbackMs = 18 * 60 * 60 * 1000; // 18 jam
  
  const riwayatMasuk = absensiData.filter(a => a.ID_Karyawan === idKaryawan && a.Tipe === 'Masuk');
  if (riwayatMasuk.length === 0) return null;
  
  const latestMasuk = riwayatMasuk[0];
  const timestampMasuk = parseTimestampSafe(latestMasuk.Timestamp);
  
  if ((now.getTime() - timestampMasuk.getTime()) <= maxLookbackMs) {
    if (!latestMasuk.Jam_Pulang || String(latestMasuk.Jam_Pulang).trim() === '') {
      return latestMasuk;
    }
  }
  return null;
}

// ==================== ABSENSI ====================
function absenMasuk(data) {
  const { idKaryawan, nama, idToko, namaToko, idShift, namaShift, fotoBase64, lat, lng } = data;

  if (!fotoBase64) return { success: false, error: 'Foto wajib diambil' };
  if (!idToko) return { success: false, error: 'Toko harus dipilih' };
  if (!idShift) return { success: false, error: 'Shift harus dipilih' };

  const absensi = getSheetData(SHEET_NAMES.ABSENSI);
  
  // 1. Cek shift menggantung (belum pulang) maks 18 jam
  const activeShift = getActiveShift(idKaryawan, absensi);
  if (activeShift) {
    return { success: false, error: 'Anda sudah absen masuk (shift sebelumnya belum ditutup)' };
  }

  // 2. Cek absen masuk di kalender hari ini
  const today = formatDate(new Date());
  const sudahMasukHariIni = absensi.find(a =>
    a.ID_Karyawan === idKaryawan &&
    (a.Timestamp instanceof Date ? formatDate(a.Timestamp) : formatDate(new Date(a.Timestamp))) === today &&
    a.Tipe === 'Masuk'
  );

  if (sudahMasukHariIni) {
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

  // --- DAILY SCORE LOGIC ---
  let attScore = 0;
  if (statusMasuk === 'Ontime') {
    attScore = 15;
  } else if (statusMasuk === 'Telat') {
    if (menitTelat <= 15) attScore = 8;
    else attScore = 3;
  }
  logDailyScore(idKaryawan, nama, 'Absen Masuk', `Status: ${statusMasuk} (${menitTelat} menit telat)`, attScore, 0);
  // -------------------------

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

  // Kirim notifikasi HANYA ke Owner
  try {
    sendPushNotificationToOwner(
      '📍 Absen Masuk',
      nama + ' absen masuk di ' + namaToko,
      'absensi_channel',
      { type: 'absen_masuk', idKaryawan: idKaryawan, toko: namaToko }
    );
  } catch(e) {
    Logger.log('FCM broadcast absen masuk ke owner error: ' + e.toString());
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

  const today = formatDate(new Date());
  const absensi = getSheetData(SHEET_NAMES.ABSENSI);
  
  // Cek shift terbuka (lookback 18 jam)
  const activeShift = getActiveShift(idKaryawan, absensi);
  
  if (!activeShift) {
    // Tidak ada shift terbuka, cek apakah sudah pulang hari ini untuk error yg pas
    const sudahPulangHariIni = absensi.find(a =>
      a.ID_Karyawan === idKaryawan &&
      formatDate(parseTimestampSafe(a.Timestamp)) === today &&
      a.Tipe === 'Pulang'
    );
    if (sudahPulangHariIni) {
      return { success: false, error: 'Anda sudah absen pulang hari ini' };
    } else {
      return { success: false, error: 'Anda belum absen masuk (atau shift sudah kedaluwarsa > 18 jam)' };
    }
  }

  const recordMasuk = activeShift;
  const masukDateStr = formatDate(parseTimestampSafe(recordMasuk.Timestamp));

  // Upload foto
  let fotoUrl = '';
  try {
    fotoUrl = uploadFotoToDrive(fotoBase64, idKaryawan, 'Pulang');
  } catch (e) {
    console.error('Gagal upload foto:', e);
  }

  const now = new Date();
  let jamMasuk = parseTimestampSafe(recordMasuk.Timestamp);
  if (isNaN(jamMasuk.getTime())) {
    jamMasuk = new Date(today + ' ' + String(recordMasuk.Jam_Masuk));
  }
  let durasiMs = now - jamMasuk;
  if (isNaN(durasiMs) || durasiMs < 0) {
    durasiMs = 0;
  }

  // Hitung batas maksimal durasi dari jadwal shift
  let maxDurationMs = 9 * 3600000; // Default 9 jam
  const shift = getSheetData(SHEET_NAMES.SHIFT_TOKO).find(s => s.ID_Shift === recordMasuk.ID_Shift);
  if (shift && shift.Jam_Masuk && shift.Jam_Pulang) {
    const formatT = (t) => {
      if (t instanceof Date) return formatTimeOnly(t);
      if (typeof t === 'number') {
        const h = Math.floor(t * 24);
        const m = Math.round((t * 24 * 60) % 60);
        return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
      }
      return String(t);
    };
    
    const sIn = formatT(shift.Jam_Masuk).split(':').map(Number);
    const sOut = formatT(shift.Jam_Pulang).split(':').map(Number);
    
    if (sIn.length >= 2 && sOut.length >= 2) {
      let minIn = sIn[0] * 60 + sIn[1];
      let minOut = sOut[0] * 60 + sOut[1];
      if (minOut < minIn) minOut += 24 * 60; // Cross midnight
      maxDurationMs = (minOut - minIn) * 60000;
    }
  }

  // Batasi (cap) durasi kerja agar tidak melebihi jadwal shift
  if (durasiMs > maxDurationMs) {
    durasiMs = maxDurationMs;
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
    const rowDate = formatDate(parseTimestampSafe(allData[i][0]));
    const rowTipe = colTipe >= 0 ? String(allData[i][colTipe]) : String(allData[i][7]);
    const rowIdKar = colIdKar >= 0 ? String(allData[i][colIdKar]) : String(allData[i][1]);
    
    if (rowIdKar === idKaryawan && rowDate === masukDateStr && rowTipe === 'Masuk' && String(allData[i][10]).trim() === '') {
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

  // Kirim notifikasi HANYA ke Owner
  try {
    sendPushNotificationToOwner(
      '🏠 Absen Pulang',
      nama + ' absen pulang',
      'absensi_channel',
      { type: 'absen_pulang', idKaryawan: idKaryawan }
    );
  } catch(e) {
    Logger.log('FCM broadcast absen pulang ke owner error: ' + e.toString());
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

  const activeShift = getActiveShift(idKaryawan, absensi);
  let masuk = null;
  let pulang = null;

  if (activeShift) {
    masuk = activeShift;
  } else {
    masuk = absensi.find(a =>
      a.ID_Karyawan === idKaryawan &&
      (a.Timestamp instanceof Date ? formatDate(a.Timestamp) : formatDate(new Date(a.Timestamp))) === today &&
      a.Tipe === 'Masuk'
    );
    pulang = absensi.find(a =>
      a.ID_Karyawan === idKaryawan &&
      (a.Timestamp instanceof Date ? formatDate(a.Timestamp) : formatDate(new Date(a.Timestamp))) === today &&
      a.Tipe === 'Pulang'
    );
  }

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

  // Validasi sisa kuota sebelum memproses
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
      // Masukkan 'izin' ke dalam pool cuti secara paksa
      const isShared = master && (master.Potong_Cuti_Bulanan === 'Ya' || master.Potong_Cuti_Bulanan === 'Yes' || master.Kode === 'izin');
      return isShared &&
        tgl && tgl.getMonth() + 1 === bulanIni && tgl.getFullYear() === tahunIni;
    })
    .reduce((sum, i) => sum + (parseInt(i.Jumlah_Hari) || 0), 0);

  const totalSharedUsedBulanIni = usedCutiBulanIni + usedPotongCutiBulanIni;

  const result = {};
  jenisIzin.forEach(j => {
    let sisa = null;

    if (j.Kode === 'cuti' || j.Kode === 'izin' || j.Potong_Cuti_Bulanan === 'Ya' || j.Potong_Cuti_Bulanan === 'Yes') {
      // Menggunakan shared pool (Kuota Cuti Bulanan)
      sisa = Math.max(0, limitCutiBulanan - totalSharedUsedBulanIni);
    } else {
      // Tentukan fallback default jika sheet kosong
      let kuotaTahun = j.Kuota_Per_Tahun;
      if (!kuotaTahun) {
        if (j.Kode === 'hamil') kuotaTahun = 30;
        else if (j.Kode === 'menikah') kuotaTahun = 7;
      }
      
      let kuotaBulan = j.Kuota_Per_Bulan;
      if (!kuotaBulan) {
        if (j.Kode === 'sakit') kuotaBulan = 3;
      }

      // Menggunakan kuota masing-masing
      if (kuotaTahun) {
        const terpakai = izinApproved
          .filter(i => {
            if (i.ID_Jenis_Izin !== j.ID_Jenis) return false;
            const tgl = parseDateSafe(i.Tanggal_Mulai);
            return tgl && tgl.getFullYear() === tahunIni;
          })
          .reduce((sum, i) => sum + (parseInt(i.Jumlah_Hari) || 0), 0);
        sisa = Math.max(0, parseInt(kuotaTahun) - terpakai);
      }
      if (kuotaBulan) {
        const terpakai = izinApproved
          .filter(i => {
            if (i.ID_Jenis_Izin !== j.ID_Jenis) return false;
            const tgl = parseDateSafe(i.Tanggal_Mulai);
            return tgl && tgl.getMonth() + 1 === bulanIni && tgl.getFullYear() === tahunIni;
          })
          .reduce((sum, i) => sum + (parseInt(i.Jumlah_Hari) || 0), 0);
        sisa = Math.max(0, parseInt(kuotaBulan) - terpakai);
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
    const aktif = jenisIzin.filter(j => j.Status && j.Status.toString().trim().toLowerCase() === 'aktif');

    // Kembalikan semua kategori yang aktif
    return { success: true, data: aktif };
  } catch (e) {
    console.error('Gagal getJenisIzinAktif:', e);
    return { success: false, error: e.toString() };
  }
}


function deleteChatMessage(data) {
  const { idKaryawan, idPesan } = data;
  if (!idPesan || !idKaryawan) return { success: false, error: 'Data tidak lengkap' };
  
  const updated = updateRow(SHEET_NAMES.CHAT, 'ID_Pesan', idPesan, {
    Is_Deleted: true
  }, { checkOwnership: true, ownerId: idKaryawan, ownerCol: 'ID_Karyawan' });
  
  if (updated) {
    try {
      triggerPusher('pinguin-chat', 'delete-message', { idPesan, idKaryawan });
    } catch(e) {}
    return { success: true };
  }
  return { success: false, error: 'Gagal menghapus. Pastikan pesan milik Anda.' };
}

function pinChatMessage(data) {
  const { idKaryawan, idPesan, isPinned } = data; // Admin can pin, or anyone?
  if (!idPesan) return { success: false, error: 'Data tidak lengkap' };
  
  const updated = updateRow(SHEET_NAMES.CHAT, 'ID_Pesan', idPesan, {
    Is_Pinned: isPinned
  });
  
  if (updated) {
    try {
      triggerPusher('pinguin-chat', 'pin-message', { idPesan, isPinned });
    } catch(e) {}
    return { success: true };
  }
  return { success: false, error: 'Gagal pin pesan.' };
}

function reactChatMessage(data) {
  const { idKaryawan, idPesan, reaction } = data;
  if (!idPesan || !idKaryawan || !reaction) return { success: false, error: 'Data tidak lengkap' };
  
  // Find current reactions
  const chat = getSheetData(SHEET_NAMES.CHAT).find(c => c.ID_Pesan === idPesan);
  if (!chat) return { success: false, error: 'Pesan tidak ditemukan' };
  
  let currentReactions = {};
  try {
    if (chat.Reactions) currentReactions = JSON.parse(chat.Reactions);
  } catch(e) {}
  
  // Toggle reaction
  let isAdding = false;
  if (!currentReactions[reaction]) currentReactions[reaction] = [];
  const idx = currentReactions[reaction].indexOf(idKaryawan);
  if (idx > -1) {
    currentReactions[reaction].splice(idx, 1);
    if (currentReactions[reaction].length === 0) delete currentReactions[reaction];
  } else {
    currentReactions[reaction].push(idKaryawan);
    isAdding = true;
  }
  
  const newReactions = JSON.stringify(currentReactions);
  const updated = updateRow(SHEET_NAMES.CHAT, 'ID_Pesan', idPesan, {
    Reactions: newReactions
  });
  
  if (updated) {
    try {
      triggerPusher('pinguin-chat', 'react-message', { idPesan, reactions: newReactions });
      // Notify sender
      if (isAdding && chat.ID_Karyawan && chat.ID_Karyawan !== idKaryawan) {
        const token = getFCMToken(chat.ID_Karyawan);
        if (token) {
          const kar = getSheetData(SHEET_NAMES.MASTER_KARYAWAN).find(k => k.ID_Karyawan === idKaryawan);
          const reactorName = kar ? kar.Nama : 'Seseorang';
          const title = "Reaksi Baru di Chat";
          const cleanPesan = (chat.Pesan || "").replace(/^\{\{REPLY:[^}]+\}\}/, "").trim();
          const body = `${reactorName} bereaksi ${reaction} pada pesan Anda: "${cleanPesan.substring(0, 30)}${cleanPesan.length > 30 ? '...' : ''}"`;
          sendFCMv1(token, title, body, "chat_channel", { type: "chat", idPesan: idPesan });
        }
      }
    } catch(e) {
      Logger.log("FCM Reaction Error: " + e.toString());
    }
    return { success: true, reactions: newReactions };
  }
  return { success: false, error: 'Gagal mereaksikan pesan.' };
}

// ==================== JADWAL ====================

function getJadwalHariIni(data) {
  const { idKaryawan, skipAbsensi } = data;
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
  
  if (skipAbsensi) {
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
      absen: null
    };
  }
  
  const absensiData = getSheetData(SHEET_NAMES.ABSENSI);
  const activeShift = getActiveShift(idKaryawan, absensiData);
  let masuk = null;
  let pulang = null;

  if (activeShift) {
    masuk = activeShift;
  } else {
    masuk = absensiData.find(a => a.ID_Karyawan === idKaryawan && (a.Timestamp instanceof Date ? formatDate(a.Timestamp) : formatDate(new Date(a.Timestamp))) === todayStr && a.Tipe === 'Masuk');
    pulang = absensiData.find(a => a.ID_Karyawan === idKaryawan && (a.Timestamp instanceof Date ? formatDate(a.Timestamp) : formatDate(new Date(a.Timestamp))) === todayStr && a.Tipe === 'Pulang');
  }

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
    j.ID_Karyawan === idKaryawan
  );

  const result = [];
  for (let i = 0; i < 7; i++) {
    const tgl = new Date(senin);
    tgl.setDate(senin.getDate() + i);
    const namaHari = hariList[i];
    const tglStr = Utilities.formatDate(tgl, 'Asia/Jakarta', 'dd MMM');
    const tglStrForCompare = formatDate(tgl); // yyyy-MM-dd

    // Tolok ukur jadwal hari ini, 7 hari seminggu full (Abaikan Tanggal_Mulai, Selesai, Hari_Berjalan)
    const jadwal = jadwalAll.length > 0 ? jadwalAll[0] : null;

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
      j.ID_Karyawan === idKaryawan
    );

    // Tolok ukur jadwal hari ini, 7 hari seminggu full (Abaikan Tanggal_Mulai, Selesai, Hari_Berjalan)
    const jadwal = jadwalAll.length > 0 ? jadwalAll[0] : null;

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

  let gajiPokok = 0;
  if (empId && mode === 'bulanan') {
    const karyawanList = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
    if (karyawanList) {
      const karyawanObj = karyawanList.find(k => String(k.ID_Karyawan) === String(empId));
      if (karyawanObj) gajiPokok = parseFloat(karyawanObj.Gaji_Pokok || 0);
    }
  }

  return {
    success: true,
    mode: mode,
    gajiPokok: gajiPokok,
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

  // Hitung yang sedang izin hari ini (Disetujui dan tanggal mencakup hari ini)
  const tToday = new Date(today).getTime();
  let izinHariIni = 0;
  izin.forEach(i => {
    if (i.Status === 'Disetujui') {
        const tStart = new Date(i.Tanggal_Mulai).getTime();
        const tEnd = new Date(i.Tanggal_Selesai).getTime();
        if (tToday >= tStart && tToday <= tEnd) {
            izinHariIni++;
        }
    }
  });

  return {
    success: true,
    stats: {
      totalKaryawan: karyawan.filter(k => k.Status === 'Aktif' && k.Jabatan !== 'Owner').length,
      hadirHariIni: hadir,
      pendingApproval: pendingLembur + pendingIzin,
      telatHariIni: telat,
      izinHariIni: izinHariIni
    }
  };
}

function getMonitoringToko(data) {
  const today = formatDate(new Date());
  const tokoList = getSheetData(SHEET_NAMES.MASTER_TOKO) || [];
  const absensi = getSheetData(SHEET_NAMES.ABSENSI) || [];
  const karyawan = getSheetData(SHEET_NAMES.MASTER_KARYAWAN) || [];

  // Ambil data absensi masuk hari ini
  const absenHariIni = absensi.filter(a => 
    formatDate(new Date(a.Timestamp)) === today && 
    a.Tipe === 'Masuk'
  );

  const karyawanAktif = karyawan.filter(k => k.Status === 'Aktif' && k.Jabatan !== 'Owner');
  
  // Pra-kalkulasi jadwal hari ini untuk setiap karyawan aktif (sudah termasuk Tukar Shift)
  const jadwalHariIniPerKaryawan = karyawanAktif.map(k => {
    const res = getJadwalHariIni({ idKaryawan: k.ID_Karyawan, skipAbsensi: true });
    return {
      idKaryawan: k.ID_Karyawan,
      jadwal: res.jadwal
    };
  });

  const result = tokoList.map(t => {
    // 1. Hitung total karyawan berdasarkan jadwal shift hari ini yang valid
    const karyawanJadwal = jadwalHariIniPerKaryawan.filter(jk => 
      jk.jadwal && jk.jadwal.idToko === t.ID_Toko
    );

    // 2. Karyawan yang benar-benar absen di toko ini (datareal)
    const absenDiToko = absenHariIni.filter(a => a.ID_Toko === t.ID_Toko);

    // Kita gabungkan data absensi riil ke dalam daftar
    const karyawanOnline = absenDiToko.map(a => {
      const k = karyawan.find(kar => kar.ID_Karyawan === a.ID_Karyawan);
      return {
        nama: k ? k.Nama : a.ID_Karyawan,
        status: a.Status_Masuk === 'Telat' ? 'telat' : 'hadir',
        menitTelat: parseInt(a.Menit_Telat) || 0,
        lat: parseFloat(String(a.Lat_Hp).replace(/'/g, '')) || 0,
        lng: parseFloat(String(a.Long_Hp).replace(/'/g, '')) || 0
      };
    });

    return {
      idToko: t.ID_Toko,
      namaToko: t.Nama_Toko,
      fotoUrl: t.Foto_Toko_URL || '',
      jamBuka: formatTimeOnly(t.Jam_Buka),
      jamTutup: formatTimeOnly(t.Jam_Tutup),
      lat: parseFloat(String(t.Lat).replace(/'/g, '')) || 0,
      lng: parseFloat(String(t.Long).replace(/'/g, '')) || 0,
      radius: parseInt(t.Radius_M) || 50,
      totalKaryawan: karyawanJadwal.length,
      totalOnline: karyawanOnline.length,
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
  const kasbon = getSheetData(SHEET_NAMES.KASBON).filter(k => k.Status === 'Pending');

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
    })),
    ...kasbon.map(k => ({
      tipe: 'kasbon',
      id: k.ID_Kasbon,
      nama: k.Nama_Karyawan,
      toko: '—',
      detail: 'Nominal: Rp ' + parseFloat(k.Nominal).toLocaleString('id-ID') + ' | Alasan: ' + k.Alasan,
      waktu: k.Tanggal_Pengajuan,
      fotoUrl: ''
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
    const folderId = settings.find(s => String(s.Parameter || '').trim().toUpperCase() === 'FOLDER_DRIVE_ID')?.Value || '1eteic6bmF5kV64ZNcJqN6aw2sUqtDYim';

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
  const required = ['Alamat_Lengkap', 'Kontak_Darurat', 'Nama_Kontak_Darurat', 'Foto_KTP', 'NIK', 'Tempat_Lahir', 'Tanggal_Lahir', 'Jenis_Kelamin', 'RT_RW', 'Desa', 'Kecamatan', 'Agama', 'Status_Kawin', 'Kewarganegaraan', 'Profil_Lengkap', 'Profile_Token'];
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
  const { 
    idKaryawan, nama, pin, jabatan, noHP, email, status, tokoDefault, shiftDefault, fotoUrl, 
    alamatLengkap, kontakDarurat, namaKontakDarurat, fotoKtp, tglMasuk,
    nik, tempatLahir, tglLahir, jenisKelamin, rtrw, desa, kecamatan, agama, statusKawin, kewarganegaraan
  } = data;

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
      
      if (nik !== undefined) { let c = headers.indexOf('NIK'); if(c !== -1) sheet.getRange(i+1, c+1).setValue(nik); }
      if (tempatLahir !== undefined) { let c = headers.indexOf('Tempat_Lahir'); if(c !== -1) sheet.getRange(i+1, c+1).setValue(tempatLahir); }
      if (tglLahir !== undefined) { let c = headers.indexOf('Tanggal_Lahir'); if(c !== -1) sheet.getRange(i+1, c+1).setValue(tglLahir); }
      if (jenisKelamin !== undefined) { let c = headers.indexOf('Jenis_Kelamin'); if(c !== -1) sheet.getRange(i+1, c+1).setValue(jenisKelamin); }
      if (rtrw !== undefined) { let c = headers.indexOf('RT_RW'); if(c !== -1) sheet.getRange(i+1, c+1).setValue(rtrw); }
      if (desa !== undefined) { let c = headers.indexOf('Desa'); if(c !== -1) sheet.getRange(i+1, c+1).setValue(desa); }
      if (kecamatan !== undefined) { let c = headers.indexOf('Kecamatan'); if(c !== -1) sheet.getRange(i+1, c+1).setValue(kecamatan); }
      if (agama !== undefined) { let c = headers.indexOf('Agama'); if(c !== -1) sheet.getRange(i+1, c+1).setValue(agama); }
      if (statusKawin !== undefined) { let c = headers.indexOf('Status_Kawin'); if(c !== -1) sheet.getRange(i+1, c+1).setValue(statusKawin); }
      if (kewarganegaraan !== undefined) { let c = headers.indexOf('Kewarganegaraan'); if(c !== -1) sheet.getRange(i+1, c+1).setValue(kewarganegaraan); }

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
    const folderId = settings.find(s => String(s.Parameter || '').trim().toUpperCase() === 'FOLDER_DRIVE_ID')?.Value || '1eteic6bmF5kV64ZNcJqN6aw2sUqtDYim';

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
    const folderId = settings.find(s => String(s.Parameter || '').trim().toUpperCase() === 'FOLDER_DRIVE_ID')?.Value || '1eteic6bmF5kV64ZNcJqN6aw2sUqtDYim';

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
  const { limit = 50, offset = 0, lastTimestamp } = data || {};
  const chat = getSheetData(SHEET_NAMES.CHAT);
  // Sort by timestamp descending, then reverse for chronological display
  const sorted = chat.sort((a, b) => {
    const timeA = new Date(a.Timestamp || a.timestamp || a.Waktu || a.waktu || 0);
    const timeB = new Date(b.Timestamp || b.timestamp || b.Waktu || b.waktu || 0);
    return timeB - timeA;
  });
    let filtered = sorted;
  if (lastTimestamp) {
    const lastTime = new Date(lastTimestamp).getTime();
    filtered = sorted.filter(c => {
      const cTime = new Date(c.Timestamp || c.timestamp || c.Waktu || c.waktu || 0).getTime();
      return cTime < lastTime;
    });
  }
  const limited = filtered.slice(offset, offset + limit);

  return {
    success: true,
    data: limited.reverse().map(c => ({
      idPesan: c.ID_Pesan || c.Id_Pesan || c.idPesan || c.id_pesan || '',
      idKaryawan: c.ID_Karyawan || c.Id_Karyawan || c.idKaryawan || c.id_karyawan || '',
      nama: c.Nama || c.nama || '',
      pesan: c.Pesan || c.pesan || '',
      tipe: c.Tipe || c.tipe || 'text',
      fileUrl: c.File_URL || c.File_Url || c.fileUrl || c.file_url || '',
      namaFile: c.Nama_File || c.Nama_file || c.namaFile || c.nama_file || '',
      replyTo: c.Reply_To || c.Reply_to || c.replyTo || c.reply_to || null,
      isDeleted: c.Is_Deleted || false,
      isPinned: c.Is_Pinned || false,
      reactions: c.Reactions || '',
      waktu: formatDateTime(new Date(c.Timestamp || c.timestamp || c.Waktu || c.waktu || new Date()))
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
  const { idKaryawan, nama, pesan, tipe, fileBase64, namaFile, replyTo, files } = data;
  if (!idKaryawan || (!pesan && !fileBase64 && (!files || files.length === 0))) {
    return { success: false, error: 'Data tidak lengkap' };
  }

  let fileUrl = '';
  let sizeKB = 0;
  let finalNamaFile = namaFile || '';

  let safeTipe = (tipe || 'text').toLowerCase();
  if ((fileBase64 || (files && files.length > 0)) && safeTipe !== 'image' && safeTipe !== 'file') {
    safeTipe = 'image'; 
  }
  
  // Backward compatible & new files array
  let fileList = [];
  if (files && files.length > 0) fileList = files;
  else if (fileBase64) fileList = [{ base64: fileBase64, namaFile: namaFile }];

  if (fileList.length > 0) {
    let urlArr = [];
    let nameArr = [];
    let totalSize = 0;
    
    // settings scope
    const settings = getSheetData(SHEET_NAMES.SETTING_GLOBAL);
    const folderSetting = settings.find(s => String(s.Parameter || '').trim().toUpperCase() === 'FOLDER_DRIVE_ID');
    const folderId = (folderSetting ? folderSetting.Value : '') || '1eteic6bmF5kV64ZNcJqN6aw2sUqtDYim';
    let folder = null, subFolder = null, bulanFolder = null;
    
    if (folderId) {
        try {
          folder = DriveApp.getFolderById(folderId);
          const folderType = safeTipe === 'image' ? 'Chat_Images' : 'Chat_Files';
          const subFolders = folder.getFoldersByName(folderType);
          subFolder = subFolders.hasNext() ? subFolders.next() : folder.createFolder(folderType);
          const bulanFolderName = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM');
          const bulanFolders = subFolder.getFoldersByName(bulanFolderName);
          bulanFolder = bulanFolders.hasNext() ? bulanFolders.next() : subFolder.createFolder(bulanFolderName);
        } catch(e) { Logger.log(e); }
    }

    for (let i = 0; i < fileList.length; i++) {
        let fBase64 = fileList[i].base64;
        let fNama = fileList[i].namaFile || '';
        if (bulanFolder && fBase64) {
            try {
              const mimeType = safeTipe === 'image' ? 'image/jpeg' : 'application/octet-stream';
              const ext = safeTipe === 'image' ? '.jpg' : (fNama.match(/\.[^.]+$/) ? fNama.match(/\.[^.]+$/)[0] : '.bin');
              const fileName = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss') + '_' + idKaryawan + '_' + i + ext;
              
              const rawBase64 = fBase64.split(',')[1] || fBase64;
              const base64Data = rawBase64.replace(/ /g, '+');
              const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
              const file = bulanFolder.createFile(blob);
              try {
                file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
              } catch(shareErr) {
                Logger.log('Sharing error: ' + shareErr);
              }
              
              urlArr.push('https://drive.google.com/uc?id=' + file.getId());
              nameArr.push(fNama);
              totalSize += Math.round(base64Data.length * 0.75 / 1024);
            } catch(e) {
              Logger.log("Upload error: " + e.toString());
            }
        }
    }
    
    if (urlArr.length === 1) {
        fileUrl = urlArr[0];
        finalNamaFile = nameArr[0];
    } else if (urlArr.length > 1) {
        fileUrl = JSON.stringify(urlArr);
        finalNamaFile = JSON.stringify(nameArr);
    }
    sizeKB = totalSize;
  }
  if (false) {
    try {
      const folderType = safeTipe === 'image' ? 'Chat_Images' : 'Chat_Files';
      const mimeType = safeTipe === 'image' ? 'image/jpeg' : 'application/octet-stream';
      const ext = safeTipe === 'image' ? '.jpg' : ((namaFile && typeof namaFile === 'string' && namaFile.match(/\.[^.]+$/)) ? namaFile.match(/\.[^.]+$/)[0] : '.bin');

      const settings = getSheetData(SHEET_NAMES.SETTING_GLOBAL);
      const folderSetting = settings.find(s => String(s.Parameter || '').trim().toUpperCase() === 'FOLDER_DRIVE_ID');
      const folderId = (folderSetting ? folderSetting.Value : '') || '1eteic6bmF5kV64ZNcJqN6aw2sUqtDYim';
      
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
        const rawBase64 = fileBase64.split(',')[1] || fileBase64;
        const base64Data = rawBase64.replace(/ /g, '+');
        const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
        const file = bulanFolder.createFile(blob);
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch(shareError) {
          Logger.log('Set sharing failed: ' + shareError);
        }
        fileUrl = 'https://drive.google.com/uc?id=' + file.getId();
        sizeKB = Math.round(base64Data.length * 0.75 / 1024);
        Logger.log('[CHAT_UPLOAD] SUCCESS fileUrl=' + fileUrl + ', sizeKB=' + sizeKB);
      } else {
        Logger.log('[CHAT_UPLOAD] FAILED: FOLDER_DRIVE_ID kosong atau tidak ditemukan di SETTING_GLOBAL');
      }
    } catch (e) {
      Logger.log('[CHAT_UPLOAD] ERROR: ' + e.toString());
      logError('sendChatMessage_upload', e, data);
      fileUrl = 'ERROR: ' + e.toString();
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
    finalNamaFile || '',
    sizeKB,
    replyTo || '',
    false,
    false,
    ''
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
      namaFile: finalNamaFile || '',
      replyTo: replyTo || '',
      isDeleted: false,
      isPinned: false,
      reactions: '',
      waktu: formatDateTime(new Date())
    });
  } catch (e) {
    Logger.log("Pusher broadcast failed in sendChatMessage: " + e.toString());
  }

  // Kirim FCM ke semua karyawan kecuali pengirim
  try {
    const allKaryawan = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
    // Cari foto profil pengirim (Admin atau Karyawan)
    const sender = allKaryawan.find(k => String(k.ID_Karyawan) === String(idKaryawan));
    const senderFoto = sender ? (sender.Foto_Profil || sender.Foto_URL || '') : '';

    const targetKaryawan = allKaryawan.filter(k => k.Status === 'Aktif' && String(k.ID_Karyawan).trim().toLowerCase() !== String(idKaryawan).trim().toLowerCase());
    
    Logger.log('[FCM Chat] Mengirim notifikasi ke ' + targetKaryawan.length + ' karyawan aktif');
    
    targetKaryawan.forEach(k => {
      try {
        let displayTitle = 'Pesan dari ' + nama;
        let displayBody = pesan || 'Mengirim file';
        
        let trimmedPesan = (pesan || '').trim();
        if (trimmedPesan.toUpperCase().startsWith('{{REPLY:')) {
          // Format: {{REPLY:ID|Nama|Snippet}}PesanAsli
          const match = trimmedPesan.match(/^{{REPLY:[^|]+\|([^|]+)\|.*?}}([\s\S]*)$/i);
          if (match) {
            const replyTarget = match[1].trim();
            const actualMessage = match[2].trim();
            
            if (replyTarget.toLowerCase() === String(k.Nama).trim().toLowerCase()) {
              displayTitle = nama + ' Membalas Anda';
            } else {
              displayTitle = nama + ' Membalas ' + replyTarget;
            }
            displayBody = actualMessage || 'Mengirim file';
          }
        }

        sendPushNotification(
            k.ID_Karyawan, 
            displayTitle, 
            displayBody, 
            'pesan_chat_channel',
            { 
                sender_id: idKaryawan,
                sender_name: nama,
                sender_foto: senderFoto,
                pesan: displayBody,
                target_id: k.ID_Karyawan
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

  const karyawanList = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
  const tokoList = getSheetData(SHEET_NAMES.MASTER_TOKO);
  const shiftList = getSheetData(SHEET_NAMES.SHIFT_TOKO);

  const swapList = getSheetData(SHEET_NAMES.TUKAR_SHIFT).filter(t =>
    String(t.ID_Karyawan).trim() === String(idKaryawan).trim() ||
    String(t.ID_Karyawan_Tujuan).trim() === String(idKaryawan).trim()
  );

  const result = swapList.map(t => {
    const requester = karyawanList.find(k => k.ID_Karyawan === t.ID_Karyawan);
    const tokoSaya = tokoList.find(tk => tk.ID_Toko === t.ID_Toko_Saya);
    const tokoTujuan = tokoList.find(tk => tk.ID_Toko === t.ID_Toko_Tujuan);
    const shiftSaya = shiftList.find(sf => sf.ID_Shift === t.Shift_Saya);
    const shiftTujuan = shiftList.find(sf => sf.ID_Shift === t.Shift_Tujuan);

    return {
      id: t.ID_Tukar,
      status: t.Status,
      tanggalPengajuan: formatDateTime(new Date(t.Timestamp)),
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

function getPendingTukarShift(data) {
  const { idKaryawan } = data;
  if (!idKaryawan) return { success: false, error: 'ID Karyawan wajib diisi' };

  const karyawanList = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
  const isAdmin = (idKaryawan === 'admin');

  // Ambil semua pengajuan Tukar Shift yang pending untuk karyawan ini (sebagai tujuan)
  const swapList = getSheetData(SHEET_NAMES.TUKAR_SHIFT).filter(t => {
    if (isAdmin) {
      return true; // Admin sees all Tukar Shift requests (Pending, Approved, Rejected)
    }
    return t.Status === 'Pending' && t.ID_Karyawan_Tujuan === idKaryawan;
  });

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
      status: t.Status,
      tanggalPengajuan: formatDateTime(new Date(t.Timestamp)),
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
    tugas = tugas.filter(t => t.Ditugaskan_Ke === 'ALL' || t.Ditugaskan_Ke === 'GUGUR' || t.Ditugaskan_Ke.split(',').map(s=>s.trim()).includes(idKaryawan));
  }
  if (idToko) {
    tugas = tugas.filter(t => t.ID_Toko === 'ALL' || t.ID_Toko === '-' || t.ID_Toko.split(',').map(s=>s.trim()).includes(idToko));
  }

  if (idKaryawan) {
      const logs = getSheetData(SHEET_NAMES.LOG_TUGAS);
      const todayStr = formatDate(new Date());
      
      tugas = tugas.map(t => {
          let statusPengerjaan = 'Pending';
          let dikerjakanOleh = '';
          
          let myLogs = [];
          if (t.Ditugaskan_Ke === 'GUGUR') {
              // Jika Gugur, cari log dari siapapun di toko yang sama untuk tugas ini
              // Asumsi: karyawan yang mengakses mengirimkan idToko nya sendiri (idToko dipassing ke getTugasList)
              myLogs = logs.filter(l => l.ID_Tugas === t.ID_Tugas && (l.ID_Toko === idToko || idToko === 'ALL'));
          } else {
              // Individu atau All
              myLogs = logs.filter(l => l.ID_Tugas === t.ID_Tugas && l.ID_Karyawan === idKaryawan);
          }

          if (t.Kategori_Tugas === 'Rutin') {
              const myLogsToday = myLogs.filter(l => 
                  (l.Timestamp && l.Timestamp.toString().includes(todayStr)) || 
                  formatDate(parseDateSafe(l.Timestamp) || new Date()) === todayStr
              );
              if (myLogsToday.length > 0) {
                  myLogsToday.sort((a, b) => (parseDateSafe(a.Timestamp) || new Date(0)) - (parseDateSafe(b.Timestamp) || new Date(0)));
                  statusPengerjaan = myLogsToday[myLogsToday.length - 1].Status_Verifikasi;
                  dikerjakanOleh = myLogsToday[myLogsToday.length - 1].ID_Karyawan;
              }
          } else {
              if (myLogs.length > 0) {
                  myLogs.sort((a, b) => (parseDateSafe(a.Timestamp) || new Date(0)) - (parseDateSafe(b.Timestamp) || new Date(0)));
                  statusPengerjaan = myLogs[myLogs.length - 1].Status_Verifikasi;
                  dikerjakanOleh = myLogs[myLogs.length - 1].ID_Karyawan;
              }
          }
          
          return {
              ...t,
              Status: statusPengerjaan === 'Selesai' ? 'Selesai' : (statusPengerjaan === 'Dikerjakan' ? 'Dikerjakan' : 'Pending'),
              Dikerjakan_Oleh: dikerjakanOleh
          };
      });
  }

  return {
    success: true,
    data: tugas.map(t => ({
      id: t.ID_Tugas,
      kategori: t.Kategori_Tugas,
      idToko: t.ID_Toko,
      judul: t.Judul,
      deskripsi: t.Deskripsi,
      prioritas: t.Prioritas,
      status: t.Status,
      ditugaskanKe: t.Ditugaskan_Ke,
      deadline: t.Deadline,
      selesaiAt: t.Selesai_At,
      dikerjakanOleh: t.Dikerjakan_Oleh || ''
    }))
  };
}

function updateTugasStatus(data) {
  const { idTugas, status, idKaryawan, fotoBase64, keterangan } = data;
  const idToko = data.idToko || 'ALL'; // Fallback

  let fotoUrl = '';
  if (fotoBase64) {
    try {
      fotoUrl = uploadFotoToDrive(fotoBase64, idKaryawan || 'Admin', 'Tugas');
    } catch(e) {
      console.error('Gagal upload foto tugas:', e);
    }
  }

  // Jika dipanggil oleh Admin (tanpa idKaryawan) untuk Selesai/Aktif, kita abaikan saja karena Admin sekarang pakai deleteTugas
  // Tapi kalau ada idKaryawan, berarti karyawan sedang mengerjakan / menyelesaikan
  if (idKaryawan) {
      const idLog = generateId('LT');
      appendRow(SHEET_NAMES.LOG_TUGAS, [
        formatDateTime(new Date()),
        idLog,
        idTugas,
        idKaryawan,
        idToko,
        fotoUrl,
        keterangan || '',
        status
      ]);
      
      // --- DAILY SCORE LOGIC ---
      if (status === 'Selesai' || status === 'selesai' || status === 'SELESAI') {
         const empData = getSheetData(SHEET_NAMES.MASTER_KARYAWAN).find(k => k.ID_Karyawan === idKaryawan);
         const empName = empData ? empData.Nama : '';
         logDailyScore(idKaryawan, empName, 'Selesai Tugas', `ID Tugas: ${idTugas}`, 0, 10);
      }
      // -------------------------
      
      try {
        triggerPusher('pinguin-chat', 'tugas-alert', {
          idTugas: idTugas,
          idKaryawan: idKaryawan,
          status: status,
          judul: 'Tugas',
          pesan: 'Tugas telah di-' + status.toLowerCase()
        });
      } catch (e) {}
      
      return { success: true, message: 'Status tugas diupdate ke ' + status };
  } else {
      // Admin update status (e.g., delete/selesai dari backend admin lama)
      const sheet = getSheet(SHEET_NAMES.TUGAS);
      const allData = sheet.getDataRange().getValues();
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][1] === idTugas) {
          sheet.getRange(i + 1, 9).setValue(status);
          return { success: true, message: 'Status master tugas diupdate' };
        }
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
      tglTayang: b.Tgl_Tayang || '',
      tglOff: b.Tgl_Off || '',
      tglPublish: b.Tgl_Publish || formatDate(new Date(b.Timestamp))
    }))
  };
}

function createBerita(data) {
  const { judul, isi, kategori, gambarUrl, gambarBase64, tglTayang, tglOff, dibuatOleh } = data;
  if (!judul || !isi) return { success: false, error: 'Judul dan isi wajib diisi' };

  const idBerita = generateId('BR');
  
  let finalGambarUrl = gambarUrl || '';
  if (gambarBase64) {
    try {
      finalGambarUrl = uploadFotoToDrive(gambarBase64, idBerita, 'Berita');
    } catch(e) {}
  }

  appendRow(SHEET_NAMES.BERITA, [
    formatDateTime(new Date()),
    idBerita,
    judul,
    isi,
    kategori || 'Umum',
    finalGambarUrl,
    tglTayang || '',
    tglOff || '',
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

function createTugas(data) {
  const { kategori, idToko, ditugaskanKe, judul, deskripsi, prioritas, dibuatOleh, deadline, modeToko } = data;
  if (!judul) return { success: false, error: 'Judul tugas wajib diisi' };

  const isTargetToko = kategori === 'Toko' || (kategori === 'Urgensi' && (data.urgensiTarget === 'Toko' || (!ditugaskanKe && idToko)));
  
  const targetTokoStr = idToko || 'ALL';
  let targetKarStr = ditugaskanKe || 'ALL';
  
  if (isTargetToko) {
      if (modeToko === 'gugur') {
          targetKarStr = 'GUGUR';
      } else {
          targetKarStr = 'ALL';
      }
  }

  const sheet = getSheet(SHEET_NAMES.TUGAS);
  const now = formatDateTime(new Date());
  const idTugas = generateId('TG');
  
  sheet.appendRow([
      now, 
      idTugas, 
      kategori || 'Rutin', 
      targetTokoStr, 
      targetKarStr, 
      judul, 
      deskripsi || '', 
      prioritas || 'Medium', 
      'Aktif', 
      dibuatOleh || 'Admin', 
      deadline || '', 
      '', 
      '', 
      '', 
      ''  
  ]);

  try {
    triggerPusher('pinguin-chat', 'tugas-alert', {
      idTugas: idTugas,
      kategori: kategori || 'Rutin',
      judul: judul,
      pesan: 'Tugas Baru: ' + judul,
      idToko: targetTokoStr,
      idKaryawan: targetKarStr
    });
  } catch (e) { Logger.log('Pusher tugas error: ' + e.toString()); }

  return { success: true, message: 'Tugas berhasil dibuat' };
}
function deleteTugas(data) {
  const { idTugas } = data;
  if (!idTugas) return { success: false, error: 'ID Tugas diperlukan' };
  
  if (updateCellByCondition(SHEET_NAMES.TUGAS, 'ID_Tugas', idTugas, 'Status', 'Deleted')) {
    return { success: true, message: 'Tugas berhasil dihapus' };
  }
  return { success: false, error: 'Tugas tidak ditemukan' };
}

function deleteBerita(data) {
  const { idBerita } = data;
  if (!idBerita) return { success: false, error: 'ID Berita diperlukan' };
  
  if (updateCellByCondition(SHEET_NAMES.BERITA, 'ID_Berita', idBerita, 'Status', 'Deleted')) {
    return { success: true, message: 'Berita berhasil dihapus' };
  }
  return { success: false, error: 'Berita tidak ditemukan' };
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

  if (!ss.getSheetByName(SHEET_NAMES.KASBON)) {
    const sh = ss.insertSheet(SHEET_NAMES.KASBON);
    sh.appendRow([
      'ID_Kasbon', 'ID_Karyawan', 'Nama_Karyawan', 'Tanggal_Pengajuan', 'Nominal', 'Alasan', 'Status', 'Keterangan_Admin', 'Timestamp'
    ]);
    sh.getRange("A1:I1").setFontWeight("bold").setBackground("#f3f3f3");
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
      statusSlip: s.Status_Slip || 'Draft',
      gajiPokok: s.Gaji_Pokok,
      ketGajiPokok: s.Ket_Gaji_Pokok || '',
      tarifLembur: s.Tarif_Lembur,
      jamLembur: s.Jam_Lembur,
      totalLembur: s.Total_Lembur,
      ketLembur: s.Ket_Lembur || '',
      bonus: s.Bonus,
      ketBonus: s.Ket_Bonus || '',
      uangTransport: s.Uang_Transport,
      ketUangTransport: s.Ket_Uang_Transport || '',
      tunjangan: s.Tunjangan,
      ketTunjangan: s.Ket_Tunjangan || '',
      kasbon: s.Kasbon,
      ketKasbon: s.Ket_Kasbon || '',
      potonganLain: s.Potongan_Lain,
      ketPotonganLain: s.Ket_Potongan_Lain || '',
      totalBersih: s.Total_Bersih,
      keterangan: s.Keterangan_Umum || s.Keterangan || '',
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
  // Set target_id for client-side filtering
  extraData.target_id = extraData.target_id || idKaryawan; // <--- Tambahkan baris ini
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
 * Mengirim notifikasi push hanya ke Owner yang aktif.
 */
function sendPushNotificationToOwner(title, message, channelId, extraData) {
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
    Logger.log('[FCM Owner] Gagal melampirkan foto profil: ' + e.toString());
  }

  try {
    const allKaryawan = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
    
    // 1. Kirim ke semua Owner aktif di MASTER_KARYAWAN (kecuali pengirim)
    allKaryawan.forEach(k => {
      const jabatan = String(k.Jabatan || '').trim().toLowerCase();
      const status = String(k.Status || '').trim().toLowerCase();
      const idK = String(k.ID_Karyawan || '').trim().toLowerCase();
      
      // Skip pengirim agar tidak dapat notif dari dirinya sendiri
      if (excludeId && idK === excludeId) {
        Logger.log('[FCM Owner] Skip pengirim: ' + k.Nama + ' (' + k.ID_Karyawan + ')');
        return;
      }
      
      if (jabatan === 'owner' && status === 'aktif') {
        try {
          sendPushNotification(k.ID_Karyawan, title, message, channelId, extraData);
          Logger.log('[FCM Owner] Berhasil memicu notifikasi untuk owner: ' + k.Nama + ' (' + k.ID_Karyawan + ')');
        } catch (e) {
          Logger.log('[FCM Owner] Gagal memicu notifikasi untuk owner ' + k.Nama + ': ' + e.toString());
        }
      }
    });
  } catch (e) {
    Logger.log('[FCM Owner] Gagal membaca data MASTER_KARYAWAN: ' + e.toString());
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
    const folderId = settings.find(s => String(s.Parameter || '').trim().toUpperCase() === 'FOLDER_DRIVE_ID')?.Value || '1eteic6bmF5kV64ZNcJqN6aw2sUqtDYim';

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

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(e) {
      console.error('Gagal set sharing KTP:', e);
    }

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
  const { idKaryawan, token } = data;
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
      
      const savedToken = rowObj['Profile_Token'] || '';
      // Verifikasi token jika dikirimkan (dari web lengkapi profil)
      if (token !== undefined) {
        if (!token || token !== savedToken) {
          return { success: false, error: 'Link tidak valid atau kedaluwarsa. Silakan hubungi Admin untuk meminta link baru.' };
        }
      }
      
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

function generateProfileToken(data) {
  const { idKaryawan } = data;
  if (!idKaryawan) return { success: false, error: 'ID Karyawan tidak valid' };

  const sheet = getSheet(SHEET_NAMES.MASTER_KARYAWAN);
  if (!sheet) return { success: false, error: 'Sheet tidak ditemukan' };

  ensureKaryawanExtraColumns();
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  
  const idIdx = headers.indexOf('ID_Karyawan');
  const tokenIdx = headers.indexOf('Profile_Token');
  const completeIdx = headers.indexOf('Profil_Lengkap');
  
  if (idIdx === -1 || tokenIdx === -1) {
    return { success: false, error: 'Kolom ID atau Token tidak ditemukan' };
  }

  const searchId = String(idKaryawan).trim();
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][idIdx]).trim() === searchId) {
      // Buat token random unik 12 digit
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let token = '';
      for (let j = 0; j < 12; j++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Simpan token ke sheet dan buka kunci profile_lengkap
      sheet.getRange(i + 1, tokenIdx + 1).setValue(token);
      if (completeIdx !== -1) {
        sheet.getRange(i + 1, completeIdx + 1).setValue(false); // Buka kunci link
      }
      
      const shareUrl = 'https://nafindo.github.io/absen/profil.html?id=' + encodeURIComponent(searchId) + '&token=' + token;
      return {
        success: true,
        token: token,
        shareUrl: shareUrl
      };
    }
  }

  return { success: false, error: 'Karyawan tidak ditemukan (' + searchId + ')' };
}

function submitKaryawanProfil(data) {
  try {
    const { 
      idKaryawan, nama, pin, noHP, email,
      alamatLengkap, kontakDarurat, namaKontakDarurat, 
      fotoKtpUrl, nik, tempatLahir, tglLahir, jenisKelamin, 
      rtrw, desa, kecamatan, agama, statusKawin, kewarganegaraan,
      fotoProfilUrl
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
        updateField('Foto_Profil', fotoProfilUrl);
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
        
        var exportUrl = 'https://www.googleapis.com/drive/v3/files/' + fileId + '/export?mimeType=text/plain';
        var response = UrlFetchApp.fetch(exportUrl, {
          headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
          muteHttpExceptions: true
        });
        text = response.getContentText();
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

function generateDummyGaji(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const karyawanSheet = ss.getSheetByName(SHEET_NAMES.MASTER_KARYAWAN);
    if (!karyawanSheet) return { success: false, error: 'Sheet MASTER_KARYAWAN tidak ditemukan' };
    
    // Read employees
    const list = getSheetData(SHEET_NAMES.MASTER_KARYAWAN) || [];
    const filteredList = list.filter(k => {
      const jb = String(k.Jabatan || '').trim().toLowerCase();
      const st = String(k.Status || '').trim().toLowerCase();
      if (jb === 'owner') return false;
      if (st === 'nonaktif' || st === 'off' || st === 'tidak aktif' || st === '') return false;
      return true;
    });

    if (filteredList.length === 0) {
      return { success: false, error: 'Tidak ada karyawan aktif untuk dibuatkan data dummy' };
    }

    const gajiSheet = getSheet(SHEET_NAMES.GAJI);
    if (!gajiSheet) return { success: false, error: 'Sheet DATA_GAJI tidak ditemukan' };

    // Get headers to match position
    const headersGAJI = gajiSheet.getDataRange().getValues()[0] || [];
    
    // We want to generate for Bulan 4, 5, 6 Tahun 2026
    const months = [4, 5, 6];
    const year = 2026;
    let count = 0;

    // First, read existing data to avoid duplicates
    const existingGaji = getSheetData(SHEET_NAMES.GAJI) || [];
    const existingIds = new Set(existingGaji.map(g => String(g.ID_Slip).trim()));

    filteredList.forEach(k => {
      const idK = String(k.ID_Karyawan).trim();
      const namaK = String(k.Nama).trim();
      const jabatanK = String(k.Jabatan || 'Staff').trim();
      
      // Basic salary depending on position
      let gp = 4000000;
      if (jabatanK.toLowerCase().includes('leader') || jabatanK.toLowerCase().includes('supervisor') || jabatanK.toLowerCase().includes('spv')) {
        gp = 5500000;
      } else if (jabatanK.toLowerCase().includes('manager')) {
        gp = 7500000;
      } else if (jabatanK.toLowerCase().includes('admin')) {
        gp = 4200000;
      } else if (k.Gaji_Pokok) {
        gp = parseFloat(k.Gaji_Pokok);
      }

      const glRate = k.Gaji_Lembur ? parseFloat(k.Gaji_Lembur) : 20000;

      months.forEach(month => {
        const idSlip = `SLIP-${year}-${month}-${idK}`;
        
        // Skip if already exists
        if (existingIds.has(idSlip)) {
          return;
        }

        const jamLembur = Math.floor(Math.random() * 11) + 5; // 5 to 15 hours
        const totalLembur = glRate * jamLembur;
        const bonus = (Math.floor(Math.random() * 5) + 1) * 100000; // 100k to 500k
        const uangTransport = 15000 * 22; // 330,000
        const tunjangan = 250000;
        const kasbon = Math.random() > 0.7 ? 100000 : 0;
        const potonganLain = 50000;
        const totalBersih = gp + totalLembur + bonus + uangTransport + tunjangan - kasbon - potonganLain;

        const newRowValues = [];
        headersGAJI.forEach(h => {
          if (h === 'ID_Slip') newRowValues.push(idSlip);
          else if (h === 'ID_Karyawan') newRowValues.push(idK);
          else if (h === 'Bulan') newRowValues.push(month);
          else if (h === 'Tahun') newRowValues.push(year);
          else if (h === 'Status_Slip') newRowValues.push('Published');
          else if (h === 'Gaji_Pokok') newRowValues.push(gp);
          else if (h === 'Ket_Gaji_Pokok') newRowValues.push('Gaji Pokok Bulanan');
          else if (h === 'Tarif_Lembur') newRowValues.push(glRate);
          else if (h === 'Jam_Lembur') newRowValues.push(jamLembur);
          else if (h === 'Total_Lembur') newRowValues.push(totalLembur);
          else if (h === 'Ket_Lembur') newRowValues.push('Uang Lembur Lemburan');
          else if (h === 'Bonus') newRowValues.push(bonus);
          else if (h === 'Ket_Bonus') newRowValues.push('Bonus Performa & Kedisiplinan');
          else if (h === 'Uang_Transport') newRowValues.push(uangTransport);
          else if (h === 'Ket_Uang_Transport') newRowValues.push('Transportasi Harian (22 Hari)');
          else if (h === 'Tunjangan') newRowValues.push(tunjangan);
          else if (h === 'Ket_Tunjangan') newRowValues.push('Tunjangan Makan & Jabatan');
          else if (h === 'Kasbon') newRowValues.push(kasbon);
          else if (h === 'Ket_Kasbon') newRowValues.push(kasbon > 0 ? 'Potongan Kasbon/Pinjaman' : '');
          else if (h === 'Potongan_Lain') newRowValues.push(potonganLain);
          else if (h === 'Ket_Potongan_Lain') newRowValues.push('Potongan Jaminan Kesehatan BPJS');
          else if (h === 'Keterangan_Umum') newRowValues.push('Slip Gaji Rilis Bulanan');
          else if (h === 'Total_Bersih') newRowValues.push(totalBersih);
          else if (h === 'Timestamp') newRowValues.push(new Date());
          else newRowValues.push('');
        });

        gajiSheet.appendRow(newRowValues);
        count++;
      });
    });

    return { success: true, message: `Berhasil menambahkan ${count} baris data slip gaji dummy` };

  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function ajukanKasbon(data) {
  const { idKaryawan, nominal, alasan } = data;
  if (!idKaryawan) return { success: false, error: 'ID Karyawan wajib diisi' };
  if (!nominal || isNaN(nominal) || parseFloat(nominal) <= 0) return { success: false, error: 'Nominal wajib diisi dengan angka positif' };
  if (!alasan) return { success: false, error: 'Alasan wajib diisi' };

  try {
    const userInfoRes = getUserInfo({ idKaryawan });
    if (!userInfoRes.success || !userInfoRes.user) {
      return { success: false, error: 'Karyawan tidak ditemukan' };
    }
    const nama = userInfoRes.user.nama;
    
    // Retrieve salary info from MASTER_KARYAWAN
    const karyawanList = getSheetData(SHEET_NAMES.MASTER_KARYAWAN);
    const karyawanObj = karyawanList.find(k => String(k.ID_Karyawan) === String(idKaryawan));
    if (!karyawanObj) return { success: false, error: 'Karyawan tidak terdaftar di master data' };
    
    // Get Gaji Pokok
    let gajiPokok = parseFloat(karyawanObj.Gaji_Pokok || 0);
    // If not found in master data, try finding in DATA_GAJI
    if (gajiPokok <= 0) {
      const gajiList = getSheetData(SHEET_NAMES.GAJI) || [];
      const userGaji = gajiList.filter(g => String(g.ID_Karyawan) === String(idKaryawan));
      if (userGaji.length > 0) {
        // Sort to get the latest slip
        userGaji.sort((a, b) => (parseInt(b.Tahun || 0) * 12 + parseInt(b.Bulan || 0)) - (parseInt(a.Tahun || 0) * 12 + parseInt(a.Bulan || 0)));
        gajiPokok = parseFloat(userGaji[0].Gaji_Pokok || 0);
      }
    }
    
    if (gajiPokok <= 0) {
      return { success: false, error: 'Gaji Pokok belum diatur. Tidak dapat mengajukan kasbon.' };
    }

    // Get current date details
    const now = new Date();
    const bln = now.getMonth() + 1;
    const thn = now.getFullYear();
    
    // Days in current month
    const daysInMonth = new Date(thn, bln, 0).getDate();
    
    // Get Raport Bulanan to get totalJamKerja
    const raport = getRaportBulanan({ idKaryawan, bulan: bln, tahun: thn });
    const totalJamKerja = (raport.success) ? (raport.totalJamKerja || 0) : 0;
    
    // Calculate limit (hourly rate * total hours worked)
    let maxKasbon = Math.round((gajiPokok / daysInMonth / 9.0) * totalJamKerja);
    
    // Calculate total approved kasbon this month
    const currentMonthPrefix = thn + '-' + String(bln).padStart(2, '0');
    const allKasbon = getSheetData(SHEET_NAMES.KASBON) || [];
    const approvedKasbon = allKasbon.filter(k => 
      String(k.ID_Karyawan) === String(idKaryawan) &&
      k.Status === 'Approved' &&
      String(k.Tanggal_Pengajuan).startsWith(currentMonthPrefix)
    );
    const totalApproved = approvedKasbon.reduce((sum, k) => sum + (parseFloat(k.Nominal) || 0), 0);
    
    maxKasbon = Math.max(0, maxKasbon - totalApproved);
    
    if (parseFloat(nominal) > maxKasbon) {
      return { 
        success: false, 
        error: 'Nominal pengajuan (Rp ' + parseFloat(nominal).toLocaleString('id-ID') + ') melebihi sisa batas maksimal bulan ini (Rp ' + maxKasbon.toLocaleString('id-ID') + '). Rumus: [(Gaji Pokok / Jumlah Hari / 9) x Total Jam Kerja (' + totalJamKerja + ' jam)] - Kasbon Disetujui (Rp ' + totalApproved.toLocaleString('id-ID') + ').'
      };
    }
    
    const idKasbon = 'KB-' + Date.now();
    const todayStr = formatDate(new Date());

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!ss.getSheetByName(SHEET_NAMES.KASBON)) {
      initSpreadsheet();
    }

    appendRow(SHEET_NAMES.KASBON, [
      idKasbon,
      idKaryawan,
      nama,
      todayStr,
      parseFloat(nominal),
      alasan,
      'Pending',
      '',
      new Date()
    ]);

    // Notifikasi ke pemohon (karyawan)
    try {
      sendPushNotification(
        idKaryawan,
        'Pengajuan Kasbon Sedang Diproses',
        'Pengajuan kasbon Anda sebesar Rp ' + parseFloat(nominal).toLocaleString('id-ID') + ' telah diterima dan sedang diproses oleh Admin.',
        'aktivitas_umum_channel',
        { tipe: 'kasbon', id: idKasbon }
      );
    } catch(e) {
      Logger.log('FCM to employee error: ' + e);
    }

    // Send FCM push notifications to all admins immediately
    try {
      sendPushNotificationToAllAdmin(
        'Pengajuan Kasbon Baru 💰',
        nama + ' mengajukan kasbon sebesar Rp ' + parseFloat(nominal).toLocaleString('id-ID') + ' dengan keperluan: ' + alasan,
        'aktivitas_umum_channel',
        { tipe: 'kasbon', id: idKasbon, idKaryawan: idKaryawan }
      );
    } catch (e) {
      Logger.log('FCM new kasbon request notify admin error: ' + e.toString());
    }

    return { success: true, message: 'Pengajuan kasbon berhasil dikirim' };
  } catch (e) {
    logError('ajukanKasbon', e, data);
    return { success: false, error: e.toString() };
  }
}

function getKasbonHistory(data) {
  const { idKaryawan } = data;
  if (!idKaryawan) return { success: false, error: 'ID Karyawan wajib diisi' };
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!ss.getSheetByName(SHEET_NAMES.KASBON)) {
      initSpreadsheet();
    }

    const sheetData = getSheetData(SHEET_NAMES.KASBON) || [];
    const filtered = sheetData.filter(s => String(s.ID_Karyawan) === String(idKaryawan));
    const formatted = filtered.map(s => ({
      idKasbon: s.ID_Kasbon,
      tanggal: s.Tanggal_Pengajuan,
      nominal: parseFloat(s.Nominal) || 0,
      alasan: s.Alasan || '',
      status: s.Status || 'Pending',
      keteranganAdmin: s.Keterangan_Admin || '',
      timestamp: s.Timestamp ? formatDateTime(parseDateSafe(s.Timestamp)) : ''
    }));

    formatted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return { success: true, data: formatted };
  } catch (e) {
    logError('getKasbonHistory', e, data);
    return { success: false, error: e.toString() };
  }
}

function approveKasbon(data) {
  const { idKasbon, status, approvedBy, keteranganAdmin, nominalDisetujui } = data;
  if (!idKasbon || !status || !approvedBy) return { success: false, error: 'Parameter tidak lengkap' };

  try {
    const sheet = getSheet(SHEET_NAMES.KASBON);
    const allData = sheet.getDataRange().getValues();

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === idKasbon) {
        if (status === 'Approved' && nominalDisetujui !== undefined && nominalDisetujui !== null) {
          sheet.getRange(i + 1, 5).setValue(nominalDisetujui); // Update Nominal
          allData[i][4] = nominalDisetujui;
        }
        sheet.getRange(i + 1, 7).setValue(status); // Column 7: Status
        sheet.getRange(i + 1, 8).setValue(keteranganAdmin || ''); // Column 8: Keterangan_Admin
        
        // Push notification
        const idKaryawan = allData[i][1];
        const nominal = allData[i][4];
        const statusLabel = status === 'Approved' ? 'disetujui' : 'ditolak';
        try {
          sendPushNotification(
            idKaryawan,
            'Pengajuan Kasbon ' + (status === 'Approved' ? 'Disetujui ✅' : 'Ditolak ❌'),
            'Pengajuan kasbon sebesar Rp ' + parseFloat(nominal).toLocaleString('id-ID') + ' Anda telah ' + statusLabel + '.',
            'aktivitas_umum_channel'
          );
        } catch (e) {
          Logger.log('FCM approve kasbon error: ' + e.toString());
        }

        return { success: true, message: 'Status kasbon berhasil diperbarui' };
      }
    }
    return { success: false, error: 'Pengajuan kasbon tidak ditemukan' };
  } catch (e) {
    logError('approveKasbon', e, data);
    return { success: false, error: e.toString() };
  }
}

function submitTugasLog(data) {
  const { idTugas, idKaryawan, idToko, fotoBukti, catatan } = data;
  if (!idTugas || !idKaryawan) return { success: false, error: 'ID Tugas dan ID Karyawan diperlukan' };

  let fotoUrl = '';
  if (fotoBukti && fotoBukti.startsWith('data:image')) {
    try {
      fotoUrl = uploadFotoToDrive(fotoBukti, idKaryawan, 'Tugas');
    } catch(e) {
      fotoUrl = fotoBukti; 
    }
  } else {
    fotoUrl = fotoBukti || '';
  }

  const idLog = generateId('LT');
  appendRow(SHEET_NAMES.LOG_TUGAS, [
    formatDateTime(new Date()),
    idLog,
    idTugas,
    idKaryawan,
    idToko || 'ALL',
    fotoUrl,
    catatan || '',
    'Selesai' // Status_Verifikasi otomatis selesai karena submitTugasLog
  ]);

  try {
    triggerPusher('pinguin-chat', 'tugas-alert', {
      idTugas: idTugas,
      idKaryawan: idKaryawan,
      status: 'Selesai',
      judul: 'Tugas',
      pesan: 'Tugas telah selesai'
    });
  } catch (e) {}

  return { success: true, message: 'Berhasil mensubmit tugas' };
}

function getTugasLogs(data) {
  const { idKaryawan, idTugas } = data || {};
  let logs = getSheetData(SHEET_NAMES.LOG_TUGAS);

  if (idKaryawan) {
    logs = logs.filter(l => l.ID_Karyawan === idKaryawan);
  }
  if (idTugas) {
    logs = logs.filter(l => l.ID_Tugas === idTugas);
  }

  return {
    success: true,
    data: logs.map(l => ({
      idLog: l.ID_Log,
      idTugas: l.ID_Tugas,
      idKaryawan: l.ID_Karyawan,
      idToko: l.ID_Toko,
      fotoBukti: l.Foto_Bukti,
      catatan: l.Catatan,
      statusVerifikasi: l.Status_Verifikasi,
      timestamp: l.Timestamp
    }))
  };
}

// ============================================================
// MODUL KINERJA (Zero-Risk Integration)
// ============================================================

// ============================================
// FILE: ReviewKinerja.gs (BARU — Tambah ke project)
// ============================================
// FILE INI TERPISAH dari Code.gs existing
// Jika ada error di file ini, Code.gs existing tetap jalan
// ============================================

/**
 * Web App URL terpisah untuk Review Kinerja
 * Deploy sebagai web app terpisah atau gunakan doGet terpisah
 */
function doGetReview(e) {
  var action = e.parameter.action;

  if (action == 'getMyScorecard') return getMyScorecard(e);
  if (action == 'getTeamScores') return getTeamScores(e);
  if (action == 'getOwnerReport') return getOwnerReport(e);
  if (action == 'getScoreTrend') return getScoreTrend(e);

  return jsonResponse({success: false, status: 'error', error: 'Unknown action'});
}

/**
 * POST handler untuk Review Kinerja (terpisah dari doPost existing)
 */
function doPostReview(e) {
  var action = e.parameter.action;

  if (action == 'calculateMonthlyScores') return calculateMonthlyScores(e);
  if (action == 'recalculateScore') return recalculateScore(e);
  if (action == 'exportScorecard') return exportScorecard(e);
  if (action == 'triggerMonthlyCalculation') return triggerMonthlyCalculation(e);

  return jsonResponse({success: false, status: 'error', error: 'Unknown action: ' + action});
}

/**
 * JSON response helper (terpisah, tidak ganggu existing)
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get spreadsheet (sama spreadsheet, sheet berbeda)
 */
function getSpreadsheetReview() {
  // Ganti dengan ID spreadsheet Anda
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ============================================
// KALKULASI UTAMA (CRON JOB)
// ============================================

/**
 * Kalkulasi score bulanan untuk SEMUA karyawan
 * Jalan otomatis tanggal 1 jam 01:00 via cron
 * Baca dari Sheet existing, tulis ke Sheet Monthly_Scores (BARU)
 */
function calculateMonthlyScores(data) {
  try {
    var yearMonth = data && data.year_month 
      ? data.year_month 
      : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');

    var ss = getSpreadsheetReview();

    // READ dari Sheet existing (TIDAK DIUBAH!)
    var absensiSheet = ss.getSheetByName('ABSENSI');
    var taskAssignmentsSheet = ss.getSheetByName('LOG_TUGAS');
    var tasksSheet = ss.getSheetByName('TUGAS');
    var karyawanSheet = ss.getSheetByName('MASTER_KARYAWAN');

    // WRITE ke Sheet baru
    var scoresSheet = ss.getSheetByName('Monthly_Scores');
    if (!scoresSheet) {
      // Buat sheet baru jika belum ada
      scoresSheet = ss.insertSheet('Monthly_Scores');
      scoresSheet.appendRow([
        'score_id', 'employee_id', 'store_id', 'year_month',
        'attendance_score', 'task_score', 'total_score', 'grade', 'recommendation',
        'generated_at', 'status'
      ]);
    }

    var karyawanData = karyawanSheet.getDataRange().getValues();
    var generated = 0;
    var errors = [];

    // Loop semua karyawan (skip header row 0)
    for (var i = 1; i < karyawanData.length; i++) {
      try {
        var employeeId = karyawanData[i][0];  // kolom A: id
        var employeeName = karyawanData[i][1]; // kolom B: nama
        var storeId = karyawanData[i][8];     // kolom I: Toko_Default
        var role = karyawanData[i][3];        // kolom D: Jabatan
        var status = karyawanData[i][5];      // kolom F: Status

        var roleUpper = role ? role.toString().toUpperCase().trim() : '';
        var statusUpper = status ? status.toString().toUpperCase().trim() : '';

        // Hanya hitung untuk Admin dan Karyawan, serta yang masih aktif
        if (statusUpper === 'NONAKTIF' || statusUpper === 'RESIGNED') continue;
        if (roleUpper !== 'KARYAWAN' && roleUpper !== 'ADMIN') continue;

        // === KALKULASI ATTENDANCE (baca dari Absensi) ===
        var izinCutiSheet = ss.getSheetByName('IZIN_CUTI');
        var attScore = calculateAttendanceFromSheet(absensiSheet, employeeId, yearMonth, izinCutiSheet);

        // === KALKULASI TASK (baca dari Task_Assignments + Tasks) ===
        var taskScore = calculateTaskFromSheet(taskAssignmentsSheet, tasksSheet, employeeId, yearMonth);

        // === NORMALISASI 50:50 ===
        var attPct = (attScore.raw / 500) * 100;
        var taskPct = (taskScore.raw / 1000) * 100;
        var totalPct = (attPct * 0.50) + (taskPct * 0.50);
        var totalScore = totalPct * 5; // skala 0-500

        // === GRADE ===
        var grade = getGrade(totalScore);

        // === RECOMMENDATION ===
        var recommendation = getRecommendation(employeeId, grade, attPct, yearMonth, scoresSheet);

        // === SIMPAN KE Sheet BARU ===
        var scoreId = 'SCR-' + yearMonth.replace('-', '') + '-' + employeeId;

        // Cek apakah sudah ada score untuk bulan ini
        var existingRow = findExistingScore(scoresSheet, employeeId, yearMonth);

        if (existingRow > 0) {
          // Update existing
          scoresSheet.getRange(existingRow, 5).setValue(attScore.raw);
          scoresSheet.getRange(existingRow, 6).setValue(taskScore.raw);
          scoresSheet.getRange(existingRow, 7).setValue(totalScore);
          scoresSheet.getRange(existingRow, 8).setValue(grade);
          scoresSheet.getRange(existingRow, 9).setValue(recommendation);
          scoresSheet.getRange(existingRow, 10).setValue(new Date());
        } else {
          // Insert new
          scoresSheet.appendRow([
            scoreId,
            employeeId,
            storeId,
            yearMonth,
            attScore.raw,
            taskScore.raw,
            totalScore,
            grade,
            recommendation,
            new Date(),
            'ACTIVE'
          ]);
        }

        generated++;

      } catch (empError) {
        errors.push({employee_id: karyawanData[i][0], error: empError.toString()});
      }
    }

    // Log ke Score_Audit
    logScoreAudit('SYSTEM', 'GENERATE', '', yearMonth, '', '', 'Generated ' + generated + ' scores');

    return jsonResponse({
      success: true, status: 'success',
      year_month: yearMonth,
      generated_count: generated,
      errors: errors
    });

  } catch (error) {
    return jsonResponse({success: false, status: 'error', error: error.toString()});
  }
}

function calculateAttendanceFromSheet(absensiSheet, employeeId, yearMonth, izinCutiSheet) {
  if (!izinCutiSheet && absensiSheet) {
    try { izinCutiSheet = absensiSheet.getParent().getSheetByName('IZIN_CUTI'); } catch(e){}
  }
  
  var absensiData = absensiSheet.getDataRange().getValues();

  var totalPoints = 0;
  var hadirTepat = 0;
  var terlambatRingan = 0;
  var terlambatBerat = 0;
  var izin = 0;
  var alpa = 0;
  var lateCount = 0;

  var startDate, endDate;
  if (yearMonth === 'ROLLING_30') {
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  } else {
    var parts = yearMonth.split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1;
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month + 1, 0);
  }
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  
  var presentDates = {};

  for (var i = 1; i < absensiData.length; i++) {
    var row = absensiData[i];
    var rowEmployeeId = row[1];
    var rowDate = row[0];
    var rowTipe = row[7];
    var rowStatus = row[11];
    var rowMenitTelat = row[12];

    if (rowTipe !== 'Masuk') continue;

    var rowDateObj = (rowDate instanceof Date) ? rowDate : new Date(rowDate);

    if (rowEmployeeId == employeeId && rowDateObj >= startDate && rowDateObj <= endDate) {
      var status = rowStatus ? rowStatus.toString().toUpperCase().trim() : '';
      var menitTelat = parseInt(rowMenitTelat) || 0;
      
      var dateKey = Utilities.formatDate(rowDateObj, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      presentDates[dateKey] = true;

      if (status == 'ONTIME' || status == 'HADIR_TEPAT' || status == 'TEPAT_WAKTU') {
        totalPoints += 15;
        hadirTepat++;
      }
    }
  }

  // Full Month Bonus
  if (alpa == 0 && izin <= 2 && lateCount <= 2 && hadirTepat > 0) {
    totalPoints += 50;
  }

  // Perfect Month (100% hadir tepat waktu, 0 izin, 0 terlambat, 0 alpa)
  var totalHari = hadirTepat + terlambatRingan + terlambatBerat + izin + alpa;
  if (totalHari > 0 && hadirTepat == totalHari) {
    totalPoints += 50; // tambahan di atas full month
  }

  // Cap 0-500
  totalPoints = Math.max(0, Math.min(500, totalPoints));

  return {
    raw: totalPoints,
    hadir_tepat: hadirTepat,
    terlambat_ringan: terlambatRingan,
    terlambat_berat: terlambatBerat,
    izin: izin,
    alpa: alpa,
    late_count: lateCount
  };
}

/**
 * Kalkulasi Task dari Sheet "Task_Assignments" + "Tasks" (READ-ONLY)
 */
function calculateTaskFromSheet(taskAssignmentsSheet, tasksSheet, employeeId, yearMonth) {
  var tasksData = tasksSheet.getDataRange().getValues();

  var totalAssigned = 0;
  var totalSelesai = 0;
  var totalOnTime = 0;
  var totalSubmitted = 0;
  var totalApproved = 0;

  var startDate, endDate;
  if (yearMonth === 'ROLLING_30') {
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  } else {
    var parts = yearMonth.split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1;
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month + 1, 0);
  }
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  for (var i = 1; i < tasksData.length; i++) {
    var row = tasksData[i];
    var timestamp = row[0];
    var ditugaskanKe = row[4] ? row[4].toString() : '';
    var status = row[8] ? row[8].toString().toUpperCase().trim() : '';
    var deadline = row[10];
    var selesaiAt = row[11];
    var dikerjakanOleh = row[12];

    var rowDateObj = (timestamp instanceof Date) ? timestamp : new Date(timestamp);

    if ((ditugaskanKe === employeeId || dikerjakanOleh === employeeId || ditugaskanKe === 'ALL') && rowDateObj >= startDate && rowDateObj <= endDate) {
      totalAssigned++;

      if (status === 'SELESAI' || status === 'APPROVED' || status === 'AUTO_APPROVED' || status === 'SUBMITTED') {
        if (dikerjakanOleh === employeeId || ditugaskanKe === employeeId || ditugaskanKe === 'ALL') {
          totalSelesai++;
          totalSubmitted++;

          var submittedDate = (selesaiAt instanceof Date) ? selesaiAt : new Date(selesaiAt);
          var deadlineDate = (deadline instanceof Date) ? deadline : new Date(deadline);

          if (!isNaN(submittedDate.getTime()) && !isNaN(deadlineDate.getTime())) {
            if (submittedDate <= deadlineDate) {
              totalOnTime++;
            }
          } else {
            totalOnTime++;
          }
          
          if (status === 'APPROVED' || status === 'AUTO_APPROVED') {
            totalApproved++;
          }
        }
      }
    }
  }

  var completionRate = totalAssigned > 0 ? (totalSelesai / totalAssigned) : 0;
  var onTimeRate = totalSelesai > 0 ? (totalOnTime / totalSelesai) : 0;
  var qualityRate = totalSubmitted > 0 ? (totalApproved / totalSubmitted) : 0;

  var baseScore = Math.min(completionRate, 1.0) * 600;
  var onTimeBonus = onTimeRate * 200;
  var qualityBonus = qualityRate * 200;

  var taskRaw = baseScore + onTimeBonus + qualityBonus;
  taskRaw = Math.max(0, Math.min(1000, taskRaw));

  return {
    raw: taskRaw,
    completion_rate: completionRate * 100,
    ontime_rate: onTimeRate * 100,
    quality_rate: qualityRate * 100,
    total_assigned: totalAssigned,
    total_selesai: totalSelesai,
    total_ontime: totalOnTime,
    total_approved: totalApproved
  };
}

/**
 * Get Grade dari Total Score
 */
function getGrade(totalScore) {
  if (totalScore >= 450) return 'A+';
  if (totalScore >= 400) return 'A';
  if (totalScore >= 350) return 'B+';
  if (totalScore >= 300) return 'B';
  if (totalScore >= 250) return 'C';
  if (totalScore >= 200) return 'D';
  return 'E';
}

/**
 * Get Recommendation
 */
function getRecommendation(employeeId, grade, attPct, yearMonth, scoresSheet) {
  // Cek history 2 bulan terakhir
  var scoresData = scoresSheet.getDataRange().getValues();
  var prevGrades = [];

  for (var i = 1; i < scoresData.length; i++) {
    if (scoresData[i][1] == employeeId && scoresData[i][3] != yearMonth && scoresData[i][3] != 'ROLLING_30') {
      prevGrades.push({
        year_month: scoresData[i][3],
        grade: scoresData[i][7]
      });
    }
  }

  // Sort by year_month descending
  prevGrades.sort(function(a, b) { return String(b.year_month).localeCompare(String(a.year_month)); });

  var lastGrade = prevGrades.length > 0 ? prevGrades[0].grade : '';
  var secondLastGrade = prevGrades.length > 1 ? prevGrades[1].grade : '';

  // Logic recommendation
  if (grade == 'A+' && lastGrade == 'A+' && attPct >= 80) {
    return 'BONUS_ELIGIBLE';
  }
  if ((grade == 'A+' || grade == 'A' || grade == 'B+') && 
      (lastGrade == 'A+' || lastGrade == 'A' || lastGrade == 'B+') &&
      (secondLastGrade == 'A+' || secondLastGrade == 'A' || secondLastGrade == 'B+')) {
    return 'RETAIN';
  }
  if (grade == 'B' || grade == 'C' || (lastGrade != '' && isLowerGrade(grade, lastGrade))) {
    return 'WATCH';
  }
  if (grade == 'D' || attPct < 60) {
    return 'REVIEW';
  }
  if (grade == 'E' || (lastGrade == 'E' && grade == 'E')) {
    return 'NOT_RECOMMENDED';
  }

  return 'RETAIN';
}

function isLowerGrade(current, previous) {
  var grades = ['E', 'D', 'C', 'B', 'B+', 'A', 'A+'];
  return grades.indexOf(current) < grades.indexOf(previous);
}

/**
 * Cari existing score di Monthly_Scores
 */
function findExistingScore(scoresSheet, employeeId, yearMonth) {
  var scoresData = scoresSheet.getDataRange().getValues();
  for (var i = 1; i < scoresData.length; i++) {
    if (scoresData[i][1] == employeeId && scoresData[i][3] == yearMonth) {
      return i + 1; // return row number (1-based)
    }
  }
  return 0;
}

// ============================================
// API ENDPOINTS untuk UI
// ============================================

/**
 * Get My Scorecard (untuk Karyawan)
 * GET/POST: action=getMyScorecard&employee_id=XXX&year_month=YYYY-MM
 */
function getMyScorecard(data) {
  try {
    var employeeId = data.employee_id;
    var yearMonth = data.year_month || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');

    var ss = getSpreadsheetReview();
    var scoresSheet = ss.getSheetByName('Monthly_Scores');
    var karyawanSheet = ss.getSheetByName('MASTER_KARYAWAN');

    
    if (!scoresSheet) {
      scoresSheet = ss.insertSheet('Monthly_Scores');
      scoresSheet.appendRow(['score_id', 'employee_id', 'store_id', 'year_month', 'attendance_score', 'task_score', 'total_score', 'grade', 'recommendation', 'generated_at', 'status']);
    }


    var scoresData = scoresSheet.getDataRange().getValues();
    var karyawanData = karyawanSheet.getDataRange().getValues();

    // Cari score
    var scoreRow = null;
    for (var i = 1; i < scoresData.length; i++) {
      if (scoresData[i][1] == employeeId && scoresData[i][3] == yearMonth) {
        scoreRow = scoresData[i];
        break;
      }
    }

    if (!scoreRow) {
      return jsonResponse({success: false, status: 'error', error: 'Scorecard not found for ' + yearMonth});
    }

    // Get employee info
    var employeeName = '';
    var storeId = '';
    for (var j = 1; j < karyawanData.length; j++) {
      if (karyawanData[j][0] == employeeId) {
        employeeName = karyawanData[j][1];
        storeId = karyawanData[j][5]; // sesuaikan kolom
        break;
      }
    }

    // Get trend (6 bulan terakhir)
    var trend = [];
    for (var k = 1; k < scoresData.length; k++) {
      if (scoresData[k][1] == employeeId && scoresData[k][3] != 'ROLLING_30') {
        trend.push({
          year_month: scoresData[k][3],
          total_score: scoresData[k][6],
          grade: scoresData[k][7]
        });
      }
    }
    trend.sort(function(a, b) { return String(a.year_month).localeCompare(String(b.year_month)); });

    return jsonResponse({
      success: true, status: 'success',
      employee: {
        id: employeeId,
        name: employeeName,
        store_id: storeId
      },
      scorecard: {
        year_month: scoreRow[3],
        attendance_score: scoreRow[4],
        task_score: scoreRow[5],
        total_score: scoreRow[6],
        grade: scoreRow[7],
        recommendation: scoreRow[8],
        generated_at: scoreRow[9]
      },
      trend: trend.slice(-6) // 6 bulan terakhir
    });

  } catch (error) {
    return jsonResponse({success: false, status: 'error', error: error.toString()});
  }
}

/**
 * Get Team Scores (untuk Manager)
 * GET/POST: action=getTeamScores&store_id=XXX&year_month=YYYY-MM
 */
function getTeamScores(data) {
  try {
    var storeId = data.store_id;
    var yearMonth = data.year_month || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');

    var ss = getSpreadsheetReview();
    var scoresSheet = ss.getSheetByName('Monthly_Scores');
    var karyawanSheet = ss.getSheetByName('MASTER_KARYAWAN');

    
    if (!scoresSheet) {
      scoresSheet = ss.insertSheet('Monthly_Scores');
      scoresSheet.appendRow(['score_id', 'employee_id', 'store_id', 'year_month', 'attendance_score', 'task_score', 'total_score', 'grade', 'recommendation', 'generated_at', 'status']);
    }


    var scoresData = scoresSheet.getDataRange().getValues();
    var karyawanData = karyawanSheet.getDataRange().getValues();

    var tokoSheet = ss.getSheetByName('MASTER_TOKO');
    var tokoData = tokoSheet ? tokoSheet.getDataRange().getValues() : [];
    var tokoMap = {};
    for (var t = 1; t < tokoData.length; t++) {
      tokoMap[tokoData[t][0]] = tokoData[t][1];
    }

    var teamScores = [];

    for (var i = 1; i < scoresData.length; i++) {
      if (scoresData[i][2] == storeId && scoresData[i][3] == yearMonth) {
        // Get employee name
        var empName = '';
        var role = '';
        var empStatus = '';
        for (var j = 1; j < karyawanData.length; j++) {
          if (karyawanData[j][0] == scoresData[i][1]) {
            empName = karyawanData[j][1];
            role = karyawanData[j][3];
            empStatus = karyawanData[j][5];
            break;
          }
        }

        var roleUpper = role ? role.toString().toUpperCase().trim() : '';
        var statusUpper = empStatus ? empStatus.toString().toUpperCase().trim() : '';

        if (statusUpper === 'NONAKTIF' || statusUpper === 'RESIGNED') continue;
        if (roleUpper !== 'KARYAWAN' && roleUpper !== 'ADMIN') continue;

        teamScores.push({
          employee_id: scoresData[i][1],
          employee_name: empName,
          attendance_score: scoresData[i][4],
          task_score: scoresData[i][5],
          total_score: scoresData[i][6],
          grade: scoresData[i][7],
          recommendation: scoresData[i][8]
        });
      }
    }

    // Sort by total_score descending
    teamScores.sort(function(a, b) { return b.total_score - a.total_score; });

    // Add rank
    for (var k = 0; k < teamScores.length; k++) {
      teamScores[k].rank = k + 1;
    }

    return jsonResponse({
      success: true, status: 'success',
      store_id: storeId,
      store_name: tokoMap[storeId] || storeId,
      year_month: yearMonth,
      total_employees: teamScores.length,
      scores: teamScores
    });

  } catch (error) {
    return jsonResponse({success: false, status: 'error', error: error.toString()});
  }
}

/**
 * Get Owner Report (untuk Owner — semua toko)
 * GET/POST: action=getOwnerReport&year_month=YYYY-MM
 */
function getOwnerReport(data) {
  try {
    var yearMonth = data.year_month || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');

    var ss = getSpreadsheetReview();
    var scoresSheet = ss.getSheetByName('Monthly_Scores');
    var karyawanSheet = ss.getSheetByName('MASTER_KARYAWAN');

    
    if (!scoresSheet) {
      scoresSheet = ss.insertSheet('Monthly_Scores');
      scoresSheet.appendRow(['score_id', 'employee_id', 'store_id', 'year_month', 'attendance_score', 'task_score', 'total_score', 'grade', 'recommendation', 'generated_at', 'status']);
    }


    var scoresData = scoresSheet.getDataRange().getValues();
    var karyawanData = karyawanSheet.getDataRange().getValues();

    var tokoSheet = ss.getSheetByName('MASTER_TOKO');
    var tokoData = tokoSheet ? tokoSheet.getDataRange().getValues() : [];
    var tokoMap = {};
    for (var t = 1; t < tokoData.length; t++) {
      tokoMap[tokoData[t][0]] = tokoData[t][1];
    }

    var summary = {
      total_karyawan: 0,
      avg_score: 0,
      a_plus: 0, a: 0, b_plus: 0, b: 0, c: 0, d: 0, e: 0,
      bonus_eligible: 0,
      retain: 0,
      watch: 0,
      review: 0,
      not_recommended: 0
    };

    var allScores = [];
    var totalScoreSum = 0;

    for (var i = 1; i < scoresData.length; i++) {
      if (scoresData[i][3] == yearMonth && scoresData[i][10] == 'ACTIVE') {
        summary.total_karyawan++;
        totalScoreSum += scoresData[i][6];

        var grade = scoresData[i][7];
        var rec = scoresData[i][8];

        if (grade == 'A+') summary.a_plus++;
        else if (grade == 'A') summary.a++;
        else if (grade == 'B+') summary.b_plus++;
        else if (grade == 'B') summary.b++;
        else if (grade == 'C') summary.c++;
        else if (grade == 'D') summary.d++;
        else if (grade == 'E') summary.e++;

        if (rec == 'BONUS_ELIGIBLE') summary.bonus_eligible++;
        else if (rec == 'RETAIN') summary.retain++;
        else if (rec == 'WATCH') summary.watch++;
        else if (rec == 'REVIEW') summary.review++;
        else if (rec == 'NOT_RECOMMENDED') summary.not_recommended++;

        // Get employee name
        var empName = '';
        var storeId = '';
        var role = '';
        var empStatus = '';
        for (var j = 1; j < karyawanData.length; j++) {
          if (karyawanData[j][0] == scoresData[i][1]) {
            empName = karyawanData[j][1];
            role = karyawanData[j][3];
            storeId = karyawanData[j][8];
            empStatus = karyawanData[j][5];
            break;
          }
        }

        var roleUpper = role ? role.toString().toUpperCase().trim() : '';
        var statusUpper = empStatus ? empStatus.toString().toUpperCase().trim() : '';

        if (statusUpper === 'NONAKTIF' || statusUpper === 'RESIGNED') {
          // Adjust summary if we already counted them
          summary.total_karyawan--;
          totalScoreSum -= scoresData[i][6];
          if (grade == 'A+') summary.a_plus--;
          else if (grade == 'A') summary.a--;
          else if (grade == 'B+') summary.b_plus--;
          else if (grade == 'B') summary.b--;
          else if (grade == 'C') summary.c--;
          else if (grade == 'D') summary.d--;
          else if (grade == 'E') summary.e--;
          if (rec == 'BONUS_ELIGIBLE') summary.bonus_eligible--;
          else if (rec == 'RETAIN') summary.retain--;
          else if (rec == 'WATCH') summary.watch--;
          else if (rec == 'REVIEW') summary.review--;
          else if (rec == 'NOT_RECOMMENDED') summary.not_recommended--;
          continue;
        }

        if (roleUpper !== 'KARYAWAN' && roleUpper !== 'ADMIN') {
          summary.total_karyawan--;
          totalScoreSum -= scoresData[i][6];
          if (grade == 'A+') summary.a_plus--;
          else if (grade == 'A') summary.a--;
          else if (grade == 'B+') summary.b_plus--;
          else if (grade == 'B') summary.b--;
          else if (grade == 'C') summary.c--;
          else if (grade == 'D') summary.d--;
          else if (grade == 'E') summary.e--;
          if (rec == 'BONUS_ELIGIBLE') summary.bonus_eligible--;
          else if (rec == 'RETAIN') summary.retain--;
          else if (rec == 'WATCH') summary.watch--;
          else if (rec == 'REVIEW') summary.review--;
          else if (rec == 'NOT_RECOMMENDED') summary.not_recommended--;
          continue;
        }

        allScores.push({
          employee_id: scoresData[i][1],
          employee_name: empName,
          store_id: storeId,
          store_name: tokoMap[storeId] || storeId,
          total_score: scoresData[i][6],
          grade: grade,
          recommendation: rec
        });
      }
    }

    summary.avg_score = summary.total_karyawan > 0 ? Math.round(totalScoreSum / summary.total_karyawan) : 0;

    // Sort by score
    allScores.sort(function(a, b) { return b.total_score - a.total_score; });

    return jsonResponse({
      success: true, status: 'success',
      year_month: yearMonth,
      summary: summary,
      all_scores: allScores,
      top_performers: allScores.slice(0, 10),
      red_flags: allScores.filter(function(s) { return s.recommendation == 'WATCH' || s.recommendation == 'REVIEW' || s.recommendation == 'NOT_RECOMMENDED'; })
    });

  } catch (error) {
    return jsonResponse({success: false, status: 'error', error: error.toString()});
  }
}

// ============================================
// AUDIT LOG
// ============================================

function logScoreAudit(actor, action, employeeId, yearMonth, oldScore, newScore, reason) {
  try {
    var ss = getSpreadsheetReview();
    var auditSheet = ss.getSheetByName('Score_Audit');

    if (!auditSheet) {
      auditSheet = ss.insertSheet('Score_Audit');
      auditSheet.appendRow(['audit_id', 'timestamp', 'action', 'employee_id', 'year_month', 'old_score', 'new_score', 'triggered_by']);
    }

    auditSheet.appendRow([
      'AUD-' + new Date().getTime(),
      new Date(),
      action,
      employeeId,
      yearMonth,
      oldScore,
      newScore,
      actor
    ]);

  } catch (e) {
    Logger.log('Audit log error: ' + e);
  }
}

// ============================================
// CRON JOB SETUP
// ============================================

/**
 * Setup cron job untuk kalkulasi bulanan
 * Jalankan INI SEKALI untuk setup trigger
 */
function setupReviewCronJob() {
  // Hapus trigger lama jika ada
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == 'calculateMonthlyScores') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Buat trigger baru: tanggal 1, jam 01:00
  ScriptApp.newTrigger('calculateMonthlyScores')
    .timeBased()
    .onMonthDay(1)
    .atHour(1)
    .nearMinute(0)
    .create();

  Logger.log('Review Kinerja cron job setup complete!');
  Logger.log('Trigger: Setiap tanggal 1 jam 01:00');
}

/**
 * Trigger manual untuk testing
 * Bisa dijalankan dari Apps Script editor
 */
function triggerMonthlyCalculation() {
  var result = calculateMonthlyScores({parameter: {}});
  Logger.log(result.getContent());
}

function logScoreAudit(triggeredBy, action, employeeId, yearMonth, oldScore, newScore, notes) {
  var ss = getSpreadsheetReview();
  var auditSheet = ss.getSheetByName('Score_Audit');
  if (!auditSheet) {
    auditSheet = ss.insertSheet('Score_Audit');
    auditSheet.appendRow(['audit_id', 'timestamp', 'action', 'employee_id', 'year_month', 'old_score', 'new_score', 'triggered_by', 'notes']);
  }
  var auditId = 'AUD-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss');
  auditSheet.appendRow([auditId, new Date(), action, employeeId, yearMonth, oldScore, newScore, triggeredBy, notes]);
}

function setupCronKinerja() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == 'calculateMonthlyScores') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('calculateMonthlyScores')
    .timeBased()
    .onMonthDay(1)
    .atHour(1)
    .create();
}

// ============================================
// REAL getKinerja FOR ANDROID COMPATIBILITY
// ============================================
function getKinerja(data) {
  try {
    var idKaryawan = data.idKaryawan;
    var bulan = data.bulan || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');

    var ss = getSpreadsheetReview();
    var scoresSheet = ss.getSheetByName('Monthly_Scores');
    var karyawanSheet = ss.getSheetByName('MASTER_KARYAWAN');
    
    
    if (!scoresSheet) {
      scoresSheet = ss.insertSheet('Monthly_Scores');
      scoresSheet.appendRow(['score_id', 'employee_id', 'store_id', 'year_month', 'attendance_score', 'task_score', 'total_score', 'grade', 'recommendation', 'generated_at', 'status']);
    }


    var scoresData = scoresSheet.getDataRange().getValues();
    var karyawanData = karyawanSheet.getDataRange().getValues();

    var tokoSheet = ss.getSheetByName('MASTER_TOKO');
    var tokoData = tokoSheet ? tokoSheet.getDataRange().getValues() : [];
    var tokoMap = {};
    for (var t = 1; t < tokoData.length; t++) {
      tokoMap[tokoData[t][0]] = tokoData[t][1];
    }

    var monthlyScores = [];
    var scorecard = null;

    for (var i = 1; i < scoresData.length; i++) {
      if (scoresData[i][3] == bulan && scoresData[i][10] == 'ACTIVE') {
        var empId = scoresData[i][1];
        
        var empName = '';
        var storeName = '';
        var role = '';
        var empStatus = '';
        var storeId = scoresData[i][2];
        
        for (var j = 1; j < karyawanData.length; j++) {
          if (karyawanData[j][0] == empId) {
            empName = karyawanData[j][1];
            role = karyawanData[j][3];
            storeName = tokoMap[storeId] || storeId;
            empStatus = karyawanData[j][5];
            break;
          }
        }

        var roleUpper = role ? role.toString().toUpperCase().trim() : '';
        var statusUpper = empStatus ? empStatus.toString().toUpperCase().trim() : '';

        if (statusUpper === 'NONAKTIF' || statusUpper === 'RESIGNED') continue;
        if (roleUpper !== 'KARYAWAN' && roleUpper !== 'ADMIN') continue;

        var item = {
          idKaryawan: empId,
          nama: empName,
          fotoProfil: null,
          idToko: storeId,
          namaToko: storeName,
          bulan: bulan,
          skorKehadiran: scoresData[i][4],
          skorTugas: scoresData[i][5],
          skorTotal: scoresData[i][6],
          grade: scoresData[i][7],
          rekomendasi: scoresData[i][8]
        };

        monthlyScores.push(item);

        if (idKaryawan && idKaryawan == empId) {
          var absensiSheet = ss.getSheetByName('ABSENSI');
          var taskAssignmentsSheet = ss.getSheetByName('LOG_TUGAS');
          var tasksSheet = ss.getSheetByName('TUGAS');
          
          var attScore = calculateAttendanceFromSheet(absensiSheet, empId, bulan);
          var taskScore = calculateTaskFromSheet(taskAssignmentsSheet, tasksSheet, empId, bulan);
          
          scorecard = {
            idKaryawan: item.idKaryawan,
            nama: item.nama,
            bulan: item.bulan,
            skorKehadiran: item.skorKehadiran,
            skorTugas: item.skorTugas,
            skorTotal: item.skorTotal,
            grade: item.grade,
            rekomendasi: item.rekomendasi,
            detailKehadiran: { 
              hadirTepat: attScore.hadir_tepat, 
              terlambatRingan: attScore.terlambat_ringan, 
              terlambatBerat: attScore.terlambat_berat, 
              izin: attScore.izin, 
              alpa: attScore.alpa, 
              bonusFullMonth: (attScore.alpa == 0 && attScore.izin <= 2 && attScore.late_count <= 2 && attScore.hadir_tepat > 0), 
              bonusPerfect: (attScore.hadir_tepat > 0 && attScore.hadir_tepat == (attScore.hadir_tepat + attScore.terlambat_ringan + attScore.terlambat_berat + attScore.izin + attScore.alpa)) 
            },
            detailTugas: { 
              totalDitugaskan: taskScore.total_assigned, 
              totalSelesai: taskScore.total_selesai, 
              totalTepatWaktu: taskScore.total_ontime, 
              totalApproved: taskScore.total_approved, 
              completionRate: taskScore.completion_rate, 
              onTimeRate: taskScore.ontime_rate, 
              qualityRate: taskScore.quality_rate 
            }
          };
        }
      }
    }

    return {
      success: true,
      monthlyScores: monthlyScores,
      scorecard: scorecard,
      error: null
    };

  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function updateRow(sheetName, idColName, idValue, updates, options) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) return false;
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    
    const idColIdx = headers.indexOf(idColName);
    if (idColIdx === -1) return false;
    
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idColIdx]) === String(idValue)) {
        if (options && options.checkOwnership) {
          const ownerIdx = headers.indexOf(options.ownerCol);
          if (ownerIdx > -1 && String(values[i][ownerIdx]) !== String(options.ownerId)) {
            return false; // Not the owner
          }
        }
        
        for (const key in updates) {
          const updateIdx = headers.indexOf(key);
          if (updateIdx > -1) {
            sheet.getRange(i + 1, updateIdx + 1).setValue(updates[key]);
          }
        }
        return true;
      }
    }
    return false;
  } catch(e) {
    Logger.log("Error in updateRow: " + e.toString());
    return false;
  }
}

function testUpdateRow() {
  const chatSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CHAT");
  if (!chatSheet) {
    Logger.log("Sheet CHAT tidak ditemukan!");
    return;
  }
  const data = chatSheet.getDataRange().getValues();
  if (data.length <= 1) {
    Logger.log("Sheet CHAT kosong, tidak ada pesan untuk dites.");
    return;
  }
  const idColIdx = data[0].indexOf("ID_Pesan");
  if (idColIdx === -1) {
    Logger.log("Kolom ID_Pesan tidak ditemukan!");
    return;
  }
  const testId = data[1][idColIdx]; // Ambil ID pesan dari baris pertama data
  Logger.log("Mencoba update pesan dengan ID: " + testId);
  
  const updated = updateRow("CHAT", "ID_Pesan", testId, {
    Is_Pinned: true,
    Reactions: '{"👍":["TEST_USER"]}'
  });
  
  if (updated) {
    Logger.log("Update BERHASIL!");
  } else {
    Logger.log("Update GAGAL. Pesan tidak ditemukan atau error.");
  }
}


// ==================== CEKLIST HARIAN ====================

// Format CEKLIST_HARIAN:
// 0: ID
// 1: Timestamp
// 2: Karyawan_ID
// 3: Karyawan_Nama
// 4: Toko_ID
// 5: Area_Tugas
// 6: Kebersihan
// 7: Tata_Letak
// 8: Barang_Rusak
// 9: Barang_Kosong
// 10: Catatan
// 11: Foto_URL

function submitChecklistHarian(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.CEKLIST_HARIAN);
    const id = "CKL" + new Date().getTime();
    const timestamp = formatDateTime(new Date());
    
    let photoUrl = "";
    if (data.foto_base64 && data.foto_base64.length > 10) {
      photoUrl = uploadBase64ToDrive(data.foto_base64, "Checklist_" + id, "image/jpeg");
    }

    const rowData = [
      id,
      timestamp,
      data.karyawan_id || "",
      data.karyawan_nama || "",
      data.toko_id || "",
      data.area_tugas || "",
      data.kebersihan ? "Bersih" : "Kotor",
      data.tata_letak ? "Rapi" : "Berantakan",
      data.barang_rusak ? "Ada Rusak" : "Aman",
      data.barang_kosong ? "Ada Kosong" : "Aman",
      data.catatan || "",
      photoUrl
    ];

    sheet.appendRow(rowData);
    
    // --- DAILY SCORE LOGIC ---
    logDailyScore(data.karyawan_id || '', data.karyawan_nama || '', 'Selesai Ceklist Harian', `Area: ${data.area_tugas || ''}`, 0, 10);
    // -------------------------

    return {
      success: true,
      message: "Ceklist harian berhasil disimpan",
      id: id,
      timestamp: timestamp,
      foto_url: photoUrl
    };
  } catch (error) {
    logError('submitChecklistHarian', error, data);
    return { success: false, error: error.toString() };
  }
}

function getChecklistHarian(data) {
  try {
    const sheet = getSheet(SHEET_NAMES.CEKLIST_HARIAN);
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return { success: true, data: [] };

    const headers = rows[0];
    const results = [];
    
    const tokoId = data.toko_id;
    const karyawanId = data.karyawan_id;
    const filterDate = data.date; // format DD/MM/YYYY
    
    for (let i = rows.length - 1; i >= 1; i--) {
      const row = rows[i];
      
      // Filter by toko if provided
      if (tokoId && row[4] != tokoId) continue;
      // Filter by karyawan if provided
      if (karyawanId && row[2] != karyawanId) continue;
      
      // Filter by date if provided
      if (filterDate) {
         const rowTimestamp = row[1];
         // Basic date matching (assuming DD/MM/YYYY prefix)
         if (typeof rowTimestamp === 'string' && !rowTimestamp.startsWith(filterDate)) {
             continue;
         } else if (rowTimestamp instanceof Date) {
             const d = Utilities.formatDate(rowTimestamp, "Asia/Jakarta", "dd/MM/yyyy");
             if (d !== filterDate) continue;
         }
      }

      results.push({
        id: row[0],
        timestamp: row[1],
        karyawan_id: row[2],
        karyawan_nama: row[3],
        toko_id: row[4],
        area_tugas: row[5],
        kebersihan: row[6],
        tata_letak: row[7],
        barang_rusak: row[8],
        barang_kosong: row[9],
        catatan: row[10],
        foto_url: row[11]
      });
      
      // Limit to 50 results for performance if no specific filter
      if (!filterDate && !karyawanId && results.length >= 50) break;
    }

    return { success: true, data: results };
  } catch (error) {
    logError('getChecklistHarian', error, data);
    return { success: false, error: error.toString() };
  }
}

// ============================================================
// MODUL SCORE AUDIT
// ============================================================
function updateScoreAudit(karyawanId, karyawanNama, tokoId, type, scoreToAdd) {
  try {
    const sheet = getSheet(SHEET_NAMES.SCORE_AUDIT);
    const dateStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy");
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    
    // Cari baris karyawan pada hari ini
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === dateStr && data[i][0] === karyawanId) {
        rowIndex = i + 1; // 1-based index for sheet
        break;
      }
    }
    
    if (rowIndex === -1) {
      // Baris baru
      // Kolom: 0:Karyawan_ID, 1:Nama, 2:Tanggal, 3:Toko_ID, 4:Status_Absen, 5:Score_Absen, 6(G):Task_Score, 7(H):Ceklist_Score, 8(I):Total_Score
      const newRow = [
        karyawanId, 
        karyawanNama, 
        dateStr, 
        tokoId, 
        (type === 'Absen' ? 'Hadir' : '-'), 
        (type === 'Absen' ? scoreToAdd : 0), // F: Score Absen
        (type === 'Tugas' ? scoreToAdd : 0), // G: Task Score
        (type === 'Checklist' ? scoreToAdd : 0), // H: Ceklist Score
        scoreToAdd // I: Total Score
      ];
      sheet.appendRow(newRow);
    } else {
      // Update baris
      let currentAbsen = parseInt(data[rowIndex - 1][5]) || 0;
      let currentTask = parseInt(data[rowIndex - 1][6]) || 0;
      let currentChecklist = parseInt(data[rowIndex - 1][7]) || 0;
      let currentTotal = parseInt(data[rowIndex - 1][8]) || 0;
      
      if (type === 'Absen') {
        currentAbsen = scoreToAdd;
        sheet.getRange(rowIndex, 5).setValue('Hadir');
        sheet.getRange(rowIndex, 6).setValue(currentAbsen);
      } else if (type === 'Tugas') {
        currentTask += scoreToAdd;
        sheet.getRange(rowIndex, 7).setValue(currentTask);
      } else if (type === 'Checklist') {
        currentChecklist += scoreToAdd;
        sheet.getRange(rowIndex, 8).setValue(currentChecklist);
      }
      
      currentTotal = currentAbsen + currentTask + currentChecklist;
      sheet.getRange(rowIndex, 9).setValue(currentTotal);
    }
  } catch (e) {
    logError('updateScoreAudit', e, { karyawanId, type });
  }
}


function logDailyScore(idKaryawan, nama, aktivitas, keterangan, attScore, taskScore) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let auditSheet = ss.getSheetByName('Score_Audit');
    
    // Auto-create & Set Headers if not match new format
    if (!auditSheet) {
      auditSheet = ss.insertSheet('Score_Audit');
      auditSheet.appendRow(['Timestamp', 'ID_Karyawan', 'Nama', 'Tanggal', 'Aktivitas', 'Keterangan', 'Score_Attendance', 'Score_Task', 'Total_Score']);
    } else {
      const headers = auditSheet.getRange(1, 1, 1, 9).getValues()[0];
      if (headers[0] !== 'Timestamp' && headers[6] !== 'Score_Attendance') {
         auditSheet.insertRowsBefore(1, 1);
         auditSheet.getRange(1, 1, 1, 9).setValues([['Timestamp', 'ID_Karyawan', 'Nama', 'Tanggal', 'Aktivitas', 'Keterangan', 'Score_Attendance', 'Score_Task', 'Total_Score']]);
      }
    }

    const today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
    const totalScore = (attScore || 0) + (taskScore || 0);

    auditSheet.appendRow([
      formatDateTime(new Date()),
      idKaryawan,
      nama || '',
      today,
      aktivitas,
      keterangan,
      attScore || 0,
      taskScore || 0,
      totalScore
    ]);

  } catch (e) {
    console.error('Gagal logDailyScore:', e);
  }
}
