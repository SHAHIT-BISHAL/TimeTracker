import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, LogIn, AlertCircle, CheckCircle, Wifi } from 'lucide-react';
import { authService } from '../services/api';
import { healthCheck } from '../services/healthCheck';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [connectionChecking, setConnectionChecking] = useState(true);
  const navigate = useNavigate();

  // Check server connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      setConnectionChecking(true);
      try {
        const status = await healthCheck();
        setConnectionStatus(status);
      } catch (err) {
        console.error('Health check failed:', err);
        setConnectionStatus({
          healthy: false,
          message: 'Cannot reach the server',
          error: err.message
        });
      } finally {
        setConnectionChecking(false);
      }
    };

    checkConnection();
    // Re-check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(username, password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Clear any previous company selection on fresh login
      localStorage.removeItem('selectedCompanyId');
      localStorage.removeItem('selectedCompanyData');
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-10 left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <motion.div 
          variants={itemVariants}
          className="flex justify-center mb-8"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="p-4 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-2xl"
          >
            <Clock className="w-8 h-8 text-white" />
          </motion.div>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={itemVariants}
          className="card backdrop-blur-lg border border-white/20"
        >
          <motion.h1 
            variants={itemVariants}
            className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent"
          >
            TimeTracker
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="text-gray-600 text-center mb-8 text-sm"
          >
            Stay focused, track your time
          </motion.p>

          {/* Connection Status */}
          {!connectionChecking && connectionStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
                connectionStatus.healthy
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              {connectionStatus.healthy ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-green-700 text-sm font-medium">Server Connected</p>
                    <p className="text-green-600 text-xs">{connectionStatus.apiUrl}</p>
                  </div>
                </>
              ) : (
                <>
                  <Wifi className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-700 text-sm font-medium">{connectionStatus.message}</p>
                    {connectionStatus.hint && (
                      <p className="text-yellow-600 text-xs">{connectionStatus.hint}</p>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <motion.form 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            onSubmit={handleLogin}
            className="space-y-4"
          >
            <motion.div variants={itemVariants}>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all outline-none text-gray-800"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all outline-none text-gray-800"
              />
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                    ⏳
                  </motion.div>
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Login
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Register Link */}
          <motion.p
            variants={itemVariants}
            className="text-center mt-6 text-gray-600"
          >
            Don't have an account?{' '}
            <motion.a
              whileHover={{ scale: 1.05 }}
              href="/register"
              className="text-sky-500 font-semibold hover:text-cyan-500 transition-colors"
            >
              Register here
            </motion.a>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
