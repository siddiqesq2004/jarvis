@echo off
title Jarvis Laptop Agent
color 0b

echo ========================================================
echo        JARVIS LAPTOP AGENT — SECURE LOCAL BRIDGE
echo ========================================================
echo Connecting your Windows laptop to your Jarvis Cloud Companion...
echo.

set JARVIS_BACKEND_URL=https://jarvis-assistant-git-main-siddiqesq2004s-projects.vercel.app
set JARVIS_DEVICE_ID=default-laptop-dev
set JARVIS_DEVICE_TOKEN=dev-test-token-32-chars-long
set JARVIS_HEARTBEAT_INTERVAL=30

cd /d "%~dp0services\laptop-agent"

echo Backend: %JARVIS_BACKEND_URL%
echo Device:  %JARVIS_DEVICE_ID%
echo.
echo [OK] Heartbeat active (every 30 seconds).
echo [OK] Your laptop will now stay permanently ONLINE on your phone and browser!
echo [OK] Minimize this window to keep Jarvis connected in the background.
echo.
echo --------------------------------------------------------

python -m src.agent

pause
