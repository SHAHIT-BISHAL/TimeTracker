import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Check, Lock } from 'lucide-react';
import axios from 'axios';
import './CompanySelector.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * CompanySelector Component
 * Allows users to create and select companies
 * Disables all timesheet features until a company is selected
 */
export default function CompanySelector({ 
  isOpen = false, 
  onClose = () => {}, 
  selectedCompanyId, 
  onCompanySelect, 
  isLocked = false 
}) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    pay_rate: 0,
    manager_email: ''
  });

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/companies`, config);
      setCompanies(response.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load companies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setError('❌ Company name is required');
      return;
    }

    if (formData.name.trim().length < 2) {
      setError('❌ Company name must be at least 2 characters');
      return;
    }

    if (formData.manager_email && !formData.manager_email.includes('@')) {
      setError('❌ Please enter a valid email address');
      return;
    }

    if (formData.pay_rate && formData.pay_rate < 0) {
      setError('❌ Pay rate cannot be negative');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/companies`, formData, config);
      
      setCompanies([...companies, response.data]);
      setFormData({
        name: '',
        description: '',
        industry: '',
        pay_rate: 0,
        manager_email: ''
      });
      setShowForm(false);
      setError('');

      // Auto-select the newly created company
      onCompanySelect(response.data.id);
      
      console.log('✅ Company created successfully:', response.data.name);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to create company. Please try again.';
      setError(`❌ ${errorMsg}`);
      console.error('Company creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = (companyId) => {
    onCompanySelect(companyId);
    localStorage.setItem('selectedCompanyId', companyId);
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="company-selector loading">
          <div className="spinner"></div>
          <p>Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target.className === 'modal-overlay' && !isLocked) {
        onClose();
      }
    }}>
      <div className={`company-selector ${isLocked ? 'locked' : ''}`}>
        <div className="selector-header">
          <div className="selector-title">
            <Building2 className="icon" />
            <h3>Select Company</h3>
            {isLocked && <Lock className="lock-icon" />}
          </div>
          <p className="selector-subtitle">
            {isLocked 
              ? 'You must select a company to use TimeTracker'
              : 'Select or create a company to begin tracking time'}
          </p>
        </div>

      {error && <div className="error-message">{error}</div>}

      <AnimatePresence>
        {companies.length > 0 && (
          <motion.div className="companies-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {companies.map((company) => (
              <motion.div
                key={company.id}
                className={`company-card ${selectedCompanyId === company.id ? 'selected' : ''}`}
                onClick={() => handleSelectCompany(company.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="company-info">
                  <h4>{company.name}</h4>
                  {company.description && <p className="description">{company.description}</p>}
                  <div className="company-meta">
                    {company.industry && <span className="tag">{company.industry}</span>}
                    {company.pay_rate > 0 && <span className="tag">${company.pay_rate}/hr</span>}
                  </div>
                </div>

                {selectedCompanyId === company.id && (
                  <motion.div
                    className="selected-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="check-icon" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {companies.length === 0 && !showForm && (
        <div className="empty-state">
          <Building2 className="empty-icon" />
          <p>No companies yet</p>
          <p className="empty-hint">Create your first company to get started</p>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.form
            className="company-form"
            onSubmit={handleCreateCompany}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h4>Create New Company</h4>

            <input
              type="text"
              placeholder="Company Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <input
              type="text"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <input
              type="text"
              placeholder="Industry (optional)"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />

            <input
              type="number"
              placeholder="Pay Rate $ (optional)"
              step="0.01"
              value={formData.pay_rate}
              onChange={(e) => setFormData({ ...formData, pay_rate: parseFloat(e.target.value) })}
            />

            <input
              type="email"
              placeholder="Manager Email (optional)"
              value={formData.manager_email}
              onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
            />

            <div className="form-actions">
              <button type="submit" className="btn-primary">Create Company</button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {!showForm && (
        <button
          className="btn-create"
          onClick={() => setShowForm(true)}
        >
          <Plus className="icon" />
          Create New Company
        </button>
      )}
      </div>
    </div>
  );
}
