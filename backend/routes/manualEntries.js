import express from 'express';
import { dbRun, dbGet, dbAll } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Add manual time entry
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { clock_in, clock_out, notes, project, company_id } = req.body;

  try {
    // Get company_id from request or user's current company
    let companyId = company_id;
    if (!companyId) {
      const user = await dbGet('SELECT current_company_id FROM users WHERE id = ?', [userId]);
      companyId = user?.current_company_id;
    }

    if (!companyId) {
      return res.status(400).json({ 
        error: 'No company selected',
        code: 'NO_COMPANY_SELECTED'
      });
    }

    // Verify user has access to company
    const access = await dbGet(
      'SELECT * FROM user_companies WHERE user_id = ? AND company_id = ?',
      [userId, companyId]
    );

    if (!access) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'INVALID_COMPANY_ACCESS'
      });
    }

    if (!clock_in || !clock_out) {
      return res.status(400).json({ error: 'Clock in and clock out times are required' });
    }

    const clockInTime = new Date(clock_in);
    const clockOutTime = new Date(clock_out);
    const durationMinutes = Math.floor((clockOutTime - clockInTime) / 60000);

    if (durationMinutes < 0) {
      return res.status(400).json({ error: 'Clock out must be after clock in' });
    }

    const result = await dbRun(
      `INSERT INTO time_entries 
       (user_id, company_id, clock_in, clock_out, duration_minutes, notes, project, is_manual) 
       VALUES (?, ?, ?, ?, ?, ?, ?, true)`,
      [userId, companyId, clock_in, clock_out, durationMinutes, notes || null, project || null]
    );

    const entry = await dbGet('SELECT * FROM time_entries WHERE id = ?', [result.id]);
    res.status(201).json({ message: 'Manual entry created', entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all manual entries for user
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { company_id } = req.query;

  try {
    // Get company_id from query or user's current company
    let companyId = company_id;
    if (!companyId) {
      const user = await dbGet('SELECT current_company_id FROM users WHERE id = ?', [userId]);
      companyId = user?.current_company_id;
    }

    if (!companyId) {
      return res.json([]);
    }

    // Verify user has access to company
    const access = await dbGet(
      'SELECT * FROM user_companies WHERE user_id = ? AND company_id = ?',
      [userId, companyId]
    );

    if (!access) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'INVALID_COMPANY_ACCESS'
      });
    }

    const entries = await dbAll(
      `SELECT * FROM time_entries 
       WHERE user_id = ? AND company_id = ? AND is_manual = true
       ORDER BY clock_in DESC`,
      [userId, companyId]
    );

    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
