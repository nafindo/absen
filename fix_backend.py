import re

with open(r"d:\absen\code.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Reply_To to CHAT headers
content = content.replace(
    "'CHAT': ['Timestamp', 'ID_Pesan', 'ID_Karyawan', 'Nama', 'Pesan', 'Tipe', 'File_URL', 'Nama_File', 'Size_KB']",
    "'CHAT': ['Timestamp', 'ID_Pesan', 'ID_Karyawan', 'Nama', 'Pesan', 'Tipe', 'File_URL', 'Nama_File', 'Size_KB', 'Reply_To']"
)

# 2. Update sendChatMessage signature to receive replyTo and append it
content = content.replace(
    "const { idKaryawan, nama, pesan, tipe, fileBase64, namaFile } = data;",
    "const { idKaryawan, nama, pesan, tipe, fileBase64, namaFile, replyTo } = data;"
)
old_append = """  appendRow(SHEET_NAMES.CHAT, [
    formatDateTime(new Date()),
    idPesan,
    idKaryawan,
    nama,
    pesan,
    tipe || 'text',
    fileUrl,
    namaFile || '',
    sizeKB
  ]);"""
new_append = """  appendRow(SHEET_NAMES.CHAT, [
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
  ]);"""
content = content.replace(old_append, new_append)

# 3. Update Pusher payload in sendChatMessage
old_pusher = """    triggerPusher('pinguin-chat', 'new-message', {
      tempId: data.tempId || '',
      idPesan: idPesan,
      idKaryawan: idKaryawan,
      nama: nama,
      pesan: pesan,
      tipe: tipe || 'text',
      fileUrl: fileUrl,
      namaFile: namaFile || '',
      waktu: formatDateTime(new Date())
    });"""
new_pusher = """    triggerPusher('pinguin-chat', 'new-message', {
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
    });"""
content = content.replace(old_pusher, new_pusher)

# 4. Update getChatMessages to return replyTo
old_getchat = """      tipe: c.Tipe || 'text',
      fileUrl: c.File_URL || '',
      namaFile: c.Nama_File || '',
      waktu: formatDateTime(new Date(c.Timestamp))"""
new_getchat = """      tipe: c.Tipe || 'text',
      fileUrl: c.File_URL || '',
      namaFile: c.Nama_File || '',
      replyTo: c.Reply_To || c.replyTo || null,
      waktu: formatDateTime(new Date(c.Timestamp))"""
content = content.replace(old_getchat, new_getchat)

with open(r"d:\absen\code.js", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated code.js for replyTo")
