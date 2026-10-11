@echo off
setlocal EnableExtensions DisableDelayedExpansion
title LegalIt Setup and Launcher
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or newer is required. Install it from https://nodejs.org/
  pause
  exit /b 1
)

where py >nul 2>nul
if errorlevel 1 (
  where python >nul 2>nul
  if errorlevel 1 (
    echo Python 3.11 or newer is required. Install it from https://python.org/ and enable Add Python to PATH.
    pause
    exit /b 1
  )
  set "PYTHON_CMD=python"
) else (
  set "PYTHON_CMD=py -3"
)

if not exist ".venv\Scripts\python.exe" (
  echo Creating the private Python environment...
  %PYTHON_CMD% -m venv .venv
  if errorlevel 1 goto failed
)

if not exist ".env" (
  echo Creating local configuration...
  > ".env" echo ENVIRONMENT=development
  >> ".env" echo DATA_DIR=./data
  >> ".env" echo UPLOAD_DIR=./data/uploads
  >> ".env" echo DATABASE_URL=sqlite:///./data/legalit.db
  >> ".env" echo CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
  >> ".env" echo GROQ_API_KEY=
  >> ".env" echo GROQ_MODEL=llama-3.3-70b-versatile
  echo Created .env. Add GROQ_API_KEY later to enable AI inference; search works without it.
)

echo Installing backend packages...
call ".venv\Scripts\python.exe" -m pip install -r backend\requirements.txt
if errorlevel 1 goto failed

echo Installing frontend packages...
call npm install
if errorlevel 1 goto failed

echo Applying database migrations...
pushd backend
call "..\.venv\Scripts\python.exe" -m alembic -c alembic.ini upgrade head
if errorlevel 1 (
  popd
  goto failed
)
popd

echo.
echo Starting LegalIt at http://localhost:5173
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:5173'"
call npm run dev
exit /b %errorlevel%

:failed
echo.
echo LegalIt setup failed. Review the error above, then run install.bat again.
pause
exit /b 1
