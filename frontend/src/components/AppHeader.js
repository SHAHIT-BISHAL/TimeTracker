import React, { useState, useEffect, useMemo, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, Building2, LogOut, Menu, X, ChevronDown } from 'lucide-react';
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
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('');
  const [companyCount, setCompanyCount] = useState(0);
  const [showCompanyHint, setShowCompanyHint] = useState(false);
  const prevCompanyIdRef = useRef(null);

  const dismissCompanyHint = () => {
    setShowCompanyHint(false);
    sessionStorage.setItem('companySwitchHintDismissed', 'true');
  };

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

  useEffect(() => {
    const dismissed = sessionStorage.getItem('companySwitchHintDismissed') === 'true';
    if (dismissed) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const { getApiUrl } = await import('../utils/apiUrl.js');
    const API_URL = getApiUrl();
    fetch(`${API_URL}/companies`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const count = Array.isArray(data) ? data.length : 0;
        setCompanyCount(count);
        if (count > 1) {
          setShowCompanyHint(true);
        }
      })
      .catch(() => {
        // Fail silently to avoid blocking navigation
      });
  }, []);

  useEffect(() => {
    if (!showCompanyHint) return;
    const handleOutsideClick = () => dismissCompanyHint();
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showCompanyHint]);

  useEffect(() => {
    const prevId = prevCompanyIdRef.current;
    if (prevId && selectedCompany?.id && prevId !== selectedCompany.id) {
      dismissCompanyHint();
    }
    prevCompanyIdRef.current = selectedCompany?.id || null;
  }, [selectedCompany]);

  const handleLogoClick = () => {
    navigate('/dashboard');
    setShowMobileMenu(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedCompanyId');
    sessionStorage.removeItem('companySwitchHintDismissed');
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
            {/* Menu Button - Mobile First with 44px tap target */}
            {onMenuClick && (
              <motion.button
                onClick={onMenuClick}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Menu size={20} className="text-gray-700 sm:w-5 sm:h-5" />
              </motion.button>
            )}

            {/* Company Selector - Mobile responsive */}
            {selectedCompany ? (
              <div className="relative">
                <motion.button
                  onClick={() => {
                    setShowCompanyDropdown(!showCompanyDropdown);
                    if (!showCompanyDropdown) {
                      onCompanyClick();
                    }
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 min-h-[44px] bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                >
                  <Building2 size={16} className="flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                  <div className="flex flex-col items-start min-w-[80px] sm:min-w-[140px] max-w-[120px] sm:max-w-[200px]">
                    <span className="text-[10px] sm:text-xs opacity-90 font-normal hidden sm:block">Active Company</span>
                    <span className="truncate font-bold text-xs sm:text-sm">{selectedCompany.name}</span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform flex-shrink-0 sm:w-4 sm:h-4 ${showCompanyDropdown ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* Switch hint - only if multiple companies and not dismissed */}
                <AnimatePresence>
                  {showCompanyHint && companyCount > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="hidden sm:flex absolute right-0 mt-2 text-xs text-gray-700 whitespace-nowrap bg-white px-3 py-2 rounded-lg border border-gray-300 shadow-lg pointer-events-none"
                    >
                      <span>Click to switch company</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissCompanyHint();
                        }}
                        className="ml-2 text-gray-500 hover:text-gray-800 pointer-events-auto"
                        aria-label="Dismiss company switch hint"
                      >
                        ✕
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                onClick={onCompanyClick}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 min-h-[44px] bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all duration-200 text-xs sm:text-sm font-semibold shadow-md animate-pulse"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <Building2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">Select Company</span>
                <span className="sm:hidden">Select</span>
              </motion.button>
            )}

            {/* Settings Button - Mobile First with 44px tap target */}
            {showSettings && (
              <motion.button
                onClick={onSettingsClick}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors duration-200"
                whileHover={{ scale: 1.05, rotate: 45 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Settings size={20} className="text-gray-700 sm:w-5 sm:h-5" />
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
