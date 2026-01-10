@echo off
title Check Port 8001
echo ===================================================
echo   Check Process on Port 8001
echo ===================================================
echo.

echo Finding process using port 8001...
set pid=
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001') do (
    set pid=%%a
)

if "%pid%"=="" (
    echo [INFO] Port 8001 is free.
) else (
    echo [WARNING] Port 8001 is being used by Process ID: %pid%
    echo.
    echo To see what program this is, open Task Manager and look for PID %pid%
    echo.
    set /p confirm="Do you want to KILL this process? (y/n): "
    if /i "%confirm%"=="y" (
        taskkill /F /PID %pid%
        echo Process killed.
    ) else (
        echo Operation cancelled.
    )
)

echo.
pause
