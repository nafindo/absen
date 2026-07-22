with open(r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\MainActivity.kt', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('onSuccess = { base64 ->', 'onSuccess = { base64: String ->')
content = content.replace('onAutoCapture = { bmp ->', 'onAutoCapture = { bmp: android.graphics.Bitmap ->')
content = content.replace('popUpTo("home")', 'popUpTo(route = "home")')
with open(r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\MainActivity.kt', 'w', encoding='utf-8') as f:
    f.write(content)
