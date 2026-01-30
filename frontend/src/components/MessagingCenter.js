import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Users, AlertCircle, User, X } from 'lucide-react';
import axios from 'axios';
import ModalForm from './ModalForm';

const API_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5000/api`;

/**
 * Messaging component - Team messages and direct messaging
 */
export default function MessagingCenter({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('team'); // 'team' or 'direct'
  const [teamMessages, setTeamMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTeamMessages();
      fetchCompanyUsers();
    }
  }, [isOpen]);

  const fetchTeamMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/messages/team`, config);
      setTeamMessages(response.data.messages || []);
    } catch (err) {
      console.error('Error fetching team messages:', err);
      setMessage('❌ Error loading messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectMessages = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/messages/direct/${userId}`, config);
      setDirectMessages(response.data.messages || []);
    } catch (err) {
      console.error('Error fetching direct messages:', err);
      setMessage('❌ Error loading messages');
    }
  };

  const fetchCompanyUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Assuming there's a /api/users/company endpoint
      const response = await axios.get(`${API_URL}/users/company`, config);
      setCompanyUsers(response.data || []);
    } catch (err) {
      console.error('Error fetching company users:', err);
    }
  };

  const handleSendTeamMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) {
      setMessage('❌ Message cannot be empty');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${API_URL}/messages/team`, { content: messageText }, config);
      setMessageText('');
      setMessage('✅ Message sent');

      setTimeout(() => {
        setMessage('');
        fetchTeamMessages();
      }, 1500);
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Error sending message'));
    }
  };

  const handleSendDirectMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) {
      setMessage('❌ Message cannot be empty');
      return;
    }

    if (!selectedUser) {
      setMessage('❌ Select a user first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(
        `${API_URL}/messages/direct`,
        { recipientId: selectedUser.id, content: messageText },
        config
      );
      setMessageText('');
      setMessage('✅ Message sent');

      setTimeout(() => {
        setMessage('');
        fetchDirectMessages(selectedUser.id);
      }, 1500);
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Error sending message'));
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchDirectMessages(user.id);
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
    <ModalForm isOpen={isOpen} onClose={onClose} title="Messages" size="xl">
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            message.includes('✅')
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {message}
        </motion.div>
      )}

      <div className="flex gap-4 h-96">
        {/* Tabs and Users */}
        <div className="w-40 flex flex-col border-r border-gray-200">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'team'
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1" /> Team
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'direct'
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-1" /> Direct
            </button>
          </div>

          {activeTab === 'direct' && (
            <div className="flex-1 overflow-y-auto space-y-2">
              {companyUsers.map((user) => (
                <motion.button
                  key={user.id}
                  whileHover={{ x: 5 }}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedUser?.id === user.id
                      ? 'bg-sky-100 border-l-4 border-sky-500 text-sky-900 font-semibold'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <User className="w-3 h-3 inline mr-2" />
                  {user.username}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages Display */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2"
          >
            {activeTab === 'team' ? (
              teamMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : (
                teamMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    variants={itemVariants}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm text-gray-800">{msg.username}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{msg.content}</p>
                  </motion.div>
                ))
              )
            ) : selectedUser ? (
              directMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : (
                directMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    variants={itemVariants}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm text-gray-800">{msg.username}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{msg.content}</p>
                  </motion.div>
                ))
              )
            ) : (
              <div className="text-center py-8 text-gray-400">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a user to start chatting</p>
              </div>
            )}
          </motion.div>

          {/* Message Input */}
          <form
            onSubmit={activeTab === 'team' ? handleSendTeamMessage : handleSendDirectMessage}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder={
                activeTab === 'direct' && !selectedUser
                  ? 'Select a user first...'
                  : 'Type a message...'
              }
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={activeTab === 'direct' && !selectedUser}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none disabled:bg-gray-100"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={activeTab === 'direct' && !selectedUser}
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </form>
        </div>
      </div>
    </ModalForm>
  );
}
