@echo off
REM ========================================
REM   SCRIPT BACKUP OTOMATIS - Absensi Pro
REM   Jalankan script ini untuk membuat backup baru
REM ========================================

set BACKUP_DIR=d:\absen\BACKUP

REM Auto-detect next version number
set /a VER=1
:findver
if exist "%BACKUP_DIR%\V%VER%_*" (
    set /a VER+=1
    goto findver
)

REM Get current date
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value') do set dt=%%a
set TANGGAL=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%

set FOLDER=%BACKUP_DIR%\V%VER%_%TANGGAL%

echo.
echo ========================================
echo   Membuat Backup V%VER% (%TANGGAL%)
echo   Folder: %FOLDER%
echo ========================================
echo.

mkdir "%FOLDER%\apk-karyawan" 2>nul
mkdir "%FOLDER%\apk-admin" 2>nul
mkdir "%FOLDER%\source-code" 2>nul

echo [1/5] Copying APK Karyawan...
copy "d:\absen\absen-native\app\build\outputs\apk\release\*" "%FOLDER%\apk-karyawan\" >nul

echo [2/5] Copying APK Admin...
copy "d:\absen\absen-admin\app\build\outputs\apk\release\app-release.apk" "%FOLDER%\apk-admin\" >nul

echo [3/5] Copying code.gs...
copy "d:\absen\code.gs" "%FOLDER%\source-code\" >nul

echo [4/5] Copying config files...
copy "d:\absen\absen-native\app\google-services.json" "%FOLDER%\source-code\google-services-karyawan.json" >nul
copy "d:\absen\absen-admin\app\google-services.json" "%FOLDER%\source-code\google-services-admin.json" >nul
copy "d:\absen\absen-native\app\src\main\java\com\pinguincell\absen\MainActivity.kt" "%FOLDER%\source-code\MainActivity-karyawan.kt" >nul
copy "d:\absen\absen-admin\app\src\main\java\com\pinguincell\absen\admin\MainActivity.kt" "%FOLDER%\source-code\MainActivity-admin.kt" >nul

echo [5/5] Setting Read-Only...
attrib +R "%FOLDER%\*.*" /S
attrib +R "%FOLDER%"

echo.
echo ========================================
echo   BACKUP V%VER% SELESAI!
echo   Lokasi: %FOLDER%
echo   Status: READ-ONLY (Paten)
echo ========================================
echo.
pause
