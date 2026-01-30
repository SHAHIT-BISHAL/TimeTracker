/**
 * Email service for sending timesheet summaries via SMTP
 */

import nodemailer from 'nodemailer';

let transporter = null;

/**
 * Initialize SMTP transporter with settings
 * @param {object} settings - SMTP settings
 * @param {string} settings.smtp_host
 * @param {number} settings.smtp_port
 * @param {string} settings.smtp_user
 * @param {string} settings.smtp_password
 * @param {boolean} settings.smtp_tls
 * @returns {boolean} True if initialized successfully
 */
export function initializeTransporter(settings) {
  try {
    if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
      throw new Error('Missing required SMTP settings');
    }

    transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port || 587,
      secure: settings.smtp_tls === 'true' || settings.smtp_tls === true, // true for 465, false for other ports
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_password
      }
    });

    return true;
  } catch (err) {
    console.error('Failed to initialize email transporter:', err);
    return false;
  }
}

/**
 * Test SMTP connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testSMTPConnection() {
  if (!transporter) {
    throw new Error('Email transporter not initialized. Configure SMTP settings first.');
  }

  try {
    await transporter.verify();
    return true;
  } catch (err) {
    console.error('SMTP connection test failed:', err);
    throw err;
  }
}

/**
 * Send timesheet email
 * @param {object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.text - Plain text body
 * @param {string} params.html - HTML body
 * @param {string} params.from - Sender email (optional, uses SMTP user)
 * @returns {Promise<object>} Email send result
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  from
}) {
  if (!transporter) {
    throw new Error('Email transporter not initialized. Configure SMTP settings first.');
  }

  if (!to) {
    throw new Error('Recipient email address is required');
  }

  try {
    const info = await transporter.sendMail({
      from: from || transporter.options.auth.user,
      to,
      subject,
      text,
      html
    });

    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (err) {
    console.error('Failed to send email:', err);
    throw err;
  }
}

/**
 * Send timesheet summary email
 * @param {object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.text - Plain text message
 * @param {string} params.html - HTML formatted message
 * @returns {Promise<object>} Send result
 */
export async function sendTimesheetEmail({
  to,
  subject,
  text,
  html
}) {
  return sendEmail({
    to,
    subject,
    text,
    html
  });
}

/**
 * Get current transporter configuration (sanitized)
 * @returns {object} Configuration without sensitive data
 */
export function getTransporterConfig() {
  if (!transporter) {
    return null;
  }

  return {
    host: transporter.options.host,
    port: transporter.options.port,
    secure: transporter.options.secure,
    user: transporter.options.auth.user
  };
}

/**
 * Check if email service is configured
 * @returns {boolean}
 */
export function isConfigured() {
  return transporter !== null;
}
