import os

file_path = r'd:\absen\absen-admin\app\src\main\java\com\pinguincell\absen\admin\ui\AdminTaskScreen.kt'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re

old_logic = """                                var finalIdToko = "ALL"
                                var finalDitugaskanKe = "ALL"

                                if (kategori == "Toko" || (kategori == "Urgensi" && urgensiTarget == "Toko")) {
                                    finalIdToko = if (isAllToko || selectedToko.isEmpty()) "ALL" else selectedToko.joinToString(",")
                                }
                                if (kategori == "Individu" || (kategori == "Urgensi" && urgensiTarget == "Karyawan")) {
                                    finalDitugaskanKe = if (isAllKaryawan || selectedKaryawan.isEmpty()) "ALL" else selectedKaryawan.joinToString(",")
                                }"""

new_logic = """                                var finalIdToko = "ALL"
                                var finalDitugaskanKe = "ALL"

                                if (kategori == "Toko" || (kategori == "Urgensi" && urgensiTarget == "Toko")) {
                                    finalIdToko = if (isAllToko || selectedToko.isEmpty()) "ALL" else selectedToko.joinToString(",")
                                    finalDitugaskanKe = "" // Not for Karyawan
                                }
                                if (kategori == "Individu" || (kategori == "Urgensi" && urgensiTarget == "Karyawan")) {
                                    finalDitugaskanKe = if (isAllKaryawan || selectedKaryawan.isEmpty()) "ALL" else selectedKaryawan.joinToString(",")
                                    finalIdToko = "" // Not for Toko
                                }"""

content = content.replace(old_logic, new_logic)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("AdminTaskScreen urgensi target logic fixed!")
