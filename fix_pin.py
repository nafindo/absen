with open(r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\MainActivity.kt', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('shiftDefault = prefs.getString("userShift", "") ?: "",', 'shiftDefault = prefs.getString("userShift", "") ?: "",
                            pin = "",')
with open(r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\MainActivity.kt', 'w', encoding='utf-8') as f:
    f.write(content)
