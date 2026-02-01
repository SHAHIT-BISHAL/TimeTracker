import express from 'express';
import { dbRun, dbGet, dbAll } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Record a break
router.post('/start', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { company_id } = req.body;

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

    const result = await dbRun(
      'INSERT INTO breaks (user_id, company_id, break_start) VALUES (?, ?, now())',
      [userId, companyId]
    );

    res.status(201).json({
      message: 'Break started',
      break: { id: result.id, company_id: companyId }
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

    const breaks = await dbAll(
      'SELECT * FROM breaks WHERE user_id = ? AND company_id = ? AND break_end IS NULL',
      [userId, companyId]
    );

    res.json(breaks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
