import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, Building2, LogOut, Menu, X } from 'lucide-react';
import AnimatedClockLogo from './AnimatedClockLogo';
import { getGreeting, formatAEDT } from '../utils/timeUtils';

/**
 * AppHeader Component
 * Persistent top navigation bar with:
 * - Animated clock logo (navigates to dashboard)
 * - App name with animation
 * - Selected company indicator
 * - Settings button
 * - Mobile menu
 */
export default function AppHeader({ 
  selectedCompany, 
  onSettingsClick,
  onCompanyClick,
  onMenuClick,
  showSettings = true 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(formatAEDT(new Date(), {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
      setGreeting(getGreeting());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogoClick = () => {
    navigate('/dashboard');
    setShowMobileMenu(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedCompanyId');
    navigate('/login');
  };

  const isOnDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard-full';

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <AnimatedClockLogo 
              size={50} 
              onClick={handleLogoClick}
              className="transition-transform hover:scale-105"
            />
            
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.h1
                className="text-xl font-bold text-gray-900 cursor-pointer"
                onClick={handleLogoClick}
                whileHover={{ scale: 1.02 }}
              >
                {/* Staggered letter animation */}
                {['T', 'i', 'm', 'e', 'T', 'r', 'a', 'c', 'k', 'e', 'r'].map((letter, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.3 + i * 0.05,
                      duration: 0.3,
                      ease: 'easeOut'
                    }}
                    className="inline-block"
                  >
                    {letter}
                  </motion.span>
                ))}
              </motion.h1>
              <motion.p
                className="text-xs text-gray-600 hidden sm:block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                {greeting} • {currentTime} AEDT
              </motion.p>
            </motion.div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {/* Menu Button */}
            {onMenuClick && (
              <motion.button
                onClick={onMenuClick}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Menu size={24} className="text-gray-700" />
              </motion.button>
            )}

            {/* Company Indicator */}
            {selectedCompany && (
              <motion.button
                onClick={onCompanyClick}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <Building2 size={18} />
                <span className="font-medium">{selectedCompany.name}</span>
              </motion.button>
            )}

            {/* Settings Button */}
            {showSettings && (
              <motion.button
                onClick={onSettingsClick}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <Settings size={24} className="text-gray-700" />
              </motion.button>
            )}

            {/* Logout Button */}
            <motion.button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              <LogOut size={18} />
              <span className="font-medium">Logout</span>
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            className="md:hidden bg-white border-t border-gray-200"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 py-4 space-y-3">
              {selectedCompany && (
                <button
                  onClick={() => {
                    onCompanyClick();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Building2 size={18} />
                  <span className="font-medium">{selectedCompany.name}</span>
                </button>
              )}

              {showSettings && (
                <button
                  onClick={() => {
                    onSettingsClick();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Settings size={18} />
                  <span className="font-medium">Settings</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
