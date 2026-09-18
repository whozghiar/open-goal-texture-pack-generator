@echo off
setlocal
cd /d "%~dp0"

if exist "texture_pack_generator.exe" (
    echo Starting OpenGOAL Texture Pack Generator...
    start "" "texture_pack_generator.exe"
    exit /b 0
)

if exist "src-tauri\target\release\open-goal-texture-pack-generator.exe" (
    echo Starting OpenGOAL Texture Pack Generator (release build)...
    start "" "src-tauri\target\release\open-goal-texture-pack-generator.exe"
    exit /b 0
)

echo No precompiled binary found. Starting Tauri development server...
npm run tauri dev
