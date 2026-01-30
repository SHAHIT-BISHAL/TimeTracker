/**
 * Fortnight calculation and grouping utilities
 * Handles fortnightly (14-day) period calculations for timesheet cycles
 */

/**
 * Get the start date of the fortnight for a given date
 * Assumes fortnight starts on Monday
 * @param {Date} date - The date to find fortnight for
 * @returns {Date} Start of the fortnight (Monday)
 */
export function getForthnightStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get the end date of the fortnight
 * @param {Date} date - The date to find fortnight for
 * @returns {Date} End of the fortnight (Sunday, 13 days after start)
 */
export function getForthnightEnd(date = new Date()) {
  const start = getForthnightStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 13);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Get fortnight period as formatted string
 * @param {Date} date - Any date within the fortnight
 * @returns {string} Formatted string like "Mon 27 Jan – Sun 9 Feb 2026"
 */
export function getForthnightLabel(date = new Date()) {
  const start = getForthnightStart(date);
  const end = getForthnightEnd(date);

  const formatter = new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const startLabel = formatter.format(start);
  const endLabel = new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(end);

  return `${startLabel} – ${endLabel}`;
}

/**
 * Get all fortnights in a date range
 * @param {Date} fromDate - Start date
 * @param {Date} toDate - End date
 * @returns {Array} Array of fortnight start dates
 */
export function getFortnightsInRange(fromDate, toDate) {
  const fortnights = [];
  let current = new Date(getForthnightStart(fromDate));

  while (current <= toDate) {
    fortnights.push(new Date(current));
    current.setDate(current.getDate() + 14);
  }

  return fortnights;
}

/**
 * Check if a date falls within a fortnight period
 * @param {Date} date - Date to check
 * @param {Date} forthnightStart - Start of fortnight
 * @returns {boolean}
 */
export function isDateInFortnight(date, forthnightStart) {
  const d = new Date(date);
  const start = getForthnightStart(forthnightStart);
  const end = getForthnightEnd(forthnightStart);
  return d >= start && d <= end;
}

/**
 * Calculate total hours from minutes
 * @param {number} minutes - Total minutes
 * @returns {object} { hours, minutes } formatted display
 */
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return {
    total: minutes,
    hours,
    minutes: mins,
    display: `${hours}h ${mins}m`,
    decimal: (hours + mins / 60).toFixed(2)
  };
}

/**
 * Get current or specified fortnight info
 * @param {Date} date - Date within the fortnight (optional)
 * @returns {object} Fortnight info
 */
export function getForthnightInfo(date = new Date()) {
  const start = getForthnightStart(date);
  const end = getForthnightEnd(date);

  return {
    start,
    end,
    label: getForthnightLabel(date),
    startFormatted: start.toISOString().split('T')[0],
    endFormatted: end.toISOString().split('T')[0]
  };
}

/**
 * Get previous fortnight
 * @param {Date} date - Date in current fortnight
 * @returns {object} Previous fortnight info
 */
export function getPreviousFortnight(date = new Date()) {
  const current = getForthnightStart(date);
  const previous = new Date(current);
  previous.setDate(previous.getDate() - 14);
  return getForthnightInfo(previous);
}

/**
 * Get next fortnight
 * @param {Date} date - Date in current fortnight
 * @returns {object} Next fortnight info
 */
export function getNextFortnight(date = new Date()) {
  const current = getForthnightStart(date);
  const next = new Date(current);
  next.setDate(next.getDate() + 14);
  return getForthnightInfo(next);
}
