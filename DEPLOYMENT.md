# Deployment Guide

This guide covers the deployment of the Expense Management System in production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Docker Deployment](#docker-deployment)
4. [Manual Deployment](#manual-deployment)
5. [Database Setup](#database-setup)
6. [Security Configuration](#security-configuration)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Backup and Recovery](#backup-and-recovery)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended), macOS, or Windows 10/11
- **Memory**: Minimum 2GB RAM, 4GB+ recommended
- **Storage**: Minimum 10GB free space
- **Network**: Internet connection for downloading dependencies

### Required Software

- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Node.js**: Version 18+ (for manual deployment)
- **PostgreSQL**: Version 13+ (for manual deployment)

### Installation Commands

#### Ubuntu/Debian
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Windows
- Download and install Docker Desktop from https://www.docker.com/products/docker-desktop
- Docker Compose is included with Docker Desktop

## Environment Configuration

### 1. Create Environment File

Copy the production environment template:

```bash
cp .env.production .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your production values:

```bash
# Critical settings to change:
POSTGRES_PASSWORD=your-secure-database-password
SESSION_SECRET=your-very-long-random-session-secret
FRONTEND_URL=https://your-domain.com
VITE_API_URL=https://api.your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### 3. Security Configuration

**Important**: Change these default values in production:

- `POSTGRES_PASSWORD`: Use a strong, unique password
- `SESSION_SECRET`: Generate a long random string (64+ characters)
- `REDIS_PASSWORD`: Use a strong password if enabling Redis
- `ALLOWED_ORIGINS`: Restrict to your actual domain(s)

### 4. Generate Secure Secrets

```bash
# Generate session secret
openssl rand -base64 64

# Generate database password
openssl rand -base64 32
```

## Docker Deployment

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd expense-management-system
   ```

2. **Configure environment**:
   ```bash
   cp .env.production .env
   # Edit .env with your values
   ```

3. **Deploy using the script**:
   ```bash
   # Linux/macOS
   ./scripts/deploy.sh

   # Windows
   scripts\deploy.bat
   ```

### Manual Docker Deployment

1. **Build and start services**:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

2. **Run database migrations**:
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

3. **Verify deployment**:
   ```bash
   docker-compose ps
   curl http://localhost:5000/health
   curl http://localhost:3000/health
   ```

### Docker Commands Reference

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Update and redeploy
docker-compose pull
docker-compose up -d --build

# Scale services (if needed)
docker-compose up -d --scale backend=2
```

## Manual Deployment

### Backend Deployment

1. **Install dependencies**:
   ```bash
   cd backend
   npm ci --only=production
   ```

2. **Build application**:
   ```bash
   npm run build:prod
   ```

3. **Set up database**:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **Start application**:
   ```bash
   npm run start:prod
   ```

### Frontend Deployment

1. **Install dependencies**:
   ```bash
   cd frontend
   npm ci --only=production
   ```

2. **Build application**:
   ```bash
   npm run build:prod
   ```

3. **Serve with nginx** (recommended):
   ```bash
   # Copy built files to nginx directory
   sudo cp -r dist/* /var/www/html/
   
   # Use provided nginx.conf as reference
   sudo cp nginx.conf /etc/nginx/sites-available/expense-management
   sudo ln -s /etc/nginx/sites-available/expense-management /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

## Database Setup

### PostgreSQL Configuration

1. **Create database and user**:
   ```sql
   CREATE DATABASE expense_management;
   CREATE USER expense_user WITH PASSWORD 'your-secure-password';
   GRANT ALL PRIVILEGES ON DATABASE expense_management TO expense_user;
   ```

2. **Configure connection**:
   ```bash
   DATABASE_URL="postgresql://expense_user:your-secure-password@localhost:5432/expense_management"
   ```

3. **Run migrations**:
   ```bash
   npx prisma migrate deploy
   ```

### Database Performance Tuning

Add these settings to `postgresql.conf`:

```conf
# Memory settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# Connection settings
max_connections = 100

# Logging
log_statement = 'mod'
log_min_duration_statement = 1000
```

## Security Configuration

### SSL/TLS Setup

1. **Obtain SSL certificates** (Let's Encrypt recommended):
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

2. **Configure nginx for HTTPS**:
   ```nginx
   server {
       listen 443 ssl http2;
       server_name your-domain.com;
       
       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
       
       # Additional SSL configuration...
   }
   ```

### Firewall Configuration

```bash
# Ubuntu/Debian with ufw
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Block direct access to application ports
sudo ufw deny 3000/tcp
sudo ufw deny 5000/tcp
```

### Security Headers

The application includes security headers by default:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

## Monitoring and Logging

### Log Files

Logs are stored in the following locations:

- **Backend logs**: `backend/logs/`
  - `combined.log`: All application logs
  - `error.log`: Error logs only
  - `security.log`: Security audit logs
  - `security-audit.log`: Security warnings and errors

- **Database logs**: Check PostgreSQL log directory
- **Nginx logs**: `/var/log/nginx/`

### Log Rotation

Configure log rotation to prevent disk space issues:

```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/expense-management << EOF
/path/to/expense-management/backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 nodejs nodejs
}
EOF
```

### Health Monitoring

The application provides health check endpoints:

- Backend: `http://localhost:5000/health`
- Frontend: `http://localhost:3000/health`
- Metrics: `http://localhost:5000/metrics`

### Monitoring Setup

Consider setting up monitoring with:

- **Prometheus + Grafana**: For metrics and dashboards
- **ELK Stack**: For log aggregation and analysis
- **Uptime monitoring**: Services like Pingdom or StatusCake

## Backup and Recovery

### Automated Backup Script

The deployment includes backup functionality:

```bash
# Create backup
./scripts/deploy.sh backup

# Backup files are stored in ./backups/
```

### Manual Database Backup

```bash
# Create backup
docker-compose exec database pg_dump -U postgres expense_management > backup.sql

# Restore backup
docker-compose exec -T database psql -U postgres expense_management < backup.sql
```

### Backup Strategy

Recommended backup schedule:
- **Daily**: Database backups
- **Weekly**: Full application backup including logs
- **Monthly**: Archive old backups to long-term storage

### Recovery Procedures

1. **Database recovery**:
   ```bash
   # Stop application
   docker-compose down
   
   # Restore database
   docker-compose up -d database
   docker-compose exec -T database psql -U postgres expense_management < backup.sql
   
   # Start application
   docker-compose up -d
   ```

2. **Full system recovery**:
   ```bash
   # Restore from backup
   tar -xzf full-backup.tar.gz
   
   # Deploy
   ./scripts/deploy.sh
   ```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Symptoms**: Backend fails to start, database connection errors

**Solutions**:
```bash
# Check database status
docker-compose ps database

# Check database logs
docker-compose logs database

# Verify connection string
echo $DATABASE_URL

# Test connection manually
docker-compose exec database psql -U postgres expense_management
```

#### 2. Frontend Not Loading

**Symptoms**: White screen, 404 errors

**Solutions**:
```bash
# Check frontend container
docker-compose ps frontend

# Check nginx logs
docker-compose logs frontend

# Verify build
docker-compose exec frontend ls -la /usr/share/nginx/html
```

#### 3. High Memory Usage

**Symptoms**: System slowdown, out of memory errors

**Solutions**:
```bash
# Check container resource usage
docker stats

# Limit container memory
# Add to docker-compose.yml:
services:
  backend:
    mem_limit: 512m
  frontend:
    mem_limit: 256m
```

#### 4. SSL Certificate Issues

**Symptoms**: HTTPS not working, certificate errors

**Solutions**:
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Test nginx configuration
sudo nginx -t
```

### Performance Optimization

1. **Database optimization**:
   ```sql
   -- Check slow queries
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   
   -- Add indexes for frequently queried columns
   CREATE INDEX CONCURRENTLY idx_costs_year_month ON costs(year, month);
   ```

2. **Application optimization**:
   ```bash
   # Enable gzip compression in nginx
   gzip on;
   gzip_types text/plain application/json application/javascript text/css;
   
   # Enable caching for static assets
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

### Getting Help

1. **Check logs first**:
   ```bash
   docker-compose logs -f
   ```

2. **Verify configuration**:
   ```bash
   docker-compose config
   ```

3. **Test individual components**:
   ```bash
   # Test database
   docker-compose exec database pg_isready

   # Test backend
   curl http://localhost:5000/health

   # Test frontend
   curl http://localhost:3000/health
   ```

4. **Contact support**: Include logs and configuration details when reporting issues.

## Production Checklist

Before going live, ensure:

- [ ] All default passwords changed
- [ ] SSL certificates installed and configured
- [ ] Firewall rules configured
- [ ] Backup system tested
- [ ] Monitoring set up
- [ ] Log rotation configured
- [ ] Health checks working
- [ ] Performance testing completed
- [ ] Security scan performed
- [ ] Documentation updated

## Maintenance

### Regular Tasks

- **Daily**: Check application health and logs
- **Weekly**: Review security logs and update dependencies
- **Monthly**: Test backup and recovery procedures
- **Quarterly**: Security audit and performance review

### Updates

1. **Application updates**:
   ```bash
   git pull origin main
   ./scripts/deploy.sh
   ```

2. **Dependency updates**:
   ```bash
   # Backend
   cd backend && npm update

   # Frontend
   cd frontend && npm update
   ```

3. **System updates**:
   ```bash
   sudo apt update && sudo apt upgrade
   docker system prune -f
   ```