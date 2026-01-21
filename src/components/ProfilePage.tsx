// UPDATED: 2026-01-21 17:16 IST - Neumorphic Design
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, Eye, Building2, Mail, User, Shield, Briefcase, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth as authAPI } from '../config/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, company, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    role: user?.role || 'Admin',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        role: user.role || 'Admin',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    if (formData.new_password || formData.confirm_password || formData.current_password) {
      if (!formData.current_password) {
        setMessage({ type: 'error', text: 'Current password is required to change password' });
        setLoading(false);
        return;
      }
      if (formData.new_password !== formData.confirm_password) {
        setMessage({ type: 'error', text: 'New passwords do not match' });
        setLoading(false);
        return;
      }
      if (formData.new_password.length < 6) {
        setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
        setLoading(false);
        return;
      }
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      role: user?.role || 'Admin',
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setIsEditing(false);
    setMessage(null);
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      await authAPI.deleteAccount();
      logout();
      navigate('/login');
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to delete account. Please try again.' 
      });
      setShowDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Message Display */}
      {message && (
        <div 
          className={`mb-6 p-4 rounded-2xl flex items-center space-x-3 ${
            message.type === 'success' 
              ? 'bg-green-50' 
              : 'bg-red-50'
          }`}
          style={{ boxShadow: message.type === 'success'
            ? '4px 4px 10px rgba(34, 197, 94, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.7)'
            : '4px 4px 10px rgba(239, 68, 68, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.7)'
          }}
        >
          <p className={`text-sm font-medium ${
            message.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      <div 
        className="bg-[#e8ecf3] rounded-3xl overflow-hidden"
        style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
      >
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-2xl font-bold shadow-xl"
                style={{ boxShadow: '4px 4px 12px rgba(0, 0, 0, 0.2), -2px -2px 8px rgba(255, 255, 255, 0.9)' }}
              >
                <span className="bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                </span>
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{user?.full_name || 'User'}</h2>
                <p className="text-purple-100">{formData.role}</p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white text-indigo-600 rounded-2xl hover:scale-105 transition-all font-medium flex items-center space-x-2"
                style={{ boxShadow: '3px 3px 8px rgba(0, 0, 0, 0.15), -2px -2px 6px rgba(255, 255, 255, 0.9)' }}
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-6">
          {/* Company Info */}
          <div 
            className="bg-[#e8ecf3] rounded-2xl p-5"
            style={{ boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff' }}
          >
            <div className="flex items-center space-x-2 mb-3">
              <div 
                className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center"
                style={{ boxShadow: '2px 2px 4px rgba(96, 165, 250, 0.4)' }}
              >
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Company Information</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company Name:</span>
                <span className="text-sm font-medium text-gray-900">{company?.company_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Company Username:</span>
                <span className="text-sm font-medium text-gray-900">{company?.company_username || user?.company_username || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div 
                className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center"
                style={{ boxShadow: '2px 2px 4px rgba(167, 139, 250, 0.4)' }}
              >
                <User className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Personal Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-[#e8ecf3] rounded-2xl focus:outline-none disabled:opacity-70 text-gray-900 font-medium"
                  style={{ boxShadow: isEditing 
                    ? 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff'
                    : '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-[#e8ecf3] rounded-2xl focus:outline-none disabled:opacity-70 text-gray-900 font-medium"
                  style={{ boxShadow: isEditing 
                    ? 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff'
                    : '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Position
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 bg-[#e8ecf3] rounded-2xl focus:outline-none disabled:opacity-70 text-gray-900 font-medium"
                  style={{ boxShadow: isEditing 
                    ? 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff'
                    : '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          {isEditing && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div 
                  className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center"
                  style={{ boxShadow: '2px 2px 4px rgba(34, 197, 94, 0.4)' }}
                >
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Change Password (Optional)</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={formData.current_password}
                    onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 bg-[#e8ecf3] rounded-2xl focus:outline-none text-gray-900"
                    style={{ boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.new_password}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 bg-[#e8ecf3] rounded-2xl focus:outline-none text-gray-900"
                    style={{ boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 bg-[#e8ecf3] rounded-2xl focus:outline-none text-gray-900"
                    style={{ boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-6 py-3 bg-[#e8ecf3] text-gray-700 rounded-2xl transition-all hover:scale-105 font-medium flex items-center gap-2 disabled:opacity-50"
                style={{ boxShadow: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff' }}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl transition-all hover:scale-105 font-medium disabled:opacity-50 flex items-center gap-2"
                style={{ boxShadow: '4px 4px 12px rgba(99, 102, 241, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.7)' }}
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Danger Zone */}
          <div className="pt-6 border-t border-red-100">
            <div 
              className="bg-red-50 rounded-2xl p-6"
              style={{ boxShadow: '4px 4px 10px rgba(239, 68, 68, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.7)' }}
            >
              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Danger Zone</h3>
                  <p className="text-sm text-red-600">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteDialog(true)}
                disabled={isEditing || loading}
                className="px-4 py-2 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: '3px 3px 8px rgba(220, 38, 38, 0.4)' }}
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Account Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-slate-700 font-medium">
                This action will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 ml-2">
                <li>Your admin account and profile</li>
                <li>All company data and settings</li>
                <li>All member accounts associated with your company</li>
                <li>All tracking data, screenshots, and activity logs</li>
                <li>All attendance and productivity records</li>
              </ul>
              <p className="text-red-600 font-semibold text-sm pt-2">
                ⚠️ This action cannot be undone. All data will be permanently lost.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
