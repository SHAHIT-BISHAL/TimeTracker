/**
 * Company Context Manager
 * Handles active company selection and validation throughout the app
 */

const COMPANY_KEY = 'selectedCompanyId';
const COMPANY_DATA_KEY = 'selectedCompanyData';

export const companyContext = {
  /**
   * Get the currently selected company ID
   * @returns {string|null} Company ID or null
   */
  getActiveCompanyId() {
    return localStorage.getItem(COMPANY_KEY);
  },

  /**
   * Get the currently selected company data
   * @returns {object|null} Company object or null
   */
  getActiveCompany() {
    const data = localStorage.getItem(COMPANY_DATA_KEY);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Set the active company
   * @param {string} companyId - Company ID
   * @param {object} companyData - Company details (name, etc.)
   */
  setActiveCompany(companyId, companyData = null) {
    localStorage.setItem(COMPANY_KEY, companyId);
    if (companyData) {
      localStorage.setItem(COMPANY_DATA_KEY, JSON.stringify(companyData));
    }
  },

  /**
   * Clear active company selection
   */
  clearActiveCompany() {
    localStorage.removeItem(COMPANY_KEY);
    localStorage.removeItem(COMPANY_DATA_KEY);
  },

  /**
   * Check if a company is selected
   * @returns {boolean}
   */
  hasActiveCompany() {
    return !!this.getActiveCompanyId();
  },

  /**
   * Ensure company context exists, throw error if not
   * @throws {Error} If no company is selected
   */
  requireActiveCompany() {
    if (!this.hasActiveCompany()) {
      throw new Error('NO_COMPANY_SELECTED');
    }
    return this.getActiveCompanyId();
  },

  /**
   * Add company_id to API request config
   * @param {object} config - Axios config object
   * @param {string} companyId - Optional company ID override
   * @returns {object} Updated config
   */
  addCompanyToRequest(config = {}, companyId = null) {
    const id = companyId || this.getActiveCompanyId();
    
    if (!id) {
      console.warn('No active company selected');
      return config;
    }

    // Add to query params for GET requests
    if (!config.params) {
      config.params = {};
    }
    config.params.company_id = id;

    // Add to body for POST/PUT requests
    if (config.data && typeof config.data === 'object') {
      config.data.company_id = id;
    }

    return config;
  },

  /**
   * Create request interceptor for axios
   * Automatically adds company_id to all requests
   */
  createRequestInterceptor() {
    return (config) => {
      return this.addCompanyToRequest(config);
    };
  },

  /**
   * Handle company selection change
   * Updates backend and local storage
   * @param {string} companyId - New company ID
   * @param {object} companyData - Company details
   * @returns {Promise<void>}
   */
  async switchCompany(companyId, companyData = null) {
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

      // Update local storage
      this.setActiveCompany(companyId, companyData);

      // Dispatch event for components to listen to
      window.dispatchEvent(new CustomEvent('companyChanged', { 
        detail: { companyId, companyData } 
      }));

      return true;
    } catch (error) {
      console.error('Error switching company:', error);
      throw error;
    }
  },

  /**
   * Validate company selection UI prompt
   * Shows alert if no company selected
   * @returns {boolean} true if company selected, false otherwise
   */
  validateOrPrompt() {
    if (!this.hasActiveCompany()) {
      alert('⚠️ Company Selection Required\n\nPlease select a company before performing this action.\n\nThis ensures data is tracked to the correct client.');
      return false;
    }
    return true;
  }
};

export default companyContext;
