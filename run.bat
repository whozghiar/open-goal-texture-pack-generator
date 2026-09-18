@echo off
set "DIR=%~dp0"
cd /d "%DIR%"
if exist "texture_pack_generator.exe" (
    start "" "texture_pack_generator.exe" %*
) else (
    python texture_pack_generator.py %*
)
