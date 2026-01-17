/**
 * API Configuration for WorkEye Frontend
 * ========================================
 * This file configures the connection between frontend and backend
 * 
 * IMPORTANT: Update these URLs based on your deployment
 */

// Backend API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://workeye-render-demo-backend.onrender.com';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    ADMIN_LOGIN: '/auth/admin/login',
    ADMIN_SIGNUP: '/auth/admin/signup',
    ADMIN_VALIDATE: '/auth/admin/validate-token',
    ADMIN_DELETE: '/auth/admin/delete-account',
  },
  
  // Dashboard endpoints
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
    MEMBER_LIVE: '/api/dashboard/member/:id/live',
  },
  
  // Members management
  MEMBERS: {
    LIST: '/admin/members',
    CREATE: '/admin/members',
    GET: '/admin/members/:id',
    UPDATE: '/admin/members/:id',
    DELETE: '/admin/members/:id',
  },
  
  // Screenshots
  SCREENSHOTS: {
    LIST: '/api/screenshots/:memberId',
    IMAGE: '/api/screenshots/image/:screenshotId',
  },
  
  // Activity logs
  ACTIVITY: {
    LOGS: '/api/activity-logs/:memberId',
    WEBSITES: '/api/website-visits/:memberId',
    APPS: '/api/app-usage/:memberId',
  },
  
  // Attendance
  ATTENDANCE: {
    MEMBERS: '/api/attendance/members',
    MEMBER_HISTORY: '/api/attendance/member/:id',
    MEMBER_ANALYTICS: '/api/attendance/analytics/:id',
    PUNCH_IN: '/api/attendance/punch-in',
    PUNCH_OUT: '/api/attendance/punch-out',
  },
  
  // Configuration
  CONFIGURATION: {
    GET: '/api/configuration',
    SAVE: '/api/configuration',
  },
  
  // Tracker
  TRACKER: {
    DOWNLOAD: '/api/tracker/download',
  },
  
  // Health check
  HEALTH: '/health',
};

// Helper function to build full URL
export const buildUrl = (endpoint, params = {}) => {
  let url = `${API_BASE_URL}${endpoint}`;
  
  // Replace path parameters
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  
  return url;
};

// Helper function to get headers with authentication
export const getAuthHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Default request configuration
export const DEFAULT_REQUEST_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
};

// Export configuration object
export default {
  API_BASE_URL,
  API_ENDPOINTS,
  buildUrl,
  getAuthHeaders,
  DEFAULT_REQUEST_CONFIG,
};
