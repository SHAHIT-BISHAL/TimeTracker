import express from 'express';
import { dbRun, dbGet, dbAll } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Clock in
router.post('/clock-in', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { project, notes, company_id } = req.body;

  try {
    // Get user's current company if not provided
    let companyId = company_id;
    if (!companyId) {
      const user = await dbGet('SELECT current_company_id FROM users WHERE id = ?', [userId]);
      companyId = user?.current_company_id;
    }

    if (!companyId) {
      return res.status(400).json({ 
        error: 'Please select a company before clocking in',
        code: 'NO_COMPANY_SELECTED'
      });
    }

    // Verify user owns the company
    const company = await dbGet(
      'SELECT id FROM companies WHERE id = ? AND user_id = ?',
      [companyId, userId]
    );

    if (!company) {
      return res.status(403).json({ 
        error: 'You do not have access to this company',
        code: 'INVALID_COMPANY'
      });
    }

    // Check for existing active clock-in
    const activeEntry = await dbGet(
      'SELECT * FROM time_entries WHERE user_id = ? AND clock_out IS NULL',
      [userId]
    );

    if (activeEntry) {
      return res.status(400).json({ 
        error: 'You are already clocked in. Please clock out first.',
        code: 'ALREADY_CLOCKED_IN',
        activeEntry
      });
    }

    const result = await dbRun(
      'INSERT INTO time_entries (user_id, company_id, clock_in, project, notes) VALUES (?, ?, now(), ?, ?)',
      [userId, companyId, project || null, notes || null]
    );

    const entry = await dbGet('SELECT * FROM time_entries WHERE id = ?', [result.id]);

    res.status(201).json({ 
      success: true,
      message: 'Successfully clocked in',
      entry
    });
  } catch (err) {
    console.error('Clock-in error:', err);
    res.status(500).json({ 
      error: 'Failed to clock in. Please try again.',
      code: 'SERVER_ERROR'
    });
  }
});

// Clock out
router.post('/clock-out', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await dbGet('SELECT current_company_id FROM users WHERE id = ?', [userId]);
    
    if (!user?.current_company_id) {
      return res.status(400).json({ 
        error: 'No company selected',
        code: 'NO_COMPANY_SELECTED'
      });
    }

    const entry = await dbGet(
      'SELECT * FROM time_entries WHERE user_id = ? AND company_id = ? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1',
      [userId, user.current_company_id]
    );

    if (!entry) {
      return res.status(400).json({ 
        error: 'No active clock-in found. Please clock in first.',
        code: 'NO_ACTIVE_ENTRY'
      });
    }

    // Calculate duration with validation
    const now = new Date();
    const clockIn = new Date(entry.clock_in);
    const durationMinutes = Math.floor((now - clockIn) / 60000);

    if (durationMinutes < 0) {
      return res.status(400).json({ 
        error: 'Invalid time entry detected',
        code: 'INVALID_DURATION'
      });
    }

    await dbRun(
      'UPDATE time_entries SET clock_out = now(), duration_minutes = ? WHERE id = ?',
      [durationMinutes, entry.id]
    );

    const updatedEntry = await dbGet('SELECT * FROM time_entries WHERE id = ?', [entry.id]);

    res.json({ 
      success: true,
      message: 'Successfully clocked out',
      entry: updatedEntry,
      duration: {
        minutes: durationMinutes,
        hours: Math.floor(durationMinutes / 60),
        display: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
      }
    });
  } catch (err) {
    console.error('Clock-out error:', err);
    res.status(500).json({ 
      error: 'Failed to clock out. Please try again.',
      code: 'SERVER_ERROR'
    });
  }
});

// Get time entries
router.get('/entries', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  try {
    let sql = 'SELECT * FROM time_entries WHERE user_id = ?';
    let params = [userId];

    if (startDate && endDate) {
      sql += ' AND clock_in >= ? AND clock_in <= ?';
      params.push(startDate, endDate);
    }

    sql += ' ORDER BY clock_in DESC';

    const entries = await dbAll(sql, params);
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current time entry status
router.get('/status', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const entry = await dbGet(
      'SELECT * FROM time_entries WHERE user_id = ? AND clock_out IS NULL',
      [userId]
    );

    if (entry) {
      res.json({ 
        isClockedIn: true,
        entry
      });
    } else {
      res.json({ 
        isClockedIn: false,
        entry: null
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
