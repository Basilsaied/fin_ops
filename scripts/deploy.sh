#!/bin/bash

# Production deployment script for Expense Management System
# This script handles the complete deployment process

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$PROJECT_ROOT/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if .env file exists
    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        warning ".env file not found. Creating from .env.production template..."
        cp "$PROJECT_ROOT/.env.production" "$PROJECT_ROOT/.env"
        warning "Please edit .env file with your production values before continuing."
        read -p "Press Enter to continue after editing .env file..."
    fi
    
    success "Prerequisites check completed"
}

# Create backup of current deployment
create_backup() {
    log "Creating backup of current deployment..."
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_NAME="backup_$(date +'%Y%m%d_%H%M%S')"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    # Backup database if container is running
    if docker-compose ps database | grep -q "Up"; then
        log "Backing up database..."
        docker-compose exec -T database pg_dump -U postgres expense_management > "$BACKUP_PATH.sql"
        success "Database backup created: $BACKUP_PATH.sql"
    fi
    
    # Backup application logs
    if [[ -d "$PROJECT_ROOT/backend/logs" ]]; then
        log "Backing up application logs..."
        tar -czf "$BACKUP_PATH-logs.tar.gz" -C "$PROJECT_ROOT/backend" logs/
        success "Logs backup created: $BACKUP_PATH-logs.tar.gz"
    fi
}

# Build and deploy application
deploy_application() {
    log "Starting application deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest images and build
    log "Building application images..."
    docker-compose build --no-cache
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose down
    
    # Start database first and wait for it to be ready
    log "Starting database..."
    docker-compose up -d database
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    timeout=60
    while ! docker-compose exec database pg_isready -U postgres -d expense_management &> /dev/null; do
        sleep 2
        timeout=$((timeout - 2))
        if [[ $timeout -le 0 ]]; then
            error "Database failed to start within 60 seconds"
        fi
    done
    success "Database is ready"
    
    # Run database migrations
    log "Running database migrations..."
    docker-compose run --rm backend npx prisma migrate deploy
    
    # Start all services
    log "Starting all services..."
    docker-compose up -d
    
    success "Application deployment completed"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend health
    if curl -f http://localhost:5000/health &> /dev/null; then
        success "Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000/health &> /dev/null; then
        success "Frontend health check passed"
    else
        error "Frontend health check failed"
    fi
    
    # Check database connection
    if docker-compose exec -T database pg_isready -U postgres -d expense_management &> /dev/null; then
        success "Database health check passed"
    else
        error "Database health check failed"
    fi
}

# Cleanup old backups (keep last 10)
cleanup_backups() {
    log "Cleaning up old backups..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        # Keep only the 10 most recent backups
        ls -t "$BACKUP_DIR"/backup_* 2>/dev/null | tail -n +11 | xargs -r rm -f
        success "Old backups cleaned up"
    fi
}

# Main deployment process
main() {
    log "Starting deployment process..."
    
    check_root
    check_prerequisites
    create_backup
    deploy_application
    health_check
    cleanup_backups
    
    success "Deployment completed successfully!"
    log "Application is now running at:"
    log "  Frontend: http://localhost:3000"
    log "  Backend API: http://localhost:5000"
    log "  Database: localhost:5432"
    log ""
    log "To view logs: docker-compose logs -f"
    log "To stop: docker-compose down"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "backup")
        create_backup
        ;;
    "health")
        health_check
        ;;
    "cleanup")
        cleanup_backups
        ;;
    *)
        echo "Usage: $0 [deploy|backup|health|cleanup]"
        echo "  deploy  - Full deployment (default)"
        echo "  backup  - Create backup only"
        echo "  health  - Run health checks only"
        echo "  cleanup - Cleanup old backups only"
        exit 1
        ;;
esac