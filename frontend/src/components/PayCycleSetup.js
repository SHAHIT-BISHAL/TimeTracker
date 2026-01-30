import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar } from 'lucide-react';
import './PayCycleSetup.css';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

export default function PayCycleSetup() {
  const [cycleType, setCycleType] = useState('weekly');
  const [customDay, setCustomDay] = useState(15);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/paycycle-setup/config`, config);
      setCycleType(res.data.pay_cycle_type || 'weekly');
      setCustomDay(res.data.custom_day || 15);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching config:', error);
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (cycleType === 'custom' && (!customDay || customDay < 1 || customDay > 31)) {
      setMessage('Custom day must be between 1 and 31');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.post(`${API_URL}/paycycle-setup/setup`, {
        pay_cycle_type: cycleType,
        custom_day: cycleType === 'custom' ? customDay : null
      }, config);

      setMessage('Pay cycle configuration saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error saving configuration');
      console.error(error);
    }
  };

  if (loading) return <div className="pay-cycle-setup">Loading...</div>;

  return (
    <div className="pay-cycle-setup">
      <h3><Calendar size={20} /> Pay Cycle Configuration</h3>

      {message && <div className="setup-message">{message}</div>}

      <div className="cycle-options">
        <div
          className={`option-card ${cycleType === 'weekly' ? 'selected' : ''}`}
          onClick={() => setCycleType('weekly')}
        >
          <input
            type="radio"
            name="cycleType"
            value="weekly"
            checked={cycleType === 'weekly'}
            onChange={(e) => setCycleType(e.target.value)}
          />
          <label>Weekly</label>
          <p className="description">7 days</p>
        </div>

        <div
          className={`option-card ${cycleType === 'fortnightly' ? 'selected' : ''}`}
          onClick={() => setCycleType('fortnightly')}
        >
          <input
            type="radio"
            name="cycleType"
            value="fortnightly"
            checked={cycleType === 'fortnightly'}
            onChange={(e) => setCycleType(e.target.value)}
          />
          <label>Fortnightly</label>
          <p className="description">14 days</p>
        </div>

        <div
          className={`option-card ${cycleType === 'monthly' ? 'selected' : ''}`}
          onClick={() => setCycleType('monthly')}
        >
          <input
            type="radio"
            name="cycleType"
            value="monthly"
            checked={cycleType === 'monthly'}
            onChange={(e) => setCycleType(e.target.value)}
          />
          <label>Monthly</label>
          <p className="description">Month-end</p>
        </div>

        <div
          className={`option-card ${cycleType === 'custom' ? 'selected' : ''}`}
          onClick={() => setCycleType('custom')}
        >
          <input
            type="radio"
            name="cycleType"
            value="custom"
            checked={cycleType === 'custom'}
            onChange={(e) => setCycleType(e.target.value)}
          />
          <label>Custom</label>
          <p className="description">Choose specific day</p>
        </div>
      </div>

      {cycleType === 'custom' && (
        <div className="custom-day-input">
          <label>Pay Cycle End Day (1-31)</label>
          <input
            type="number"
            min="1"
            max="31"
            value={customDay}
            onChange={(e) => setCustomDay(parseInt(e.target.value))}
          />
          <p className="help-text">Your pay cycle will end on the {customDay}<sup>{getOrdinalSuffix(customDay)}</sup> of each month</p>
        </div>
      )}

      <div className="setup-info">
        <h4>Pay Cycle Details</h4>
        <ul>
          <li><strong>Type:</strong> {cycleType.charAt(0).toUpperCase() + cycleType.slice(1)}</li>
          {cycleType === 'custom' && <li><strong>End Day:</strong> {customDay}<sup>{getOrdinalSuffix(customDay)}</sup> of each month</li>}
          <li>Pay cycles are used for calculating earnings and generating reports</li>
          <li>You can generate pay cycle reports anytime</li>
        </ul>
      </div>

      <button className="btn-save-cycle" onClick={handleSetup}>
        Save Configuration
      </button>
    </div>
  );
}

function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}
