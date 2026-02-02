import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, AlertCircle } from 'lucide-react';
import axios from 'axios';
import ModalForm from './ModalForm';

import { getApiUrl } from '../utils/apiUrl.js';

const API_URL = getApiUrl();

/**
 * Company manager - Create and switch between companies (Premium SaaS modal)
 */
export default function CompanyManager({ isOpen, onClose, onCompanyChanged, forceCreateMode = false, isClockedIn = false }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: ''
  });
  const [showForm, setShowForm] = useState(forceCreateMode);

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
      if (forceCreateMode) {
        setShowForm(true);
      }
    }
  }, [isOpen, forceCreateMode]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/companies`, config);
      setCompanies(response.data || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setMessage('❌ Error loading companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setMessage('❌ Company name is required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${API_URL}/companies`, formData, config);
      setMessage('✅ Company created successfully');
      setFormData({ name: '', description: '', industry: '' });
      setShowForm(false);

      setTimeout(() => {
        setMessage('');
        fetchCompanies();
      }, 1500);
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Error creating company'));
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchCompany = async (companyId) => {
    if (isClockedIn) {
      const confirmSwitch = window.confirm(
        'You are currently clocked in. Switching companies now will keep your active session tied to the current company.\n\nDo you want to continue?'
      );
      if (!confirmSwitch) return;
    }
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`${API_URL}/users/current-company`, { company_id: companyId }, config);
      setMessage('✅ Company switched');

      setTimeout(() => {
        setMessage('');
        onCompanyChanged();
        onClose();
      }, 1500);
    } catch (error) {
      setMessage('❌ Error switching company');
    }
  };

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

  return (
    <ModalForm isOpen={isOpen} onClose={onClose} title="Companies" size="lg">
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.includes('✅')
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {message}
        </motion.div>
      )}

      {loading && !companies.length ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="bg-gray-100 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
          <p className="text-gray-500 text-sm text-center mt-4">Loading companies...</p>
        </div>
      ) : (
        <>
          {companies.length === 0 && !showForm && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">No companies yet</h3>
              <p className="text-gray-600 text-sm mt-2">
                Create your first company to organize time entries by client or project.
              </p>
            </div>
          )}
          {/* Create Company Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(!showForm)}
            className="w-full btn-primary flex items-center justify-center gap-2 mb-6"
          >
            <Plus className="w-5 h-5" />
            Create New Company
          </motion.button>

          {/* Create Form */}
          {showForm && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateCompany}
              className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="space-y-2">
                <label className="block text-gray-700 font-semibold text-sm">
                  Company Name *
                </label>
                <input
                  type="text"
                  placeholder="Acme Corporation"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-gray-800"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-gray-700 font-semibold text-sm">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="What does your company do?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-gray-800 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-gray-700 font-semibold text-sm">
                  Industry (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Technology, Healthcare"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-gray-800"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" disabled={loading} className="flex-1 btn-primary">
                  {loading ? '⏳ Creating...' : '✅ Create Company'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}

          {/* Companies List */}
          {companies.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No companies yet. Create one to get started!</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {companies.map((company) => (
                <motion.div
                  key={company.id}
                  variants={itemVariants}
                  className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-500" />
                        {company.name}
                      </h3>
                      {company.description && (
                        <p className="text-sm text-gray-600 mt-1">{company.description}</p>
                      )}
                      {company.industry && (
                        <p className="text-xs text-gray-500 mt-1">📋 {company.industry}</p>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSwitchCompany(company.id)}
                      className="px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
                    >
                      Switch
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </ModalForm>
  );
}
