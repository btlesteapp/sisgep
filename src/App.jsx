import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Stats from './pages/Stats';
import Productivity from './pages/Productivity';
import Settings from './pages/Settings';
import ImportPdfPage from './pages/ImportPdfPage';
import Sidebar from './components/Sidebar';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route 
                path="/dashboard" 
                element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
              />
              <Route 
                path="/stats" 
                element={<ProtectedRoute><Stats /></ProtectedRoute>} 
              />
              <Route 
                path="/productivity" 
                element={<ProtectedRoute><Productivity /></ProtectedRoute>} 
              />
              <Route 
                path="/import-pdf" 
                element={<ProtectedRoute><ImportPdfPage /></ProtectedRoute>} 
              />
              <Route 
                path="/settings" 
                element={<ProtectedRoute><Settings /></ProtectedRoute>} 
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
