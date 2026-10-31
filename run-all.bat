@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-all.ps1"
set "launch_result=%ERRORLEVEL%"
if not "%launch_result%"=="0" (
  echo.
  echo Startup failed. Read the error above.
  pause
)
exit /b %launch_result%
