@echo off
setlocal enabledelayedexpansion
echo ======================================================================
echo    PRAMAAN Standalone Production Desktop Application Installer Build
echo ======================================================================

set "ROOT=%~dp0.."
set "DESKTOP_DIR=%~dp0"
set "VCVARS=C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"

:: ── Step 1: MSVC environment ─────────────────────────────────────────────────
if exist "%VCVARS%" (
    echo [1/5] Initializing MSVC x64 build environment...
    call "%VCVARS%" >nul 2>&1
) else (
    echo [WARN] MSVC vcvars64.bat not found. Using default environment.
)
set PATH=%USERPROFILE%\.cargo\bin;%PATH%

:: ── Step 2: PyInstaller — compile Python backend ─────────────────────────────
echo.
echo [2/5] Compiling Standalone Python Backend Executable ^(PyInstaller^)...
cd /d "%ROOT%"
call pyinstaller --noconfirm --onefile --clean ^
  --paths "%ROOT%\backend" ^
  --name pramaan-backend ^
  --additional-hooks-dir "%DESKTOP_DIR%pyinstaller-hooks" ^
  --hidden-import passlib.handlers.bcrypt ^
  --hidden-import passlib.handlers.sha2_crypt ^
  --hidden-import passlib.handlers.des_crypt ^
  --hidden-import aiosqlite ^
  --hidden-import asyncpg ^
  --hidden-import sqlalchemy.dialects.sqlite ^
  --hidden-import sqlalchemy.dialects.postgresql ^
  "%DESKTOP_DIR%desktop_launcher.py"
if errorlevel 1 (
    echo [ERROR] PyInstaller backend build failed!
    pause & exit /b 1
)

:: ── Step 3: Copy sidecar binary ──────────────────────────────────────────────
echo.
echo [3/5] Copying Backend Sidecar Binary to Tauri binaries folder...
if not exist "%DESKTOP_DIR%src-tauri\binaries" mkdir "%DESKTOP_DIR%src-tauri\binaries"
copy /Y "%ROOT%\dist\pramaan-backend.exe" ^
  "%DESKTOP_DIR%src-tauri\binaries\pramaan-backend-x86_64-pc-windows-msvc.exe"
if errorlevel 1 (
    echo [ERROR] Failed to copy sidecar binary!
    pause & exit /b 1
)

:: ── Step 4: Build Next.js production bundle ───────────────────────────────────
echo.
echo [4/5] Building Next.js Production Bundle ^(npm run build^)...
cd /d "%ROOT%\frontend"
call npm run build
if errorlevel 1 (
    echo [ERROR] Next.js build failed!
    pause & exit /b 1
)

:: ── Step 5: Build Tauri installer ─────────────────────────────────────────────
echo.
echo [5/5] Building Tauri Production Installer...
cd /d "%DESKTOP_DIR%"
call npx tauri build
if errorlevel 1 (
    echo [ERROR] Tauri production installer build failed!
    pause & exit /b 1
)

echo.
echo ======================================================================
echo    SUCCESS! Installer is at:
echo    desktop\src-tauri\target\release\bundle\nsis\PRAMAAN_0.1.0_x64-setup.exe
echo ======================================================================
pause
