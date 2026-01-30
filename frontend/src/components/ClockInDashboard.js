import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, BarChart3, FileText, Settings as SettingsIcon, Lock } from 'lucide-react';
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
  onNavigate,
  isLocked = false,
  selectedCompany = null
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
      className="space-y-6 sm:space-y-8"
    >
      {/* Locked State Warning */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-sm"
        >
          <Lock className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800 text-sm">Company Selection Required</h3>
            <p className="text-sm text-red-600">Please select a company before tracking time</p>
          </div>
        </motion.div>
      )}
      
      {/* Selected Company Display */}
      {!isLocked && selectedCompany && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 rounded-xl p-4 flex items-center gap-3 shadow-sm"
        >
          <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-emerald-800 text-sm">Tracking for: {selectedCompany.name}</h3>
            {selectedCompany.pay_rate > 0 && (
              <p className="text-sm text-emerald-600">${selectedCompany.pay_rate}/hour</p>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Primary Clock In/Out Section */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col items-center justify-center py-8 sm:py-12"
      >
        {/* Status Badge */}
        <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
          <motion.div
            animate={isClockedIn ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 3, repeat: isClockedIn ? Infinity : 0, ease: 'easeInOut' }}
            className={`px-5 py-2.5 rounded-full font-semibold text-sm text-white shadow-lg ${
              isClockedIn
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-gray-600 to-gray-700'
            }`}
          >
            {isClockedIn ? '⏱️ You are clocked in' : '😴 You are clocked out'}
          </motion.div>
        </motion.div>

        {/* Animated Timer */}
        <motion.div variants={itemVariants} className="mb-8 sm:mb-12 w-full flex justify-center">
          <AnimatedTimer
            clockInTime={currentEntry?.clock_in}
            isActive={isClockedIn}
          />
        </motion.div>

        {/* Primary Action Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: isLocked ? 1 : 1.03, boxShadow: isLocked ? undefined : '0 20px 40px rgba(14, 165, 233, 0.4)' }}
          whileTap={{ scale: isLocked ? 1 : 0.97 }}
          onClick={isClockedIn ? onClockOut : onClockIn}
          disabled={loading || isLocked}
          className={`min-w-[240px] sm:min-w-[280px] py-5 sm:py-6 rounded-2xl font-bold text-lg sm:text-xl mb-6 sm:mb-8 transition-all duration-300 shadow-xl ${
            isLocked
              ? 'bg-gray-400 cursor-not-allowed opacity-60'
              : isClockedIn
              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <motion.div
            animate={loading ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 0.6, repeat: loading ? Infinity : 0, ease: 'easeInOut' }}
          >
            {isLocked ? '🔒 Locked - Select Company' : loading ? '⏳ Processing...' : isClockedIn ? '🛑 Clock Out' : '✅ Clock In'}
          </motion.div>
        </motion.button>

        {/* Current Session Info */}
        {isClockedIn && currentEntry && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-gray-200 w-full max-w-md"
          >
            <h3 className="text-gray-800 font-semibold mb-3 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-sky-500" />
              Current Session
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Started at</span>
                <span className="font-semibold text-gray-800">
                  {new Date(currentEntry.clock_in).toLocaleTimeString()}
                </span>
              </div>
              {currentEntry.notes && (
                <div className="py-2">
                  <p className="text-gray-600 mb-1">Notes</p>
                  <p className="font-medium text-gray-800 italic">{currentEntry.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Navigation Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      >
        {navigationCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.action}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(card.action)}
              className={`bg-white/90 backdrop-blur-sm rounded-xl p-5 shadow-md hover:shadow-lg border border-gray-200 transition-all duration-200 text-left group`}
            >
              <Icon className={`w-7 h-7 ${card.iconColor} mb-3 group-hover:scale-110 transition-transform duration-200`} />
              <h3 className="font-semibold text-gray-800 text-base">{card.title}</h3>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{card.description}</p>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
