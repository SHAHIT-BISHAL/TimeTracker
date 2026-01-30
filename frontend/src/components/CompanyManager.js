import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Building2, ChevronRight } from 'lucide-react';
import './CompanyManager.css';

export default function CompanyManager() {
  const [companies, setCompanies] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', industry: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('http://localhost:5000/api/companies', config);
      setCompanies(res.data);
      
      // Get current company from user
      const userRes = await axios.get('http://localhost:5000/api/users/profile', config);
      const current = res.data.find(c => c.id === userRes.data.current_company_id);
      setCurrentCompany(current || res.data[0]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setLoading(false);
    }
  };

  const handleAddCompany = async () => {
    if (!formData.name.trim()) {
      setMessage('Company name is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post('http://localhost:5000/api/companies', formData, config);
      
      setCompanies([...companies, res.data]);
      setCurrentCompany(res.data);
      setFormData({ name: '', description: '', industry: '' });
      setShowForm(false);
      setMessage('Company created successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error creating company');
      console.error(error);
    }
  };

  const handleSwitchCompany = async (companyId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`http://localhost:5000/api/companies/${companyId}/switch`, {}, config);
      
      const selected = companies.find(c => c.id === companyId);
      setCurrentCompany(selected);
      window.location.reload(); // Refresh to update all data
    } catch (error) {
      console.error('Error switching company:', error);
    }
  };

  if (loading) return <div className="company-manager">Loading companies...</div>;

  return (
    <div className="company-manager">
      <div className="company-header">
        <h3><Building2 size={20} /> Your Companies</h3>
        <button className="add-company-btn" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Add Company
        </button>
      </div>

      {message && <div className="manager-message">{message}</div>}

      {showForm && (
        <div className="company-form">
          <input
            type="text"
            placeholder="Company name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <input
            type="text"
            placeholder="Industry"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          />
          <div className="form-actions">
            <button className="btn-save" onClick={handleAddCompany}>Create</button>
            <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="companies-list">
        {companies.map(company => (
          <div
            key={company.id}
            className={`company-item ${currentCompany?.id === company.id ? 'active' : ''}`}
            onClick={() => handleSwitchCompany(company.id)}
          >
            <div className="company-info">
              <h4>{company.name}</h4>
              {company.description && <p>{company.description}</p>}
            </div>
            <ChevronRight size={18} />
          </div>
        ))}
      </div>
    </div>
  );
}
