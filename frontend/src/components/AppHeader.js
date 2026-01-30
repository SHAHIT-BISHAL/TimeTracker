import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, Building2, LogOut, Menu, X } from 'lucide-react';
import AnimatedClockLogo from './AnimatedClockLogo';
import { getGreeting, formatAEDT } from '../utils/timeUtils';

/**
 * AnimatedTitle Component (Memoized)
 * Renders staggered letter animation for "TimeTracker"
 */
const AnimatedTitle = memo(({ onClick }) => {
  const letters = useMemo(() => ['T', 'i', 'm', 'e', 'T', 'r', 'a', 'c', 'k', 'e', 'r'], []);
  
  return (
    <motion.h1
      className="text-xl font-bold text-gray-900 cursor-pointer tracking-tight"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
    >
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.05 + i * 0.03,
            duration: 0.3,
            ease: [0.34, 1.56, 0.64, 1]
          }}
          className="inline-block"
        >
          {letter}
        </motion.span>
      ))}
    </motion.h1>
  );
});

AnimatedTitle.displayName = 'AnimatedTitle';

/**
 * AppHeader Component (Performance Optimized)
 * Persistent top navigation bar with minimal re-renders
 */
const AppHeader = memo(({ 
  selectedCompany, 
  onSettingsClick,
  onCompanyClick,
  onMenuClick,
  showSettings = true 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(formatAEDT(new Date(), {
        hour: '2-digit',
        minute: '2-digit'
      }));
      setGreeting(getGreeting());
    };

    updateTime();
    // Update every minute instead of every second
    const interval = setInterval(updateTime, 60000);

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

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <AnimatedClockLogo 
              size={48} 
              onClick={handleLogoClick}
            />
            
            <motion.div
              className="flex flex-col gap-0.5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <AnimatedTitle onClick={handleLogoClick} />
              <motion.p
                className="text-xs text-gray-600 hidden sm:block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                {greeting} • {currentTime} AEDT
              </motion.p>
            </motion.div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            {/* Menu Button */}
            {onMenuClick && (
              <motion.button
                onClick={onMenuClick}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Menu size={22} className="text-gray-700" />
              </motion.button>
            )}

            {/* Company Indicator */}
            {selectedCompany && (
              <motion.button
                onClick={onCompanyClick}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200 text-sm font-medium"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                <Building2 size={16} />
                <span className="max-w-[150px] truncate">{selectedCompany.name}</span>
              </motion.button>
            )}

            {/* Settings Button */}
            {showSettings && (
              <motion.button
                onClick={onSettingsClick}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                whileHover={{ scale: 1.05, rotate: 45 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Settings size={22} className="text-gray-700" />
              </motion.button>
            )}

            {/* Logout Button */}
            <motion.button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200 text-sm font-medium"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.3 }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-4 py-3 space-y-2">
              {selectedCompany && (
                <button
                  onClick={() => {
                    onCompanyClick();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <Building2 size={16} />
                  <span className="truncate">{selectedCompany.name}</span>
                </button>
              )}

              {showSettings && (
                <button
                  onClick={() => {
                    onSettingsClick();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
});

AppHeader.displayName = 'AppHeader';

export default AppHeader;
