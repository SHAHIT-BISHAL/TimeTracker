import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Menu, X, LogOut as LogOutIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { timeService } from '../services/api';
import ClockInDashboard from './ClockInDashboard';
import ModernManualEntryForm from './ModernManualEntryForm';
import ExpenseEntryModal from './ExpenseEntryModal';
import ModernSettings from './ModernSettings';
import ModernAnalytics from './ModernAnalytics';
import EntriesView from './EntriesView';

/**
 * Main dashboard component
 * Manages navigation between different views and handles clock in/out logic
 */
export default function ModernDashboard() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('clock');
  const [showMenu, setShowMenu] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatus();
    // Refresh status every 2 seconds to keep timer in sync
    const interval = setInterval(fetchStatus, 2000);
    
    // Keyboard shortcuts: Alt+I for Clock In, Alt+O for Clock Out
    const handleKeyPress = (e) => {
      if (e.altKey) {
        if (e.key === 'i' && !isClockedIn) {
          e.preventDefault();
          handleClockIn();
        } else if (e.key === 'o' && isClockedIn) {
          e.preventDefault();
          handleClockOut();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isClockedIn]);

  const fetchStatus = async () => {
    try {
      const response = await timeService.getStatus();
      setIsClockedIn(response.data.isClockedIn);
      setCurrentEntry(response.data.entry);
    } catch (err) {
      console.error('Error fetching status:', err);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNavigate = (view) => {
    if (view === 'entries') {
      setActiveView('entries');
      setShowMenu(false);
    } else if (view === 'expense') {
      setShowExpenseModal(true);
    } else {
      setActiveView(view);
      setShowMenu(false);
    }
  };

  // Render view-specific content
  const renderView = () => {
    switch (activeView) {
      case 'entries':
        return (
          <EntriesView
            onClose={() => setActiveView('clock')}
          />
        );
      case 'analytics':
        return <ModernAnalytics />;
      case 'settings':
        return <ModernSettings />;
      case 'clock':
      default:
        return (
          <ClockInDashboard
            isClockedIn={isClockedIn}
            currentEntry={currentEntry}
            loading={loading}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div className="min-h-screen gradient-bg text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-black/20 border-b border-white/10">
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
            aria-label="Toggle menu"
          >
            {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t border-white/10 bg-black/40 backdrop-blur-md"
          >
            <div className="max-w-4xl mx-auto px-4 py-4 flex gap-2 flex-col">
              {activeView === 'clock' && (
                <>
                  <button
                    onClick={() => handleNavigate('entries')}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm"
                  >
                    📝 View Time Entries
                  </button>
                  <button
                    onClick={() => handleNavigate('expense')}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm"
                  >
                    💰 Add Expense
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setActiveView('analytics');
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm"
              >
                📊 Analytics
              </button>
              <button
                onClick={() => {
                  setActiveView('settings');
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-red-500/20 rounded-lg transition-colors text-sm text-red-300"
              >
                <LogOutIcon className="w-4 h-4 inline mr-2" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {renderView()}
      </main>

      {/* Floating Action Button - Clock In/Out (only on clock view) */}
      {activeView === 'clock' && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={isClockedIn ? handleClockOut : handleClockIn}
          disabled={loading}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-2xl font-bold text-2xl hover:shadow-cyan-500/50 transition-shadow z-30"
          aria-label={isClockedIn ? 'Clock out' : 'Clock in'}
        >
          {isClockedIn ? '🛑' : '✅'}
        </motion.button>
      )}

      {/* Modals */}
      <ExpenseEntryModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onExpenseAdded={() => {
          // Refresh data if needed
        }}
      />
    </div>
  );
}
