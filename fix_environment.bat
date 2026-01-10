@echo off
chcp 65001 > nul
echo ===================================================
echo   System Repair Tool for NCDs 4YOU (Environment Fix)
echo ===================================================
echo.
echo กำลังตรวจสอบและซ่อมแซมระบบ Environment...
echo (Checking and repairing python environment...)
echo.

cd /d "%~dp0backend"

if exist "venv" (
    echo [INFO] พบ Environment เก่าที่อาจเสียหาย กำลังลบ...
    echo (Removing old venv...)
    rmdir /s /q venv
)

echo [INFO] กำลังสร้าง Environment ใหม่...
echo (Creating new venv...)
python -m venv venv

if errorlevel 1 (
    echo.
    echo [ERROR] ไม่สามารถสร้าง Environment ได้ กรุณาตรวจสอบว่าติดตั้ง Python หรือยัง
    echo (Failed to create venv. Please make sure Python is installed.)
    pause
    exit /b
)

echo [INFO] กำลังติดตั้ง Libraries ที่จำเป็น...
echo (Installing dependencies...)
venv\Scripts\pip install -r requirements.txt

echo.
echo ===================================================
echo   ซ่อมแซมเสร็จสมบูรณ์! (Repair Complete)
echo   สามารถเปิดโปรแกรมได้ตามปกติครับ
echo ===================================================
pause
