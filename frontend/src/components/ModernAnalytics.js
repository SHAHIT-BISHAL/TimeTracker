import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;
const COLORS = ['#0ea5e9', '#06b6d4', '#14b8a6', '#f59e0b', '#ef4444'];

export default function ModernAnalytics({ onClose, selectedCompanyId }) {
  const [weeklyData, setWeeklyData] = useState([]);
  const [projectData, setProjectData] = useState([]);
  const [stats, setStats] = useState({ totalHours: 0, avgPerDay: 0, overtimeHours: 0 });
  const [loading, setLoading] = useState(true);

  // Clear analytics data when company changes to prevent showing stale data
  useEffect(() => {
    if (selectedCompanyId) {
      // Reset all data immediately when company changes
      setWeeklyData([]);
      setProjectData([]);
      setStats({ totalHours: 0, avgPerDay: 0, overtimeHours: 0 });
      setLoading(true);
      fetchAnalytics();
    } else {
      // Clear if no company selected
      setWeeklyData([]);
      setProjectData([]);
      setStats({ totalHours: 0, avgPerDay: 0, overtimeHours: 0 });
      setLoading(false);
    }
  }, [selectedCompanyId]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const params = selectedCompanyId ? `?company_id=${selectedCompanyId}` : '';
      const entriesRes = await axios.get(`${API_URL}/time/entries${params}`, config);
      const entries = entriesRes.data;

      processWeeklyData(entries);
      processProjectData(entries);
      processStats(entries);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

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

  const processStats = (entries) => {
    let totalHours = 0;
    let workDays = new Set();

    entries.forEach(e => {
      const date = new Date(e.clock_in).toDateString();
      workDays.add(date);
      totalHours += (e.duration_minutes || 0) / 60;
    });

    const avgPerDay = workDays.size > 0 ? totalHours / workDays.size : 0;
    const overtimeHours = Math.max(0, totalHours - (workDays.size * 8));

    setStats({
      totalHours: parseFloat(totalHours.toFixed(2)),
      avgPerDay: parseFloat(avgPerDay.toFixed(2)),
      overtimeHours: parseFloat(overtimeHours.toFixed(2))
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full"
        />
      </div>
    );
  }

  // Show empty state if no data for selected company
  const hasData = stats.totalHours > 0 || weeklyData.some(d => d.hours > 0);
  
  if (!loading && !hasData) {
    return (
      <div className="min-h-screen gradient-bg text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <motion.button
            onClick={onClose}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </motion.button>
          
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="bg-white/10 rounded-full p-8 mb-6"
            >
              <BarChart3 className="w-20 h-20 text-gray-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-3">No Analytics Data Yet</h2>
            <p className="text-gray-400 text-center max-w-md mb-6">
              Start tracking time for {selectedCompanyId ? 'this company' : 'a company'} to see your productivity analytics and insights.
            </p>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg"
            >
              Go to Dashboard
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const StatCard = ({ icon: Icon, title, value, unit, color }) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5 }}
      className="card group"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-xs sm:text-sm font-semibold mb-2">{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
            {value}
          </p>
          {unit && <p className="text-gray-500 text-xs mt-1">{unit}</p>}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl ${color.replace('bg-', 'bg-').replace('to-', 'to-')}/20 group-hover:scale-110 transition-transform flex-shrink-0 ml-2`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-sky-500" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen gradient-bg text-white py-6 sm:py-12">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Back Button - Mobile First with 44px tap target */}
        <motion.button
          onClick={onClose}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm sm:text-base">Back to Dashboard</span>
        </motion.button>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 sm:space-y-8"
        >
          {/* Header - Mobile First */}
          <motion.div variants={itemVariants} className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex-shrink-0">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Analytics</h1>
              <p className="text-gray-400 text-xs sm:text-sm">Track your productivity</p>
            </div>
          </motion.div>

          {/* Stats Grid - Mobile First (stack on mobile) */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
          >
            <StatCard
              icon={Clock}
              title="Total Hours"
              value={stats.totalHours}
              unit="hours worked"
              color="from-blue-500 to-cyan-500"
            />
            <StatCard
              icon={TrendingUp}
              title="Daily Average"
              value={stats.avgPerDay}
              unit="hours/day"
              color="from-emerald-500 to-teal-500"
            />
            <StatCard
              icon={BarChart3}
              title="Overtime"
              value={stats.overtimeHours}
              unit="hours extra"
              color="from-amber-500 to-orange-500"
            />
          </motion.div>

          {/* Charts Grid - Mobile First (stack on mobile) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Weekly Chart - Mobile responsive */}
            <motion.div
              variants={itemVariants}
              className="card"
            >
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-500" />
                Weekly Hours
              </h2>
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="hours" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Project Distribution - Mobile responsive */}
            {projectData.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="card"
              >
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  Project Distribution
                </h2>
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <PieChart>
                    <Pie
                      data={projectData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}h`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>

          {/* No Data Message */}
          {weeklyData.length === 0 && (
            <motion.div
              variants={itemVariants}
              className="card border-2 border-dashed border-gray-300 text-center py-12"
            >
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-semibold">No data yet</p>
              <p className="text-gray-500 mt-2">Start clocking in to see your analytics</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
