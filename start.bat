@echo off
title WatchEase — Dev Server

echo.
echo  ================================================
echo   WatchEase ^| Starting Development Server...
echo  ================================================
echo.

:: Check Node is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found. Please install it from https://nodejs.org
    pause
    exit /b 1
)

:: Check .env exists
if not exist "%~dp0.env" (
    echo  [WARN] .env file not found — copying from .env.example
    copy "%~dp0.env.example" "%~dp0.env" >nul
    echo  [WARN] Please fill in your API keys in .env before using email features.
    echo.
)

:: Check node_modules exist
if not exist "%~dp0node_modules" (
    echo  [INFO] node_modules not found — running npm install...
    echo.
    npm install
    echo.
)

echo  [OK]  Starting server on http://localhost:3000
echo  [OK]  Press Ctrl+C to stop.
echo.

:: Open browser after a short delay (1.5s)
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Start the server
node "%~dp0js/server.js"

echo.
echo  Server stopped.
pause
