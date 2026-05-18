@echo off
echo ==============================================
echo InternHub Startup Script
echo ==============================================

echo Stopping any existing Node.js servers...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo Starting Backend Server (port 5000)...
cd "internship2 backend"
start "InternHub Backend" cmd /k "npm run dev"
cd ..

echo ==============================================
echo Done! Backend is starting in a new window.
echo You can now use VS Code Live Server to view your frontend!
echo ==============================================
pause
