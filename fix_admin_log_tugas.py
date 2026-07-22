import os

file_path = r'd:\absen\absen-admin\app\src\main\java\com\pinguincell\absen\admin\ui\viewmodels\AdminLogTugasViewModel.kt'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('emptyList<TugasLogItem>()', 'emptyList()')

content = content.replace('var rawLogs = logsResponse.data ?: emptyList()', 'var rawLogs = logsResponse.data ?: emptyList<TugasLogItem>()')

content = content.replace('val tasksList = if (tasksResponse.success) tasksResponse.data ?: emptyList() else emptyList()', 'val tasksList = if (tasksResponse.success) tasksResponse.data ?: emptyList<TugasItem>() else emptyList<TugasItem>()')

content = content.replace('val logsForThisTask = grouped[task.id] ?: emptyList()', 'val logsForThisTask = grouped[task.id] ?: emptyList<TugasLogItem>()')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("AdminLogTugasViewModel fixed!")
