@echo off
setlocal EnableExtensions DisableDelayedExpansion
title LegalIt Setup and Launcher
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo Install Node.js 20 or newer from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Reinstall Node.js from https://nodejs.org/.
  pause
  exit /b 1
)

if exist ".env" goto configured
echo.
echo First-time LegalIt configuration
set /p GROQ_KEY=Paste a Groq API key, or press Enter to configure it later: 
> ".env" echo # LegalIt local configuration - do not share this file
>> ".env" echo GROQ_API_KEY=%GROQ_KEY%
>> ".env" echo GROQ_MODEL=llama-3.3-70b-versatile
>> ".env" echo API_PORT=3001
echo Created .env.

:configured

echo.
echo Installing LegalIt dependencies...
call npm install
if errorlevel 1 (
  echo Dependency installation failed. Check the messages above.
  pause
  exit /b 1
)

echo.
echo Starting LegalIt at http://localhost:5173
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:5173'"
call npm run dev

endlocal
