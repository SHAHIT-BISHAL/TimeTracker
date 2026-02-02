import React, { useState } from 'react';
import axios from 'axios';
import { Plus, X } from 'lucide-react';
import './ManualEntryForm.css';

import { getApiUrl } from '../utils/apiUrl.js';

const API_URL = getApiUrl();

export default function ManualEntryForm({ onEntryAdded }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clock_in: '',
    clock_out: '',
    notes: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddEntry = async (e) => {
    e.preventDefault();

    if (!formData.clock_in || !formData.clock_out) {
      setMessage('Please enter both clock in and clock out times');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.post(`${API_URL}/manual-entries`, formData, config);
      
      setMessage('Entry added successfully');
      setFormData({ clock_in: '', clock_out: '', notes: '' });
      setShowForm(false);
      setTimeout(() => setMessage(''), 3000);
      
      if (onEntryAdded) onEntryAdded();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error adding entry');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manual-entry-form">
      {!showForm ? (
        <button className="btn-add-entry" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Add Manual Entry
        </button>
      ) : (
        <div className="form-container">
          <div className="form-header">
            <h3>Add Manual Time Entry</h3>
            <button className="btn-close" onClick={() => setShowForm(false)}>
              <X size={20} />
            </button>
          </div>

          {message && <div className="entry-message">{message}</div>}

          <form onSubmit={handleAddEntry}>
            <div className="form-group">
              <label>Clock In *</label>
              <input
                type="datetime-local"
                value={formData.clock_in}
                onChange={(e) => setFormData({ ...formData, clock_in: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Clock Out *</label>
              <input
                type="datetime-local"
                value={formData.clock_out}
                onChange={(e) => setFormData({ ...formData, clock_out: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                placeholder="Add notes about this work session"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Entry'}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
