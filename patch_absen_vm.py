import os

path = r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\AbsensiViewModel.kt'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('fun absenMasuk(', 'fun absenMasuk(context: Context, ')
content = content.replace('CacheManager.saveCache("absenStatus", "sudah_masuk")', 'CacheManager.saveCache("absenStatus", "sudah_masuk")\n                    NotificationHelper.cancelMasukReminders(context)')

content = content.replace('fun absenPulang(', 'fun absenPulang(context: Context, ')
content = content.replace('CacheManager.saveCache("absenStatus", "sudah_pulang")', 'CacheManager.saveCache("absenStatus", "sudah_pulang")\n                    NotificationHelper.cancelPulangReminders(context)')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated AbsensiViewModel.kt')
