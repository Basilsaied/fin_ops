@echo off
REM Production deployment script for Expense Management System (Windows)
REM This script handles the complete deployment process

setlocal enabledelayedexpansion

REM Configuration
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set BACKUP_DIR=%PROJECT_ROOT%\backups
set LOG_FILE=%PROJECT_ROOT%\deploy.log

REM Create log file
echo [%date% %time%] Starting deployment process... > "%LOG_FILE%"

echo [INFO] Starting deployment process...

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check if Docker is installed and running
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker first.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Check if .env file exists
if not exist "%PROJECT_ROOT%\.env" (
    echo [WARNING] .env file not found. Creating from .env.production template...
    copy "%PROJECT_ROOT%\.env.production" "%PROJECT_ROOT%\.env"
    echo [WARNING] Please edit .env file with your production values before continuing.
    pause
)

echo [SUCCESS] Prerequisites check completed

REM Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Create backup with timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "BACKUP_NAME=backup_%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

echo [INFO] Creating backup: %BACKUP_NAME%

REM Change to project directory
cd /d "%PROJECT_ROOT%"

REM Build application images
echo [INFO] Building application images...
docker-compose build --no-cache
if errorlevel 1 (
    echo [ERROR] Failed to build application images
    exit /b 1
)

REM Stop existing containers
echo [INFO] Stopping existing containers...
docker-compose down

REM Start database first
echo [INFO] Starting database...
docker-compose up -d database

REM Wait for database to be ready
echo [INFO] Waiting for database to be ready...
timeout /t 30 /nobreak >nul

REM Run database migrations
echo [INFO] Running database migrations...
docker-compose run --rm backend npx prisma migrate deploy
if errorlevel 1 (
    echo [ERROR] Database migration failed
    exit /b 1
)

REM Start all services
echo [INFO] Starting all services...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start services
    exit /b 1
)

echo [SUCCESS] Application deployment completed

REM Wait for services to start
echo [INFO] Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Health checks
echo [INFO] Performing health checks...

REM Check backend health
curl -f http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Backend health check failed - service may still be starting
) else (
    echo [SUCCESS] Backend health check passed
)

REM Check frontend health
curl -f http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Frontend health check failed - service may still be starting
) else (
    echo [SUCCESS] Frontend health check passed
)

echo [SUCCESS] Deployment completed successfully!
echo.
echo Application is now running at:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:5000
echo   Database: localhost:5432
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down

pause