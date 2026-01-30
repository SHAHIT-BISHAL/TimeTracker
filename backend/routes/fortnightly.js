import express from 'express';
import { dbGet, dbAll, dbRun } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  getForthnightStart, 
  getForthnightEnd, 
  getForthnightInfo,
  formatDuration
} from '../services/fortnight.js';
import {
  generateTimesheetMessage,
  generateSampleMessage
} from '../services/messageGenerator.js';
import { 
  sendTimesheetEmail,
  isConfigured as isEmailConfigured
} from '../services/emailService.js';

const router = express.Router();

/**
 * GET /api/fortnightly/summary
 * Get timesheet summary for a specific fortnight and company
 * Query params: date (ISO string), company_id
 */
router.get('/summary', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { date, company_id } = req.query;
  const queryDate = date ? new Date(date) : new Date();

  if (!company_id) {
    return res.status(400).json({ error: 'company_id is required' });
  }

  try {
    // Verify user has access to company
    const access = await dbGet(
      'SELECT id FROM user_companies WHERE user_id = ? AND company_id = ?',
      [userId, company_id]
    );

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const forthnightInfo = getForthnightInfo(queryDate);

    // Get time entries for this fortnight and company
    const timeEntries = await new Promise((resolve, reject) => {
      const db = global.db;
      db.all(
        `SELECT * FROM time_entries 
         WHERE user_id = ? 
         AND company_id = ? 
         AND clock_in >= ? 
         AND clock_in <= ?
         ORDER BY clock_in`,
        [userId, company_id, forthnightInfo.start, forthnightInfo.end],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // Get expenses for this fortnight and company
    const expenses = await new Promise((resolve, reject) => {
      const db = global.db;
      db.all(
        `SELECT * FROM expenses 
         WHERE user_id = ? 
         AND company_id = ? 
         AND expense_date >= ? 
         AND expense_date <= ?
         ORDER BY expense_date`,
        [userId, company_id, forthnightInfo.startFormatted, forthnightInfo.endFormatted],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // Calculate totals
    let totalMinutes = 0;
    const dailyBreakdown = {};

    for (const entry of timeEntries) {
      if (entry.duration_minutes) {
        totalMinutes += entry.duration_minutes;

        // Create daily breakdown
        const entryDate = new Date(entry.clock_in).toISOString().split('T')[0];
        dailyBreakdown[entryDate] = (dailyBreakdown[entryDate] || 0) + entry.duration_minutes;
      }
    }

    // Format expenses
    const formattedExpenses = expenses.map(exp => ({
      date: exp.expense_date,
      amount: parseFloat(exp.amount),
      description: exp.category,
      notes: exp.notes
    }));

    // Get company info
    const company = await dbGet('SELECT * FROM companies WHERE id = ?', [company_id]);

    const summary = {
      fortnight: forthnightInfo,
      company: {
        id: company.id,
        name: company.name,
        manager_email: company.manager_email
      },
      timeEntries: timeEntries,
      totalMinutes,
      duration: formatDuration(totalMinutes),
      dailyBreakdown,
      expenses: formattedExpenses,
      totalExpenses: formattedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    };

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/fortnightly/generate-message
 * Generate a message/email draft for a fortnight
 */
router.post('/generate-message', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { date, company_id } = req.body;
  const queryDate = date ? new Date(date) : new Date();

  if (!company_id) {
    return res.status(400).json({ error: 'company_id is required' });
  }

  try {
    const forthnightInfo = getForthnightInfo(queryDate);

    // Verify access
    const access = await dbGet(
      'SELECT id FROM user_companies WHERE user_id = ? AND company_id = ?',
      [userId, company_id]
    );

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get data using dbAll instead of global.db.all
    const timeEntries = await dbAll(
      `SELECT * FROM time_entries 
       WHERE user_id = ? AND company_id = ? 
       AND clock_in >= ? AND clock_in <= ?
       ORDER BY clock_in`,
      [userId, company_id, forthnightInfo.start, forthnightInfo.end]
    );

    const expenses = await dbAll(
      `SELECT * FROM expenses 
       WHERE user_id = ? AND company_id = ? 
       AND expense_date >= ? AND expense_date <= ?
       ORDER BY expense_date`,
      [userId, company_id, forthnightInfo.startFormatted, forthnightInfo.endFormatted]
    );

    const company = await dbGet('SELECT * FROM companies WHERE id = ?', [company_id]);
    const user = await dbGet('SELECT username FROM users WHERE id = ?', [userId]);

    let totalMinutes = 0;
    const dailyBreakdown = {};

    for (const entry of timeEntries) {
      if (entry.duration_minutes) {
        totalMinutes += entry.duration_minutes;
        const entryDate = new Date(entry.clock_in).toISOString().split('T')[0];
        dailyBreakdown[entryDate] = (dailyBreakdown[entryDate] || 0) + entry.duration_minutes;
      }
    }

    const formattedExpenses = expenses.map(exp => ({
      date: exp.expense_date,
      amount: parseFloat(exp.amount),
      description: exp.category,
      notes: exp.notes
    }));

    const summaryRes = {
      companyName: company.name,
      forthnightLabel: forthnightInfo.label,
      totalMinutes,
      dailyBreakdown,
      expenses: formattedExpenses,
      userName: user.username
    };

    const message = generateTimesheetMessage(summaryRes);

    res.json({
      fortnight: getForthnightInfo(queryDate),
      message
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/fortnightly/send-email
 * Send the fortnightly summary email
 */
router.post('/send-email', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { date, company_id, recipient_email } = req.body;
  const queryDate = date ? new Date(date) : new Date();

  if (!company_id || !recipient_email) {
    return res.status(400).json({ error: 'company_id and recipient_email are required' });
  }

  try {
    // Check if email is configured
    if (!isEmailConfigured()) {
      return res.status(503).json({ 
        error: 'Email service not configured. Please configure SMTP settings first.' 
      });
    }

    // Verify user has access to company
    const access = await dbGet(
      'SELECT id FROM user_companies WHERE user_id = ? AND company_id = ?',
      [userId, company_id]
    );

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get company info and email settings
    const company = await dbGet('SELECT * FROM companies WHERE id = ?', [company_id]);
    const emailSettings = await dbGet('SELECT * FROM email_settings WHERE user_id = ?', [userId]);

    // Generate message
    const forthnightInfo = getForthnightInfo(queryDate);

    // Get time entries and expenses using dbAll...
    const timeEntries = await dbAll(
      `SELECT * FROM time_entries 
       WHERE user_id = ? AND company_id = ? 
       AND clock_in >= ? AND clock_in <= ?
       ORDER BY clock_in`,
      [userId, company_id, forthnightInfo.start, forthnightInfo.end]
    );

    const expenses = await dbAll(
      `SELECT * FROM expenses 
       WHERE user_id = ? AND company_id = ? 
       AND expense_date >= ? AND expense_date <= ?
       ORDER BY expense_date`,
      [userId, company_id, forthnightInfo.startFormatted, forthnightInfo.endFormatted]
    );

    const user = await dbGet('SELECT username FROM users WHERE id = ?', [userId]);

    let totalMinutes = 0;
    const dailyBreakdown = {};

    for (const entry of timeEntries) {
      if (entry.duration_minutes) {
        totalMinutes += entry.duration_minutes;
        const entryDate = new Date(entry.clock_in).toISOString().split('T')[0];
        dailyBreakdown[entryDate] = (dailyBreakdown[entryDate] || 0) + entry.duration_minutes;
      }
    }

    const formattedExpenses = expenses.map(exp => ({
      date: exp.expense_date,
      amount: parseFloat(exp.amount),
      description: exp.category,
      notes: exp.notes
    }));

    const messageData = {
      companyName: company.name,
      forthnightLabel: forthnightInfo.label,
      totalMinutes,
      dailyBreakdown,
      expenses: formattedExpenses,
      userName: user.username
    };

    const message = generateTimesheetMessage(messageData);

    // Send email
    const result = await sendTimesheetEmail({
      to: recipient_email,
      subject: message.subject,
      text: message.text,
      html: message.html,
      from: emailSettings?.from_address
    });

    // Log the email send
    await dbRun(
      `INSERT INTO email_log (user_id, company_id, recipient, subject, sent_at) 
       VALUES (?, ?, ?, ?, now())`,
      [userId, company_id, recipient_email, message.subject]
    );

    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/fortnightly/sample
 * Get a sample message for preview
 */
router.get('/sample', (req, res) => {
  try {
    const sample = generateSampleMessage();
    res.json(sample);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
