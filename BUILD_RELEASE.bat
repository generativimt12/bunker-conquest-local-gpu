@echo off
cd /d "%~dp0"
call npm install || exit /b 1
call npm run build || exit /b 1
echo Build ready in dist\
pause
