import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, LogIn, LogOut, Menu, Settings, BarChart3, FileText } from 'lucide-react';
import { timeService } from '../services/api';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

export default function ModernDashboard() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('clock');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(updateElapsedTime, 1000);
    return () => clearInterval(interval);
  }, [currentEntry]);

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
      await timeService.clockIn({});
      await fetchStatus();
    } catch (err) {
      console.error('Clock in error:', err);
      alert('Error clocking in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await timeService.clockOut();
      await fetchStatus();
    } catch (err) {
      console.error('Clock out error:', err);
      alert('Error clocking out');
    } finally {
      setLoading(false);
    }
  };

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

  const pulseVariants = {
    pulse: {
      scale: [1, 1.02, 1],
      transition: { duration: 2, repeat: Infinity }
    }
  };

  const timerVariants = {
    animate: {
      scale: [1, 1.01, 1],
      transition: { duration: 2, repeat: Infinity }
    }
  };

  return (
    <div className="min-h-screen gradient-bg text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-xl">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">TimeTracker</h1>
              <p className="text-xs text-gray-300">Stay productive</p>
            </div>
          </motion.div>
          
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Primary Clock In/Out Section */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col items-center justify-center min-h-[600px] py-12"
          >
            {/* Status Badge */}
            <motion.div 
              variants={itemVariants}
              className="mb-8"
            >
              <motion.div 
                animate={isClockedIn ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: isClockedIn ? Infinity : 0 }}
                className={`px-6 py-3 rounded-full font-semibold text-center ${
                  isClockedIn 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/50' 
                    : 'bg-gradient-to-r from-gray-600 to-gray-700'
                }`}
              >
                {isClockedIn ? '⏱️ You are clocked in' : '😴 You are clocked out'}
              </motion.div>
            </motion.div>

            {/* Large Timer Display */}
            <motion.div 
              variants={itemVariants}
              animate={isClockedIn ? timerVariants.animate : {}}
              className="mb-12"
            >
              <div className={`text-8xl font-bold font-mono tracking-wider ${
                isClockedIn 
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent' 
                  : 'text-gray-400'
              }`}>
                {isClockedIn ? elapsedTime : '00:00:00'}
              </div>
              <p className="text-gray-400 text-center mt-4 text-sm">
                {isClockedIn ? 'Time elapsed' : 'Ready to start work'}
              </p>
            </motion.div>

            {/* Primary Action Button */}
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(14, 165, 233, 0.6)' }}
              whileTap={{ scale: 0.95 }}
              onClick={isClockedIn ? handleClockOut : handleClockIn}
              disabled={loading}
              className={`min-w-[280px] py-6 rounded-3xl font-bold text-xl mb-8 transition-all duration-300 shadow-2xl ${
                isClockedIn
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:shadow-red-500/50 text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-emerald-500/50 text-white'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 0.5, repeat: loading ? Infinity : 0 }}
              >
                {loading ? '⏳ Processing...' : (isClockedIn ? '🛑 Clock Out' : '✅ Clock In')}
              </motion.div>
            </motion.button>

            {/* Current Session Info */}
            {isClockedIn && currentEntry && (
              <motion.div 
                variants={itemVariants}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card w-full max-w-md"
              >
                <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-500" />
                  Current Session
                </h3>
                <div className="space-y-3 text-gray-700 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Started at</span>
                    <span className="font-semibold">{new Date(currentEntry.clock_in).toLocaleTimeString()}</span>
                  </div>
                  {currentEntry.notes && (
                    <div className="py-2">
                      <p className="text-gray-600 mb-1">Notes</p>
                      <p className="font-semibold italic">{currentEntry.notes}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Secondary Navigation Cards */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('entries')}
              className="card-hover bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 group"
            >
              <FileText className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-800 text-left">Manual Entries</h3>
              <p className="text-xs text-gray-600 mt-1">Log past work sessions</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('analytics')}
              className="card-hover bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 group"
            >
              <BarChart3 className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-800 text-left">Analytics</h3>
              <p className="text-xs text-gray-600 mt-1">View your work stats</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('settings')}
              className="card-hover bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/30 group"
            >
              <Settings className="w-8 h-8 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-800 text-left">Settings</h3>
              <p className="text-xs text-gray-600 mt-1">Configure your account</p>
            </motion.button>
          </motion.div>
        </motion.div>
      </main>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={isClockedIn ? handleClockOut : handleClockIn}
        disabled={loading}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-2xl font-bold text-2xl hover:shadow-cyan-500/50 transition-shadow"
      >
        {isClockedIn ? '🛑' : '✅'}
      </motion.button>
    </div>
  );
}
