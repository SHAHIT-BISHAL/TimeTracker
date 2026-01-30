import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Tag, FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';
import ModalForm from './ModalForm';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Tools', 'Software', 'Other'];

/**
 * Expense entry modal - allows users to log expenses
 * Tracks amount, category, and description
 */
export default function ExpenseEntryModal({ isOpen, onClose, onExpenseAdded }) {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Other',
    description: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setMessage('❌ Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${API_URL}/expenses`, formData, config);

      setMessage('✅ Expense added successfully');
      setFormData({ amount: '', category: 'Other', description: '' });
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
