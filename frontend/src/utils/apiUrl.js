/**
 * Get the API base URL
 * 
 * Smart detection for different access patterns:
 * - localhost:3000 → proxy intercepts, uses /api (forwarded to :5000 by package.json)
 * - 192.168.x.x:3000 → direct connection to same IP on port 5000
 * - domain.com → reverse proxy uses relative /api
 * - REACT_APP_API_URL env var → override everything
 */
export function getApiUrl() {
  // Allow environment variable override
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Check if we're in a browser context
  if (typeof window === 'undefined') {
    return '/api';
  }

  const hostname = window.location.hostname;

  // For localhost, use relative path - React proxy will handle it
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return '/api';
  }

  // For IP addresses (local development or LAN access), connect directly to port 5000
  if (
    hostname.match(/^\d+\.\d+\.\d+\.\d+$/) || // IPv4 pattern
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
    // Direct connection to backend on same IP, port 5000
    const protocol = window.location.protocol; // http: or https:
    return `${protocol}//${hostname}:5000/api`;
  }

  // For domain names, use relative path (reverse proxy will route)
  return '/api';
}
