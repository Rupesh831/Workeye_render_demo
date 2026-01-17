import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SignupPage from './components/auth/SignupPage';
import { Dashboard } from './components/Dashboard';
import { EmployeeDetailPage } from './components/EmployeeDetailPage';
import { ConfigurationPage } from './components/ConfigurationPage';
import { AttendanceDetailPage } from './components/AttendanceDetailPage';
import { ProfilePage } from './components/ProfilePage';
import { MembersPage } from './components/MembersPage';
import { AttendancePage } from './components/AttendancePage';
import { Layout } from './components/Layout';

const App: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem('authToken');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Layout>
                <Navigate to="/dashboard" replace />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
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
                <ConfigurationPage />
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
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
