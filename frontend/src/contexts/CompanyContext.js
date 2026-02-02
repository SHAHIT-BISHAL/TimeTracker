import React, { createContext, useContext, useState, useEffect } from 'react';

const CompanyContext = createContext(null);

/**
 * CompanyProvider - Global state manager for active company context
 * Persists company selection across page reloads
 * Ensures all operations are scoped to the selected company
 */
export function CompanyProvider({ children }) {
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [activeCompanyName, setActiveCompanyName] = useState(null);
  const [activeCompanyData, setActiveCompanyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore company context from localStorage on mount
  useEffect(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId');
    const storedCompanyData = localStorage.getItem('selectedCompanyData');

    if (storedCompanyId) {
      setActiveCompanyId(storedCompanyId);
      
      if (storedCompanyData) {
        try {
          const companyData = JSON.parse(storedCompanyData);
          setActiveCompanyName(companyData.name);
          setActiveCompanyData(companyData);
        } catch (err) {
          console.error('Error parsing company data:', err);
        }
      }
    }
    
    setIsLoading(false);
  }, []);

  // Persist to localStorage whenever company changes
  useEffect(() => {
    if (activeCompanyId) {
      localStorage.setItem('selectedCompanyId', activeCompanyId);
      
      if (activeCompanyData) {
        localStorage.setItem('selectedCompanyData', JSON.stringify(activeCompanyData));
      }
    } else {
      localStorage.removeItem('selectedCompanyId');
      localStorage.removeItem('selectedCompanyData');
    }
  }, [activeCompanyId, activeCompanyData]);

  /**
   * Set the active company
   * @param {string|number} companyId - Company ID
   * @param {object} companyData - Company details { id, name, description, etc. }
   */
  const setActiveCompany = (companyId, companyData = null) => {
    setActiveCompanyId(companyId?.toString());
    
    if (companyData) {
      setActiveCompanyName(companyData.name);
      setActiveCompanyData(companyData);
    } else {
      setActiveCompanyName(null);
      setActiveCompanyData(null);
    }

    // Dispatch event for components that listen directly
    window.dispatchEvent(new CustomEvent('companyChanged', { 
      detail: { companyId, companyData } 
    }));
  };

  /**
   * Clear active company selection
   */
  const clearActiveCompany = () => {
    setActiveCompanyId(null);
    setActiveCompanyName(null);
    setActiveCompanyData(null);
    localStorage.removeItem('selectedCompanyId');
    localStorage.removeItem('selectedCompanyData');
    
    window.dispatchEvent(new CustomEvent('companyCleared'));
  };

  /**
   * Check if a company is currently selected
   * @returns {boolean}
   */
  const hasActiveCompany = () => {
    return !!activeCompanyId;
  };

  /**
   * Get active company ID or throw error
   * @throws {Error} if no company selected
   * @returns {string} Company ID
   */
  const requireActiveCompany = () => {
    if (!activeCompanyId) {
      throw new Error('No company selected');
    }
    return activeCompanyId;
  };

  /**
   * Switch to a different company
   * @param {string|number} companyId - New company ID
   * @param {object} companyData - Company details
   */
  const switchCompany = async (companyId, companyData = null) => {
    const { getApiUrl } = await import('../utils/apiUrl.js');
    const API_URL = getApiUrl();
    const token = localStorage.getItem('token');

    try {
      // Update backend
      const response = await fetch(`${API_URL}/users/current-company`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ company_id: companyId })
      });

      if (!response.ok) {
        throw new Error('Failed to update company on server');
      }

      // Update context
      setActiveCompany(companyId, companyData);
      
      return true;
    } catch (error) {
      console.error('Error switching company:', error);
      throw error;
    }
  };

  const value = {
    // State
    activeCompanyId,
    activeCompanyName,
    activeCompanyData,
    isLoading,
    
    // Actions
    setActiveCompany,
    clearActiveCompany,
    switchCompany,
    
    // Helpers
    hasActiveCompany,
    requireActiveCompany
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

/**
 * Custom hook to access active company context
 * @returns {object} Company context with state and actions
 * @throws {Error} if used outside CompanyProvider
 */
export function useActiveCompany() {
  const context = useContext(CompanyContext);
  
  if (!context) {
    throw new Error('useActiveCompany must be used within a CompanyProvider');
  }
  
  return context;
}

/**
 * HOC to ensure component has active company
 * Redirects or shows message if no company selected
 */
export function withActiveCompany(Component) {
  return function WithActiveCompanyWrapper(props) {
    const { hasActiveCompany, activeCompanyId } = useActiveCompany();
    
    if (!hasActiveCompany()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-xl text-gray-600 mb-4">
              ⚠️ Please select a company to continue
            </p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} companyId={activeCompanyId} />;
  };
}

export default CompanyContext;
