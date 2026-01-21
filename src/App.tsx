import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SignupPage from './components/auth/SignupPage';
import { Layout } from './components/Layout';
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
        {/* Public Routes - NO Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Root redirect */}
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
        
        {/* Protected Routes - WITH Layout */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Layout>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/employee/:id"
          element={
            isAuthenticated ? (
              <Layout>
                <EmployeeDetailPage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/attendance/:id"
          element={
            isAuthenticated ? (
              <Layout>
                <AttendanceDetailPage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/configuration"
          element={
            isAuthenticated ? (
              <Layout>
                <Configuration />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <Layout>
                <ProfilePage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/members"
          element={
            isAuthenticated ? (
              <Layout>
                <MembersPage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/attendance"
          element={
            isAuthenticated ? (
              <Layout>
                <AttendancePage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/analytics"
          element={
            isAuthenticated ? (
              <Layout>
                <AnalyticsPage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
