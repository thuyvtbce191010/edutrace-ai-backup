@echo off
title EduTrace AI Server
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0server.ps1"
if %errorlevel% neq 0 (
    echo.
    echo [Loi] Khong the khoi dong server.
    pause
)
