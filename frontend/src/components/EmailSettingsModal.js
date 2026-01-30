import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import ModalForm from './ModalForm';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

/**
 * Email settings modal - Configure SMTP for email notifications
 */
export default function EmailSettingsModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    reminder_enabled: false,
    reminder_before_minutes: 60,
    reminder_frequency: 'daily'
  });

  useEffect(() => {
    if (isOpen) {
      fetchEmailSettings();
    }
  }, [isOpen]);

  const fetchEmailSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/email-settings`, config);

      setFormData({
        ...response.data,
        smtp_password: '' // Never pre-fill password for security
      });
    } catch (err) {
      console.error('Error fetching email settings:', err);
      setMessage('❌ Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.reminder_enabled) {
      if (!formData.smtp_host || !formData.smtp_port || !formData.smtp_user) {
        setMessage('❌ Please fill in SMTP details to enable reminders');
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`${API_URL}/email-settings`, formData, config);
      setMessage('✅ Email settings saved successfully');

      setTimeout(() => {
        setMessage('');
      }, 2000);
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Error saving settings'));
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
    <ModalForm isOpen={isOpen} onClose={onClose} title="Email Settings" size="lg">
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
        className="space-y-6"
      >
        {/* SMTP Configuration Section */}
        <motion.div variants={itemVariants} className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            SMTP Configuration
          </h3>

          <div className="space-y-2">
            <label className="block text-gray-700 font-semibold text-sm">
              SMTP Host
            </label>
            <input
              type="text"
              placeholder="smtp.gmail.com"
              value={formData.smtp_host}
              onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-gray-800"
            />
            <p className="text-xs text-gray-500">e.g., smtp.gmail.com, smtp.mailgun.org</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="block text-gray-700 font-semibold text-sm">Port</label>
              <input
                type="number"
                value={formData.smtp_port}
                onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-gray-800"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="block text-gray-700 font-semibold text-sm">User/Email</label>
              <input
                type="email"
                placeholder="your-email@gmail.com"
                value={formData.smtp_user}
                onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-gray-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-gray-700 font-semibold text-sm">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Your SMTP password or app-specific password"
                value={formData.smtp_password}
                onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-gray-800 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">For Gmail, use an App Password not your regular password</p>
          </div>
        </motion.div>

        {/* Reminder Settings Section */}
        <motion.div variants={itemVariants} className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h3 className="font-semibold text-gray-800">Reminder Notifications</h3>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.reminder_enabled}
              onChange={(e) => setFormData({ ...formData, reminder_enabled: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-gray-700">Enable email reminders</span>
          </label>

          {formData.reminder_enabled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-gray-700 font-semibold text-sm">
                    Remind me before (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.reminder_before_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, reminder_before_minutes: parseInt(e.target.value) })
                    }
                    min="1"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-700 font-semibold text-sm">
                    Frequency
                  </label>
                  <select
                    value={formData.reminder_frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, reminder_frequency: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-gray-800"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <p className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
                💡 You'll receive email reminders to clock in/out and complete your time entries
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Submit Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Saving...' : '💾 Save Email Settings'}
        </motion.button>
      </motion.form>
    </ModalForm>
  );
}
