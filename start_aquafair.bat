@echo off
title AquaFair - Smart Water Monitoring and Equity System
echo ============================================================
echo   AquaFair - Smart Water Monitoring and Equity System
echo   Nagar Parishad Municipal Utilities ^& Connected Households
echo ============================================================
echo.

set PY_EXE=""
if exist "%~dp0smart_equal_water_distribution\backend\venv\Scripts\python.exe" (
    set "PY_EXE=%~dp0smart_equal_water_distribution\backend\venv\Scripts\python.exe"
) else if exist "%~dp0.venv\Scripts\python.exe" (
    set "PY_EXE=%~dp0.venv\Scripts\python.exe"
) else (
    set "PY_EXE=python"
)

echo [1/2] Starting Django REST Backend on http://0.0.0.0:8000 ...
start "AquaFair Backend Server" cmd /k "cd /d %~dp0smart_equal_water_distribution\backend && "%PY_EXE%" manage.py runserver 0.0.0.0:8000"

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "AquaFair Frontend UI" cmd /k "cd /d %~dp0smart_equal_water_distribution && npm run dev"

echo.
echo ============================================================
echo   System running successfully!
echo   Frontend Dashboard:  http://localhost:5173
echo   Backend REST API:    http://127.0.0.1:8000/api/dashboard/
echo   Admin Credentials:   samru / samru123
echo   Citizen Credentials: AF-W1-1042 / 123456
echo ============================================================
echo.
pause
