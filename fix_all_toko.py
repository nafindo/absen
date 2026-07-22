import os

file_path = r'd:\absen\code.gs'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re

old_create_tugas = re.search(r'function createTugas\(data\) \{.*?(?=function deleteTugas)', content, re.DOTALL).group(0)

new_create_tugas = """function createTugas(data) {
  const { kategori, idToko, ditugaskanKe, judul, deskripsi, prioritas, dibuatOleh, deadline } = data;
  if (!judul) return { success: false, error: 'Judul tugas wajib diisi' };

  let targetTokos = (idToko || '').split(',').map(s => s.trim()).filter(s => s);
  let targetKaryawans = (ditugaskanKe || '').split(',').map(s => s.trim()).filter(s => s);
  
  let finalTokos = [];
  let finalKaryawans = [];
  
  const isTargetKaryawan = kategori === 'Individu' || (kategori === 'Urgensi' && targetKaryawans.length > 0 && targetTokos.length === 0);
  const isTargetToko = kategori === 'Toko' || (kategori === 'Urgensi' && targetTokos.length > 0 && targetKaryawans.length === 0) || kategori === 'Rutin';

  if (isTargetKaryawan) {
      if (targetKaryawans.length > 0 && targetKaryawans[0] === 'ALL') {
          const karSheet = getSheetData(SHEET_NAMES.KARYAWAN);
          finalKaryawans = karSheet.filter(k => k.Status !== 'Deleted').map(k => k.ID_Karyawan);
      } else if (targetKaryawans.length > 0) {
          finalKaryawans = targetKaryawans;
      }
      finalTokos = ['ALL']; // Store is ALL for Individual tasks
  } else if (isTargetToko) {
      if (targetTokos.length > 0 && targetTokos[0] === 'ALL') {
          const tokoSheet = getSheetData(SHEET_NAMES.TOKO);
          finalTokos = tokoSheet.filter(t => t.Status !== 'Deleted').map(t => t.ID_Toko);
      } else if (targetTokos.length > 0) {
          finalTokos = targetTokos;
      }
      finalKaryawans = ['ALL']; // Employee is ALL for Toko tasks
  }

  const sheet = getSheet(SHEET_NAMES.TUGAS);
  const now = formatDateTime(new Date());
  
  let ids = [];
  
  if (isTargetKaryawan) {
      finalKaryawans.forEach(kar => {
          const idTugas = generateId('TG');
          ids.push(idTugas);
          sheet.appendRow([now, idTugas, kategori, 'ALL', kar, judul, deskripsi || '', prioritas || 'Medium', 'Pending', dibuatOleh || 'Admin', deadline || '', '', '']);
      });
  } else {
      finalTokos.forEach(tok => {
          const idTugas = generateId('TG');
          ids.push(idTugas);
          sheet.appendRow([now, idTugas, kategori || 'Rutin', tok, 'ALL', judul, deskripsi || '', prioritas || 'Medium', 'Pending', dibuatOleh || 'Admin', deadline || '', '', '']);
      });
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

print("code.gs createTugas beautifully fixed!")
