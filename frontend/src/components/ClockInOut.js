import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { timeService } from '../services/api';
import './ClockInOut.css';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

export default function ClockInOut() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchCompanies();
    const interval = setInterval(updateElapsedTime, 1000);
    return () => clearInterval(interval);
  }, [currentEntry]);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/companies`, config);
      setCompanies(response.data);
      if (response.data.length > 0) {
        setSelectedCompany(response.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.altKey) {
        if (e.key === 'i' && !isClockedIn) {
          e.preventDefault();
          handleClockIn();
        } else if (e.key === 'o' && isClockedIn) {
          e.preventDefault();
          handleClockOut();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isClockedIn]);

  const fetchStatus = async () => {
    try {
      const response = await timeService.getStatus();
      setIsClockedIn(response.data.isClockedIn);
      setCurrentEntry(response.data.entry);
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  };

  const updateElapsedTime = () => {
    if (currentEntry && currentEntry.clock_in) {
      const clockInTime = new Date(currentEntry.clock_in);
      const now = new Date();
      const diff = Math.floor((now - clockInTime) / 1000);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      setElapsedTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      await timeService.clockIn({ notes, company_id: selectedCompany });
      await fetchStatus();
      setShowForm(false);
      setNotes('');
      // Play sound notification
      playSound();
    } catch (err) {
      console.error('Clock in error:', err);
      alert('Error clocking in: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await timeService.clockOut();
      await fetchStatus();
      setNotes('');
      // Play sound notification
      playSound();
    } catch (err) {
      console.error('Clock out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const playSound = () => {
    // Simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  return (
    <div className="clock-container">
      <div className="clock-card">
        <h2>Clock In/Out</h2>
        <div className="clock-status">
          <div className={`status-indicator ${isClockedIn ? 'active' : 'inactive'}`}></div>
          <span className="status-text">
            {isClockedIn ? 'You are clocked in' : 'You are clocked out'}
          </span>
        </div>

        {isClockedIn && (
          <div className="elapsed-time">
            <p>Time Elapsed</p>
            <p className="time-display">{elapsedTime}</p>
          </div>
        )}

        {!isClockedIn && !showForm && (
          <button
            className="btn btn-clock-in"
            onClick={() => setShowForm(true)}
          >
            ⏱️ Start Work Session
          </button>
        )}

        {showForm && !isClockedIn && (
          <div className="clock-form">
            {companies.length > 1 && (
              <div className="form-group">
                <label>Select Company</label>
                <select
                  value={selectedCompany || ''}
                  onChange={(e) => setSelectedCompany(parseInt(e.target.value))}
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button
                className="btn btn-clock-in"
                onClick={handleClockIn}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Clock In'}
              </button>
              <button
                className="btn btn-cancel"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isClockedIn && (
          <div className="button-group">
            <button
              className="btn btn-clock-out"
              onClick={handleClockOut}
              disabled={loading}
            >
              {loading ? 'Processing...' : '🛑 Clock Out'}
            </button>
          </div>
        )}

        {currentEntry && (
          <div className="last-entry">
            <h3>Current Session</h3>
            <p>Clock In: {new Date(currentEntry.clock_in).toLocaleString()}</p>
            {currentEntry.project && <p>Project: {currentEntry.project}</p>}
            {currentEntry.notes && <p>Notes: {currentEntry.notes}</p>}
            {currentEntry.clock_out && (
              <p>Clock Out: {new Date(currentEntry.clock_out).toLocaleString()}</p>
            )}
            {currentEntry.duration_minutes && (
              <p>Duration: {(currentEntry.duration_minutes / 60).toFixed(2)} hours</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
