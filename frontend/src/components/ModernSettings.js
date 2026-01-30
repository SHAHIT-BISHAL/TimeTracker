import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Moon, Sun, DollarSign, Calendar, Bell, Save, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

export default function ModernSettings() {
  const [settings, setSettings] = useState({
    hourly_rate: 0,
    pay_cycle: 'weekly',
    theme: 'light',
    break_reminder_minutes: 120
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/users/profile`, config);
      setSettings({
        hourly_rate: res.data.hourly_rate || 0,
        pay_cycle: res.data.pay_cycle || 'weekly',
        theme: res.data.theme || 'light',
        break_reminder_minutes: res.data.break_reminder_minutes || 120
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.put(
        `${API_URL}/users/settings`,
        {
          hourly_rate: parseFloat(settings.hourly_rate),
          pay_cycle: settings.pay_cycle,
          theme: settings.theme,
          break_reminder_minutes: parseInt(settings.break_reminder_minutes)
        },
        config
      );

      if (settings.theme === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      localStorage.setItem('theme', settings.theme);

      setMessage('✅ Settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error saving settings');
      setTimeout(() => setMessage(''), 3000);
    }
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

  return (
    <div className="min-h-screen gradient-bg text-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Settings</h1>
              <p className="text-gray-400 text-sm">Customize your experience</p>
            </div>
          </motion.div>

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl flex items-center gap-3 ${
                message.includes('✅')
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50'
                  : 'bg-red-500/20 text-red-200 border border-red-500/50'
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {message}
            </motion.div>
          )}

          {/* Settings Cards */}
          <motion.div variants={itemVariants} className="card space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-amber-500" />
              Pay & Time
            </h2>

            <div className="space-y-4">
              {/* Hourly Rate */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                <label className="block text-gray-700 font-semibold">
                  Hourly Rate ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-3 w-5 h-5 text-amber-500 pointer-events-none" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.hourly_rate}
                    onChange={(e) => setSettings({ ...settings, hourly_rate: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none text-gray-800"
                    placeholder="0.00"
                  />
                </div>
              </motion.div>

              {/* Pay Cycle */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <label className="block text-gray-700 font-semibold">
                  Pay Cycle
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['weekly', 'bi-weekly', 'monthly'].map((option) => (
                    <motion.button
                      key={option}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSettings({ ...settings, pay_cycle: option })}
                      className={`py-3 rounded-xl font-semibold transition-all ${
                        settings.pay_cycle === option
                          ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Break Reminder */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <label className="block text-gray-700 font-semibold">
                  Break Reminder (minutes)
                </label>
                <div className="relative">
                  <Bell className="absolute left-4 top-3 w-5 h-5 text-amber-500 pointer-events-none" />
                  <input
                    type="number"
                    min="30"
                    step="15"
                    value={settings.break_reminder_minutes}
                    onChange={(e) => setSettings({ ...settings, break_reminder_minutes: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all outline-none text-gray-800"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Theme Section */}
          <motion.div variants={itemVariants} className="card space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Sun className="w-6 h-6 text-amber-500" />
              Appearance
            </h2>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
              >
                <label className="block text-gray-700 font-semibold">Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'light', label: '☀️ Light', icon: Sun },
                    { value: 'dark', label: '🌙 Dark', icon: Moon }
                  ].map((theme) => (
                    <motion.button
                      key={theme.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSettings({ ...settings, theme: theme.value })}
                      className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        settings.theme === theme.value
                          ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {theme.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={saveSettings}
            className="w-full btn-primary flex items-center justify-center gap-2 text-lg"
          >
            <Save className="w-5 h-5" />
            Save Settings
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
