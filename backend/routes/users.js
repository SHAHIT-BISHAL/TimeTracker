import express from 'express';
import { dbGet, dbRun } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await dbGet(
      'SELECT id, username, email, hourly_rate, pay_cycle FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user settings
router.put('/settings', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { hourly_rate, pay_cycle } = req.body;

  try {
    await dbRun(
      'UPDATE users SET hourly_rate = ?, pay_cycle = ?, updated_at = now() WHERE id = ?',
      [hourly_rate, pay_cycle, userId]
    );

    const user = await dbGet(
      'SELECT id, username, email, hourly_rate, pay_cycle FROM users WHERE id = ?',
      [userId]
    );

    res.json({ 
      message: 'Settings updated successfully',
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark profile setup as complete
router.put('/profile/setup-complete', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    await dbRun(
      'UPDATE users SET profile_setup_complete = true, updated_at = now() WHERE id = ?',
      [userId]
    );

    res.json({ message: 'Profile setup marked as complete' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
