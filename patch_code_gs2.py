import re

def patch_code_gs():
    with open('d:\\absen\\code.gs', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace createTugas
    create_tugas_new = """function createTugas(data) {
  const { kategori, idToko, ditugaskanKe, judul, deskripsi, prioritas, dibuatOleh, deadline, modeToko } = data;
  if (!judul) return { success: false, error: 'Judul tugas wajib diisi' };

  const targetTokoStr = idToko || 'ALL';
  const targetKarStr = ditugaskanKe || 'ALL';

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
}"""
    content = re.sub(r'function createTugas\(data\) \{[\s\S]*?return \{ success: true, message: \'Tugas berhasil dibuat\' \};\n\}', create_tugas_new, content)

    # 2. Replace getTugasList
    get_tugas_list_new = """function getTugasList(data) {
  const { idKaryawan, idToko } = data || {};
  let tugas = getSheetData(SHEET_NAMES.TUGAS).filter(t => t.Status !== 'Deleted');

  if (idKaryawan) {
    tugas = tugas.filter(t => t.Ditugaskan_Ke === 'ALL' || t.Ditugaskan_Ke.split(',').map(s=>s.trim()).includes(idKaryawan));
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
          
          if (t.Kategori_Tugas === 'Rutin') {
              const myLogsToday = logs.filter(l => 
                  l.ID_Tugas === t.ID_Tugas && 
                  l.ID_Karyawan === idKaryawan && 
                  (l.Timestamp && l.Timestamp.toString().includes(todayStr) || formatDate(parseDateSafe(l.Timestamp) || new Date()) === todayStr)
              );
              if (myLogsToday.length > 0) {
                  // Ambil status log terbaru
                  statusPengerjaan = myLogsToday[myLogsToday.length - 1].Status_Verifikasi;
                  dikerjakanOleh = idKaryawan;
              }
          } else {
              const myLogs = logs.filter(l => 
                  l.ID_Tugas === t.ID_Tugas && 
                  l.ID_Karyawan === idKaryawan
              );
              if (myLogs.length > 0) {
                  statusPengerjaan = myLogs[myLogs.length - 1].Status_Verifikasi;
                  dikerjakanOleh = idKaryawan;
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
}"""
    content = re.sub(r'function getTugasList\(data\) \{[\s\S]*?return \{\s*success: true,\s*data: tugas\.map\([\s\S]*?\}\)\)\s*\};\n\}', get_tugas_list_new, content)

    # 3. Replace updateTugasStatus
    update_tugas_status_new = """function updateTugasStatus(data) {
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
}"""
    content = re.sub(r'function updateTugasStatus\(data\) \{[\s\S]*?return \{ success: false, error: \'Tugas tidak ditemukan\' \};\n\}', update_tugas_status_new, content)

    # 4. Replace submitTugasLog
    submit_tugas_log_new = """function submitTugasLog(data) {
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
}"""
    content = re.sub(r'function submitTugasLog\(data\) \{[\s\S]*?return \{ success: true, message: \'Berhasil mensubmit tugas\' \};\n\}', submit_tugas_log_new, content)

    with open('d:\\absen\\code.gs', 'w', encoding='utf-8') as f:
        f.write(content)
    print("code.gs patched successfully")

if __name__ == "__main__":
    patch_code_gs()
