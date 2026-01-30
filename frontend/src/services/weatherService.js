/**
 * Weather Service
 * Fetches and caches weather data from OpenWeatherMap API
 * Used for dynamic background adjustments
 */

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const DEFAULT_LOCATION = { lat: -33.8688, lon: 151.2093 }; // Sydney coordinates

// Free tier OpenWeatherMap API - replace with your key or use environment variable
const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || 'demo';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

let weatherCache = {
  data: null,
  timestamp: null
};

/**
 * Get weather condition for background adjustment
 * @returns {Promise<Object>} Weather data with condition and temperature
 */
export const getWeather = async () => {
  // Check cache first
  const now = Date.now();
  if (weatherCache.data && weatherCache.timestamp && (now - weatherCache.timestamp < CACHE_DURATION)) {
    return weatherCache.data;
  }

  try {
    // Try to get user's location first
    const position = await getCurrentPosition().catch(() => null);
    
    const lat = position?.coords.latitude || DEFAULT_LOCATION.lat;
    const lon = position?.coords.longitude || DEFAULT_LOCATION.lon;

    const response = await fetch(
      `${API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();
    
    const weatherData = {
      condition: mapWeatherCondition(data.weather[0].main),
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      location: data.name
    };

    // Cache the result
    weatherCache = {
      data: weatherData,
      timestamp: now
    };

    return weatherData;
  } catch (error) {
    console.warn('Weather fetch failed, using default:', error);
    
    // Return default sunny weather if API fails
    const defaultWeather = {
      condition: 'clear',
      temperature: 22,
      description: 'Clear sky',
      location: 'Sydney'
    };

    // Cache the default for a shorter period
    weatherCache = {
      data: defaultWeather,
      timestamp: now - (CACHE_DURATION - 5 * 60 * 1000) // Only cache for 5 more minutes
    };

    return defaultWeather;
  }
};

/**
 * Get current geolocation position
 * @returns {Promise<GeolocationPosition>}
 */
const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 5000,
      maximumAge: 600000 // 10 minutes
    });
  });
};

/**
 * Map OpenWeatherMap conditions to simplified categories
 * @param {string} condition - Weather condition from API
 * @returns {string} Simplified condition category
 */
const mapWeatherCondition = (condition) => {
  const conditionMap = {
    'Clear': 'clear',
    'Clouds': 'cloudy',
    'Rain': 'rainy',
    'Drizzle': 'rainy',
    'Thunderstorm': 'rainy',
    'Snow': 'cloudy',
    'Mist': 'cloudy',
    'Fog': 'cloudy',
    'Haze': 'cloudy'
  };

  return conditionMap[condition] || 'clear';
};

/**
 * Clear weather cache (useful for testing or manual refresh)
 */
export const clearWeatherCache = () => {
  weatherCache = {
    data: null,
    timestamp: null
  };
};
