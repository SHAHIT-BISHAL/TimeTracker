import express from 'express';
import { dbRun, dbGet, dbAll } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create a new company
router.post('/', authenticateToken, async (req, res) => {
  const { name, description, industry, pay_rate, manager_email } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    const result = await dbRun(
      'INSERT INTO companies (user_id, name, description, industry, pay_rate, manager_email) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, description || null, industry || null, pay_rate || 0, manager_email || null]
    );

    // Add user to company with owner role
    await dbRun(
      'INSERT INTO user_companies (user_id, company_id, hourly_rate, role) VALUES (?, ?, ?, ?)',
      [userId, result.id, pay_rate || 0, 'owner']
    );

    // Set as current company
    await dbRun('UPDATE users SET current_company_id = ? WHERE id = ?', [result.id, userId]);

    const company = await dbGet('SELECT * FROM companies WHERE id = ?', [result.id]);
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all companies for user
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const companies = await dbAll(
      `SELECT c.* FROM companies c 
       JOIN user_companies uc ON c.id = uc.company_id 
       WHERE c.user_id = ? OR uc.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId, userId]
    );
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get company details with user info
router.get('/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const userId = req.user.id;

  try {
    // Verify user has access to this company
    const access = await dbGet(
      'SELECT * FROM user_companies WHERE user_id = ? AND company_id = ?',
      [userId, companyId]
    );

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const company = await dbGet(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM time_entries WHERE company_id = c.id) as total_entries,
              (SELECT SUM(duration_minutes) FROM time_entries WHERE company_id = c.id) as total_minutes
       FROM companies c WHERE id = ?`,
      [companyId]
    );

    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update company
router.put('/:companyId', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const { name, description, industry, pay_rate, manager_email } = req.body;
  const userId = req.user.id;

  try {
    // Verify user is owner
    const access = await dbGet(
      'SELECT * FROM user_companies WHERE user_id = ? AND company_id = ? AND role = ?',
      [userId, companyId, 'owner']
    );

    if (!access) {
      return res.status(403).json({ error: 'Only owner can update company' });
    }

    await dbRun(
      'UPDATE companies SET name = ?, description = ?, industry = ?, pay_rate = ?, manager_email = ?, updated_at = now() WHERE id = ?',
      [name, description, industry, pay_rate || 0, manager_email || null, companyId]
    );

    const company = await dbGet('SELECT * FROM companies WHERE id = ?', [companyId]);
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Switch current company
router.post('/:companyId/switch', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const userId = req.user.id;

  try {
    // Verify user has access
    const access = await dbGet(
      'SELECT * FROM user_companies WHERE user_id = ? AND company_id = ?',
      [userId, companyId]
    );

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await dbRun('UPDATE users SET current_company_id = ? WHERE id = ?', [companyId, userId]);
    res.json({ message: 'Company switched successfully', company_id: companyId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get company members
router.get('/:companyId/members', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const userId = req.user.id;

  try {
    const access = await dbGet(
      'SELECT * FROM user_companies WHERE user_id = ? AND company_id = ?',
      [userId, companyId]
    );

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const members = await dbAll(
      `SELECT u.id, u.username, u.email, uc.role, uc.hourly_rate, uc.created_at
       FROM user_companies uc
       JOIN users u ON uc.user_id = u.id
       WHERE uc.company_id = ?`,
      [companyId]
    );

    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update hourly rate for user in company
router.put('/:companyId/hourly-rate', authenticateToken, async (req, res) => {
  const { companyId } = req.params;
  const userId = req.user.id;
  const { hourly_rate } = req.body;

  if (hourly_rate === undefined) {
    return res.status(400).json({ error: 'Hourly rate is required' });
  }

  try {
    const access = await dbGet(
      'SELECT * FROM user_companies WHERE user_id = ? AND company_id = ?',
      [userId, companyId]
    );

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await dbRun(
      'UPDATE user_companies SET hourly_rate = ? WHERE user_id = ? AND company_id = ?',
      [parseFloat(hourly_rate), userId, companyId]
    );

    res.json({ message: 'Hourly rate updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
