import os

path = r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\NotificationHelper.kt'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'schedule3Times(context, alarmManager, jamMasukStr, "Masuk", 100)',
    'schedule3Times(context, alarmManager, jamMasukStr, "Masuk", 100, listOf(-15, -10, -5))'
)
content = content.replace(
    'schedule3Times(context, alarmManager, jamPulangStr, "Pulang", 200)',
    'schedule3Times(context, alarmManager, jamPulangStr, "Pulang", 200, listOf(5, 10, 15))'
)
content = content.replace(
    'private fun schedule3Times(context: Context, alarmManager: AlarmManager, timeStr: String, type: String, baseId: Int) {',
    'private fun schedule3Times(context: Context, alarmManager: AlarmManager, timeStr: String, type: String, baseId: Int, offsets: List<Int>) {'
)
content = content.replace(
    'val offsets = listOf(-15, -10, -5)\n            for (i in offsets.indices) {',
    'for (i in offsets.indices) {'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated NotificationHelper.kt offsets')
