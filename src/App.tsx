// UPDATED: 2026-01-21 18:23 IST - Fixed Authentication Flow
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
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

const App = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e8ecf3] via-[#e8ecf3] to-[#d4dae6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } 
      />
      <Route 
        path="/signup" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />
        } 
      />
      
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
      
      {/* Protected Routes */}
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
