import express from 'express';
import { dbRun, dbGet, dbAll } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Record a break
router.post('/start', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await dbRun(
      'INSERT INTO breaks (user_id, break_start) VALUES (?, now())',
      [userId]
    );

    res.status(201).json({
      message: 'Break started',
      break: { id: result.id }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// End a break
router.post('/end/:breakId', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const breakId = req.params.breakId;

  try {
    const breakRecord = await dbGet('SELECT * FROM breaks WHERE id = ? AND user_id = ?', [breakId, userId]);
    
    if (!breakRecord) {
      return res.status(404).json({ error: 'Break not found' });
    }

    const breakStart = new Date(breakRecord.break_start);
    const breakEnd = new Date();
    const breakDuration = Math.floor((breakEnd - breakStart) / 60000);

    await dbRun(
      'UPDATE breaks SET break_end = now(), duration_minutes = ? WHERE id = ?',
      [breakDuration, breakId]
    );

    res.json({ message: 'Break ended' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get active breaks
router.get('/active', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const breaks = await dbAll(
      'SELECT * FROM breaks WHERE user_id = ? AND break_end IS NULL',
      [userId]
    );

    res.json(breaks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
