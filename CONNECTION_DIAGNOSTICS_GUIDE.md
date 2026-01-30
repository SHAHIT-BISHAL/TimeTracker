# Connection Diagnostics Guide

## Overview

The TimeTracker application now includes built-in server connection diagnostics to help users and developers identify and resolve network-related issues during registration, login, and API usage.

## Features Added

### 1. **Server Connection Status Indicator**

Both the Login and Register pages now display a real-time connection status indicator that shows:

- **Green (Connected)**: Server is responding and accessible
  - Shows the API URL being used
  - Ready to register/login
  
- **Yellow (Disconnected)**: Server cannot be reached
  - Shows the API URL attempted
  - Provides helpful hints based on your environment
  - Suggests next steps

### 2. **Automatic Health Checks**

- Connection status is checked **automatically on page load**
- **Periodic re-checks** happen every **30 seconds**
- No user action required - diagnosis happens silently in the background

### 3. **Smart Error Hints**

The system provides context-aware hints based on your deployment:

**For localhost development:**
```
Make sure the backend is running on port 5000
```

**For remote servers:**
```
Make sure the server at [hostname]:5000 is accessible
```

### 4. **Detailed Error Information**

When connecting fails, users see:
- Connection error message
- API URL that was attempted
- Specific error details (helpful for debugging)

## How Connection Status Looks

### Healthy Connection (Green)
```
✓ Server Connected
http://localhost:5000/api
```

### Network Error (Yellow)
```
⚠ Cannot reach the server
http://localhost:5000/api
Make sure the backend is running on port 5000
```

## API Endpoints

### Health Check Endpoint
```
GET http://localhost:5000/api/health
```

**Response (when healthy):**
```json
{
  "status": "OK",
  "message": "TimeTracker API is running"
}
```

**Purpose:** Provides a lightweight way to verify server accessibility without requiring authentication.

## Backend Implementation

### Server Code
**File:** `backend/server.js` (lines 238-240)

```javascript
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'TimeTracker API is running' });
});
```

### Health Check Service
**File:** `frontend/src/services/healthCheck.js`

```javascript
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_URL.replace('/api', '')}/api/health`);
    if (response.ok) {
      return { 
        healthy: true, 
        message: 'Server is responding',
        apiUrl: API_URL 
      };
    }
  } catch (err) {
    return { 
      healthy: false, 
      message: `Cannot connect to server: ${err.message}`,
      hint: 'Make sure the backend is running on port 5000'
    };
  }
};
```

## Troubleshooting Guide

### "Server Connected" but Registration Still Fails

**Possible Causes:**
1. Username already exists
2. Invalid email format
3. Password too short (minimum 6 characters)
4. Database connection issue

**Solution:**
- Check the browser console for detailed error messages (F12)
- Review the validation error message displayed
- Ensure you're using a unique username
- Verify email format is valid

### "Cannot reach the server" Message

**Possible Causes:**
1. Backend is not running
2. Wrong port configuration (should be 5000)
3. Firewall/network blocking the connection
4. API URL is incorrectly configured

**Solution:**

**For Local Development:**
```bash
# Check if backend is running on port 5000
cd backend
npm install
npm start
```

**For Docker Deployment:**
```bash
# Start the containers
docker-compose up -d --build

# Check backend logs
docker logs timetracker-backend

# Verify port 5000 is exposed
docker ps | grep timetracker
```

**For Remote Server:**
```bash
# SSH into the server
ssh shah@192.168.1.155

# Check if containers are running
docker ps

# Restart if needed
docker-compose down && docker-compose up -d --build

# Check logs
docker logs timetracker-backend
```

### Testing Connection Programmatically

**Using curl:**
```bash
curl -X GET http://localhost:5000/api/health
```

**Expected response:**
```json
{"status":"OK","message":"TimeTracker API is running"}
```

**Using Python:**
```python
import requests

response = requests.get('http://localhost:5000/api/health')
print(response.json())
```

## Environment Configuration

### Setting Custom API URL

If your backend is on a different host/port, set the environment variable:

**For development (.env.local):**
```
REACT_APP_API_URL=http://192.168.1.155:5000/api
```

**For Docker/Production:**
```bash
export REACT_APP_API_URL=http://your-domain.com:5000/api
```

### Default Behavior

If `REACT_APP_API_URL` is not set:
- Frontend uses `window.location.hostname` to construct the API URL
- Allows mobile devices on the same network to access the backend
- Port 5000 is assumed by default

## Network Error Types

The application distinguishes between different types of network errors:

| Error Type | Meaning | Solution |
|-----------|---------|----------|
| `ERR_NETWORK` | Network unavailable | Check internet connection |
| `ECONNREFUSED` | Server not responding | Start backend server |
| `ERR_TIMEOUT` | Request took too long | Check server performance |
| `4xx Status` | Client error | Check request format |
| `5xx Status` | Server error | Check server logs |

## Console Debugging

Enable detailed logging by opening the browser console (F12):

**Login/Register page logs:**
```javascript
// Connection check logs
console.log('Health check status:', { healthy, message, apiUrl });

// Registration error logs
console.log('Registration error details:', {
  message: err.message,
  status: err.response?.status,
  data: err.response?.data,
  code: err.code,
  URL: err.config?.url
});
```

## Monitoring Server Health

### Real-time Health Checks

The frontend makes health checks every 30 seconds. You can:

1. **Watch server logs for health check requests:**
```bash
docker logs -f timetracker-backend | grep "GET /api/health"
```

2. **Monitor API response times:**
```bash
# The request should respond in <100ms if healthy
curl -w "Time: %{time_total}s\n" http://localhost:5000/api/health
```

3. **Check database connectivity:**
If health check passes but registration fails, the issue is likely in the database layer:
```bash
docker logs timetracker-backend | grep "database\|error\|failed"
```

## Security Notes

- The `/api/health` endpoint requires **no authentication**
- It only returns basic status information
- This is intentional - helps diagnose issues even when auth fails
- No sensitive data is exposed

## Future Enhancements

Planned improvements to the diagnostics:

1. **Detailed Health Report**
   - Database connectivity status
   - Redis cache status (when added)
   - Email service status
   - Overall system health percentage

2. **Performance Metrics**
   - API response times
   - Database query performance
   - Network latency visualization

3. **Historical Health Data**
   - Track uptime and downtime
   - Identify performance patterns
   - Alert on degradation

4. **User-facing Status Dashboard**
   - Show system status to logged-in users
   - Notify of maintenance windows
   - Display service incidents

## Support & Debugging

If users encounter connection issues:

1. **First, ask them to check the status indicator**
   - Green = network is fine, other issue
   - Yellow = backend/network problem

2. **Have them share:**
   - Browser console errors (F12 → Console tab)
   - API URL shown in the status indicator
   - Network details from F12 → Network tab

3. **Backend troubleshooting:**
   - Check if port 5000 is listening
   - Verify database credentials
   - Check firewall/network rules
   - Review backend logs

## Summary

The connection diagnostics feature helps:
- ✅ Identify network issues immediately
- ✅ Distinguish network problems from validation errors
- ✅ Provide actionable hints for resolution
- ✅ Enable faster debugging for developers
- ✅ Improve user experience with clear feedback

Users no longer see generic "Network Error" messages - they get specific, actionable information about what's wrong and how to fix it.
