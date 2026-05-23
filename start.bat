@echo off
title InternHub Ecosystem Launcher
echo ============================================================
echo              INTERNHUB FULL-STACK STARTER
echo ============================================================
echo.

echo [1/4] Stopping any existing Node.js servers...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo [2/4] Starting Backend Server (port 5000)...
cd "internship2 backend"
start "InternHub Backend" cmd /k "npm run dev"
cd ..

echo [3/4] Starting Frontend Web Server (port 5500)...
start "InternHub Frontend" cmd /k "npx -y http-server internship2 -p 5500"

echo [4/4] Waiting for servers to initialize...
timeout /t 4 /nobreak >nul

echo Launching InternHub in your default browser...
start http://localhost:5500/login.html

echo.
echo ============================================================
echo  Ecosystem is fully live!
echo  - Backend API: http://localhost:5000
echo  - Frontend Web: http://localhost:5500
echo ============================================================
echo.
pause
