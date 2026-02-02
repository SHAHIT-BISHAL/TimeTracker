import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Edit2, Plus, Clock, AlertCircle, Calendar } from 'lucide-react';
import axios from 'axios';
import ModernManualEntryForm from './ModernManualEntryForm';

import { getApiUrl } from '../utils/apiUrl.js';

const API_URL = getApiUrl();

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

  // Clear entries when company changes to prevent showing stale data
  useEffect(() => {
    if (selectedCompanyId) {
      setEntries([]); // Clear old data immediately
      setLoading(true);
      fetchEntries();
    } else {
      setEntries([]); // Clear if no company selected
      setLoading(false);
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
      {/* Header - Mobile First */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-black/20 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex justify-between items-center">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl sm:text-2xl font-bold"
          >
            Time Entries
          </motion.h1>
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content - Mobile First */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
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

        {/* Add Entry Button - Mobile First with 48px min tap target */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowAddModal(true)}
          className="mb-6 w-full min-h-[48px] btn-primary flex items-center justify-center gap-2 text-base sm:text-lg font-semibold"
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
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="bg-white/5 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Time Entries Yet</h3>
            <p className="text-gray-400 mb-6">
              Start tracking time for this company to see your entries here.
            </p>
          </motion.div>
        )}

        {/* MOBILE: Card Layout (Hidden on tablet+) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3 md:hidden"
        >
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              variants={itemVariants}
              className="bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-300"
            >
              {editingId === entry.id ? (
                // Edit Mode - Mobile
                <div className="space-y-3">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Edit2 className="w-4 h-4" />
                    Edit Entry
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Clock In
                    </label>
                    <input
                      type="datetime-local"
                      value={editData.clock_in || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, clock_in: e.target.value })
                      }
                      className="w-full px-3 py-3 text-base border border-white/20 rounded-lg bg-black/50 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Clock Out
                    </label>
                    <input
                      type="datetime-local"
                      value={editData.clock_out || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, clock_out: e.target.value })
                      }
                      className="w-full px-3 py-3 text-base border border-white/20 rounded-lg bg-black/50 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Project
                    </label>
                    <input
                      type="text"
                      placeholder="Project name (optional)"
                      value={editData.project || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, project: e.target.value })
                      }
                      className="w-full px-3 py-3 text-base border border-white/20 rounded-lg bg-black/50 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Notes
                    </label>
                    <textarea
                      value={editData.notes || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, notes: e.target.value })
                      }
                      rows="2"
                      className="w-full px-3 py-3 text-base border border-white/20 rounded-lg bg-black/50 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={saveEdit}
                      className="flex-1 min-h-[44px] px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-semibold hover:scale-105 transition-transform"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 min-h-[44px] px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode - Mobile Card
                <div>
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <span className="text-sm font-bold text-white">
                      {new Date(entry.clock_in).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>

                  {/* Time Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Clock In</span>
                      <span className="text-sm font-medium text-white">
                        {new Date(entry.clock_in).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Clock Out</span>
                      <span className="text-sm font-medium text-white">
                        {entry.clock_out 
                          ? new Date(entry.clock_out).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : 'Active'}
                      </span>
                    </div>
                    {entry.clock_out && (
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-xs text-gray-400">Duration</span>
                        <span className="text-base font-bold text-sky-400">
                          {calculateDuration(entry.clock_in, entry.clock_out)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Project & Notes */}
                  {entry.project && (
                    <div className="mb-2">
                      <span className="inline-block px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-md font-medium">
                        {entry.project}
                      </span>
                    </div>
                  )}
                  {entry.notes && (
                    <p className="text-xs text-gray-300 italic mb-3 line-clamp-2">
                      {entry.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => startEditing(entry)}
                      className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-cyan-300 transition-all font-medium text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-300 transition-all font-medium text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* TABLET/DESKTOP: Table Layout (Hidden on mobile) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="hidden md:block overflow-x-auto"
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Clock In</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Clock Out</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Duration</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Project</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Notes</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <motion.tr
                  key={entry.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/10 hover:bg-white/5 transition-all duration-300"
                >
                  {editingId === entry.id ? (
                    // Edit Mode - Table Row
                    <td colSpan="7" className="py-4 px-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                          <Edit2 className="w-4 h-4" />
                          Edit Entry
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
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
                              className="w-full px-4 py-2.5 text-base border border-white/20 rounded-lg bg-black/50 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50"
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
                              className="w-full px-4 py-2.5 text-base border border-white/20 rounded-lg bg-black/50 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50"
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
                              className="w-full px-4 py-2.5 text-base border border-white/20 rounded-lg bg-black/50 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50"
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
                              className="w-full px-4 py-2.5 text-base border border-white/20 rounded-lg bg-black/50 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200/50 resize-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={saveEdit}
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-semibold hover:scale-105 transition-transform"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-6 py-2.5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    // View Mode - Table Row
                    <>
                      <td className="py-3 px-4 text-sm text-white">
                        {new Date(entry.clock_in).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">
                        {new Date(entry.clock_in).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">
                        {entry.clock_out 
                          ? new Date(entry.clock_out).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : <span className="text-emerald-400 font-semibold">Active</span>}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-sky-400">
                        {entry.clock_out ? calculateDuration(entry.clock_in, entry.clock_out) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {entry.project ? (
                          <span className="inline-block px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-md font-medium">
                            {entry.project}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300 max-w-xs truncate">
                        {entry.notes || <span className="text-gray-500 text-xs">-</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => startEditing(entry)}
                            className="p-2 hover:bg-white/10 rounded-lg text-cyan-300 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-300 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
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
            <div className="relative flex items-center justify-center min-h-screen p-3 sm:p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-white rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
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
