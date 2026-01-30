import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Lock, CheckCircle } from 'lucide-react';
import './EmailSettings.css';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

export default function EmailSettings() {
  const [settings, setSettings] = useState({
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_password: '',
    reminder_enabled: false,
    reminder_before_minutes: 60,
    reminder_frequency: 'daily'
  });
  const [message, setMessage] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/email-settings`, config);
      setSettings(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching email settings:', error);
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.put(`${API_URL}/email-settings`, settings, config);
      
      setMessage('Email settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error saving settings');
      console.error(error);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.smtp_host) {
      setTestMessage('Please configure SMTP settings first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const res = await axios.post(`${API_URL}/email-settings/test-connection`, {}, config);
      
      setTestMessage('✓ Connection successful!');
      setTimeout(() => setTestMessage(''), 3000);
    } catch (error) {
      setTestMessage('✗ Connection failed. Check your settings.');
      console.error(error);
    }
  };

  if (loading) return <div className="email-settings">Loading...</div>;

  return (
    <div className="email-settings">
      <div className="settings-header">
        <h3><Mail size={20} /> Email Settings</h3>
      </div>

      {message && <div className="settings-message success">{message}</div>}
      {testMessage && <div className={`settings-message ${testMessage.includes('✓') ? 'success' : 'error'}`}>{testMessage}</div>}

      <div className="settings-sections">
        {/* SMTP Configuration */}
        <div className="settings-section">
          <h4>📧 SMTP Configuration</h4>
          
          <div className="form-group">
            <label>SMTP Host</label>
            <input
              type="text"
              placeholder="e.g., smtp.gmail.com"
              value={settings.smtp_host || ''}
              onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
            />
            <p className="help-text">Your email provider's SMTP server address</p>
          </div>

          <div className="form-group">
            <label>SMTP Port</label>
            <input
              type="number"
              placeholder="e.g., 587"
              value={settings.smtp_port || ''}
              onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
            />
            <p className="help-text">Usually 587 (TLS) or 465 (SSL)</p>
          </div>

          <div className="form-group">
            <label>SMTP User (Email)</label>
            <input
              type="email"
              placeholder="your-email@gmail.com"
              value={settings.smtp_user || ''}
              onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>SMTP Password <Lock size={14} /></label>
            <input
              type="password"
              placeholder={settings.smtp_password === '***hidden***' ? '••••••••' : 'Your password'}
              value={settings.smtp_password === '***hidden***' ? '' : (settings.smtp_password || '')}
              onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
            />
            <p className="help-text">For Gmail, use an App Password, not your regular password</p>
          </div>

          <button className="btn-test" onClick={handleTestConnection}>
            Test Connection
          </button>
        </div>

        {/* Reminder Settings */}
        <div className="settings-section">
          <h4>🔔 Reminder Settings</h4>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="reminderEnabled"
              checked={settings.reminder_enabled}
              onChange={(e) => setSettings({ ...settings, reminder_enabled: e.target.checked })}
            />
            <label htmlFor="reminderEnabled">Enable Email Reminders</label>
          </div>

          {settings.reminder_enabled && (
            <>
              <div className="form-group">
                <label>Remind Me Before</label>
                <select
                  value={settings.reminder_before_minutes || 60}
                  onChange={(e) => setSettings({ ...settings, reminder_before_minutes: parseInt(e.target.value) })}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={480}>8 hours</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reminder Frequency</label>
                <select
                  value={settings.reminder_frequency || 'daily'}
                  onChange={(e) => setSettings({ ...settings, reminder_frequency: e.target.value })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="on-event">On Clock Out</option>
                </select>
                <p className="help-text">How often you want to receive reminders</p>
              </div>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="settings-section info-box">
          <h4>💡 Setup Instructions</h4>
          <div className="instructions">
            <h5>For Gmail:</h5>
            <ol>
              <li>Enable 2-factor authentication on your Gmail account</li>
              <li>Create an App Password at <code>myaccount.google.com/apppasswords</code></li>
              <li>Use the app password here (not your regular password)</li>
              <li>SMTP Host: <code>smtp.gmail.com</code></li>
              <li>SMTP Port: <code>587</code></li>
            </ol>

            <h5>For Outlook:</h5>
            <ol>
              <li>SMTP Host: <code>smtp-mail.outlook.com</code></li>
              <li>SMTP Port: <code>587</code></li>
              <li>Use your full email address as the username</li>
            </ol>

            <h5>For Other Providers:</h5>
            <ol>
              <li>Contact your email provider for SMTP settings</li>
              <li>Most providers support TLS on port 587</li>
            </ol>
          </div>
        </div>
      </div>

      <button className="btn-save" onClick={handleSaveSettings}>
        Save Email Settings
      </button>
    </div>
  );
}
