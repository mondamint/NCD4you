@echo off
title Home NCD-NHH Launcher
chcp 65001 > nul
echo Starting Home NCD-NHH...

cd /d "%~dp0"

:: 1. Check if backend venv exists
if not exist "backend\venv\Scripts\python.exe" (
    echo [INFO] Python environment not found. Creating new environment...
    cd backend
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create python environment. Please install Python first.
        pause
        exit /b
    )
    cd ..
)

:: 2. Check for critical dependencies (e.g. uvicorn)
"%~dp0backend\venv\Scripts\python.exe" -c "import uvicorn" 2>nul
if errorlevel 1 (
    echo [INFO] Missing dependencies detected. Installing...
    "%~dp0backend\venv\Scripts\pip.exe" install -r "%~dp0backend\requirements.txt"
)

:: 3. Run the App
"%~dp0backend\venv\Scripts\python.exe" run_app.py

if errorlevel 1 (
    echo.
    echo [ERROR] Application crashed.
    pause
)
