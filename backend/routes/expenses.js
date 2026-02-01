import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth.js';
import { pool } from '../server.js';

const router = express.Router();

// Configure multer for file uploads
const uploadDir = './uploads/receipts';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp-userid-originalname
    const uniqueSuffix = `${Date.now()}-${req.user.id}-${file.originalname}`;
    cb(null, uniqueSuffix);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, or PDF are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Get all expenses for the authenticated user
 * GET /api/expenses
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.query.company_id || req.user.current_company_id;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Company context required',
        code: 'NO_COMPANY_SELECTED'
      });
    }

    // Verify user has access to company
    const accessCheck = await pool.query(
      'SELECT id FROM user_companies WHERE user_id = $1 AND company_id = $2',
      [userId, companyId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'INVALID_COMPANY_ACCESS'
      });
    }

    const result = await pool.query(
      'SELECT * FROM expenses WHERE user_id = $1 AND company_id = $2 ORDER BY expense_date DESC',
      [userId, companyId]
    );

    res.json({
      success: true,
      expenses: result.rows
    });
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expenses'
    });
  }
});

/**
 * Get single expense by ID
 * GET /api/expenses/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;

    // Get expense and verify both user_id and company access
    const result = await pool.query(
      `SELECT e.* FROM expenses e
       JOIN user_companies uc ON e.company_id = uc.company_id
       WHERE e.id = $1 AND e.user_id = $2 AND uc.user_id = $2`,
      [expenseId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found or access denied'
      });
    }

    res.json({
      success: true,
      expense: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching expense:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expense'
    });
  }
});

/**
 * Create a new expense
 * POST /api/expenses
 * Body: { amount, category, description, expense_type, receipt (file) }
 */
router.post('/', authenticateToken, upload.single('receipt'), async (req, res) => {
  try {
    const { amount, category, description, expense_type } = req.body;
    const userId = req.user.id;
    const companyId = req.user.current_company_id;

    // Validation
    if (!amount || amount <= 0) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    if (!category || !['Food', 'Transport', 'Tools', 'Software', 'Other'].includes(category)) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({
        success: false,
        error: 'Invalid category. Must be: Food, Transport, Tools, Software, or Other'
      });
    }

    // Validate expense_type
    const validTypes = ['work', 'personal'];
    const type = expense_type && validTypes.includes(expense_type) ? expense_type : 'work';

    // Prepare receipt path if file was uploaded
    const receiptPath = req.file ? `/uploads/receipts/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO expenses (user_id, company_id, amount, category, description, expense_type, receipt_path, expense_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       RETURNING *`,
      [userId, companyId, amount, category, description || null, type, receiptPath]
    );

    res.status(201).json({
      success: true,
      expense: result.rows[0],
      message: 'Expense added successfully'
    });
  } catch (err) {
    // Clean up uploaded file if error occurs
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    console.error('Error creating expense:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create expense'
    });
  }
});

/**
 * Update an expense
 * PUT /api/expenses/:id
 * Body: { amount, category, description }
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { amount, category, description } = req.body;
    const userId = req.user.id;
    const expenseId = req.params.id;

    // Check if expense exists and belongs to user
    const existingExpense = await pool.query(
      'SELECT * FROM expenses WHERE id = $1 AND user_id = $2',
      [expenseId, userId]
    );

    if (existingExpense.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    // Validation
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    if (category && !['Food', 'Transport', 'Tools', 'Software', 'Other'].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category. Must be: Food, Transport, Tools, Software, or Other'
      });
    }

    const result = await pool.query(
      `UPDATE expenses 
       SET amount = COALESCE($1, amount),
           category = COALESCE($2, category),
           description = COALESCE($3, description),
           updated_at = now()
       WHERE id = $4
       RETURNING *`,
      [amount || null, category || null, description || null, expenseId]
    );

    res.json({
      success: true,
      expense: result.rows[0],
      message: 'Expense updated successfully'
    });
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update expense'
    });
  }
});

/**
 * Delete an expense
 * DELETE /api/expenses/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;

    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [expenseId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete expense'
    });
  }
});

/**
 * Get expense summary for current month
 * GET /api/expenses/summary/monthly
 */
router.get('/summary/monthly', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.current_company_id;

    const result = await pool.query(
      `SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average
       FROM expenses 
       WHERE user_id = $1 
       AND company_id = $2 
       AND expense_date >= DATE_TRUNC('month', now())
       GROUP BY category
       ORDER BY total DESC`,
      [userId, companyId]
    );

    const totalExpenses = await pool.query(
      `SELECT SUM(amount) as total FROM expenses 
       WHERE user_id = $1 AND company_id = $2 
       AND expense_date >= DATE_TRUNC('month', now())`,
      [userId, companyId]
    );

    res.json({
      success: true,
      monthlyTotal: totalExpenses.rows[0].total || 0,
      byCategory: result.rows
    });
  } catch (err) {
    console.error('Error fetching expense summary:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expense summary'
    });
  }
});

export default router;
