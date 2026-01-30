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
      return res.status(400).json({ error: 'Company not selected' });
    }

    const activeEntry = await dbGet(
      'SELECT * FROM time_entries WHERE user_id = ? AND clock_out IS NULL',
      [userId]
    );

    if (activeEntry) {
      return res.status(400).json({ error: 'Already clocked in' });
    }

    const result = await dbRun(
      'INSERT INTO time_entries (user_id, company_id, clock_in, project, notes) VALUES (?, ?, now(), ?, ?)',
      [userId, companyId, project || null, notes || null]
    );

    const entry = await dbGet('SELECT * FROM time_entries WHERE id = ?', [result.id]);

    res.status(201).json({ 
      message: 'Clocked in successfully',
      entry
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clock out
router.post('/clock-out', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await dbGet('SELECT current_company_id FROM users WHERE id = ?', [userId]);
    const entry = await dbGet(
      'SELECT * FROM time_entries WHERE user_id = ? AND company_id = ? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1',
      [userId, user.current_company_id]
    );

    if (!entry) {
      return res.status(400).json({ error: 'No active clock in found' });
    }

    // Use ISO8601 UTC timestamps consistently to avoid timezone parsing issues
    const now = new Date();
    const clockIn = new Date(entry.clock_in);
    const durationMinutes = Math.floor((now - clockIn) / 60000);

    await dbRun(
      'UPDATE time_entries SET clock_out = now(), duration_minutes = ? WHERE id = ?',
      [durationMinutes, entry.id]
    );

    const updatedEntry = await dbGet('SELECT * FROM time_entries WHERE id = ?', [entry.id]);

    res.json({ 
      message: 'Clocked out successfully',
      entry: updatedEntry
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
