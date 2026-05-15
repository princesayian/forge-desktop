@echo off
title Superhero Forge
cd /d "%~dp0"

:: First time? Run setup
IF NOT EXIST "vendor\react.js" (
    echo First time setup — downloading dependencies...
    python setup.py
    echo.
    pause
)

:: Launch the app
echo Starting Superhero Forge...
python app.py
