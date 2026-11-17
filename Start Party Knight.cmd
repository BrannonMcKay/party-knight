@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js LTS to launch Party Knight, then open this file again.
  pause
  exit /b 1
)
node server.cjs --standalone --open
if errorlevel 1 pause
