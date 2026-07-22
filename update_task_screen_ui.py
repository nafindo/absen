import os

file_path = r'd:\absen\absen-admin\app\src\main\java\com\pinguincell\absen\admin\ui\AdminTaskScreen.kt'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add modeToko state
target1 = '''                var urgensiTarget by remember { mutableStateOf("Toko") } // "Toko" or "Karyawan"'''
replacement1 = '''                var urgensiTarget by remember { mutableStateOf("Toko") } // "Toko" or "Karyawan"

                var modeToko by remember { mutableStateOf("gugur") } // "gugur" or "all"'''
if target1 in content:
    content = content.replace(target1, replacement1)
else:
    print("target1 not found")

# 2. Add RadioButtons for modeToko
target2 = '''                    if (showTokoSelection) {
                        Text("Pilih Toko:", fontWeight = FontWeight.Bold)
                        Row(verticalAlignment = Alignment.CenterVertically) {'''
replacement2 = '''                    if (showTokoSelection) {
                        Text("Pilih Toko:", fontWeight = FontWeight.Bold)
                        Text("Mode Target Toko:", fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(selected = modeToko == "gugur", onClick = { modeToko = "gugur" })
                            Text("Gugur (Satu Lapor, Semua Selesai)")
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(selected = modeToko == "all", onClick = { modeToko = "all" })
                            Text("Semua (Setiap Orang Wajib Lapor)")
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {'''
if target2 in content:
    content = content.replace(target2, replacement2)
else:
    print("target2 not found")

# 3. Update viewModel.createTask
target3 = '''                                viewModel.createTask(
                                    judul = judul, 
                                    deskripsi = deskripsi, 
                                    kategori = kategori, 
                                    idToko = finalIdToko, 
                                    ditugaskanKe = finalDitugaskanKe,
                                    deadline = if (kategori == "Rutin") "" else deadline,
                                    prioritas = prioritas
                                )'''
replacement3 = '''                                viewModel.createTask(
                                    judul = judul, 
                                    deskripsi = deskripsi, 
                                    kategori = kategori, 
                                    idToko = finalIdToko, 
                                    ditugaskanKe = finalDitugaskanKe,
                                    deadline = if (kategori == "Rutin") "" else deadline,
                                    prioritas = prioritas,
                                    modeToko = modeToko
                                )'''
if target3 in content:
    content = content.replace(target3, replacement3)
else:
    print("target3 not found")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
