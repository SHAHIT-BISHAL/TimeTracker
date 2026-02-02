/**
 * Get the API base URL
 * Supports:
 * 1. Environment variable REACT_APP_API_URL for explicit configuration
 * 2. Local development on localhost/127.0.0.1 with port 5000
 * 3. Production with reverse proxy using relative path
 */
export function getApiUrl() {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Local development: connect to backend on port 5000
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `http://${window.location.hostname}:5000/api`;
  }

  // Production with reverse proxy: use relative path to same domain
  return '/api';
}
