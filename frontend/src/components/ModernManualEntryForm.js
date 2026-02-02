import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import ModalForm from './ModalForm';

import { getApiUrl } from '../utils/apiUrl.js';

const API_URL = getApiUrl();

/**
 * Manual entry modal - allows users to log past work sessions
 * Opens in animated modal instead of inline form
 */
export default function ModernManualEntryForm({ onEntryAdded, triggerButton = true }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    clock_in: '',
    clock_out: '',
    notes: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clock_in || !formData.clock_out) {
      setMessage('❌ Please enter both clock in and clock out times');
      return;
    }

    // Validate clock out is after clock in
    const clockInDate = new Date(formData.clock_in);
    const clockOutDate = new Date(formData.clock_out);
    if (clockOutDate <= clockInDate) {
      setMessage('❌ Clock out time must be after clock in time');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${API_URL}/manual-entries`, formData, config);

      setMessage('✅ Entry added successfully');
      setFormData({ clock_in: '', clock_out: '', notes: '' });
      setTimeout(() => {
        setShowModal(false);
        setMessage('');
      }, 1500);

      if (onEntryAdded) onEntryAdded();
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Error adding entry'));
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

  if (!triggerButton) {
    // Just render the form content (for embedded use)
    return (
      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl flex items-center gap-3 ${
              message.includes('✅')
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {message}
          </motion.div>
        )}

        {/* Clock In */}
        <motion.div variants={itemVariants} className="space-y-2">
          <label className="block text-gray-700 font-semibold text-sm">
            Clock In Time
          </label>
          <div className="relative">
            <Clock className="absolute left-4 top-3 w-5 h-5 text-sky-500 pointer-events-none" />
            <input
              type="datetime-local"
              value={formData.clock_in}
              onChange={(e) => setFormData({ ...formData, clock_in: e.target.value })}
              required
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all outline-none text-gray-800"
            />
          </div>
        </motion.div>

        {/* Clock Out */}
        <motion.div variants={itemVariants} className="space-y-2">
          <label className="block text-gray-700 font-semibold text-sm">
            Clock Out Time
          </label>
          <div className="relative">
            <Clock className="absolute left-4 top-3 w-5 h-5 text-sky-500 pointer-events-none" />
            <input
              type="datetime-local"
              value={formData.clock_out}
              onChange={(e) => setFormData({ ...formData, clock_out: e.target.value })}
              required
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all outline-none text-gray-800"
            />
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div variants={itemVariants} className="space-y-2">
          <label className="block text-gray-700 font-semibold text-sm">
            Notes (Optional)
          </label>
          <textarea
            placeholder="Add any notes about this work session..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="3"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all outline-none text-gray-800 resize-none"
          />
        </motion.div>

        {/* Submit */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Adding...' : '✅ Add Entry'}
        </motion.button>
      </motion.form>
    );
  }

  // Render as modal trigger
  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Manual Entry
      </motion.button>

      <ModalForm
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setMessage('');
        }}
        title="Add Manual Entry"
        size="md"
      >
        <motion.form
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl flex items-center gap-3 ${
                message.includes('✅')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {message}
            </motion.div>
          )}

          {/* Clock In - Mobile First with 44px min tap target */}
          <motion.div variants={itemVariants} className="space-y-2">
            <label className="block text-gray-700 font-semibold text-sm sm:text-base">
              Clock In Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3 sm:left-4 top-3 sm:top-3.5 w-5 h-5 text-sky-500 pointer-events-none z-10" />
              <input
                type="datetime-local"
                value={formData.clock_in}
                onChange={(e) => setFormData({ ...formData, clock_in: e.target.value })}
                required
                className="w-full pl-11 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 text-base rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all outline-none text-gray-800"
              />
            </div>
          </motion.div>

          {/* Clock Out - Mobile First with 44px min tap target */}
          <motion.div variants={itemVariants} className="space-y-2">
            <label className="block text-gray-700 font-semibold text-sm sm:text-base">
              Clock Out Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3 sm:left-4 top-3 sm:top-3.5 w-5 h-5 text-sky-500 pointer-events-none z-10" />
              <input
                type="datetime-local"
                value={formData.clock_out}
                onChange={(e) => setFormData({ ...formData, clock_out: e.target.value })}
                required
                className="w-full pl-11 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 text-base rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all outline-none text-gray-800"
              />
            </div>
          </motion.div>

          {/* Notes - Mobile First */}
          <motion.div variants={itemVariants} className="space-y-2">
            <label className="block text-gray-700 font-semibold text-sm sm:text-base">
              Notes (Optional)
            </label>
            <textarea
              placeholder="Add any notes about this work session..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="w-full px-3 sm:px-4 py-3 text-base rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all outline-none text-gray-800 resize-none"
            />
          </motion.div>

          {/* Submit - 44px min tap target */}
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg font-semibold"
          >
            {loading ? '⏳ Adding...' : '✅ Add Entry'}
          </motion.button>
        </motion.form>
      </ModalForm>
    </>
  );
}
