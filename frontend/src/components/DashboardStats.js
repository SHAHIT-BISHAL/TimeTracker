import React, { useState, useEffect } from 'react';
import { timeService, payCycleService, userService } from '../services/api';
import './DashboardStats.css';

export default function DashboardStats() {
  const [stats, setStats] = useState({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
    todayEarnings: 0,
    nextPayDay: null,
    recentEntries: []
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const userData = await userService.getProfile();
      setUser(userData.data);

      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Today's stats
      const todayEntries = await timeService.getEntries(
        startOfToday.toISOString().split('T')[0],
        endOfToday.toISOString().split('T')[0]
      );

      const todayMinutes = todayEntries.data.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
      const todayHours = (todayMinutes / 60).toFixed(2);
      const todayEarnings = (todayHours * userData.data.hourly_rate).toFixed(2);

      // Week stats
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const weekEntries = await timeService.getEntries(
        startOfWeek.toISOString().split('T')[0],
        endOfToday.toISOString().split('T')[0]
      );

      const weekMinutes = weekEntries.data.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
      const weekHours = (weekMinutes / 60).toFixed(2);

      // Month stats
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEntries = await timeService.getEntries(
        startOfMonth.toISOString().split('T')[0],
        endOfToday.toISOString().split('T')[0]
      );

      const monthMinutes = monthEntries.data.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
      const monthHours = (monthMinutes / 60).toFixed(2);

      // Next pay day
      const payCycle = await payCycleService.getCurrent();
      const nextPayDate = new Date(payCycle.data.end_date);
      const daysUntilPay = Math.ceil((nextPayDate - today) / (1000 * 60 * 60 * 24));

      setStats({
        todayHours,
        weekHours,
        monthHours,
        todayEarnings,
        nextPayDay: daysUntilPay > 0 ? daysUntilPay : 0,
        recentEntries: weekEntries.data.slice(0, 5)
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard stats...</div>;
  }

  return (
    <div className="dashboard-stats">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Today</h3>
          <div className="stat-value">{stats.todayHours}h</div>
          <div className="stat-earnings">Earned: ${stats.todayEarnings}</div>
        </div>

        <div className="stat-card">
          <h3>This Week</h3>
          <div className="stat-value">{stats.weekHours}h</div>
          <div className="stat-secondary">avg/day: {(stats.weekHours / 7).toFixed(1)}h</div>
        </div>

        <div className="stat-card">
          <h3>This Month</h3>
          <div className="stat-value">{stats.monthHours}h</div>
          <div className="stat-secondary">Hourly Rate: ${user?.hourly_rate}</div>
        </div>

        <div className="stat-card highlight">
          <h3>Next Pay Day</h3>
          <div className="stat-value">{stats.nextPayDay}d</div>
          <div className="stat-secondary">days remaining</div>
        </div>
      </div>

      <div className="recent-entries">
        <h3>Recent Time Entries</h3>
        <div className="entries-list">
          {stats.recentEntries.length > 0 ? (
            stats.recentEntries.map(entry => (
              <div key={entry.id} className="entry-item">
                <div className="entry-time">
                  {new Date(entry.clock_in).toLocaleString()}
                </div>
                <div className="entry-duration">
                  {entry.duration_minutes ? (entry.duration_minutes / 60).toFixed(2) + 'h' : 'ongoing'}
                </div>
              </div>
            ))
          ) : (
            <p className="no-entries">No entries yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
