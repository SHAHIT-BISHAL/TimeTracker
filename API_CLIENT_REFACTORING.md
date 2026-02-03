# API Client Refactoring - Relative URL Architecture

## Overview
Refactored the API client to use relative URLs (`/api`) consistently across all environments, eliminating hardcoded domains, protocols, and IP addresses.

## Key Changes

### 1. Simplified API URL Resolution (`frontend/src/utils/apiUrl.js`)
**Before**: Complex logic with hostname detection for localhost, private IPs, and production
**After**: Always returns `/api` (relative path)

```javascript
export function getApiUrl() {
  // Override with environment variable if needed
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Always use relative path - let proxy handle routing
  return '/api';
}
```

### 2. Added Proxy Configuration (`frontend/package.json`)
For local development, React's built-in proxy forwards `/api` requests to the backend:

```json
{
  "proxy": "http://localhost:5000"
}
```

This means:
- Frontend runs on `http://localhost:3000`
- Requests to `/api/*` are automatically proxied to `http://localhost:5000/api/*`
- No CORS issues in development

### 3. Centralized API Client (`frontend/src/services/api.js`)
Enhanced exports for consistent usage:

```javascript
import api, { API_BASE_URL } from '../services/api';

// Use the configured axios instance (RECOMMENDED)
const response = await api.get('/companies');

// Or use API_BASE_URL for custom fetch calls
fetch(`${API_BASE_URL}/companies`);
```

## Architecture by Environment

### Local Development (localhost:3000)
```
Browser → http://localhost:3000
  ↓ Request to /api/companies
  ↓ package.json proxy intercepts
  ↓ Forwards to http://localhost:5000/api/companies
Backend → Returns JSON
```

**Setup**: Just run `npm start` - proxy is automatic

### Production with Nginx Reverse Proxy (time.shahit.org)
```
Browser → http://time.shahit.org
  ↓ Request to /api/companies
  ↓ Nginx location /api/ block
  ↓ Proxies to http://localhost:5000/api/companies
Backend → Returns JSON
```

**Setup**: Requires nginx configuration (see below)

### Direct IP Access (192.168.1.155:3000)
Same as local development - proxy handles it automatically.

## Nginx Configuration (Production)

Your nginx config MUST have this structure:

```nginx
server {
    listen 80;
    server_name time.shahit.org;

    root /path/to/frontend/build;
    index index.html;

    # CRITICAL: /api location MUST come BEFORE location /
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
    }

    # Serve frontend static files
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Critical**: The `/api/` location block must be processed BEFORE the catch-all `location /` block.

## Benefits

### 1. **Consistency**
- One URL pattern (`/api`) works everywhere
- No environment-specific URL logic
- No hardcoded domains or IPs

### 2. **Security**
- No API credentials or backend ports exposed in frontend code
- All routing handled by proxy layer
- Authorization headers properly forwarded

### 3. **Simplicity**
- Developers don't need to think about URL construction
- Import `api` from `services/api.js` and make requests
- Proxy configuration handles environment differences

### 4. **Maintainability**
- Single source of truth for API configuration
- Easy to change backend location (just update proxy)
- No scattered URL logic across components

## Migration Guide for Components

### Old Pattern (Don't use)
```javascript
import { getApiUrl } from '../utils/apiUrl.js';
const API_URL = getApiUrl();

// Direct axios call with URL construction
const response = await axios.get(`${API_URL}/companies`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### New Pattern (Use this)
```javascript
import api from '../services/api';

// Let the configured client handle everything
const response = await api.get('/companies');
// Token and company_id automatically added by interceptors
```

### For File Downloads/External URLs
```javascript
import { API_BASE_URL } from '../services/api';

const downloadUrl = `${API_BASE_URL.replace('/api', '')}${receiptPath}`;
window.open(downloadUrl, '_blank');
```

## Environment Variable Override

If you need custom API URL (e.g., staging environment):

```bash
# .env.local
REACT_APP_API_URL=https://staging-api.example.com/api
```

This overrides the default `/api` behavior.

## Troubleshooting

### "Cannot GET /api/companies" in development
- Make sure `"proxy": "http://localhost:5000"` is in package.json
- Restart the dev server (`npm start`)
- Verify backend is running on port 5000

### API returns HTML instead of JSON in production
- Check nginx config - `/api/` location must come before `location /`
- Verify with: `curl http://your-domain/api/health`
- Should return JSON, not HTML

### CORS errors
- In development: proxy should eliminate CORS issues
- In production: Backend should have proper CORS headers
- Verify `Access-Control-Allow-Origin` is set correctly

## Testing the Setup

### Local Development
```bash
# Terminal 1: Start backend
cd backend
node server.js

# Terminal 2: Start frontend
cd frontend
npm start

# Browser: http://localhost:3000
# All /api calls will proxy to port 5000
```

### Production
```bash
# Build frontend
cd frontend
npm run build

# Deploy build/ directory to server
# Configure nginx as shown above
# Access via domain - all /api calls go through nginx to backend
```

## Files Modified

1. `frontend/src/utils/apiUrl.js` - Simplified to always return `/api`
2. `frontend/package.json` - Added proxy configuration
3. `frontend/src/services/api.js` - Enhanced exports for consistency
4. All component files - Can now use centralized `api` client

## Next Steps

Future improvements:
- [ ] Migrate all components to use centralized `api` client
- [ ] Remove direct axios/fetch imports from components
- [ ] Add API response interceptors for global error handling
- [ ] Add request retry logic for transient failures
- [ ] Implement request/response logging in development mode
