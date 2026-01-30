import React, { useState, useEffect } from 'react';
import { timeService, userService, payCycleService } from '../services/api';
import ClockInOut from '../components/ClockInOut';
import PayCycleSummary from '../components/PayCycleSummary';
import Settings from '../components/Settings';
import DashboardStats from '../components/DashboardStats';
import Analytics from '../components/Analytics';
import TimeEntryManager from '../components/TimeEntryManager';
import BreakTracker from '../components/BreakTracker';
import EnhancedSettings from '../components/EnhancedSettings';
import CompanyManager from '../components/CompanyManager';
import PayCycleSetup from '../components/PayCycleSetup';
import EmailSettings from '../components/EmailSettings';
import SetupProfile from '../components/SetupProfile';
import './Dashboard.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Check if profile setup is complete
      if (!parsedUser.profile_setup_complete) {
        setNeedsSetup(true);
      }
    }
    
    // Apply saved theme
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    setLoading(false);
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.altKey) {
        switch (e.key) {
          case 'i':
            e.preventDefault();
            setActiveTab('clock');
            break;
          case 'o':
            e.preventDefault();
            setActiveTab('clock');
            break;
          case 'b':
            e.preventDefault();
            setActiveTab('breaks');
            break;
          case 'a':
            e.preventDefault();
            setActiveTab('analytics');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleSetupComplete = () => {
    // Update user data in localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const updatedUser = JSON.parse(userData);
      updatedUser.profile_setup_complete = true;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    setNeedsSetup(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (needsSetup) {
    return <SetupProfile onSetupComplete={handleSetupComplete} />;
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-content">
          <h1>⏱️ TimeTracker</h1>
          <div className="navbar-actions">
            <span>Welcome, {user?.username}!</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          title="Dashboard"
        >
          📊 Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'clock' ? 'active' : ''}`}
          onClick={() => setActiveTab('clock')}
          title="Alt + I/O"
        >
          🕐 Clock In/Out
        </button>
        <button
          className={`tab ${activeTab === 'breaks' ? 'active' : ''}`}
          onClick={() => setActiveTab('breaks')}
          title="Alt + B"
        >
          ☕ Breaks
        </button>
        <button
          className={`tab ${activeTab === 'entries' ? 'active' : ''}`}
          onClick={() => setActiveTab('entries')}
        >
          📝 Entries
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
          title="Alt + A"
        >
          📈 Analytics
        </button>
        <button
          className={`tab ${activeTab === 'pay' ? 'active' : ''}`}
          onClick={() => setActiveTab('pay')}
        >
          💰 Pay Cycle
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
        <button
          className={`tab ${activeTab === 'companies' ? 'active' : ''}`}
          onClick={() => setActiveTab('companies')}
        >
          🏢 Companies
        </button>
        <button
          className={`tab ${activeTab === 'paycycle-setup' ? 'active' : ''}`}
          onClick={() => setActiveTab('paycycle-setup')}
        >
          📅 Pay Cycle Setup
        </button>
        <button
          className={`tab ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          📧 Email Reminders
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'dashboard' && <DashboardStats />}
        {activeTab === 'clock' && <ClockInOut />}
        {activeTab === 'breaks' && <BreakTracker />}
        {activeTab === 'entries' && <TimeEntryManager />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'pay' && <PayCycleSummary />}
        {activeTab === 'settings' && <EnhancedSettings />}
        {activeTab === 'companies' && <CompanyManager />}
        {activeTab === 'paycycle-setup' && <PayCycleSetup />}
        {activeTab === 'email' && <EmailSettings />}
      </div>
    </div>
  );
}
