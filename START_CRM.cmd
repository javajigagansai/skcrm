@echo off
title SK Smart Investments CRM Server
echo ========================================================
echo Launching SK Smart Investments & Insurance CRM Server...
echo ========================================================
cd /d "%~dp0frontend"
start http://localhost:5173
npm run dev
pause
