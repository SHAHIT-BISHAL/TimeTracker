import express from 'express';
import { dbGet, dbAll } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Calculate pay cycle dates based on user preference
const calculatePayCycleDates = (payType) => {
  const today = new Date();
  let startDate, endDate;

  if (payType === 'weekly') {
    const day = today.getDay();
    const diff = today.getDate() - day;
    startDate = new Date(today.getFullYear(), today.getMonth(), diff);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else if (payType === 'bi-weekly') {
    const day = today.getDay();
    const diff = today.getDate() - day;
    startDate = new Date(today.getFullYear(), today.getMonth(), diff);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 13);
    endDate.setHours(23, 59, 59, 999);
  } else if (payType === 'monthly') {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

// Get current pay cycle
router.get('/current', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await dbGet('SELECT pay_cycle FROM users WHERE id = ?', [userId]);
    const payType = user.pay_cycle;
    const { startDate, endDate } = calculatePayCycleDates(payType);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const payCycle = await dbGet(
      'SELECT * FROM pay_cycles WHERE user_id = ? AND start_date = ? AND end_date = ?',
      [userId, startStr, endStr]
    );

    if (payCycle) {
      res.json(payCycle);
    } else {
      res.json({
        user_id: userId,
        start_date: startStr,
        end_date: endStr,
        total_hours: 0,
        total_earnings: 0,
        status: 'active'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate pay cycle earnings
router.get('/calculate', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  try {
    const user = await dbGet('SELECT hourly_rate FROM users WHERE id = ?', [userId]);

    const result = await dbGet(
      'SELECT SUM(duration_minutes) as total_minutes FROM time_entries WHERE user_id = ? AND clock_in >= ? AND clock_in <= ? AND clock_out IS NOT NULL',
      [userId, startDate, endDate]
    );

    const totalMinutes = result.total_minutes || 0;
    const totalHours = parseFloat((totalMinutes / 60).toFixed(2));
    const hourlyRate = user.hourly_rate;
    const totalEarnings = parseFloat((totalHours * hourlyRate).toFixed(2));

    res.json({
      total_hours: totalHours,
      total_earnings: totalEarnings,
      hourly_rate: hourlyRate,
      period: {
        start_date: startDate,
        end_date: endDate
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate message for boss
router.get('/generate-message', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  try {
    const user = await dbGet('SELECT username, hourly_rate FROM users WHERE id = ?', [userId]);

    const result = await dbGet(
      'SELECT SUM(duration_minutes) as total_minutes FROM time_entries WHERE user_id = ? AND clock_in >= ? AND clock_in <= ? AND clock_out IS NOT NULL',
      [userId, startDate, endDate]
    );

    const totalMinutes = result.total_minutes || 0;
    const totalHours = parseFloat((totalMinutes / 60).toFixed(2));
    const hourlyRate = user.hourly_rate;
    const totalEarnings = parseFloat((totalHours * hourlyRate).toFixed(2));

    const startDateFormatted = new Date(startDate).toLocaleDateString();
    const endDateFormatted = new Date(endDate).toLocaleDateString();

    const message = `Time Tracking Summary for Pay Period: ${startDateFormatted} - ${endDateFormatted}

Employee: ${user.username}
Total Hours Worked: ${totalHours}
Hourly Rate: $${hourlyRate}
Total Earnings: $${totalEarnings}

Please let me know if you have any questions about these hours.`;

    res.json({
      message,
      summary: {
        total_hours: totalHours,
        total_earnings: totalEarnings,
        period: { start_date: startDate, end_date: endDate }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
