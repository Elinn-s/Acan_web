@echo off
setlocal
cd /d "%~dp0"
set PORT=5500

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install it from https://nodejs.org/
  pause
  exit /b 1
)

powershell -NoProfile -Command "try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1', %PORT%); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>nul
if %errorlevel%==0 (
  echo Server already running on port %PORT%, just opening the browser...
) else (
  echo Starting Acan local server...
  start "Acan Server" /min cmd /c "node web/server.js"
  ping 127.0.0.1 -n 2 >nul
)

start "" "http://localhost:%PORT%/"

echo Done. Keep the "Acan Server" window open in the background -
echo edit your files and just refresh the page, no need to restart anything.
