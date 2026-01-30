import express from 'express';
import { pool } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get all team messages for a company
 * GET /api/messages/team
 */
router.get('/team', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.current_company_id;

    const result = await pool.query(
      `SELECT m.*, u.username, u.email 
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.company_id = $1 AND m.is_team_message = true
       ORDER BY m.created_at DESC
       LIMIT 100`,
      [companyId]
    );

    res.json({
      success: true,
      messages: result.rows
    });
  } catch (err) {
    console.error('Error fetching team messages:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

/**
 * Get direct messages between two users
 * GET /api/messages/direct/:recipientId
 */
router.get('/direct/:recipientId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const recipientId = parseInt(req.params.recipientId);
    const companyId = req.user.current_company_id;

    const result = await pool.query(
      `SELECT m.*, u.username, u.email 
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.company_id = $1 
       AND m.is_team_message = false
       AND ((m.sender_id = $2 AND m.recipient_id = $3) OR (m.sender_id = $3 AND m.recipient_id = $2))
       ORDER BY m.created_at DESC
       LIMIT 100`,
      [companyId, userId, recipientId]
    );

    res.json({
      success: true,
      messages: result.rows.reverse()
    });
  } catch (err) {
    console.error('Error fetching direct messages:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

/**
 * Send a team message
 * POST /api/messages/team
 * Body: { content }
 */
router.post('/team', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;
    const companyId = req.user.current_company_id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, company_id, is_team_message, content)
       VALUES ($1, $2, true, $3)
       RETURNING *`,
      [userId, companyId, content]
    );

    res.status(201).json({
      success: true,
      message: result.rows[0]
    });
  } catch (err) {
    console.error('Error sending team message:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

/**
 * Send a direct message
 * POST /api/messages/direct
 * Body: { recipientId, content }
 */
router.post('/direct', authenticateToken, async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const userId = req.user.id;
    const companyId = req.user.current_company_id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, company_id, recipient_id, is_team_message, content)
       VALUES ($1, $2, $3, false, $4)
       RETURNING *`,
      [userId, companyId, recipientId, content]
    );

    res.status(201).json({
      success: true,
      message: result.rows[0]
    });
  } catch (err) {
    console.error('Error sending direct message:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

/**
 * Mark message as read
 * PUT /api/messages/:id/read
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const messageId = req.params.id;

    const result = await pool.query(
      `UPDATE messages SET read = true WHERE id = $1 RETURNING *`,
      [messageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: result.rows[0]
    });
  } catch (err) {
    console.error('Error marking message as read:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update message'
    });
  }
});

/**
 * Delete a message
 * DELETE /api/messages/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    const result = await pool.query(
      `DELETE FROM messages WHERE id = $1 AND sender_id = $2 RETURNING id`,
      [messageId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Message not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
});

export default router;
