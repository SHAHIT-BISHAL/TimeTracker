import express from 'express';
import authenticateToken from '../middleware/auth.js';
import { pool } from '../server.js';

const router = express.Router();

/**
 * Get all expenses for the authenticated user
 * GET /api/expenses
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.current_company_id;

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

    const result = await pool.query(
      'SELECT * FROM expenses WHERE id = $1 AND user_id = $2',
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
 * Body: { amount, category, description }
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { amount, category, description } = req.body;
    const userId = req.user.id;
    const companyId = req.user.current_company_id;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    if (!category || !['Food', 'Transport', 'Tools', 'Software', 'Other'].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category. Must be: Food, Transport, Tools, Software, or Other'
      });
    }

    const result = await pool.query(
      `INSERT INTO expenses (user_id, company_id, amount, category, description, expense_date)
       VALUES ($1, $2, $3, $4, $5, now())
       RETURNING *`,
      [userId, companyId, amount, category, description || null]
    );

    res.status(201).json({
      success: true,
      expense: result.rows[0],
      message: 'Expense added successfully'
    });
  } catch (err) {
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
