@echo off
color 0A
echo ============================================================
echo  [PINGUIN ABSEN] Memulai Otomatisasi Deploy & Build APK
echo ============================================================
echo.

echo [INFO] 1. Menyelaraskan berkas statis (compile.py)...
python compile.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gagal menjalankan compile.py
    pause
    exit /b %ERRORLEVEL%
)
echo.

echo [INFO] 2. Sinkronisasi berkas Capacitor...
call npx.cmd cap sync
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Gagal melakukan cap sync. Pastikan npx terpasang jika menggunakan aset lokal.
)
echo.

echo [INFO] 3. Menambahkan perubahan berkas ke Git...
git add .
echo.

echo [INFO] 4. Membuat commit baru...
git commit -m "Update WebView configuration and Android permissions"
echo.

echo [INFO] 5. Mengunggah kode ke https://github.com/nafindo/absen...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gagal mengunggah ke GitHub. Pastikan Anda sudah login git di komputer ini.
    pause
    exit /b %ERRORLEVEL%
)
echo.

echo [INFO] 6. Masuk ke folder Android...
cd android
echo.

echo [INFO] 7. Memulai Kompilasi APK (assembleDebug)...
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gagal melakukan kompilasi APK.
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
cd ..
echo.

echo ============================================================
echo  [SUKSES] Semua langkah selesai dijalankan!
echo  Aplikasi Anda berhasil di-push ke GitHub.
echo  File APK baru berada di:
echo  android\app\build\outputs\apk\debug\app-debug.apk
echo ============================================================
echo.
pause
