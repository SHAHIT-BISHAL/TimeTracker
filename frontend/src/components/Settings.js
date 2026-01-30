import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import './Settings.css';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [hourlyRate, setHourlyRate] = useState('');
  const [payCycle, setPayCycle] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await userService.getProfile();
      setUser(response.data);
      setHourlyRate(response.data.hourly_rate || '');
      setPayCycle(response.data.pay_cycle || 'weekly');
    } catch (err) {
      console.error('Error loading user data:', err);
      setMessage('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      await userService.updateSettings(parseFloat(hourlyRate), payCycle);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-card">
        <h2>Settings</h2>

        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="settings-form">
          <div className="form-group">
            <label>Username</label>
            <input type="text" value={user?.username || ''} disabled />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" value={user?.email || ''} disabled />
          </div>

          <div className="form-group">
            <label htmlFor="hourly-rate">Hourly Rate ($)</label>
            <input
              id="hourly-rate"
              type="number"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="Enter your hourly rate"
            />
          </div>

          <div className="form-group">
            <label htmlFor="pay-cycle">Pay Cycle</label>
            <select value={payCycle} onChange={(e) => setPayCycle(e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <button onClick={handleSave} disabled={saving} className="save-btn">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
