@echo off
REM ── Superhero Forge Launcher ──────────────────────────────────────────────────
REM  Run this once to install as a Windows service, or just double-click to run.

SET APP_DIR=%~dp0
SET PYTHON=python
SET PORT=5000

REM Check if arg is "install" for NSSM service setup
IF "%1"=="install" GOTO INSTALL
IF "%1"=="uninstall" GOTO UNINSTALL

REM ── Default: just run it ─────────────────────────────────────────────────────
echo.
echo   Superhero Forge starting on http://localhost:%PORT%
echo   Press Ctrl+C to stop.
echo.
cd /d "%APP_DIR%"
%PYTHON% -m pip install -r requirements.txt --quiet
%PYTHON% app.py
GOTO END

REM ── Install as Windows service via NSSM ──────────────────────────────────────
:INSTALL
WHERE nssm >nul 2>&1
IF ERRORLEVEL 1 (
  echo   NSSM not found. Download from https://nssm.cc and add to PATH.
  GOTO END
)
echo   Installing Superhero Forge as Windows service...
nssm install SuperheroForge "%PYTHON%" "%APP_DIR%app.py"
nssm set SuperheroForge AppDirectory "%APP_DIR%"
nssm set SuperheroForge DisplayName "Superhero Forge"
nssm set SuperheroForge Description "Nocturnal Knights Character System"
nssm set SuperheroForge Start SERVICE_AUTO_START
nssm set SuperheroForge AppStdout "%APP_DIR%logs\forge.log"
nssm set SuperheroForge AppStderr "%APP_DIR%logs\forge_err.log"
IF NOT EXIST "%APP_DIR%logs" MKDIR "%APP_DIR%logs"
nssm start SuperheroForge
echo.
echo   Done! Superhero Forge will now start with Windows.
echo   Access at: http://localhost:%PORT%
echo   Manage via: services.msc (look for "Superhero Forge")
echo.
GOTO END

REM ── Uninstall service ────────────────────────────────────────────────────────
:UNINSTALL
nssm stop SuperheroForge
nssm remove SuperheroForge confirm
echo   Superhero Forge service removed.

:END
