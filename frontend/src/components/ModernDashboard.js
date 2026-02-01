import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Menu, X, LogOut as LogOutIcon, Building2, MessageSquare, Mail, FileText, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { timeService } from '../services/api';
import AppHeader from './AppHeader';
import ClockInDashboard from './ClockInDashboard';
import ModernManualEntryForm from './ModernManualEntryForm';
import ExpenseEntryModal from './ExpenseEntryModal';
import ExpensesManager from './ExpensesManager';
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
  const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000`;
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
  
  // Company selection state - Get from CompanyGuard's validated context
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    localStorage.getItem('selectedCompanyId') || null
  );
  const [showCompanySelector, setShowCompanySelector] = useState(false); // Don't force on load, CompanyGuard handles it
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

  // Load company details when selectedCompanyId changes
  useEffect(() => {
    if (selectedCompanyId && !selectedCompany) {
      const loadCompanyDetails = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE}/api/companies/${selectedCompanyId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const company = await response.json();
            setSelectedCompany(company);
          }
        } catch (err) {
          console.error('Error fetching company details:', err);
        }
      };
      loadCompanyDetails();
    }
  }, [selectedCompanyId]);

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
      const response = await fetch(`${API_BASE}/api/users/current-company`, {
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
      const response = await fetch(`${API_BASE}/api/companies/${companyId}`, {
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
            selectedCompanyId={selectedCompanyId}
          />
        );
      case 'expenses':
        return (
          <div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView('clock')}
              className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold flex items-center gap-2"
            >
              ← Back
            </motion.button>
            <ExpensesManager selectedCompanyId={selectedCompanyId} />
          </div>
        );
      case 'analytics':
        return <ModernAnalytics onClose={() => setActiveView('clock')} selectedCompanyId={selectedCompanyId} />;
      case 'settings':
        return <ModernSettings onClose={() => setActiveView('clock')} />;
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
    <div className="min-h-screen">
      {/* Persistent App Header */}
      <AppHeader
        selectedCompany={selectedCompany}
        onSettingsClick={() => handleNavigate('settings')}
        onCompanyClick={() => setShowCompanySelector(true)}
        onMenuClick={() => setShowMenu(!showMenu)}
        showSettings={true}
      />

      {/* Main Content - with padding for fixed header */}
      <main className="pt-20 px-4 sm:px-6 lg:px-8 pb-12 max-w-7xl mx-auto">
        <div className="max-w-5xl mx-auto">
          {renderView()}
        </div>
      </main>

      {/* Navigation Menu */}
      {showMenu && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-16 left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-lg z-40"
        >
          <div className="max-w-4xl mx-auto px-4 py-4 flex gap-2 flex-col">
            {activeView === 'clock' && (
              <>
                <button
                  onClick={() => handleNavigate('entries')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700"
                >
                  📝 View Time Entries
                </button>
                <button
                  onClick={() => {
                    if (!selectedCompanyId) {
                      alert('⚠️ Company Selection Required\n\nPlease select a company before adding manual entries.');
                      setShowCompanySelector(true);
                      setShowMenu(false);
                      return;
                    }
                    setShowManualEntryModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700"
                >
                  ⏱️ Add Manual Entry
                </button>
                <button
                  onClick={() => handleNavigate('expense')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700"
                >
                  💰 Add Expense
                </button>
                <button
                  onClick={() => {
                    if (!selectedCompanyId) {
                      alert('⚠️ Company Selection Required\n\nPlease select a company to view expenses.');
                      setShowCompanySelector(true);
                      setShowMenu(false);
                      return;
                    }
                    setActiveView('expenses');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700"
                >
                  📊 View Expenses
                </button>
                <hr className="border-gray-200 my-2" />
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
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm flex items-center gap-2 text-gray-700"
                >
                  <FileText className="w-4 h-4" />
                  Generate Timesheet
                </button>
                <hr className="border-gray-200 my-2" />
                <button
                  onClick={() => {
                    setShowCompanyModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm flex items-center gap-2 text-gray-700"
                >
                  <Building2 className="w-4 h-4" />
                  Manage Companies
                </button>
                <button
                  onClick={() => {
                    setShowMessagingModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm flex items-center gap-2 text-gray-700"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </button>
                <button
                  onClick={() => {
                    setShowEmailModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm flex items-center gap-2 text-gray-700"
                >
                  <Mail className="w-4 h-4" />
                  Email Settings
                </button>
                <hr className="border-gray-200 my-2" />
              </>
            )}
            <button
              onClick={() => {
                setActiveView('analytics');
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700"
            >
              📊 Analytics
            </button>
          </div>
        </motion.div>
      )}

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

      {/* Manual Entry Modal */}
      {showManualEntryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Add Manual Entry</h2>
              <button
                onClick={() => setShowManualEntryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <ModernManualEntryForm
              onEntryAdded={() => {
                setShowManualEntryModal(false);
                fetchStatus();
              }}
              triggerButton={false}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
