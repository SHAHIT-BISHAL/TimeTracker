import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, BarChart3, FileText, Settings as SettingsIcon } from 'lucide-react';
import AnimatedTimer from './AnimatedTimer';

/**
 * Clock In/Out dashboard component
 * Primary UI for time tracking with large timer and action buttons
 * Extracted from ModernDashboard for cleaner component hierarchy
 */
export default function ClockInDashboard({
  isClockedIn,
  currentEntry,
  loading,
  onClockIn,
  onClockOut,
  onNavigate
}) {
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

  const navigationCards = [
    {
      icon: FileText,
      title: 'Manual Entries',
      description: 'Log past work sessions',
      color: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-400/30',
      action: 'entries',
      iconColor: 'text-blue-400'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'View your work stats',
      color: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-400/30',
      action: 'analytics',
      iconColor: 'text-purple-400'
    },
    {
      icon: SettingsIcon,
      title: 'Settings',
      description: 'Configure your account',
      color: 'from-amber-500/10 to-orange-500/10',
      borderColor: 'border-amber-400/30',
      action: 'settings',
      iconColor: 'text-amber-400'
    }
  ];

  return (
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
        <motion.div variants={itemVariants} className="mb-8">
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

        {/* Animated Timer */}
        <motion.div variants={itemVariants} className="mb-12 w-full flex justify-center">
          <AnimatedTimer
            clockInTime={currentEntry?.clock_in}
            isActive={isClockedIn}
          />
        </motion.div>

        {/* Primary Action Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(14, 165, 233, 0.6)' }}
          whileTap={{ scale: 0.95 }}
          onClick={isClockedIn ? onClockOut : onClockIn}
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
            {loading ? '⏳ Processing...' : isClockedIn ? '🛑 Clock Out' : '✅ Clock In'}
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
                <span className="font-semibold">
                  {new Date(currentEntry.clock_in).toLocaleTimeString()}
                </span>
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

      {/* Navigation Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {navigationCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.action}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate(card.action)}
              className={`card-hover bg-gradient-to-br ${card.color} border ${card.borderColor} group`}
            >
              <Icon className={`w-8 h-8 ${card.iconColor} mb-3 group-hover:scale-110 transition-transform`} />
              <h3 className="font-semibold text-gray-800 text-left">{card.title}</h3>
              <p className="text-xs text-gray-600 mt-1">{card.description}</p>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
