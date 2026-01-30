import React, { useState, useEffect } from 'react';
import { payCycleService } from '../services/api';
import './PayCycleSummary.css';

export default function PayCycleSummary() {
  const [payCycle, setPayCycle] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadPayCycleData();
  }, []);

  const loadPayCycleData = async () => {
    setLoading(true);
    try {
      const cycleResponse = await payCycleService.getCurrent();
      setPayCycle(cycleResponse.data);

      const startDate = new Date(cycleResponse.data.start_date);
      const endDate = new Date(cycleResponse.data.end_date);

      const earningsResponse = await payCycleService.calculate(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      setEarnings(earningsResponse.data);

      const messageResponse = await payCycleService.generateMessage(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      setMessage(messageResponse.data.message);
    } catch (err) {
      console.error('Error loading pay cycle:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="loading">Loading pay cycle data...</div>;
  }

  return (
    <div className="pay-cycle-container">
      <div className="pay-cycle-card">
        <h2>Current Pay Cycle</h2>

        {payCycle && (
          <div className="pay-cycle-dates">
            <p>
              <strong>Period:</strong> {new Date(payCycle.start_date).toLocaleDateString()} -{' '}
              {new Date(payCycle.end_date).toLocaleDateString()}
            </p>
          </div>
        )}

        {earnings && (
          <div className="earnings-summary">
            <div className="earning-item">
              <span className="label">Total Hours</span>
              <span className="value">{earnings.total_hours} hrs</span>
            </div>
            <div className="earning-item">
              <span className="label">Hourly Rate</span>
              <span className="value">${earnings.hourly_rate}</span>
            </div>
            <div className="earning-item highlight">
              <span className="label">Total Earnings</span>
              <span className="value">${earnings.total_earnings}</span>
            </div>
          </div>
        )}

        <div className="message-section">
          <h3>Message for Boss</h3>
          <div className="message-box">
            <pre>{message}</pre>
            <button className="copy-btn" onClick={handleCopyMessage}>
              {copied ? '✓ Copied!' : 'Copy Message'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
