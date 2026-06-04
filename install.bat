@echo off
title Superhero Forge — Setup
color 0A

cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    cls
    echo.
    echo   ERROR: Python not found
    echo.
    echo   Superhero Forge requires Python 3.9 or higher.
    echo   Download from: https://www.python.org/downloads
    echo.
    echo   When installing, check "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

echo.
echo   Running Superhero Forge Setup...
echo.

python install.py

if %errorlevel% neq 0 (
    echo.
    echo   Setup failed. Press any key to exit.
    pause
    exit /b %errorlevel%
)

echo.
pause
