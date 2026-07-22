import os

file_path = r'd:\absen\absen-admin\app\src\main\java\com\pinguincell\absen\admin\ui\AdminTaskScreen.kt'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False

for i, line in enumerate(lines):
    if 'val tabTitles = listOf' in line:
        new_lines.append('    val tabTitles = listOf("Rutin", "Individu", "Toko", "Urgensi", "Monitor")\n')
        continue
        
    if 'val filteredTasks = tasks.filter {' in line:
        new_lines.append('                    if (selectedTabIndex == 4) {\n')
        new_lines.append('                        Box(modifier = Modifier.weight(1f)) {\n')
        new_lines.append('                            AdminLogTugasScreen()\n')
        new_lines.append('                        }\n')
        new_lines.append('                    } else {\n')
        new_lines.append('                    val filteredTasks = tasks.filter { task ->\n')
        new_lines.append('                        when (selectedTabIndex) {\n')
        new_lines.append('                            0 -> task.kategori == "Rutin"\n')
        new_lines.append('                            1 -> task.kategori == "Individu"\n')
        new_lines.append('                            2 -> task.kategori == "Toko"\n')
        new_lines.append('                            3 -> task.kategori == "Urgensi"\n')
        new_lines.append('                            else -> false\n')
        new_lines.append('                        }\n')
        new_lines.append('                    }\n')
        skip = True
        continue
        
    if skip and 'if (isLoading && tasks.isEmpty()) {' in line:
        skip = False
        
    if 'if (selectedTabIndex == 4) {' in line and 'Gunakan Kembali' in ''.join(lines[i:i+20]):
        skip = True
        continue
        
    if skip and 'IconButton(onClick = { viewModel.deleteTask(task.id) }) {' in line:
        skip = False
        
    if not skip:
        new_lines.append(line)

final_lines = []
for i, line in enumerate(new_lines):
    if 'FloatingActionButton(' in line:
        final_lines.append('                    }\n')
    final_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)
print('Patched successfully')
