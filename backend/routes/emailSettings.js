import express from 'express';
import { dbRun, dbGet } from '../server.js';
import { authenticateToken } from '../middleware/auth.js';
import { initializeTransporter, testSMTPConnection } from '../services/emailService.js';

const router = express.Router();

// Get email settings
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    let settings = await dbGet(
      'SELECT * FROM email_settings WHERE user_id = ?',
      [userId]
    );

    if (!settings) {
      // Create default settings
      await dbRun(
        `INSERT INTO email_settings 
         (user_id, reminder_enabled, reminder_before_minutes, reminder_frequency) 
         VALUES (?, false, 60, 'daily')`,
        [userId]
      );
      settings = await dbGet(
        'SELECT * FROM email_settings WHERE user_id = ?',
        [userId]
      );
    }

    // Don't send back actual password
    settings.smtp_password = settings.smtp_password ? '***hidden***' : null;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update email settings
router.put('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const {
    smtp_host,
    smtp_port,
    smtp_user,
    smtp_password,
    reminder_enabled,
    reminder_before_minutes,
    reminder_frequency
  } = req.body;

  try {
    const existingSettings = await dbGet(
      'SELECT * FROM email_settings WHERE user_id = ?',
      [userId]
    );

    if (!existingSettings) {
      // Create new settings
      await dbRun(
        `INSERT INTO email_settings 
         (user_id, smtp_host, smtp_port, smtp_user, smtp_password, reminder_enabled, reminder_before_minutes, reminder_frequency) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, smtp_host || null, smtp_port || null, smtp_user || null, smtp_password || null, reminder_enabled ? true : false, reminder_before_minutes || 60, reminder_frequency || 'daily']
      );
    } else {
      // Update settings, preserve password if not provided
      const passwordToUse = smtp_password && smtp_password !== '***hidden***' ? smtp_password : existingSettings.smtp_password;
      
      await dbRun(
        `UPDATE email_settings 
         SET smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_password = ?, 
             reminder_enabled = ?, reminder_before_minutes = ?, reminder_frequency = ?,
             updated_at = now()
         WHERE user_id = ?`,
        [smtp_host || null, smtp_port || null, smtp_user || null, passwordToUse, reminder_enabled ? true : false, reminder_before_minutes || 60, reminder_frequency || 'daily', userId]
      );
    }

    const settings = await dbGet(
      'SELECT * FROM email_settings WHERE user_id = ?',
      [userId]
    );

    // Initialize email transporter if SMTP settings are complete
    if (settings.smtp_host && settings.smtp_user && settings.smtp_password) {
      initializeTransporter({
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port,
        smtp_user: settings.smtp_user,
        smtp_password: passwordToUse || settings.smtp_password,
        smtp_tls: true
      });
    }

    settings.smtp_password = settings.smtp_password ? '***hidden***' : null;
    res.json({ message: 'Email settings updated', settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test SMTP connection
router.post('/test-connection', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const settings = await dbGet(
      'SELECT * FROM email_settings WHERE user_id = ?',
      [userId]
    );

    if (!settings || !settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
      return res.status(400).json({ error: 'SMTP settings not fully configured' });
    }

    // Initialize and test transporter
    const initialized = initializeTransporter({
      smtp_host: settings.smtp_host,
      smtp_port: settings.smtp_port,
      smtp_user: settings.smtp_user,
      smtp_password: settings.smtp_password,
      smtp_tls: true
    });

    if (!initialized) {
      return res.status(500).json({ error: 'Failed to initialize SMTP connection' });
    }

    // Test the connection
    await testSMTPConnection();

    res.json({
      success: true,
      message: 'SMTP connection test successful',
      host: settings.smtp_host,
      port: settings.smtp_port,
      user: settings.smtp_user
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'SMTP connection test failed',
      details: err.message
    });
  }
});

export default router;
