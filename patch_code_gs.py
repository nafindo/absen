import os

path = r'd:\absen\code.gs'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """  if (idToko) {
    tugas = tugas.filter(t => t.ID_Toko === 'ALL' || t.ID_Toko.split(',').map(s=>s.trim()).includes(idToko));
  }"""

new_logic = """  if (idToko) {
    tugas = tugas.filter(t => t.ID_Toko === 'ALL' || t.ID_Toko === '-' || t.ID_Toko.split(',').map(s=>s.trim()).includes(idToko));
  }"""

content = content.replace(old_logic, new_logic)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated code.gs')
