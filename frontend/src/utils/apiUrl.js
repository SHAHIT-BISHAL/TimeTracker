/**
 * Get the API base URL
 * Supports:
 * 1. Environment variable REACT_APP_API_URL for explicit configuration
 * 2. Local development on localhost/127.0.0.1 with port 5000
 * 3. Production with reverse proxy using relative path
 */
export function getApiUrl() {
  // Ensure we're in a browser context
  if (typeof window === 'undefined') {
    return '/api';
  }

  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  const hostname = window.location.hostname;

  // Local development: localhost, 127.0.0.1, or private IP ranges
  if (
    hostname === 'localhost' || 
    hostname === '127.0.0.1' || 
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.16.') ||
    hostname.startsWith('172.17.') ||
    hostname.startsWith('172.18.') ||
    hostname.startsWith('172.19.') ||
    hostname.startsWith('172.20.') ||
    hostname.startsWith('172.21.') ||
    hostname.startsWith('172.22.') ||
    hostname.startsWith('172.23.') ||
    hostname.startsWith('172.24.') ||
    hostname.startsWith('172.25.') ||
    hostname.startsWith('172.26.') ||
    hostname.startsWith('172.27.') ||
    hostname.startsWith('172.28.') ||
    hostname.startsWith('172.29.') ||
    hostname.startsWith('172.30.') ||
    hostname.startsWith('172.31.')
  ) {
    return `http://${hostname}:5000/api`;
  }

  // Production with reverse proxy: use relative path to same domain
  return '/api';
}
