/**
 * Get the API base URL
 * 
 * Always returns '/api' (relative path) which works in all environments:
 * - Local development: package.json proxy forwards /api -> http://localhost:5000/api
 * - Production: Nginx reverse proxy forwards /api -> backend on port 5000
 * - Custom environments: Set REACT_APP_API_URL env variable to override
 * 
 * This centralized approach ensures consistent API routing without hardcoding URLs.
 */
export function getApiUrl() {
  // Allow environment variable override for custom deployments
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Use relative path - let proxy handle routing
  return '/api';
}
