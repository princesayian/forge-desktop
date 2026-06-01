@echo off
setlocal EnableDelayedExpansion
title Superhero Forge — Windows Setup
color 0B

echo.
echo  ==========================================
echo   SUPERHERO FORGE — Windows Setup
echo  ==========================================
echo.

:: ── Check Python ──────────────────────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found.
    echo.
    echo  Install Python 3.10+ from https://python.org
    echo  Make sure to check "Add Python to PATH" during install.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%V in ('python --version 2^>^&1') do echo  Found: %%V

:: ── Install pip packages ───────────────────────────────────────────────────────
echo.
echo  Installing packages (flask, pywebview, reportlab, playwright)...
python -m pip install --quiet --upgrade pip
python -m pip install --quiet flask pywebview reportlab playwright
if errorlevel 1 (
    echo  [ERROR] Package install failed. Check internet and try again.
    pause
    exit /b 1
)
echo  Packages installed.

:: ── Install Playwright Chromium (for PDF screenshot generation) ───────────────
echo.
echo  Installing Playwright browsers...
python -m playwright install chromium --quiet 2>nul
echo  Done.

:: ── Locate pythonw.exe ────────────────────────────────────────────────────────
set PYTHONW=
for /f "tokens=*" %%P in ('python -c "import sys,os; print(os.path.join(os.path.dirname(sys.executable), 'pythonw.exe'))"') do set PYTHONW=%%P

if not exist "!PYTHONW!" (
    :: Fallback: use VBScript to hide the console window instead
    set USE_VBS=1
) else (
    set USE_VBS=0
)

:: ── Get forge directory (where this script lives) ────────────────────────────
set FORGE_DIR=%~dp0
:: Remove trailing backslash
if "%FORGE_DIR:~-1%"=="\" set FORGE_DIR=%FORGE_DIR:~0,-1%

set DESKTOP=%USERPROFILE%\Desktop
set APP_PY=!FORGE_DIR!\app.py

:: ── Create launcher ────────────────────────────────────────────────────────────
if "!USE_VBS!"=="0" (
    :: Preferred: pythonw.exe — no console window at all
    echo.
    echo  Creating Desktop shortcut using pythonw.exe...

    set LNK=!DESKTOP!\Superhero Forge.lnk
    powershell -NoProfile -Command ^
        "$s = New-Object -ComObject WScript.Shell;" ^
        "$sc = $s.CreateShortcut('!LNK!');" ^
        "$sc.TargetPath = '!PYTHONW!';" ^
        "$sc.Arguments = '\"!APP_PY!\"';" ^
        "$sc.WorkingDirectory = '!FORGE_DIR!';" ^
        "$sc.WindowStyle = 7;" ^
        "$sc.Description = 'Superhero Forge';" ^
        "$sc.Save();"

    if exist "!LNK!" (
        echo  Created: !LNK!
    ) else (
        echo  Shortcut creation failed — falling back to VBScript launcher.
        set USE_VBS=1
    )
)

if "!USE_VBS!"=="1" (
    :: Fallback: VBScript launcher hides the console window
    echo.
    echo  Creating VBScript launcher on Desktop...

    set VBS=!DESKTOP!\Superhero Forge.vbs
    (
        echo Set WshShell = CreateObject^("WScript.Shell"^)
        echo WshShell.CurrentDirectory = "!FORGE_DIR!"
        echo WshShell.Run "python.exe ""!APP_PY!""", 0, False
    ) > "!VBS!"

    echo  Created: !VBS!
)

:: ── Ollama reminder ────────────────────────────────────────────────────────────
echo.
echo  ==========================================
echo   Setup complete!
echo  ==========================================
echo.
echo  The "Superhero Forge" launcher has been placed on your Desktop.
echo  Double-click it to launch — no terminal window will appear.
echo.

where ollama >nul 2>&1
if errorlevel 1 (
    echo  NOTE: Ollama is not installed or not in PATH.
    echo  Download it from https://ollama.com/download and install it.
    echo  Forge will still launch but AI features will be disabled until Ollama is running.
    echo.
)

echo  Press any key to exit.
pause >nul
