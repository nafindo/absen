import re

def patch_code_gs_toko_mode():
    with open('d:\\absen\\code.gs', 'r', encoding='utf-8') as f:
        content = f.read()

    # Update createTugas
    create_tugas_new = """function createTugas(data) {
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
}"""
    content = re.sub(r'function createTugas\(data\) \{[\s\S]*?return \{ success: true, message: \'Tugas berhasil dibuat\' \};\n\}', create_tugas_new, content)

    # Update getTugasList
    get_tugas_list_new = """function getTugasList(data) {
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
                  statusPengerjaan = myLogsToday[myLogsToday.length - 1].Status_Verifikasi;
                  dikerjakanOleh = myLogsToday[myLogsToday.length - 1].ID_Karyawan;
              }
          } else {
              if (myLogs.length > 0) {
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
}"""
    content = re.sub(r'function getTugasList\(data\) \{[\s\S]*?return \{\s*success: true,\s*data: tugas\.map\([\s\S]*?\}\)\)\s*\};\n\}', get_tugas_list_new, content)

    with open('d:\\absen\\code.gs', 'w', encoding='utf-8') as f:
        f.write(content)
    print("code.gs patched successfully")

if __name__ == "__main__":
    patch_code_gs_toko_mode()
