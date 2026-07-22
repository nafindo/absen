import os

file_path = r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\TugasScreen.kt'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'val isSelesai = tugas.isSelesaiHariIni == true || tugas.isSelesaiPermanen == true',
    'val isSelesai = tugas.status == "Selesai" || tugas.isSelesaiHariIni == true || tugas.isSelesaiPermanen == true'
)

content = content.replace(
    'it.isSelesaiHariIni == true || it.isSelesaiPermanen == true',
    'it.status == "Selesai" || it.isSelesaiHariIni == true || it.isSelesaiPermanen == true'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("TugasScreen fixed")
