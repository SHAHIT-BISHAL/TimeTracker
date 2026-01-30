# TimeTracker - Self-Hosted Time Tracking Application

## Overview

TimeTracker is a full-stack, self-hosted time tracking application designed for Linux deployment. It allows employees to:

- **Clock In/Out**: Record work time with automatic elapsed time tracking
- **Pay Calculations**: Automatically calculate earnings based on hourly rate and hours worked
- **Pay Cycle Management**: Support for weekly, bi-weekly, and monthly pay cycles
- **Message Generation**: Generate professional summaries to send to bosses at the end of each pay cycle
- **User Management**: Secure authentication with JWT tokens

## Features

### Core Features
- ✅ User registration and secure login
- ✅ Real-time clock in/out functionality
- ✅ Time entry history with duration tracking
- ✅ Configurable hourly pay rate
- ✅ Multiple pay cycle options (weekly, bi-weekly, monthly)
- ✅ Automatic earnings calculation
- ✅ Professional message generation for pay cycle summaries
- ✅ Copy-to-clipboard message functionality

### Technology Stack

**Backend:**
- Node.js & Express.js
- PostgreSQL database
- JWT authentication
- bcryptjs for password hashing

**Frontend:**
- React 18
- React Router for navigation
- Axios for API calls
- CSS for styling

**Deployment:**
- Docker & Docker Compose
- Linux compatible

## Project Structure

```
TimeTracker/
├── backend/
│   ├── routes/
│   │   ├── auth.js          # Authentication endpoints
│   │   ├── timeTracking.js  # Clock in/out endpoints
│   │   ├── users.js         # User settings
│   │   └── payCycle.js      # Pay cycle calculations
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── server.js            # Express app setup
│   ├── migrate.js           # Database migrations
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── ClockInOut.js        # Clock in/out interface
│   │   │   ├── PayCycleSummary.js   # Pay cycle & message display
│   │   │   ├── Settings.js          # User settings form
│   │   │   └── PrivateRoute.js      # Protected routes
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   └── Dashboard.js
│   │   ├── services/
│   │   │   └── api.js              # API client
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
├── docker/
│   ├── docker-compose.yml   # Multi-container setup
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── setup.sh            # Linux setup script
│   └── .env.example
└── README.md

```

## Installation & Setup

### Prerequisites
- Docker and Docker Compose installed
- Linux server or local machine with Linux environment

### Quick Start

1. **Clone/Navigate to the project:**
```bash
cd TimeTracker
```

2. **Run the setup script:**
```bash
chmod +x docker/setup.sh
./docker/setup.sh
```

3. **Access the application:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000/api`

### Manual Docker Setup

```bash
# Build images
docker-compose -f docker/docker-compose.yml build

# Start all services
docker-compose -f docker/docker-compose.yml up -d

# Run migrations
docker exec timetracker-api npm run migrate

# Stop services
docker-compose -f docker/docker-compose.yml down
```

## Configuration

### Environment Variables

**Backend (.env):**
```
DATABASE_URL=postgresql://timetracker:password@localhost:5432/timetracker
JWT_SECRET=your-secret-key-here-change-in-production
PORT=5000
NODE_ENV=production
```

**Frontend (.env):**
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Changing Default Credentials

Edit `docker-compose.yml`:
```yaml
environment:
  POSTGRES_USER: timetracker
  POSTGRES_PASSWORD: your-secure-password  # Change this
  JWT_SECRET: your-production-secret-key   # Change this
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (returns JWT token)

### Time Tracking
- `POST /api/time/clock-in` - Clock in
- `POST /api/time/clock-out` - Clock out
- `GET /api/time/status` - Get current clock status
- `GET /api/time/entries` - Get time entries (with date range)

### User Settings
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/settings` - Update hourly rate and pay cycle

### Pay Cycles
- `GET /api/paycycle/current` - Get current pay cycle
- `GET /api/paycycle/calculate` - Calculate earnings for period
- `GET /api/paycycle/generate-message` - Generate message for boss

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password_hash` - Hashed password
- `hourly_rate` - User's hourly pay rate
- `pay_cycle` - Payment frequency (weekly, bi-weekly, monthly)
- `created_at`, `updated_at` - Timestamps

### Time Entries Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `clock_in` - Clock in timestamp
- `clock_out` - Clock out timestamp (nullable)
- `duration_minutes` - Total minutes worked
- `created_at`, `updated_at` - Timestamps

### Pay Cycles Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `start_date` - Pay cycle start
- `end_date` - Pay cycle end
- `total_hours` - Total hours in cycle
- `total_earnings` - Total earnings in cycle
- `status` - Cycle status
- `notes` - Additional notes
- `created_at`, `updated_at` - Timestamps

## Usage Guide

### 1. Register & Login
- Go to `http://localhost:3000`
- Register with username, email, and password
- Login with your credentials

### 2. Configure Settings
- Go to Settings tab
- Set your hourly rate
- Choose your pay cycle (weekly, bi-weekly, or monthly)
- Click "Save Settings"

### 3. Clock In/Out
- Click "Clock In" button to start tracking
- Real-time elapsed time is displayed
- Click "Clock Out" to stop tracking
- Last entry details are shown

### 4. View Pay Summary
- Go to "Pay Cycle" tab
- See your current pay period dates
- View total hours, hourly rate, and total earnings
- Generate a professional message to send to your boss
- Copy the message and send via email or text

## Logs & Troubleshooting

### Connection Diagnostics

The application includes built-in connection diagnostics to help identify network and server issues:

- **Real-time Server Status**: Login and Register pages show whether the server is accessible
- **Automatic Health Checks**: The frontend checks server availability every 30 seconds
- **Helpful Error Messages**: Get specific hints about what's wrong and how to fix it

**For detailed troubleshooting guide, see:** [CONNECTION_DIAGNOSTICS_GUIDE.md](CONNECTION_DIAGNOSTICS_GUIDE.md)

This guide covers:
- How to use the connection status indicator
- Common connection errors and solutions
- Testing the `/api/health` endpoint
- Debugging network issues
- Configuration options for different deployment environments

### View Logs
```bash
# All services
docker-compose -f docker/docker-compose.yml logs -f

# Specific service
docker logs -f timetracker-api
docker logs -f timetracker-web
docker logs -f timetracker-db
```

### Common Issues

**Database connection failed:**
- Ensure PostgreSQL container is running: `docker ps`
- Check database credentials in .env file
- Run migrations: `docker exec timetracker-api npm run migrate`

**Frontend can't reach API:**
- Check `REACT_APP_API_URL` in frontend .env
- Verify backend is running: `docker logs -f timetracker-api`
- Check network connectivity between containers

**Port already in use:**
- Change ports in docker-compose.yml
- Or stop existing containers: `docker-compose down`

## Production Deployment

### Security Checklist
1. Change all default passwords in .env files
2. Generate a strong JWT_SECRET
3. Use HTTPS/SSL certificates
4. Set up firewall rules
5. Enable database backups
6. Use reverse proxy (nginx/traefik)
7. Set `NODE_ENV=production`

### Recommended Setup
```bash
# Use environment variables
docker-compose --env-file .env up -d

# Set up nginx reverse proxy
# Configure SSL certificates
# Set up automated backups
```

## Development

### Running Locally (Without Docker)

**Backend:**
```bash
cd backend
npm install
npm run dev  # Requires PostgreSQL running
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

### Adding Features

1. Create API endpoint in `/routes`
2. Add corresponding frontend component in `/src/components`
3. Update `/src/services/api.js` with API call
4. Test with React components

## Support & Contributing

For issues or feature requests, please check the logs and ensure:
- All services are running
- Database is accessible
- Environment variables are set correctly
- Network connectivity between services

## License

This project is open-source and available for self-hosting.

## Next Steps

1. Change default database password
2. Generate strong JWT secret
3. Deploy to Linux server
4. Set up SSL/HTTPS
5. Configure automated backups
6. Monitor logs and performance
