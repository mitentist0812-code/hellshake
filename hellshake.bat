@echo off

cd /d "%~dp0"

start "" cmd /c http-server

timeout /t 2 /nobreak > nul

start http://localhost:8080