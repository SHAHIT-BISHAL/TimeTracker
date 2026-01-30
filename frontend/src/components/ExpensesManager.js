import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Download, Briefcase, User, AlertCircle, Calendar } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

/**
 * Expenses Manager - Display and manage expenses
 * Shows expenses by type (Work/Personal) with receipt links
 */
export default function ExpensesManager({ selectedCompanyId }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchExpenses();
    }
  }, [selectedCompanyId]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data.expenses || []);
      setError('');
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/expenses/${expenseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(expenses.filter(e => e.id !== expenseId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense');
    }
  };

  const handleDownloadReceipt = (receiptPath) => {
    if (receiptPath) {
      const fullPath = `${API_URL.replace('/api', '')}${receiptPath}`;
      window.open(fullPath, '_blank');
    }
  };

  const groupedExpenses = {
    work: expenses.filter(e => e.expense_type === 'work' || !e.expense_type),
    personal: expenses.filter(e => e.expense_type === 'personal')
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5" />
          {error}
        </motion.div>
      )}

      {expenses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-gray-50 rounded-lg"
        >
          <p className="text-gray-600 text-lg">No expenses yet</p>
          <p className="text-gray-400">Add an expense to get started</p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Work Expenses */}
          {groupedExpenses.work.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-sky-200">
                <Briefcase className="w-5 h-5 text-sky-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Work Expenses ({groupedExpenses.work.length})
                </h3>
                <span className="text-sm text-gray-600 ml-auto">
                  Total: ${groupedExpenses.work.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2)}
                </span>
              </div>
              <div className="space-y-2">
                {groupedExpenses.work.map(expense => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onDelete={() => setDeleteConfirm(expense.id)}
                    onDownloadReceipt={() => handleDownloadReceipt(expense.receipt_path)}
                    itemVariants={itemVariants}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Personal Expenses */}
          {groupedExpenses.personal.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-purple-200">
                <User className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Personal Expenses ({groupedExpenses.personal.length})
                </h3>
                <span className="text-sm text-gray-600 ml-auto">
                  Total: ${groupedExpenses.personal.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(2)}
                </span>
              </div>
              <div className="space-y-2">
                {groupedExpenses.personal.map(expense => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onDelete={() => setDeleteConfirm(expense.id)}
                    onDownloadReceipt={() => handleDownloadReceipt(expense.receipt_path)}
                    itemVariants={itemVariants}
                    isPersonal={true}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-lg p-6 max-w-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Expense?</h3>
              <p className="text-gray-600 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Individual expense card component
 */
function ExpenseCard({ expense, onDelete, onDownloadReceipt, itemVariants, isPersonal }) {
  const formattedDate = new Date(expense.expense_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const badgeColor = isPersonal
    ? 'bg-purple-100 text-purple-700'
    : 'bg-sky-100 text-sky-700';

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-gray-900">{expense.category}</h4>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${badgeColor}`}>
              ${parseFloat(expense.amount).toFixed(2)}
            </span>
          </div>
          {expense.description && (
            <p className="text-gray-600 text-sm mb-2">{expense.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </div>
            {expense.receipt_path && (
              <button
                onClick={onDownloadReceipt}
                className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-medium transition-colors"
              >
                <Download className="w-3 h-3" />
                View Receipt
              </button>
            )}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete expense"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
