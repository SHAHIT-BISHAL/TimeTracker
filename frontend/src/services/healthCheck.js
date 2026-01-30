/**
 * Health Check Service
 * Diagnoses API connectivity and provides detailed error information
 */

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_URL.replace('/api', '')}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      return { 
        healthy: true, 
        message: 'Server is responding',
        apiUrl: API_URL 
      };
    } else {
      return { 
        healthy: false, 
        message: `Server returned status ${response.status}`,
        apiUrl: API_URL,
        status: response.status
      };
    }
  } catch (err) {
    return { 
      healthy: false, 
      message: `Cannot connect to server: ${err.message}`,
      apiUrl: API_URL,
      error: err.message,
      hint: window.location.hostname === 'localhost' 
        ? 'Make sure the backend is running on port 5000'
        : `Make sure the server at ${window.location.hostname}:5000 is accessible`
    };
  }
};

export const getApiUrl = () => {
  return API_URL;
};

export const getServerAddress = () => {
  const url = new URL(API_URL);
  return `${url.hostname}:${url.port || 5000}`;
};
