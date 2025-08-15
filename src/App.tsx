import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Components
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import GoalsPage from './pages/GoalsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ParentPage from './pages/ParentPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Demo persona switcher
import PersonaSwitcher from './components/PersonaSwitcher';

function AppContent() {
  const { user, loading } = useAuth();
  const [showPersonaSwitcher, setShowPersonaSwitcher] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowPersonaSwitcher(!showPersonaSwitcher)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Demo Accounts
          </button>
          {showPersonaSwitcher && (
            <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border p-4 min-w-[300px]">
              <PersonaSwitcher onClose={() => setShowPersonaSwitcher(false)} />
            </div>
          )}
        </div>
        <LoginPage />
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/parent" element={<ParentPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppContent />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;