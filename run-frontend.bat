@echo off
echo Starting frontend on port 5173...
cd /d "%~dp0frontend"
call npm run dev
