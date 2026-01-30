import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Copy, FileText, Mail } from 'lucide-react';
import axios from 'axios';
import './MessagePreview.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * MessagePreview Component
 * Display and manage fortnightly timesheet summary
 */
export default function MessagePreview({
  isOpen,
  onClose,
  forthnightDate,
  companyId,
  companyName,
  companyEmail
}) {
  const [message, setMessage] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview', 'edit', 'send'
  const [recipientEmail, setRecipientEmail] = useState(companyEmail || '');

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (isOpen && companyId) {
      generateMessage();
    }
  }, [isOpen, companyId, forthnightDate]);

  const generateMessage = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.post(
        `${API_URL}/fortnightly/generate-message`,
        { date: forthnightDate, company_id: companyId },
        config
      );

      setMessage(response.data.message);
      setEditedText(response.data.message.text);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate message');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    const text = activeTab === 'edit' ? editedText : message.text;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    // Validation
    if (!recipientEmail || !recipientEmail.trim()) {
      setError('❌ Please enter a recipient email address');
      return;
    }

    if (!recipientEmail.includes('@') || !recipientEmail.includes('.')) {
      setError('❌ Please enter a valid email address');
      return;
    }

    if (!companyId) {
      setError('❌ Company information is missing. Please select a company and try again.');
      return;
    }

    try {
      setSending(true);
      setError('');
      
      const response = await axios.post(
        `${API_URL}/fortnightly/send-email`,
        {
          date: forthnightDate,
          company_id: companyId,
          recipient_email: recipientEmail.trim()
        },
        config
      );

      setSuccess('✅ Email sent successfully to ' + recipientEmail);
      console.log('Email sent:', response.data);
      
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 2500);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to send email. Please check your email settings and try again.';
      setError(`❌ ${errorMsg}`);
      console.error('Email send error:', err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="message-preview-overlay" onClick={onClose}>
      <motion.div
        className="message-preview-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="modal-header">
          <div className="header-title">
            <FileText className="icon" />
            <div>
              <h2>Fortnightly Timesheet Summary</h2>
              <p className="header-subtitle">{companyName}</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X className="icon" />
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Generating timesheet summary...</p>
          </div>
        ) : message ? (
          <>
            <div className="modal-tabs">
              <button
                className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                Preview
              </button>
              <button
                className={`tab ${activeTab === 'edit' ? 'active' : ''}`}
                onClick={() => setActiveTab('edit')}
              >
                Edit
              </button>
              <button
                className={`tab ${activeTab === 'send' ? 'active' : ''}`}
                onClick={() => setActiveTab('send')}
              >
                Send Email
              </button>
            </div>

            <div className="modal-content">
              {activeTab === 'preview' && (
                <div className="preview-content">
                  <div className="html-preview">
                    <iframe
                      srcDoc={message.html}
                      title="Message Preview"
                      sandbox="allow-same-origin"
                    ></iframe>
                  </div>
                  <button
                    className="btn-action btn-copy"
                    onClick={handleCopyToClipboard}
                  >
                    <Copy className="icon" />
                    {copied ? 'Copied!' : 'Copy Message'}
                  </button>
                </div>
              )}

              {activeTab === 'edit' && (
                <div className="edit-content">
                  <label>Edit Message Text</label>
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    rows={15}
                  ></textarea>
                  <button
                    className="btn-action btn-copy"
                    onClick={handleCopyToClipboard}
                  >
                    <Copy className="icon" />
                    {copied ? 'Copied!' : 'Copy Edited Text'}
                  </button>
                </div>
              )}

              {activeTab === 'send' && (
                <div className="send-content">
                  <div className="send-form">
                    <div className="form-group">
                      <label htmlFor="recipient">Recipient Email *</label>
                      <input
                        id="recipient"
                        type="email"
                        placeholder="manager@company.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                    </div>

                    <div className="send-preview">
                      <h4>Email Preview</h4>
                      <div className="email-preview-box">
                        <div className="email-header">
                          <strong>Subject:</strong> {message.subject}
                        </div>
                        <div className="email-body">
                          <p>{message.text.split('\n').slice(0, 5).join('\n')}</p>
                          <p className="more-text">...</p>
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn-action btn-send"
                      onClick={handleSendEmail}
                      disabled={sending || !recipientEmail}
                    >
                      <Send className="icon" />
                      {sending ? 'Sending...' : 'Send Email'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="error-state">
            <p>No message generated. Please try again.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
