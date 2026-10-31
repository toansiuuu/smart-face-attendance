@echo off
setlocal
cd /d "%~dp0deploy"
if not defined LIVENESS_SECRET (
  echo Set LIVENESS_SECRET to the same value used by the backend before running this script.
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" (
  echo Create deploy\.venv and install deploy\requirements.txt first. See deploy\README.md.
  exit /b 1
)
".venv\Scripts\python.exe" -m uvicorn service:app --host 127.0.0.1 --port 8001 --limit-concurrency 8
