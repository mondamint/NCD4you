@echo off
title Build and Deploy NCDs 4YOU
echo ==========================================
echo       Building NCDs 4YOU for Deploy
echo ==========================================

echo.
echo [1/4] Install Frontend Dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Error: npm install failed.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Building Frontend (Vite)...
call npm run build
if %errorlevel% neq 0 (
    echo Error: Frontend build failed.
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo [3/4] Preparing Static Files...
echo Checking if frontend/dist exists...
if not exist "frontend\dist" (
    echo Error: frontend/dist not found! Build might have failed silently.
    pause
    exit /b 1
)

echo.
echo [4/4] Instructions for PyInstaller...
echo.
echo To complete the deployment package:
echo 1. Ensure 'pyinstaller' is installed: pip install pyinstaller
echo 2. Run the following command:
echo.
echo    pyinstaller --noconfirm --onedir --console --name "NCDs_4YOU" --add-data "frontend/dist;static_ui" --add-data "backend/ncd_app.db;." backend/main.py
echo.
echo 3. The output will be in 'dist/NCDs_4YOU'.
echo 4. Copy 'backend/ncd_app.db' into 'dist/NCDs_4YOU' manually if not included or to ensure latest data.
echo.
echo Note: This script only builds the frontend. The EXE compilation needs PyInstaller.
echo.
pause
