import os

path = r'd:\absen\absen-native\app\src\main\AndroidManifest.xml'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'SCHEDULE_EXACT_ALARM' not in content:
    perm_insert_pos = content.find('<uses-permission android:name="android.permission.INTERNET" />')
    perms = '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />\n    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />\n    '
    content = content[:perm_insert_pos] + perms + content[perm_insert_pos:]

if 'ShiftReminderReceiver' not in content:
    receiver_str = '\n        <receiver\n            android:name=".ShiftReminderReceiver"\n            android:exported="false">\n        </receiver>\n'
    insert_pos = content.rfind('</application>')
    content = content[:insert_pos] + receiver_str + content[insert_pos:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Patched AndroidManifest.xml')
