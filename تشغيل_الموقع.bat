@echo off
chcp 65001 >nul
title DAR ELBANNA Local Server
echo ===================================================
echo     جاري تشغيل خادم موقع دار البنة محلياً...
echo ===================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
