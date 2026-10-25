@echo off
echo Starting FastAPI Backend for Intelligent Freight Forecasting...
cd /d "%~dp0backend"
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
pause
