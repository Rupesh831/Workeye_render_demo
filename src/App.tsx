import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SignupPage from './components/auth/SignupPage';
import { Dashboard } from './components/Dashboard';
import { EmployeeDetailPage } from './components/EmployeeDetailPage';
import { Configuration } from './components/Configuration';
import { AttendanceDetailPage } from './components/AttendanceDetailPage';
import { ProfilePage } from './components/ProfilePage';
import { MembersPage } from './components/MembersPage';
import { AttendancePage } from './components/AttendancePage';
import AnalyticsPage from './components/AnalyticsPage';

const App: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem('authToken');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Protected Routes - NO Layout wrapper needed, all pages have their own headers */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/employee/:id"
          element={
            isAuthenticated ? (
              <EmployeeDetailPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/attendance/:id"
          element={
            isAuthenticated ? (
              <AttendanceDetailPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/configuration"
          element={
            isAuthenticated ? (
              <Configuration />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <ProfilePage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/members"
          element={
            isAuthenticated ? (
              <MembersPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/attendance"
          element={
            isAuthenticated ? (
              <AttendancePage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/analytics"
          element={
            isAuthenticated ? (
              <AnalyticsPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
