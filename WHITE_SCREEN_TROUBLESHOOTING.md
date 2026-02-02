# White Screen After Login - Troubleshooting Guide

If you see a white screen after successfully logging in, follow these steps to diagnose and fix the issue.

## Quick Diagnostic Checklist

### 1. **Check Browser Console (F12)**
   - Press `F12` to open Developer Tools
   - Go to **Console** tab
   - Look for any red error messages
   - Look for network errors (see step 2)

### 2. **Check Network Requests (F12 → Network)**
   - Refresh the page
   - Look for failed requests (marked in red)
   - Check `/api/companies` request:
     - Should return `200 OK`
     - Should contain a list of companies
   - Check if requests are hitting the correct URL

### 3. **Verify API Connection**
   - Open browser console (F12 → Console)
   - Run this command:
     ```javascript
     fetch('/api/companies', {
       headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')}
     }).then(r => r.json()).then(d => console.log(d)).catch(e => console.error(e))
     ```
   - If this fails, your backend is not responding

## Common Issues & Solutions

### Issue: "Failed to load companies: Network Error"

**Cause:** Backend API is not responding through the reverse proxy

**Solutions:**

1. **Verify Backend is Running**
   ```bash
   # Check if backend is running on port 5000
   curl http://localhost:5000/api/companies
   ```

2. **Verify Reverse Proxy Configuration**
   - Check your nginx/apache config
   - Ensure `/api/*` routes to backend (http://localhost:5000)
   - Example Nginx config:
     ```nginx
     location /api/ {
       proxy_pass http://localhost:5000/api/;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
     ```

3. **Check CORS Headers**
   - Backend should allow requests from your domain
   - Look for `Access-Control-Allow-Origin` in response headers

4. **Verify Token is Valid**
   - Open browser console and check:
     ```javascript
     console.log(localStorage.getItem('token'))
     ```
   - If empty, login again

### Issue: "401 Unauthorized" errors

**Cause:** Token is invalid or expired

**Solution:**
```javascript
// Clear local storage and login again
localStorage.clear();
location.href = '/login';
```

### Issue: Blank/Empty Company List

**Cause:** User has no companies created yet

**Solution:**
- Application should show company creation screen
- If it shows blank screen instead, there's a rendering error
- Check console for JavaScript errors

### Issue: Request to `:5000` fails (port hardcoded)

**Cause:** Using old frontend build before reverse proxy fix

**Solution:**
1. **Clear Browser Cache**
   ```
   Ctrl+Shift+Delete (Windows/Linux)
   Cmd+Shift+Delete (Mac)
   ```

2. **Rebuild Frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Redeploy Frontend**
   - If using Docker: rebuild the image
   - If using direct server: copy new build files

## Advanced Debugging

### Enable Debug Mode

Add this to browser console to see API calls:

```javascript
// Log all API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('API Call:', args[0]);
  return originalFetch.apply(this, args)
    .then(r => {
      console.log('Response:', r.status, r.url);
      return r;
    })
    .catch(e => {
      console.error('Fetch Error:', e);
      throw e;
    });
};
```

### Check Reverse Proxy Logs

```bash
# Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Apache
tail -f /var/log/apache2/access.log
tail -f /var/log/apache2/error.log

# Docker
docker logs container_name
```

### Verify Backend Health

```bash
# Direct backend health check
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/companies

# Through reverse proxy
curl -H "Authorization: Bearer YOUR_TOKEN" https://time.shahit.org/api/companies
```

## Expected Flow

1. ✅ User logs in with credentials
2. ✅ Token is saved to localStorage
3. ✅ Redirect to `/dashboard`
4. ✅ CompanyGuard fetches `/api/companies`
5. ✅ Shows company selector or company creation
6. ✅ After selecting/creating company, show dashboard

If any step fails, you'll see a white screen.

## Getting Help

Include these details when reporting the issue:

1. **Browser Console Output** (F12 → Console)
   - Copy all red error messages
   - Include full error stack traces

2. **Network Tab Details** (F12 → Network)
   - Failed request URLs
   - HTTP status codes
   - Request/response headers (especially `Authorization`)

3. **Your Setup**
   - Domain name (e.g., `time.shahit.org`)
   - Reverse proxy type (Nginx/Apache)
   - Frontend URL and backend URL

4. **Test Commands Output**
   ```bash
   # Run these and share output
   curl http://localhost:5000/api/health
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/companies
   ```

## Related Documentation

- See [REVERSE_PROXY_SETUP.md](REVERSE_PROXY_SETUP.md) for reverse proxy configuration
- See backend logs for API errors
- Check browser console for JavaScript errors
