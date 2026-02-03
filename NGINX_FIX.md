# Nginx Configuration Fix for time.shahit.org

## Problem
The reverse proxy is returning React's `index.html` for ALL requests, including API calls to `/api/*`.
This happens because the `try_files` directive catches everything before the `/api` location block runs.

## Solution
On your Ubuntu server (192.168.1.155), edit the nginx config:

```bash
sudo nano /etc/nginx/sites-enabled/default
# OR
sudo nano /etc/nginx/sites-enabled/time.shahit.org
```

The config should look like this:

```nginx
server {
    listen 80;
    server_name time.shahit.org;

    # Root directory for frontend static files
    root /path/to/your/frontend/build;
    index index.html;

    # IMPORTANT: /api location MUST come BEFORE the location / block
    # This ensures API requests are proxied before try_files catches them
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        
        # Forward all headers including Authorization
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serve frontend for all non-API requests
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Apply the fix:

1. Edit the nginx config file (see above)
2. Test the configuration:
   ```bash
   sudo nginx -t
   ```
3. If test passes, reload nginx:
   ```bash
   sudo systemctl reload nginx
   ```
4. Verify it works:
   ```bash
   curl http://localhost/api/health
   curl http://time.shahit.org/api/health
   ```

## Common Mistakes to Avoid

❌ **WRONG ORDER** (causes the bug you're experiencing):
```nginx
location / {
    try_files $uri $uri/ /index.html;  # This catches /api/* first!
}

location /api/ {
    proxy_pass http://localhost:5000/api/;  # Never reached!
}
```

✅ **CORRECT ORDER**:
```nginx
location /api/ {
    proxy_pass http://localhost:5000/api/;  # Checked first
}

location / {
    try_files $uri $uri/ /index.html;  # Catches everything else
}
```

## Verification

After fixing, these should work:
- `curl http://time.shahit.org/api/health` → JSON response
- `curl http://time.shahit.org/api/companies` → 401 Unauthorized (without token)
- Frontend at time.shahit.org should load and login should work

## Frontend Build Location

Make sure your nginx `root` directive points to where you deployed the frontend build:
```bash
# Common locations:
/var/www/time.shahit.org/build
/home/shah/timetracker/frontend/build
/opt/timetracker/frontend/build
```
