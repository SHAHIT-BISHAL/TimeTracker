import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Menu, X, LogOut as LogOutIcon, Building2, MessageSquare, Mail, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { timeService } from '../services/api';
import ClockInDashboard from './ClockInDashboard';
import ModernManualEntryForm from './ModernManualEntryForm';
import ExpenseEntryModal from './ExpenseEntryModal';
import ModernSettings from './ModernSettings';
import ModernAnalytics from './ModernAnalytics';
import EntriesView from './EntriesView';
import CompanyManager from './CompanyManager';
import MessagingCenter from './MessagingCenter';
import EmailSettingsModal from './EmailSettingsModal';
import CompanySelector from './CompanySelector';
import MessagePreview from './MessagePreview';

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
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  // Company selection state
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    localStorage.getItem('selectedCompanyId') || null
  );
  const [showCompanySelector, setShowCompanySelector] = useState(!selectedCompanyId);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showMessagePreview, setShowMessagePreview] = useState(false);
  
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
    if (!selectedCompanyId) {
      alert('⚠️ Company Selection Required\n\nPlease select a company before clocking in. This ensures your time is tracked correctly.');
      setShowCompanySelector(true);
      return;
    }
    
    setLoading(true);
    try {
      const response = await timeService.clockIn({ company_id: selectedCompanyId });
      await fetchStatus();
      
      // Show success message
      if (response.data?.success) {
        // Optional: Add a toast notification here
        console.log('✅ Successfully clocked in');
      }
    } catch (err) {
      console.error('Clock in error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to clock in. Please try again.';
      const errorCode = err.response?.data?.code;
      
      if (errorCode === 'NO_COMPANY_SELECTED' || errorCode === 'INVALID_COMPANY') {
        alert(`⚠️ Company Issue\n\n${errorMessage}\n\nPlease select a valid company.`);
        setShowCompanySelector(true);
      } else if (errorCode === 'ALREADY_CLOCKED_IN') {
        alert(`⏰ Already Clocked In\n\n${errorMessage}`);
      } else {
        alert(`❌ Error\n\n${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      const response = await timeService.clockOut();
      await fetchStatus();
      
      // Show duration summary
      if (response.data?.duration) {
        const { display } = response.data.duration;
        console.log(`✅ Clocked out successfully. Session duration: ${display}`);
        // Optional: Add a toast notification with duration
      }
    } catch (err) {
      console.error('Clock out error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to clock out. Please try again.';
      const errorCode = err.response?.data?.code;
      
      if (errorCode === 'NO_ACTIVE_ENTRY') {
        alert(`⚠️ No Active Session\n\n${errorMessage}`);
      } else if (errorCode === 'NO_COMPANY_SELECTED') {
        alert(`⚠️ Company Issue\n\n${errorMessage}\n\nPlease select a company.`);
        setShowCompanySelector(true);
      } else {
        alert(`❌ Error\n\n${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleCompanySelect = async (companyId) => {
    setSelectedCompanyId(companyId);
    localStorage.setItem('selectedCompanyId', companyId);
    setShowCompanySelector(false);
    
    // Update user's current_company_id in backend
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/current-company`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ company_id: companyId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update current company');
      }
    } catch (err) {
      console.error('Error updating current company:', err);
      alert('⚠️ Company selection saved locally, but failed to sync with server.\n\nYour selection will work, but may not persist across devices.');
    }
    
    // Fetch company details
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const company = await response.json();
        setSelectedCompany(company);
        console.log(`✅ Company selected: ${company.name}`);
      }
    } catch (err) {
      console.error('Error fetching company details:', err);
      // Non-critical error, continue anyway
    }
  };

  const handleNavigate = (view) => {
    if (view === 'entries') {
      setActiveView('entries');
      setShowMenu(false);
    } else if (view === 'expense') {
      if (!selectedCompanyId) {
        alert('⚠️ Company Selection Required\n\nPlease select a company before adding expenses.\n\nThis ensures expenses are tracked to the correct client.');
        setShowCompanySelector(true);
        return;
      }
      setShowExpenseModal(true);
      setShowMenu(false);
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
            isLocked={!selectedCompanyId}
            selectedCompany={selectedCompany}
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
                  <hr className="border-white/10 my-2" />
                  <button
                    onClick={() => {
                      setShowCompanySelector(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <Building2 className="w-4 h-4" />
                    {selectedCompany ? `Company: ${selectedCompany.name}` : 'Select Company'}
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedCompanyId) {
                        alert('Please select a company first');
                        setShowCompanySelector(true);
                        setShowMenu(false);
                        return;
                      }
                      setShowMessagePreview(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Generate Timesheet
                  </button>
                  <hr className="border-white/10 my-2" />
                  <button
                    onClick={() => {
                      setShowCompanyModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <Building2 className="w-4 h-4" />
                    Manage Companies
                  </button>
                  <button
                    onClick={() => {
                      setShowMessagingModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Messages
                  </button>
                  <button
                    onClick={() => {
                      setShowEmailModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email Settings
                  </button>
                  <hr className="border-white/10 my-2" />
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
        companyId={selectedCompanyId}
      />
      
      <CompanyManager
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        onCompanyChanged={() => {
          // Refresh data if needed
          setShowCompanyModal(false);
        }}
      />
      
      <MessagingCenter
        isOpen={showMessagingModal}
        onClose={() => setShowMessagingModal(false)}
      />
      
      <EmailSettingsModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
      
      <CompanySelector
        isOpen={showCompanySelector}
        onClose={() => {
          if (selectedCompanyId) {
            setShowCompanySelector(false);
          }
        }}
        selectedCompanyId={selectedCompanyId}
        onCompanySelect={handleCompanySelect}
        isLocked={!selectedCompanyId}
      />
      
      <MessagePreview
        isOpen={showMessagePreview}
        onClose={() => setShowMessagePreview(false)}
        forthnightDate={new Date()}
        companyId={selectedCompanyId}
        companyName={selectedCompany?.name}
        companyEmail={selectedCompany?.manager_email}
      />
    </div>
  );
}
