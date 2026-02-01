/**
 * Message generator for fortnightly timesheet summaries
 * Creates professional email drafts for timesheet submission
 */

import { formatDuration } from './fortnight.js';

function formatTimeLabel(dateValue, timeZone) {
  const date = new Date(dateValue);
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone
  });

  return time
    .replace(':00', '')
    .replace(' AM', 'am')
    .replace(' PM', 'pm');
}

function formatDayLabel(dateValue, timeZone) {
  const date = new Date(dateValue);
  return date.toLocaleDateString('en-US', { weekday: 'short', timeZone });
}

function formatDateLabel(dateValue, timeZone) {
  const date = new Date(dateValue);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone });
}

function formatHoursLabel(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) {
    return `${hours} hours`;
  }
  return `${hours}h ${mins}m`;
}

function getDateKey(dateValue, timeZone) {
  const date = new Date(dateValue);
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone
  }).format(date);
}

function getDailyRanges(timeEntries = [], timeZone) {
  const ranges = {};

  for (const entry of timeEntries) {
    const dateKey = getDateKey(entry.clock_in, timeZone);
    if (!ranges[dateKey]) {
      ranges[dateKey] = {
        firstIn: entry.clock_in,
        lastOut: entry.clock_out || null,
        totalMinutes: 0
      };
    }

    const current = ranges[dateKey];
    if (new Date(entry.clock_in) < new Date(current.firstIn)) {
      current.firstIn = entry.clock_in;
    }
    if (entry.clock_out) {
      if (!current.lastOut || new Date(entry.clock_out) > new Date(current.lastOut)) {
        current.lastOut = entry.clock_out;
      }
    }
    if (entry.duration_minutes) {
      current.totalMinutes += entry.duration_minutes;
    }
  }

  return ranges;
}

/**
 * Generate a fortnightly summary message
 * @param {object} data - Summary data
 * @param {string} data.companyName - Name of the company
 * @param {string} data.forthnightLabel - Fortnight date range label
 * @param {number} data.totalMinutes - Total minutes worked
 * @param {object} data.dailyBreakdown - Breakdown by day {date: minutes}
 * @param {array} data.expenses - Array of expenses {date, amount, description}
 * @param {string} data.userName - User's name (optional)
 * @returns {object} { text, html, subject }
 */
export function generateTimesheetMessage(data) {
  const {
    companyName,
    forthnightLabel,
    totalMinutes,
    dailyBreakdown = {},
    timeEntries = [],
    timeZone,
    expenses = [],
    userName = 'Employee'
  } = data;

  const duration = formatDuration(totalMinutes);
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Plain text version
  const textMessage = generateTextMessage({
    companyName,
    forthnightLabel,
    duration,
    dailyBreakdown,
    timeEntries,
    timeZone,
    expenses,
    totalExpenses,
    userName
  });

  // HTML version
  const htmlMessage = generateHTMLMessage({
    companyName,
    forthnightLabel,
    duration,
    dailyBreakdown,
    timeEntries,
    timeZone,
    expenses,
    totalExpenses,
    userName
  });

  // Subject line
  const subject = `Fortnightly Timesheet – ${companyName} – ${forthnightLabel}`;

  return {
    text: textMessage,
    html: htmlMessage,
    subject
  };
}

/**
 * Generate plain text message
 */
function generateTextMessage({
  companyName,
  forthnightLabel,
  duration,
  dailyBreakdown,
  timeEntries = [],
  timeZone,
  expenses,
  totalExpenses,
  userName
}) {
  let message = `Hi,\n`;
  message += `Here's my timesheet for ${companyName}\n`;
  message += `Period: ${forthnightLabel}\n\n`;

  const dailyRanges = getDailyRanges(timeEntries, timeZone);

  if (Object.keys(dailyRanges).length > 0) {
    message += `DAILY TIME RANGES:\n`;

    for (const [dateKey, range] of Object.entries(dailyRanges)) {
      const dayLabel = formatDayLabel(range.firstIn, timeZone);
      const dateLabel = formatDateLabel(range.firstIn, timeZone);
      const firstIn = formatTimeLabel(range.firstIn, timeZone);
      const lastOut = range.lastOut ? formatTimeLabel(range.lastOut, timeZone) : 'Active';
      const hoursLabel = formatHoursLabel(range.totalMinutes);
      message += `${dayLabel} ${dateLabel} ${firstIn} - ${lastOut} ${hoursLabel}\n`;
    }
  } else if (Object.keys(dailyBreakdown).length > 0) {
    message += `DAILY TIME RANGES:\n`;

    for (const [date, minutes] of Object.entries(dailyBreakdown)) {
      const dayLabel = formatDayLabel(date, timeZone);
      const dateLabel = formatDateLabel(date, timeZone);
      const hoursLabel = formatHoursLabel(minutes);
      message += `${dayLabel} ${dateLabel} ${hoursLabel}\n`;
    }
  }

  message += `Total Hours Worked: ${duration.display}\n`;

  if (expenses.length > 0) {
    for (const expense of expenses) {
      const dateObj = new Date(expense.date);
      const expenseDate = dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      message += `${expenseDate}: ${expense.description} - $${expense.amount.toFixed(2)}\n`;
    }
  }

  message += `Thank you`;

  return message;
}

/**
 * Generate HTML message
 */
function generateHTMLMessage({
  companyName,
  forthnightLabel,
  duration,
  dailyBreakdown,
  timeEntries = [],
  timeZone,
  expenses,
  totalExpenses,
  userName
}) {
  const today = new Date().toLocaleDateString();

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fortnightly Timesheet Submission</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #2c3e50;
      max-width: 650px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 25px;
      font-size: 26px;
      font-weight: 600;
    }
    h2 {
      color: #374151;
      margin-top: 30px;
      margin-bottom: 15px;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .header-info {
      background: #f8fafc;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 25px;
      border-left: 4px solid #2563eb;
    }
    .header-info p {
      margin: 8px 0;
      font-size: 14px;
      color: #475569;
    }
    .header-info strong {
      color: #1e293b;
      font-weight: 600;
    }
    .summary-box {
      background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
      border-left: 4px solid #2563eb;
      padding: 20px;
      margin: 20px 0;
      border-radius: 6px;
    }
    .summary-box p {
      margin: 10px 0;
      font-size: 15px;
      color: #1e293b;
    }
    .summary-value {
      font-weight: 700;
      color: #1e40af;
      font-size: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }
    th {
      background: #1e293b;
      color: white;
      padding: 14px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 12px 14px;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
      font-size: 14px;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover {
      background: #f9fafb;
    }
    .total-row {
      background: #f8fafc;
      font-weight: 700;
      color: #1e293b;
    }
    .footer {
      margin-top: 40px;
      padding-top: 25px;
      border-top: 2px solid #e5e7eb;
      color: #64748b;
      font-size: 14px;
      line-height: 1.8;
    }
    .signature {
      margin-top: 25px;
      font-size: 15px;
      color: #1e293b;
    }
    .confirmation {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 13px;
      color: #78350f;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📋 Fortnightly Timesheet Submission</h1>

    <p style="color: #475569; font-size: 15px; margin-bottom: 25px;">Dear Hiring Manager,</p>
    <p style="color: #475569; font-size: 15px; margin-bottom: 25px;">Please find below my timesheet submission for the fortnightly period. All hours and expenses have been accurately recorded.</p>
    
    <div class="header-info">
      <p><strong>Client/Company:</strong> ${companyName}</p>
      <p><strong>Period:</strong> ${forthnightLabel}</p>
      <p><strong>Submitted:</strong> ${today}</p>
      <p><strong>Contractor:</strong> ${userName}</p>
    </div>
      background: #34495e;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 14px;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #ecf0f1;
    }
    tr:hover {
      background: #f5f5f5;
    }
    .total-row {
      background: #ecf0f1;
      font-weight: bold;
    }
    .expense-row {
      font-size: 14px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 13px;
      color: #7f8c8d;
    }
    .signature {
      margin-top: 20px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Fortnightly Timesheet Submission</h1>
    
    <div class="header-info">
      <p><strong>Company:</strong> ${companyName}</p>
      <p><strong>Period:</strong> ${forthnightLabel}</p>
      <p><strong>Submitted by:</strong> ${userName}</p>
      <p><strong>Date Submitted:</strong> ${today}</p>
    </div>

    <h2>Summary</h2>
    <div class="summary-box">
      <p>Total Hours Worked: <span class="summary-value">${duration.display}</span></p>
      <p>Total Hours (Decimal): <span class="summary-value">${duration.decimal}</span></p>
    </div>`;

  const dailyRanges = getDailyRanges(timeEntries, timeZone);

  // Daily breakdown table
  if (Object.keys(dailyRanges).length > 0 || Object.keys(dailyBreakdown).length > 0) {
    html += `
    <h2>Daily Breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Day & Date</th>
          <th>First In</th>
          <th>Last Out</th>
          <th>Total Hours</th>
        </tr>
      </thead>
      <tbody>`;

    if (Object.keys(dailyRanges).length > 0) {
      for (const [dateKey, range] of Object.entries(dailyRanges)) {
        const dayLabel = formatDayLabel(range.firstIn, timeZone);
        const dateLabel = formatDateLabel(range.firstIn, timeZone);
        const firstIn = formatTimeLabel(range.firstIn, timeZone);
        const lastOut = range.lastOut ? formatTimeLabel(range.lastOut, timeZone) : 'Active';
        const hoursLabel = formatHoursLabel(range.totalMinutes);

        html += `
        <tr>
          <td>${dayLabel} ${dateLabel}</td>
          <td>${firstIn}</td>
          <td>${lastOut}</td>
          <td>${hoursLabel}</td>
        </tr>`;
      }
    } else {
      for (const [date, minutes] of Object.entries(dailyBreakdown)) {
        const dayLabel = formatDayLabel(date, timeZone);
        const dateLabel = formatDateLabel(date, timeZone);
        const hoursLabel = formatHoursLabel(minutes);
        html += `
        <tr>
          <td>${dayLabel} ${dateLabel}</td>
          <td>-</td>
          <td>-</td>
          <td>${hoursLabel}</td>
        </tr>`;
      }
    }

    html += `
      </tbody>
    </table>`;
  }

  // Expenses section
  if (expenses.length > 0) {
    html += `
    <h2>Expenses</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>`;

    for (const expense of expenses) {
      html += `
        <tr class="expense-row">
          <td>${expense.date}</td>
          <td>${expense.description}</td>
          <td>$${expense.amount.toFixed(2)}</td>
        </tr>`;
    }

    html += `
        <tr class="total-row">
          <td colspan="2">Total Expenses</td>
          <td>$${totalExpenses.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>`;
  }

  html += `
    <div class="confirmation">
      ⚠️ I hereby confirm that the hours and expenses listed above are accurate and complete to the best of my knowledge.
    </div>

    <div class="footer">
      <p>Please review and process this timesheet at your earliest convenience. Should you require any additional information, supporting documentation, or clarification regarding the hours or expenses listed, please do not hesitate to contact me.</p>
      
      <p>Thank you for your prompt attention to this matter.</p>
      
      <div class="signature">
        <p><strong>Best regards,</strong></p>
        <p>${userName}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Generate message preview with sample data
 * @returns {object} Sample message
 */
export function generateSampleMessage() {
  return generateTimesheetMessage({
    companyName: 'Acme Corporation',
    forthnightLabel: 'Mon 27 Jan – Sun 9 Feb 2026',
    totalMinutes: 280 * 60, // 280 hours
    timeZone: 'Australia/Sydney',
    timeEntries: [
      { clock_in: '2026-01-27T02:00:00', clock_out: '2026-01-27T19:00:00', duration_minutes: 1020 },
      { clock_in: '2026-01-28T02:15:00', clock_out: '2026-01-28T18:45:00', duration_minutes: 990 },
      { clock_in: '2026-01-29T03:00:00', clock_out: '2026-01-29T19:00:00', duration_minutes: 960 },
      { clock_in: '2026-01-30T02:30:00', clock_out: '2026-01-30T18:30:00', duration_minutes: 960 },
      { clock_in: '2026-01-31T02:00:00', clock_out: '2026-01-31T17:00:00', duration_minutes: 900 },
      { clock_in: '2026-02-03T02:00:00', clock_out: '2026-02-03T19:00:00', duration_minutes: 1020 },
      { clock_in: '2026-02-04T02:00:00', clock_out: '2026-02-04T19:00:00', duration_minutes: 1020 },
      { clock_in: '2026-02-05T02:00:00', clock_out: '2026-02-05T19:00:00', duration_minutes: 1020 },
      { clock_in: '2026-02-06T02:00:00', clock_out: '2026-02-06T19:00:00', duration_minutes: 1020 },
      { clock_in: '2026-02-09T02:00:00', clock_out: '2026-02-09T19:00:00', duration_minutes: 1020 }
    ],
    dailyBreakdown: {
      '2026-01-27': 8 * 60,
      '2026-01-28': 8 * 60,
      '2026-01-29': 8 * 60,
      '2026-01-30': 8 * 60,
      '2026-01-31': 8 * 60,
      '2026-02-03': 8 * 60,
      '2026-02-04': 8 * 60,
      '2026-02-05': 8 * 60,
      '2026-02-06': 8 * 60,
      '2026-02-09': 8 * 60
    },
    expenses: [
      { date: '2026-01-28', amount: 45.50, description: 'Client meeting lunch' },
      { date: '2026-02-05', amount: 32.00, description: 'Parking' }
    ],
    userName: 'John Smith'
  });
}
