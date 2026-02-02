# Reverse Proxy Setup Guide

This application now supports domain-based access through a reverse proxy. The frontend automatically detects when it's running behind a reverse proxy and routes API requests correctly.

## How It Works

The frontend uses an intelligent API URL detection system:

1. **Environment Variable** (Highest Priority)
   - If `REACT_APP_API_URL` is set, it uses that explicit URL
   - Format: `http://your-api-server:port/api`

2. **Local Development** (localhost/127.0.0.1)
   - Automatically connects to `http://localhost:5000/api`
   - Uses the separate backend port for development

3. **Production with Reverse Proxy** (All Other Domains)
   - Automatically uses `/api` (relative path)
   - Works seamlessly with any domain (e.g., `time.shahit.org`)

## Reverse Proxy Configuration Examples

### Nginx Example

```nginx
server {
    listen 80;
    server_name time.shahit.org;

    # Serve frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Apache Example

```apache
<VirtualHost *:80>
    ServerName time.shahit.org

    # Frontend
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # Backend API
    ProxyPass /api/ http://localhost:5000/api/
    ProxyPassReverse /api/ http://localhost:5000/api/

    # WebSocket support (if needed)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]
</VirtualHost>
```

### Docker Compose Example

```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/timetracker

  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
```

## Setup Steps

1. **Configure your reverse proxy** with the domain name (e.g., `time.shahit.org`)

2. **Set proxy rules**:
   - Route `/api/*` to your backend (port 5000 or wherever backend runs)
   - Route all other paths to your frontend (port 3000 or wherever frontend runs)

3. **Optional: Set environment variable** for explicit control
   ```bash
   export REACT_APP_API_URL=https://time.shahit.org/api
   npm run build
   ```

4. **Build the frontend** in production mode:
   ```bash
   cd frontend
   npm run build
   ```

5. **Start the services**:
   ```bash
   # Backend
   cd backend
   npm start

   # Frontend (serve the build directory)
   npm run serve

   # Or use the Docker setup
   docker-compose up
   ```

## Testing

To verify the setup works:

1. Visit your domain: `https://time.shahit.org`
2. Try logging in - the frontend will automatically make API calls through `/api`
3. Check the browser console for any CORS or connection errors
4. Verify no hardcoded port references in the network requests

## Troubleshooting

### Issue: "Cannot connect to server" error
- Check that your backend is running and accessible through the reverse proxy
- Verify proxy routes are correctly configured
- Check browser console for detailed error messages
- Ensure CORS headers are properly set in backend

### Issue: API calls still using port 5000
- Clear browser cache
- Rebuild the frontend: `npm run build`
- Check that you're not on localhost (which uses port 5000 by default)

### Issue: WebSocket connection fails
- Ensure your proxy supports WebSocket upgrades (if using WebSockets)
- Add necessary headers: `Upgrade`, `Connection`, `Sec-WebSocket-Key`

## Environment Variables

- `REACT_APP_API_URL`: Explicit API URL (overrides auto-detection)
- `NODE_ENV`: Set to `production` for optimized builds
- `REACT_APP_BACKEND_URL`: Alternative variable name (if using custom setup)

## Important Notes

- **Local Development**: Keep using `localhost:3000` for frontend and `localhost:5000` for backend
- **Production**: The domain-based setup with reverse proxy is recommended
- **HTTPS**: Use a reverse proxy with SSL/TLS for production (certbot + Nginx)
- **Port 5000 only used for localhost** - production ignores it automatically
