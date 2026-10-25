@echo off
title Opening FreightIQ in VS Code
cd /d "%~dp0"
start "" "C:\Users\guttu\AppData\Local\Programs\Microsoft VS Code\Code.exe" "%~dp0" "%~dp0frontend\src\App.tsx" "%~dp0backend\main.py" "%~dp0README.md"
exit
