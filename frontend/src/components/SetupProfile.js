import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, AlertCircle } from 'lucide-react';
import './SetupProfile.css';

export default function SetupProfile({ onSetupComplete }) {
  const [step, setStep] = useState(1); // 1 = Company, 2 = Hourly Rate, 3 = Pay Cycle
  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [hourlyRate, setHourlyRate] = useState('');
  const [payCycleType, setPayCycleType] = useState('weekly');
  const [customDay, setCustomDay] = useState('1');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('http://localhost:5000/api/companies', config);
      setCompanies(response.data);
      if (response.data.length > 0) {
        setSelectedCompany(response.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!newCompany.trim()) {
      setMessage('Please enter company name');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(
        'http://localhost:5000/api/companies',
        { name: newCompany, description: '' },
        config
      );
      setCompanies([...companies, response.data]);
      setSelectedCompany(response.data.id);
      setNewCompany('');
      setShowNewCompanyForm(false);
      setMessage('Company created successfully');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error creating company');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchCompany = async (companyId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `http://localhost:5000/api/companies/${companyId}/switch`,
        {},
        config
      );
      setSelectedCompany(companyId);
      setMessage('Company selected');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error selecting company');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueStep = () => {
    if (step === 1) {
      if (!selectedCompany) {
        setMessage('Please select or create a company');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!hourlyRate) {
        setMessage('Please enter your hourly rate');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      handleCompleteSetup();
    }
  };

  const handleCompleteSetup = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Update hourly rate in user_companies
      await axios.put(
        `http://localhost:5000/api/companies/${selectedCompany}/hourly-rate`,
        { hourly_rate: parseFloat(hourlyRate) },
        config
      );

      // Setup pay cycle
      await axios.post(
        'http://localhost:5000/api/paycycle-setup/setup',
        {
          pay_cycle_type: payCycleType,
          custom_day: payCycleType === 'custom' ? parseInt(customDay) : null
        },
        config
      );

      // Mark profile as setup complete
      await axios.put(
        'http://localhost:5000/api/users/profile/setup-complete',
        {},
        config
      );

      setMessage('Profile setup complete!');
      setTimeout(() => {
        if (onSetupComplete) onSetupComplete();
      }, 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error completing setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-profile-overlay">
      <div className="setup-profile-modal">
        <h1>Welcome! Let's Set Up Your Profile</h1>
        <p className="subtitle">Complete these steps to get started</p>

        {message && (
          <div className={`setup-message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message.includes('Error') ? (
              <AlertCircle size={18} />
            ) : (
              <CheckCircle size={18} />
            )}
            {message}
          </div>
        )}

        <div className="setup-progress">
          <div className={`progress-item ${step >= 1 ? 'active' : ''}`}>
            <div className="progress-number">1</div>
            <div className="progress-label">Company</div>
          </div>
          <div className={`progress-item ${step >= 2 ? 'active' : ''}`}>
            <div className="progress-number">2</div>
            <div className="progress-label">Hourly Rate</div>
          </div>
          <div className={`progress-item ${step >= 3 ? 'active' : ''}`}>
            <div className="progress-number">3</div>
            <div className="progress-label">Pay Cycle</div>
          </div>
        </div>

        <div className="setup-content">
          {step === 1 && (
            <div className="setup-step">
              <h2>Select or Create a Company</h2>
              
              {companies.length > 0 && (
                <div className="company-list">
                  <label>Select existing company:</label>
                  <div className="companies-grid">
                    {companies.map((company) => (
                      <button
                        key={company.id}
                        className={`company-card ${selectedCompany === company.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedCompany(company.id);
                          handleSwitchCompany(company.id);
                        }}
                        disabled={loading}
                      >
                        {company.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="divider">OR</div>

              {showNewCompanyForm ? (
                <form onSubmit={handleCreateCompany}>
                  <div className="form-group">
                    <label>Company Name</label>
                    <input
                      type="text"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      placeholder="Enter company name"
                      autoFocus
                    />
                  </div>
                  <div className="button-group">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Company'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-cancel"
                      onClick={() => setShowNewCompanyForm(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowNewCompanyForm(true)}
                >
                  + Create New Company
                </button>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="setup-step">
              <h2>What's Your Hourly Rate?</h2>
              <div className="form-group">
                <label>Hourly Rate ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="e.g., 25.50"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="setup-step">
              <h2>Set Your Pay Cycle</h2>
              <div className="pay-cycle-options">
                <label className={`radio-option ${payCycleType === 'weekly' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value="weekly"
                    checked={payCycleType === 'weekly'}
                    onChange={(e) => setPayCycleType(e.target.value)}
                  />
                  <span>Weekly (7 days)</span>
                </label>
                <label className={`radio-option ${payCycleType === 'fortnightly' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value="fortnightly"
                    checked={payCycleType === 'fortnightly'}
                    onChange={(e) => setPayCycleType(e.target.value)}
                  />
                  <span>Fortnightly (14 days)</span>
                </label>
                <label className={`radio-option ${payCycleType === 'monthly' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value="monthly"
                    checked={payCycleType === 'monthly'}
                    onChange={(e) => setPayCycleType(e.target.value)}
                  />
                  <span>Monthly</span>
                </label>
                <label className={`radio-option ${payCycleType === 'custom' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value="custom"
                    checked={payCycleType === 'custom'}
                    onChange={(e) => setPayCycleType(e.target.value)}
                  />
                  <span>Custom Day of Month</span>
                </label>
              </div>
              {payCycleType === 'custom' && (
                <div className="form-group">
                  <label>Day of Month (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={customDay}
                    onChange={(e) => setCustomDay(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="setup-actions">
          {step > 1 && (
            <button
              className="btn btn-secondary"
              onClick={() => setStep(step - 1)}
              disabled={loading}
            >
              Back
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleContinueStep}
            disabled={loading}
          >
            {loading ? 'Processing...' : step === 3 ? 'Complete Setup' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
