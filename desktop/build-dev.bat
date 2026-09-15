@echo off
echo [PRAMAAN] Initializing Visual Studio environment...
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
set PATH=%USERPROFILE%\.cargo\bin;%PATH%
echo [PRAMAAN] Starting Tauri dev build...
cd /d "%~dp0"
npx tauri dev
