import os

file_path = r'd:\absen\code.gs'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re

old_create_tugas = re.search(r'function createTugas\(data\) \{.*?(?=function deleteTugas)', content, re.DOTALL).group(0)

new_create_tugas = """function createTugas(data) {
  const { kategori, idToko, ditugaskanKe, judul, deskripsi, prioritas, dibuatOleh, deadline } = data;
  if (!judul) return { success: false, error: 'Judul tugas wajib diisi' };

  let targetTokos = (idToko || 'ALL').split(',').map(s => s.trim()).filter(s => s);
  let targetKaryawans = (ditugaskanKe || 'ALL').split(',').map(s => s.trim()).filter(s => s);
  
  let finalTokos = ['ALL'];
  let finalKaryawans = ['ALL'];
  
  if ((kategori === 'Toko' || kategori === 'Urgensi') && targetTokos.length > 0 && targetTokos[0] !== 'ALL') {
      finalTokos = targetTokos;
      finalKaryawans = ['ALL']; // if target is toko, it applies to all karyawan in that toko
  } else if ((kategori === 'Individu' || kategori === 'Urgensi') && targetKaryawans.length > 0 && targetKaryawans[0] !== 'ALL') {
      finalKaryawans = targetKaryawans;
      finalTokos = ['ALL'];
  }

  const sheet = getSheet(SHEET_NAMES.TUGAS);
  const now = formatDateTime(new Date());
  
  let ids = [];
  
  if (kategori === 'Individu' || (kategori === 'Urgensi' && finalKaryawans.length > 0 && finalKaryawans[0] !== 'ALL')) {
      // Loop Karyawan
      finalKaryawans.forEach(kar => {
          const idTugas = generateId('TG');
          ids.push(idTugas);
          sheet.appendRow([now, idTugas, kategori, 'ALL', kar, judul, deskripsi || '', prioritas || 'Medium', 'Pending', dibuatOleh || 'Admin', deadline || '', '', '']);
      });
  } else if (kategori === 'Toko' || (kategori === 'Urgensi' && finalTokos.length > 0 && finalTokos[0] !== 'ALL')) {
      // Loop Toko
      finalTokos.forEach(tok => {
          const idTugas = generateId('TG');
          ids.push(idTugas);
          sheet.appendRow([now, idTugas, kategori, tok, 'ALL', judul, deskripsi || '', prioritas || 'Medium', 'Pending', dibuatOleh || 'Admin', deadline || '', '', '']);
      });
  } else {
      // Rutin or ALL
      const idTugas = generateId('TG');
      ids.push(idTugas);
      sheet.appendRow([now, idTugas, kategori || 'Rutin', idToko || 'ALL', ditugaskanKe || 'ALL', judul, deskripsi || '', prioritas || 'Medium', 'Pending', dibuatOleh || 'Admin', deadline || '', '', '']);
  }

  // Broadcast notifikasi tugas baru
  try {
    triggerPusher('pinguin-chat', 'tugas-alert', {
      idTugas: ids[0], // send first id just for triggering reload
      kategori: kategori || 'Rutin',
      judul: judul,
      pesan: 'Tugas Baru: ' + judul,
      idToko: idToko || 'ALL',
      idKaryawan: ditugaskanKe || 'ALL'
    });
  } catch (e) { Logger.log('Pusher tugas error: ' + e.toString()); }

  return { success: true, message: 'Tugas berhasil dibuat' };
}
"""

content = content.replace(old_create_tugas, new_create_tugas)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("code.gs createTugas updated!")
