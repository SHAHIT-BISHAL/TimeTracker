/**
 * Time utilities for AEDT (Australia Eastern Daylight Time) handling
 * Ensures all displayed times respect Australia/Sydney timezone
 */

/**
 * Get current time in AEDT
 * @returns {Date} Current date/time in AEDT
 */
export const getAEDTTime = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
};

/**
 * Format time for AEDT display
 * @param {Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted time string
 */
export const formatAEDT = (date = new Date(), options = {}) => {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    ...options
  }).format(date);
};

/**
 * Get time of day based on AEDT hour
 * @returns {string} 'morning' | 'afternoon' | 'evening' | 'night'
 */
export const getTimeOfDay = () => {
  const aedtTime = getAEDTTime();
  const hour = aedtTime.getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

/**
 * Get current AEDT time components for analog clock
 * @returns {Object} { hours, minutes, seconds, milliseconds }
 */
export const getAEDTTimeComponents = () => {
  const aedtTime = getAEDTTime();
  
  return {
    hours: aedtTime.getHours(),
    minutes: aedtTime.getMinutes(),
    seconds: aedtTime.getSeconds(),
    milliseconds: aedtTime.getMilliseconds()
  };
};

/**
 * Calculate clock hand angles based on time
 * @param {Object} time - Time components from getAEDTTimeComponents
 * @returns {Object} { hourAngle, minuteAngle, secondAngle }
 */
export const calculateClockAngles = (time) => {
  const { hours, minutes, seconds, milliseconds } = time;
  
  // Second hand: 6 degrees per second (360/60) + smooth millisecond progression
  const secondAngle = (seconds + milliseconds / 1000) * 6;
  
  // Minute hand: 6 degrees per minute (360/60) + smooth second progression
  const minuteAngle = (minutes + seconds / 60) * 6;
  
  // Hour hand: 30 degrees per hour (360/12) + smooth minute progression
  const hourAngle = ((hours % 12) + minutes / 60) * 30;
  
  return {
    hourAngle,
    minuteAngle,
    secondAngle
  };
};

/**
 * Get greeting based on AEDT time
 * @returns {string} Time-appropriate greeting
 */
export const getGreeting = () => {
  const timeOfDay = getTimeOfDay();
  
  const greetings = {
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
    night: 'Good Evening'
  };
  
  return greetings[timeOfDay];
};
