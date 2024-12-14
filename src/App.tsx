import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { MainApp } from './pages/MainApp';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      <Route 
        path="/*" 
        element={isAuthenticated ? <MainApp /> : <Navigate to="/login" replace />} 
      />
    </Routes>
  );
}

export default App;