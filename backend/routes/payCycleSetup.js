import express from 'express';
import { dbRun, dbGet, dbAll } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Setup or update pay cycle configuration
router.post('/setup', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { pay_cycle_type, custom_day } = req.body;

  const validCycleTypes = ['weekly', 'fortnightly', 'monthly', 'custom'];

  if (!validCycleTypes.includes(pay_cycle_type)) {
    return res.status(400).json({ error: 'Invalid pay cycle type' });
  }

  if (pay_cycle_type === 'custom' && !custom_day) {
    return res.status(400).json({ error: 'Custom day must be provided for custom cycle' });
  }

  try {
    await dbRun(
      'UPDATE users SET pay_cycle_type = ?, pay_cycle_custom_day = ? WHERE id = ?',
      [pay_cycle_type, custom_day || null, userId]
    );

    res.json({ message: 'Pay cycle configured', pay_cycle_type, custom_day });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pay cycle configuration
router.get('/config', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await dbGet(
      'SELECT pay_cycle_type, pay_cycle_custom_day FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      pay_cycle_type: user.pay_cycle_type || 'weekly',
      custom_day: user.pay_cycle_custom_day
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate next pay cycle based on configuration
router.post('/generate-next', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await dbGet('SELECT current_company_id, pay_cycle_type, pay_cycle_custom_day FROM users WHERE id = ?', [userId]);
    if (!user || !user.current_company_id) {
      return res.status(400).json({ error: 'No company selected' });
    }

    // Get last pay cycle
    const lastCycle = await dbGet(
      `SELECT end_date FROM pay_cycles 
       WHERE user_id = ? AND company_id = ? 
       ORDER BY end_date DESC LIMIT 1`,
      [userId, user.current_company_id]
    );

    let startDate, endDate;
    const cycleType = user.pay_cycle_type || 'weekly';
    const today = new Date();

    if (lastCycle) {
      startDate = new Date(lastCycle.end_date);
      startDate.setDate(startDate.getDate() + 1);
    } else {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
    }

    // Calculate end date based on cycle type
    switch (cycleType) {
      case 'weekly':
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        break;
      case 'fortnightly':
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 13);
        break;
      case 'monthly':
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        break;
      case 'custom':
        endDate = new Date(startDate);
        endDate.setDate(user.pay_cycle_custom_day || 15);
        if (endDate <= startDate) {
          endDate.setMonth(endDate.getMonth() + 1);
        }
        break;
      default:
        throw new Error('Invalid cycle type');
    }

    const result = await dbRun(
      `INSERT INTO pay_cycles (user_id, company_id, start_date, end_date, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [userId, user.current_company_id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    const cycle = await dbGet('SELECT * FROM pay_cycles WHERE id = ?', [result.id]);
    res.status(201).json({ message: 'Pay cycle generated', cycle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current pay cycle with auto-generation if needed
router.get('/current', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await dbGet('SELECT current_company_id FROM users WHERE id = ?', [userId]);
    if (!user || !user.current_company_id) {
      return res.json(null);
    }

    let cycle = await dbGet(
      `SELECT * FROM pay_cycles 
       WHERE user_id = ? AND company_id = ? AND status = 'active'
       ORDER BY end_date DESC LIMIT 1`,
      [userId, user.current_company_id]
    );

    if (!cycle) {
      // Auto-generate first cycle
      const generateRes = await new Promise((resolve) => {
        const cycleData = generatePayCycleData(userId, user.current_company_id);
        dbRun(
          `INSERT INTO pay_cycles (user_id, company_id, start_date, end_date, status)
           VALUES (?, ?, ?, ?, 'active')`,
          [userId, user.current_company_id, cycleData.start_date, cycleData.end_date]
        ).then(result => {
          dbGet('SELECT * FROM pay_cycles WHERE id = ?', [result.id]).then(c => resolve(c));
        });
      });
      cycle = generateRes;
    }

    res.json(cycle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to generate pay cycle dates
function generatePayCycleData(userId, companyId) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0]
  };
}

export default router;
