@echo off
echo ======================================================================
echo  OpenGOAL - Building texture_pack_generator.exe
echo ======================================================================
setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo [1/3] Checking dependencies...
python -m pip show pyinstaller >nul 2>&1 || python -m pip install --upgrade pyinstaller
python -m pip install -r requirements.txt

echo [2/3] Building standalone binary...
pyinstaller --noconfirm --clean --onefile --windowed --name "texture_pack_generator" ^
  --add-data "ui;ui" ^
  --collect-all webview ^
  --hidden-import bottle ^
  texture_pack_generator.py
if errorlevel 1 (
    echo [ERROR] PyInstaller build failed.
    pause
    exit /b 1
)

echo [3/3] Moving exe to tool root...
if exist "dist\texture_pack_generator.exe" copy /y "dist\texture_pack_generator.exe" "%SCRIPT_DIR%texture_pack_generator.exe" >nul

rmdir /s /q build >nul 2>&1
rmdir /s /q dist >nul 2>&1
del /q texture_pack_generator.spec >nul 2>&1

echo ======================================================================
echo  Done. Run: texture_pack_generator.exe   (or run.bat)
echo ======================================================================
pause
