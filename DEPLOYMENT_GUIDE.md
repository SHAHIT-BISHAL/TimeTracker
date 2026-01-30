# TimeTracker Docker Deployment Guide

## Overview
This application is now configured for Docker deployment with Postgres as the database backend.

## Architecture
- **Backend:** Node.js/Express API (port 5000)
- **Frontend:** React web app (port 3000)
- **Database:** PostgreSQL 15 Alpine (port 5432)
- **Networking:** Docker bridge network (`timetracker-net`)

## Prerequisites
- Docker and Docker Compose installed
- At least 2GB free disk space
- Ubuntu 20.04 LTS or later (recommended for deployment)

## Deployment Steps

### 1. Prepare the System
```bash
# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker compose --version
```

### 2. Clone/Transfer the Application
```bash
# Transfer TimeTracker to your Ubuntu server
scp -r /path/to/TimeTracker/ user@server:/opt/timetracker

# SSH into the server
ssh user@server
cd /opt/timetracker
```

### 3. Configure Environment (Optional)
Edit `docker/docker-compose.yml` to customize:
- **JWT Secret:** Change `JWT_SECRET: your-secret-key-change-in-production` to a strong random string
- **Postgres Password:** Change `POSTGRES_PASSWORD: password` for production security
- **Postgres User:** Optionally change `POSTGRES_USER: timetracker`

### 4. Build and Start Services
```bash
# Build images (first time only)
docker compose -f docker/docker-compose.yml build

# Start all services in background
docker compose -f docker/docker-compose.yml up -d

# Verify services are running
docker compose -f docker/docker-compose.yml ps
```

Expected output:
```
NAME                    STATUS
timetracker-db          Up (healthy)
timetracker-api         Up
timetracker-web         Up
```

### 5. Verify Deployment
```bash
# Check backend API health
curl -i http://localhost:5000/api/health

# Check frontend
curl -i http://localhost:3000

# View logs
docker compose -f docker/docker-compose.yml logs -f backend
docker compose -f docker/docker-compose.yml logs -f frontend
```

### 6. Access the Application
- **Frontend:** http://your-server-ip:3000
- **Backend API:** http://your-server-ip:5000/api

## Database Management

### Accessing Postgres Directly
```bash
# Start an interactive postgres shell
docker exec -it timetracker-db psql -U timetracker -d timetracker

# List tables
\dt

# Exit
\q
```

### Backup Database
```bash
docker exec timetracker-db pg_dump -U timetracker timetracker > backup.sql
```

### Restore Database
```bash
docker exec -i timetracker-db psql -U timetracker timetracker < backup.sql
```

## Troubleshooting

### Services Won't Start
```bash
# Check service logs
docker compose -f docker/docker-compose.yml logs backend
docker compose -f docker/docker-compose.yml logs postgres

# Restart all services
docker compose -f docker/docker-compose.yml restart

# Full reset (WARNING: deletes database)
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d --build
```

### Database Connection Issues
Ensure `DATABASE_URL` environment variable in docker-compose.yml matches:
```
postgresql://timetracker:password@postgres:5432/timetracker
```
(where `postgres` is the service name in compose, not localhost)

### Frontend API Calls Failing
The frontend `REACT_APP_API_URL` should be set to `http://backend:5000/api` for container networking.

## Production Considerations

1. **Update Secrets:** Change JWT_SECRET and POSTGRES_PASSWORD in docker-compose.yml
2. **SSL/HTTPS:** Use a reverse proxy (nginx) in front of the services
3. **Persistent Storage:** Ensure `postgres_data` volume is on a reliable disk
4. **Backups:** Schedule regular database backups using the commands above
5. **Monitoring:** Monitor logs and resource usage with `docker stats`

## Migration from SQLite

If migrating from the SQLite version:

1. Export SQLite data (before upgrade)
2. Deploy new Postgres version as above
3. Import data into Postgres using SQL import scripts
4. Verify data integrity

## Helpful Commands

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Stop services
docker compose -f docker/docker-compose.yml stop

# Resume services
docker compose -f docker/docker-compose.yml start

# Remove everything (WARNING: deletes database)
docker compose -f docker/docker-compose.yml down

# Update to latest images
docker compose -f docker/docker-compose.yml pull
docker compose -f docker/docker-compose.yml up -d --build

# View resource usage
docker stats
```

## Support

For issues or questions, check the logs first:
```bash
docker compose -f docker/docker-compose.yml logs --tail=50
```
