@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js 20+ is required. & pause & exit /b 1)
call npm install || exit /b 1
call npm run dev -- --host 127.0.0.1
pause
