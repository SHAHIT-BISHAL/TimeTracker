import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Moon, Sun, Bell, Save } from 'lucide-react';
import './EnhancedSettings.css';

import { getApiUrl } from '../utils/apiUrl.js';

const API_URL = getApiUrl();

export default function EnhancedSettings() {
  const [settings, setSettings] = useState({
    hourly_rate: 0,
    pay_cycle: 'weekly',
    theme: 'light',
    notifications_enabled: true,
    sound_enabled: true,
    default_project: '',
    break_reminder_minutes: 120
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/users/profile`, config);
      setSettings({
        hourly_rate: res.data.hourly_rate || 0,
        pay_cycle: res.data.pay_cycle || 'weekly',
        theme: res.data.theme || 'light',
        notifications_enabled: true,
        sound_enabled: true,
        default_project: res.data.default_project || '',
        break_reminder_minutes: res.data.break_reminder_minutes || 120
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.put(
        `${API_URL}/users/settings`,
        {
          hourly_rate: parseFloat(settings.hourly_rate),
          pay_cycle: settings.pay_cycle,
          theme: settings.theme,
          default_project: settings.default_project,
          break_reminder_minutes: parseInt(settings.break_reminder_minutes)
        },
        config
      );

      // Apply theme
      if (settings.theme === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      localStorage.setItem('theme', settings.theme);

      setMessage('Settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving settings');
      console.error(error);
    }
  };

  const toggleTheme = () => {
    setSettings({
      ...settings,
      theme: settings.theme === 'light' ? 'dark' : 'light'
    });
  };

  if (loading) return <div className="enhanced-settings">Loading settings...</div>;

  return (
    <div className="enhanced-settings">
      <h2>Settings & Preferences</h2>

      {message && <div className="settings-message">{message}</div>}

      <div className="settings-grid">
        {/* Pay & Time Settings */}
        <div className="settings-section">
          <h3>💰 Pay & Time</h3>
          
          <div className="setting-item">
            <label>Hourly Rate ($)</label>
            <input
              type="number"
              step="0.01"
              value={settings.hourly_rate}
              onChange={(e) => setSettings({ ...settings, hourly_rate: e.target.value })}
              placeholder="Enter hourly rate"
            />
          </div>

          <div className="setting-item">
            <label>Pay Cycle</label>
            <select
              value={settings.pay_cycle}
              onChange={(e) => setSettings({ ...settings, pay_cycle: e.target.value })}
            >
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Default Project</label>
            <input
              type="text"
              value={settings.default_project}
              onChange={(e) => setSettings({ ...settings, default_project: e.target.value })}
              placeholder="e.g., Project Alpha"
            />
          </div>

          <div className="setting-item">
            <label>Break Reminder (minutes)</label>
            <input
              type="number"
              value={settings.break_reminder_minutes}
              onChange={(e) => setSettings({ ...settings, break_reminder_minutes: e.target.value })}
              placeholder="120"
            />
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="settings-section">
          <h3>🎨 Appearance</h3>

          <div className="setting-item">
            <label>Theme</label>
            <div className="theme-toggle">
              <button
                className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, theme: 'light' })}
              >
                <Sun size={18} /> Light
              </button>
              <button
                className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, theme: 'dark' })}
              >
                <Moon size={18} /> Dark
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <h3>🔔 Notifications</h3>

          <div className="setting-item checkbox">
            <input
              type="checkbox"
              id="notifications"
              checked={settings.notifications_enabled}
              onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
            />
            <label htmlFor="notifications">Enable Notifications</label>
          </div>

          <div className="setting-item checkbox">
            <input
              type="checkbox"
              id="sound"
              checked={settings.sound_enabled}
              onChange={(e) => setSettings({ ...settings, sound_enabled: e.target.checked })}
            />
            <label htmlFor="sound">Enable Sound Alerts</label>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="settings-section">
          <h3>⌨️ Keyboard Shortcuts</h3>
          <div className="shortcuts-list">
            <div className="shortcut-item">
              <kbd>Alt + I</kbd>
              <span>Clock In</span>
            </div>
            <div className="shortcut-item">
              <kbd>Alt + O</kbd>
              <span>Clock Out</span>
            </div>
            <div className="shortcut-item">
              <kbd>Alt + B</kbd>
              <span>Start Break</span>
            </div>
            <div className="shortcut-item">
              <kbd>Alt + E</kbd>
              <span>End Break</span>
            </div>
          </div>
        </div>
      </div>

      <div className="save-section">
        <button className="save-btn" onClick={saveSettings}>
          <Save size={20} /> Save Settings
        </button>
      </div>
    </div>
  );
}
