import express from 'express';
import { dbGet, dbRun, dbAll } from '../server.js';
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

// Get current user info with company
router.get('/me', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await dbGet(
      'SELECT id, username, email, current_company_id as company_id, hourly_rate, pay_cycle_type FROM users WHERE id = ?',
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

// Switch current company
router.put('/current-company', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { company_id } = req.body;

  if (!company_id) {
    return res.status(400).json({ error: 'company_id is required' });
  }

  try {
    // Verify user has access to this company
    const access = await dbGet(
      'SELECT id FROM user_companies WHERE user_id = ? AND company_id = ?',
      [userId, company_id]
    );

    if (!access) {
      return res.status(403).json({ error: 'Company not found or access denied' });
    }

    await dbRun(
      'UPDATE users SET current_company_id = ?, updated_at = now() WHERE id = ?',
      [company_id, userId]
    );

    res.json({ message: 'Company switched successfully', company_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users in current company
router.get('/company', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Get user's current company
    const user = await dbGet(
      'SELECT current_company_id FROM users WHERE id = ?',
      [userId]
    );

    if (!user || !user.current_company_id) {
      return res.status(400).json({ error: 'User not in a company' });
    }

    // Get all users in the same company
    const users = await dbAll(
      'SELECT id, username, email FROM users WHERE current_company_id = ? ORDER BY username',
      [user.current_company_id]
    );

    res.json({ users, company_id: user.current_company_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
