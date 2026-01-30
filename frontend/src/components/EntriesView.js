import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Edit2, Plus, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import ModernManualEntryForm from './ModernManualEntryForm';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

/**
 * Entries view - Shows list of time entries with add/edit/delete functionality
 */
export default function EntriesView({ onClose, selectedCompanyId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (selectedCompanyId) {
      fetchEntries();
    }
  }, [selectedCompanyId]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const params = selectedCompanyId ? `?company_id=${selectedCompanyId}` : '';
      const response = await axios.get(`${API_URL}/time/entries${params}`, config);
      setEntries(response.data || []);
    } catch (err) {
      console.error('Error fetching entries:', err);
      setMessage('❌ Error loading entries');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (entry) => {
    setEditingId(entry.id);
    setEditData({
      clock_in: entry.clock_in?.slice(0, 16) || '',
      clock_out: entry.clock_out?.slice(0, 16) || '',
      notes: entry.notes || '',
      project: entry.project || ''
    });
  };

  const saveEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_URL}/entries/${editingId}`, editData, config);
      setMessage('✅ Entry updated');
      setEditingId(null);
      setTimeout(() => {
        setMessage('');
        fetchEntries();
      }, 1500);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Error updating entry'));
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL}/entries/${id}`, config);
      setMessage('✅ Entry deleted');
      setTimeout(() => {
        setMessage('');
        fetchEntries();
      }, 1500);
    } catch (err) {
      setMessage('❌ Error deleting entry');
    }
  };

  const formatDateTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const calculateDuration = (clockIn, clockOut) => {
    try {
      const start = new Date(clockIn);
      const end = new Date(clockOut || new Date());
      const minutes = Math.floor((end - start) / 60000);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    } catch {
      return 'N/A';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen gradient-bg text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-black/20 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold"
          >
            Time Entries
          </motion.h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                message.includes('✅')
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50'
                  : 'bg-red-500/20 text-red-200 border border-red-500/50'
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Entry Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowAddModal(true)}
          className="mb-6 w-full btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Entry
        </motion.button>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-300">Loading entries...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && entries.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No entries yet. Add one to get started!</p>
          </div>
        )}

        {/* Entries List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              variants={itemVariants}
              className="bg-white/10 border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-colors"
            >
              {editingId === entry.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <h3 className="font-semibold text-white mb-4">Edit Entry</h3>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Clock In
                    </label>
                    <input
                      type="datetime-local"
                      value={editData.clock_in || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, clock_in: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-white/20 rounded-lg bg-black/50 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Clock Out
                    </label>
                    <input
                      type="datetime-local"
                      value={editData.clock_out || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, clock_out: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-white/20 rounded-lg bg-black/50 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Project
                    </label>
                    <input
                      type="text"
                      placeholder="Project name (optional)"
                      value={editData.project || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, project: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-white/20 rounded-lg bg-black/50 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={editData.notes || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, notes: e.target.value })
                      }
                      rows="3"
                      className="w-full px-4 py-2 border border-white/20 rounded-lg bg-black/50 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={saveEdit}
                      className="flex-1 btn-primary"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold">Clock In:</span> {formatDateTime(entry.clock_in)}
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      <span className="font-semibold">Clock Out:</span>{' '}
                      {entry.clock_out ? formatDateTime(entry.clock_out) : 'Still clocked in'}
                    </p>
                    {entry.clock_out && (
                      <p className="text-sm text-sky-300 font-semibold mt-2">
                        Duration: {calculateDuration(entry.clock_in, entry.clock_out)}
                      </p>
                    )}
                    {entry.project && (
                      <p className="text-sm text-cyan-300 mt-2">
                        <span className="font-semibold">Project:</span> {entry.project}
                      </p>
                    )}
                    {entry.notes && (
                      <p className="text-sm text-gray-300 mt-3 italic">
                        <span className="font-semibold">Notes:</span> {entry.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEditing(entry)}
                      className="p-2 hover:bg-white/10 rounded-lg text-cyan-300 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-red-300 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <div className="relative flex items-center justify-center min-h-screen p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Manual Entry</h2>
                <ModernManualEntryForm
                  onEntryAdded={() => {
                    setShowAddModal(false);
                    fetchEntries();
                  }}
                  triggerButton={false}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
