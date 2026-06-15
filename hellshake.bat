@echo off
rem node.jsでサーバーを起動、ブラウザの表示
cd /d "%~dp0"

start "" cmd /c http-server

timeout /t 2 /nobreak > nul

start http://localhost:8080