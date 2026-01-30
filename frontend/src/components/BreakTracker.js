import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Square, Coffee } from 'lucide-react';
import './BreakTracker.css';

export default function BreakTracker() {
  const [activeBreak, setActiveBreak] = useState(null);
  const [breaks, setBreaks] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveBreak();
    const interval = setInterval(() => {
      if (activeBreak && activeBreak.break_start) {
        const elapsed = Math.floor((Date.now() - new Date(activeBreak.break_start).getTime()) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBreak]);

  const fetchActiveBreak = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('http://localhost:5000/api/breaks/active', config);
      setActiveBreak(res.data[0] || null);
      if (res.data[0]) {
        const elapsed = Math.floor((Date.now() - new Date(res.data[0].break_start).getTime()) / 1000);
        setElapsedTime(elapsed);
      }
    } catch (error) {
      console.error('Error fetching active break:', error);
    }
  };

  const startBreak = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post('http://localhost:5000/api/breaks/start', {}, config);
      setActiveBreak(res.data);
      setElapsedTime(0);
    } catch (error) {
      console.error('Error starting break:', error);
    } finally {
      setLoading(false);
    }
  };

  const endBreak = async () => {
    if (!activeBreak) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`http://localhost:5000/api/breaks/end/${activeBreak.id}`, {}, config);
      setActiveBreak(null);
      setElapsedTime(0);
      fetchActiveBreak();
    } catch (error) {
      console.error('Error ending break:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="break-tracker">
      <div className="break-header">
        <h2><Coffee size={28} /> Break Tracker</h2>
      </div>

      <div className="break-status">
        {activeBreak ? (
          <div className="break-active">
            <div className="break-indicator">On Break</div>
            <div className="elapsed-time">{formatTime(elapsedTime)}</div>
            <button
              className="end-break-btn"
              onClick={endBreak}
              disabled={loading}
            >
              <Square size={20} /> End Break
            </button>
          </div>
        ) : (
          <div className="break-inactive">
            <div className="break-indicator">Not on Break</div>
            <button
              className="start-break-btn"
              onClick={startBreak}
              disabled={loading}
            >
              <Play size={20} /> Start Break
            </button>
          </div>
        )}
      </div>

      <div className="break-info">
        <p>Breaks are automatically deducted from your working hours.</p>
      </div>
    </div>
  );
}
