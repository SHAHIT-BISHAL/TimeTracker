import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Analytics.css';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

export default function Analytics() {
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [projectData, setProjectData] = useState([]);
  const [overtimeData, setOvertimeData] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch all entries for analysis
        const entriesRes = await axios.get(`${API_URL}/time/entries`, config);
        const entries = entriesRes.data;

        processWeeklyData(entries);
        processMonthlyData(entries);
        processProjectData(entries);
        processOvertimeData(entries);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const processWeeklyData = (entries) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map((day, idx) => {
      const dayEntries = entries.filter(e => {
        const date = new Date(e.clock_in);
        return date.getDay() === (idx + 1) % 7;
      });
      const hours = dayEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60;
      return { day, hours: parseFloat(hours.toFixed(2)) };
    });
    setWeeklyData(data);
  };

  const processMonthlyData = (entries) => {
    const monthData = {};
    entries.forEach(e => {
      const date = new Date(e.clock_in);
      const week = Math.ceil(date.getDate() / 7);
      const key = `Week ${week}`;
      if (!monthData[key]) monthData[key] = 0;
      monthData[key] += (e.duration_minutes || 0) / 60;
    });

    const data = Object.entries(monthData).map(([week, hours]) => ({
      week,
      hours: parseFloat(hours.toFixed(2))
    }));
    setMonthlyData(data);
  };

  const processProjectData = (entries) => {
    const projects = {};
    entries.forEach(e => {
      const project = e.project || 'Unassigned';
      if (!projects[project]) projects[project] = 0;
      projects[project] += (e.duration_minutes || 0) / 60;
    });

    const data = Object.entries(projects).map(([name, hours]) => ({
      name,
      value: parseFloat(hours.toFixed(2))
    }));
    setProjectData(data);
  };

  const processOvertimeData = (entries) => {
    let totalHours = 0;
    let workDays = new Set();

    entries.forEach(e => {
      const date = new Date(e.clock_in).toDateString();
      workDays.add(date);
      totalHours += (e.duration_minutes || 0) / 60;
    });

    const avgPerDay = workDays.size > 0 ? totalHours / workDays.size : 0;
    const overtimeHours = Math.max(0, totalHours - (workDays.size * 8));

    setOvertimeData({
      totalHours: parseFloat(totalHours.toFixed(2)),
      avgPerDay: parseFloat(avgPerDay.toFixed(2)),
      overtimeHours: parseFloat(overtimeHours.toFixed(2)),
      workDays: workDays.size
    });
  };

  if (loading) return <div className="analytics-container"><p>Loading analytics...</p></div>;

  return (
    <div className="analytics-container">
      <h2>Analytics Dashboard</h2>

      {overtimeData && (
        <div className="overtime-summary">
          <div className="overtime-card">
            <h3>Total Hours</h3>
            <p className="large-number">{overtimeData.totalHours}</p>
          </div>
          <div className="overtime-card">
            <h3>Avg Per Day</h3>
            <p className="large-number">{overtimeData.avgPerDay}</p>
          </div>
          <div className="overtime-card highlight">
            <h3>Overtime Hours</h3>
            <p className="large-number">{overtimeData.overtimeHours}</p>
          </div>
          <div className="overtime-card">
            <h3>Work Days</h3>
            <p className="large-number">{overtimeData.workDays}</p>
          </div>
        </div>
      )}

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Weekly Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="hours" stroke="#667eea" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Monthly Progression</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="hours" fill="#764ba2" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {projectData.length > 0 && (
          <div className="chart-container">
            <h3>Hours by Project</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}h`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
