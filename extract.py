import re
with open('app.js', 'r', encoding='utf-8') as f:
    print("app.js:", set(re.findall(r"apiCall\('([^']+)'", f.read())))
with open('admin.js', 'r', encoding='utf-8') as f:
    print("admin.js:", set(re.findall(r"apiCall\('([^']+)'", f.read())))
