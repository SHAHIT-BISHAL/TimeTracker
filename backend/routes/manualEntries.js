import express from 'express';
import { dbRun, dbGet, dbAll } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Add manual time entry
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { clock_in, clock_out, notes, project } = req.body;

  try {
    // Get user's current company
    const user = await dbGet('SELECT current_company_id FROM users WHERE id = ?', [userId]);
    if (!user || !user.current_company_id) {
      return res.status(400).json({ error: 'No company selected' });
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
      [userId, user.current_company_id, clock_in, clock_out, durationMinutes, notes || null, project || null]
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

  try {
    const user = await dbGet('SELECT current_company_id FROM users WHERE id = ?', [userId]);
    if (!user || !user.current_company_id) {
      return res.json([]);
    }

    const entries = await dbAll(
      `SELECT * FROM time_entries 
       WHERE user_id = ? AND company_id = ? AND is_manual = true
       ORDER BY clock_in DESC`,
      [userId, user.current_company_id]
    );

    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
