@echo off
echo ========================================================
echo Iniciando todos los servicios de Apps Transporte...
echo ========================================================


echo Iniciando Base de datos (Backend - Docker)...
start cmd /k "cd /d "%~dp0" && docker-compose up -d"
timeout /t 3 /nobreak > nul

echo Iniciando Panel Administrativo...
start cmd /k "cd /d "%~dp0\panel-admin" && npm run dev"
timeout /t 3 /nobreak > nul

echo Iniciando App Conductor...
start cmd /k "cd /d "%~dp0\app-conductor" && npm run web"
timeout /t 3 /nobreak > nul

echo Iniciando App Pasajero...
start cmd /k "cd /d "%~dp0\app-pasajero" && npm run web"

echo.
echo Todos los procesos han sido enrutados a ventanas separadas.
echo Por favor, espera unos segundos a que las ventanas de negro
echo terminen de cargar. Una vez iniciados, los enlaces funcionaran.
echo.
pause
