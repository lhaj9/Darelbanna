@echo off
chcp 65001 >nul
title DAR ELBANNA Local Server
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
