import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CompanyProvider } from './contexts/CompanyContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ModernDashboard from './components/ModernDashboard';
import PrivateRoute from './components/PrivateRoute';
import CompanyGuard from './components/CompanyGuard';
import DynamicBackground from './components/DynamicBackground';
import './App.css';

function App() {
  return (
    <CompanyProvider>
      <Router>
        <DynamicBackground>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <CompanyGuard>
                    <ModernDashboard />
                  </CompanyGuard>
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard-full"
              element={
                <PrivateRoute>
                  <CompanyGuard>
                    <Dashboard />
                  </CompanyGuard>
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </DynamicBackground>
      </Router>
    </CompanyProvider>
  );
}

export default App;
