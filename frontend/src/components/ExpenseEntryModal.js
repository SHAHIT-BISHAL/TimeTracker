import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Tag, FileText, AlertCircle, Upload, Briefcase, User } from 'lucide-react';
import axios from 'axios';
import ModalForm from './ModalForm';

import { getApiUrl } from '../utils/apiUrl.js';

const API_URL = getApiUrl();

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Tools', 'Software', 'Other'];
const EXPENSE_TYPES = [
  { value: 'work', label: 'Work', icon: Briefcase },
  { value: 'personal', label: 'Personal', icon: User }
];

/**
 * Expense entry modal - allows users to log expenses
 * Tracks amount, category, description, type, and receipt
 */
export default function ExpenseEntryModal({ isOpen, onClose, onExpenseAdded }) {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Other',
    description: '',
    expense_type: 'work',
    receipt: null
  });
  const [receiptFileName, setReceiptFileName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('❌ File size must be less than 5MB');
        return;
      }
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setMessage('❌ Only JPG, PNG, or PDF files are allowed');
        return;
      }
      setFormData({ ...formData, receipt: file });
      setReceiptFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setMessage('❌ Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('amount', formData.amount);
      submitData.append('category', formData.category);
      submitData.append('description', formData.description);
      submitData.append('expense_type', formData.expense_type);
      if (formData.receipt) {
        submitData.append('receipt', formData.receipt);
      }

      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`
          // Don't set Content-Type - axios will set it automatically with boundary
        } 
      };

      await axios.post(`${API_URL}/expenses`, submitData, config);

      setMessage('✅ Expense added successfully');
      setFormData({ amount: '', category: 'Other', description: '', expense_type: 'work', receipt: null });
      setReceiptFileName('');
      setTimeout(() => {
        onClose();
        setMessage('');
      }, 1500);

      if (onExpenseAdded) onExpenseAdded();
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Error adding expense'));
    } finally {
      setLoading(false);
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
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <ModalForm isOpen={isOpen} onClose={onClose} title="Add Expense" size="md">
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

      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Amount */}
        <motion.div variants={itemVariants} className="space-y-2">
          <label className="block text-gray-700 font-semibold text-sm">
            Amount ($)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-3 w-5 h-5 text-sky-500 pointer-events-none" />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all outline-none text-gray-800"
            />
          </div>
        </motion.div>

        {/* Category */}
        <motion.div variants={itemVariants} className="space-y-2">
          <label className="block text-gray-700 font-semibold text-sm">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {EXPENSE_CATEGORIES.map((cat) => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat })}
                className={`py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
                  formData.category === cat
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Description */}
        <motion.div variants={itemVariants} className="space-y-2">
          <label className="block text-gray-700 font-semibold text-sm">
            Description (Optional)
          </label>
          <textarea
            placeholder="What was this expense for?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="3"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all outline-none text-gray-800 resize-none"
          />
        </motion.div>

        {/* Expense Type */}
        <motion.div variants={itemVariants} className="space-y-2">
          <label className="block text-gray-700 font-semibold text-sm">
            Expense Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {EXPENSE_TYPES.map(({ value, label, icon: Icon }) => (
              <motion.button
                key={value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setFormData({ ...formData, expense_type: value })}
                className={`py-3 px-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  formData.expense_type === value
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Receipt Upload */}
        <motion.div variants={itemVariants} className="space-y-2">
          <label className="block text-gray-700 font-semibold text-sm">
            Receipt (Optional)
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="receipt-upload"
            />
            <label
              htmlFor="receipt-upload"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-sky-500 cursor-pointer transition-colors bg-gray-50 hover:bg-sky-50"
            >
              <Upload className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700 font-medium">
                {receiptFileName || 'Upload receipt (JPG, PNG, PDF)'}
              </span>
            </label>
            {receiptFileName && (
              <p className="text-xs text-gray-500 mt-2">✓ {receiptFileName} selected</p>
            )}
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {loading ? '⏳ Adding...' : '💰 Add Expense'}
        </motion.button>
      </motion.form>
    </ModalForm>
  );
}
