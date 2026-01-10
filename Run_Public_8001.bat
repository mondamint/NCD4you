@echo off
chcp 65001 > nul
title NCDs 4YOU - Public Server (Port 8001)
echo ===================================================
echo   NCDs 4YOU - Public Server Launcher
echo   Mode: Single Port (8001) for Public IP
echo ===================================================

cd /d "%~dp0"

echo.
echo [1/2] Building Frontend...
echo (This may take a minute...)
cd frontend
call npm install
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed. Please check dependencies.
    pause
    exit /b
)
cd ..

echo.
echo [2/2] Starting Server...
echo.
echo ********************************************************
echo *  Server is running at: http://localhost:8001         *
echo *  For Public Access, use: http://YOUR_PUBLIC_IP:8001  *
echo ********************************************************
echo.

:: Ensure venv exists
if not exist "backend\venv" (
    echo [INFO] Creating Python environment...
    cd backend
    python -m venv venv
    venv\Scripts\pip install -r requirements.txt
    cd ..
)

:: Run Uvicorn directly on port 8001
:: We run as a module from root so 'backend.main' works
backend\venv\Scripts\python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001

pause
