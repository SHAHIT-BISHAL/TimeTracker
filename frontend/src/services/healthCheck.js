/**
 * Health Check Service
 * Diagnoses API connectivity and provides detailed error information
 */

import { getApiUrl } from '../utils/apiUrl.js';

const getAPI_URL = () => getApiUrl();

export const healthCheck = async () => {
  try {
    const response = await fetch(`${getAPI_URL().replace('/api', '')}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      return { 
        healthy: true, 
        message: 'Server is responding',
        apiUrl: getAPI_URL() 
      };
    } else {
      return { 
        healthy: false, 
        message: `Server returned status ${response.status}`,
        apiUrl: getAPI_URL(),
        status: response.status
      };
    }
  } catch (err) {
    return { 
      healthy: false, 
      message: `Cannot connect to server: ${err.message}`,
      apiUrl: getAPI_URL(),
      error: err.message,
      hint: window.location.hostname === 'localhost' 
        ? 'Make sure the backend is running on port 5000'
        : 'Make sure the reverse proxy is correctly configured'
    };
  }
};

export const getApiUrlValue = () => {
  return getAPI_URL();
};
