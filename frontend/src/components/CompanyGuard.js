import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Building2, Loader } from 'lucide-react';
import CompanySelector from './CompanySelector';
import CompanyManager from './CompanyManager';
import { useActiveCompany } from '../contexts/CompanyContext';

import { getApiUrl } from '../utils/apiUrl.js';

const API_URL = getApiUrl();

/**
 * CompanyGuard - Ensures user has selected a company before accessing protected routes
 * Flow:
 * 1. Check if user has companies
 * 2. If no companies exist, force company creation
 * 3. If companies exist but none selected, show company selector
 * 4. If company selected, render children
 */
export default function CompanyGuard({ children }) {
  const { activeCompanyId, setActiveCompany, isLoading: contextLoading } = useActiveCompany();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [showCompanyCreation, setShowCompanyCreation] = useState(false);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkCompanyStatus();
  }, []);

  const checkCompanyStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user's companies
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token in localStorage');
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      console.log('Fetching companies from:', API_URL);
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await axios.get(`${API_URL}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Companies fetched successfully:', response.data);

      const userCompanies = response.data || [];
      setCompanies(userCompanies);

      if (userCompanies.length === 0) {
        console.log('No companies found, showing creation screen');
        // No companies - force creation
        setShowCompanyCreation(true);
        setShowCompanySelector(false);
      } else if (!activeCompanyId || !userCompanies.find(c => c.id === parseInt(activeCompanyId))) {
        console.log('Companies found, showing selector');
        // Companies exist but none selected or invalid selection
        setShowCompanySelector(true);
        setShowCompanyCreation(false);
      } else {
        console.log('Valid company already selected');
        // Valid company selected - ensure context has full data
        const company = userCompanies.find(c => c.id === parseInt(activeCompanyId));
        if (company) {
          setActiveCompany(activeCompanyId, company);
        }
      }
    } catch (err) {
      console.error('Error checking company status:', err);
      let errorMessage = 'Failed to load companies';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - backend not responding';
      } else if (err.response?.status === 401) {
        errorMessage = 'Unauthorized - token expired. Please login again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied - invalid permissions';
      } else if (err.response?.status === 404) {
        errorMessage = 'API endpoint not found - check your configuration';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error - backend not accessible. Check reverse proxy configuration.';
      } else {
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
      console.error('Full error:', errorMessage);
      // On error, assume need to select company
      setShowCompanySelector(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyCreated = async () => {
    // Refresh company list after creation
    await checkCompanyStatus();
  };

  const handleCompanySelected = async (companyId) => {
    try {
      const company = companies.find(c => c.id === companyId);
      
      // Update context (which also updates backend and localStorage)
      await setActiveCompany(companyId, company);
      
      setShowCompanySelector(false);
      setShowCompanyCreation(false);
    } catch (err) {
      console.error('Error selecting company:', err);
      alert('Failed to select company. Please try again.');
    }
  };

  // Loading state
  if (loading || contextLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <Loader className="w-12 h-12 text-blue-500" />
          </motion.div>
          <p className="text-white text-lg font-semibold">Loading your workspace...</p>
        </motion.div>
      </div>
    );
  }

  // Force company creation
  if (showCompanyCreation) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to TimeTracker!
              </h1>
              <p className="text-gray-600 text-lg">
                Let's get started by creating your first company
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Companies help you organize time tracking for different clients or projects
              </p>
            </div>
            
            <CompanyManager
              isOpen={true}
              onClose={() => {}} // Prevent closing
              onCompanyChanged={handleCompanyCreated}
              forceCreateMode={true}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // Show company selector
  if (showCompanySelector) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md"
          >
            <p className="text-red-800 font-semibold">Connection Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <p className="text-red-600 text-xs mt-2">
              Make sure your backend is running and the reverse proxy is configured correctly.
            </p>
            <button
              onClick={checkCompanyStatus}
              className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </motion.div>
        )}
        <CompanySelector
          isOpen={true}
          onClose={() => {}} // Prevent closing - must select
          selectedCompanyId={activeCompanyId}
          onCompanySelect={handleCompanySelected}
          isLocked={true}
          companies={companies}
        />
      </div>
    );
  }

  // Company selected - render protected content
  if (activeCompanyId) {
    return children;
  }

  // Fallback - shouldn't reach here, but show helpful message if it does
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Selection</h2>
        <p className="text-gray-600 mb-4">
          Unable to proceed - please select a company or create one first.
        </p>
        <button
          onClick={checkCompanyStatus}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Try Again
        </button>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="w-full mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
        >
          Login Again
        </button>
      </motion.div>
    </div>
  );
}
