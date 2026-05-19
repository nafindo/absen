@echo off
color 0A

:: Deteksi otomatis JAVA_HOME dari Android Studio jika belum diset
if "%JAVA_HOME%"=="" (
    echo [INFO] Variabel JAVA_HOME belum diset. Mencoba mendeteksi JDK/JBR bawaan Android Studio...
    if exist "%ProgramFiles%\Android\Android Studio\jbr" (
        set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
    ) else if exist "%ProgramFiles%\Android\Android Studio\jre" (
        set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jre"
    ) else if exist "%LocalAppdata%\Programs\Android Studio\jbr" (
        set "JAVA_HOME=%LocalAppdata%\Programs\Android Studio\jbr"
    ) else if exist "%LocalAppdata%\Programs\Android Studio\jre" (
        set "JAVA_HOME=%LocalAppdata%\Programs\Android Studio\jre"
    )
)

if not "%JAVA_HOME%"=="" (
    echo [INFO] Java terdeteksi! Menggunakan JAVA_HOME: %JAVA_HOME%
    set "PATH=%JAVA_HOME%\bin;%PATH%"
) else (
    echo [WARNING] Tidak dapat mendeteksi JDK bawaan Android Studio secara otomatis.
    echo           Jika proses kompilasi APK gagal, mohon set variabel lingkungan JAVA_HOME.
)
echo.

:: Deteksi otomatis Android SDK & buat local.properties jika belum ada
if not exist "android\local.properties" (
    echo [INFO] Berkas android\local.properties tidak ditemukan. Mencoba mendeteksi Android SDK...
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        echo [INFO] Android SDK terdeteksi! Membuat berkas local.properties otomatis...
        echo # Location of the SDK. This is automatically generated. > android\local.properties
        echo sdk.dir=C\:\\Users\\%USERNAME%\\AppData\\Local\\Android\\Sdk >> android\local.properties
        echo [INFO] Berhasil membuat berkas android\local.properties secara otomatis!
    ) else (
        echo [WARNING] Tidak dapat mendeteksi Android SDK secara otomatis.
        echo           Silakan buat berkas android\local.properties secara manual dan set sdk.dir.
    )
)
echo.

echo ============================================================
echo  [PINGUIN ABSEN] Memulai Otomatisasi Deploy ^& Build APK
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

echo [INFO] 7. Memulai Kompilasi APK (clean assembleDebug)...
call gradlew.bat clean assembleDebug
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
