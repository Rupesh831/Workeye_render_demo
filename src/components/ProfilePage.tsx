// UPDATED: 2026-01-22 11:57 IST - Neumorphic design system
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Save, X, Building2, Mail, User, Shield, Briefcase, Trash2, AlertTriangle } from 'lucide-react';
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
    <div style={{ minHeight: '100vh', padding: '32px' }}>
      {/* Message Display */}
      {message && (
        <div 
          className="neu-card"
          style={{ 
            marginBottom: '24px',
            padding: '16px',
            background: message.type === 'success' ? 'linear-gradient(145deg, #d1fae5, #a7f3d0)' : 'linear-gradient(145deg, #fecaca, #fca5a5)',
          }}
        >
          <p style={{ 
            fontSize: '14px', 
            fontWeight: 600,
            color: message.type === 'success' ? '#065f46' : '#7f1d1d',
            margin: 0
          }}>
            {message.text}
          </p>
        </div>
      )}

      <div className="neu-card" style={{ overflow: 'hidden', maxWidth: '900px', margin: '0 auto' }}>
        {/* Profile Header */}
        <div style={{ 
          background: 'linear-gradient(145deg, #7477ff, #5558d9)',
          padding: '32px 24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--neu-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 800,
                color: '#6366f1',
                boxShadow: '6px 6px 12px rgba(0,0,0,0.2), -3px -3px 8px rgba(255,255,255,0.8)'
              }}>
                {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
              </div>
              <div style={{ color: 'white' }}>
                <h1 className="neu-title" style={{ fontSize: '32px', margin: 0, marginBottom: '4px', color: 'white' }}>
                  {user?.full_name || 'User'}
                </h1>
                <p style={{ fontSize: '14px', color: '#e0e7ff', margin: 0 }}>{formData.role}</p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="neu-btn"
                style={{ 
                  background: 'white',
                  color: '#6366f1',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Edit style={{ width: '16px', height: '16px' }} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Company Info */}
          <div className="neu-inset" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div className="neu-icon-box-sm" style={{ background: 'linear-gradient(145deg, #93c5fd, #60a5fa)' }}>
                <Building2 style={{ width: '20px', height: '20px', color: '#1e3a8a' }} />
              </div>
              <h2 className="neu-title" style={{ fontSize: '18px', margin: 0 }}>Company Information</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="neu-text-muted">Company Name:</span>
                <span className="neu-title" style={{ fontSize: '14px' }}>{company?.company_name || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="neu-text-muted">Company Username:</span>
                <span className="neu-title" style={{ fontSize: '14px' }}>{company?.company_username || user?.company_username || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div className="neu-icon-box-sm" style={{ background: 'linear-gradient(145deg, #c4b5fd, #a78bfa)' }}>
                <User style={{ width: '20px', height: '20px', color: '#5b21b6' }} />
              </div>
              <h2 className="neu-title" style={{ fontSize: '18px', margin: 0 }}>Personal Information</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="neu-subtitle" style={{ display: 'block', marginBottom: '8px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={!isEditing}
                  className={isEditing ? 'neu-input' : 'neu-btn'}
                  style={{ width: '100%', opacity: isEditing ? 1 : 0.7 }}
                />
              </div>

              <div>
                <label className="neu-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Mail style={{ width: '14px', height: '14px' }} />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className={isEditing ? 'neu-input' : 'neu-btn'}
                  style={{ width: '100%', opacity: isEditing ? 1 : 0.7 }}
                />
              </div>

              <div>
                <label className="neu-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Briefcase style={{ width: '14px', height: '14px' }} />
                  Position
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={!isEditing}
                  className={isEditing ? 'neu-input' : 'neu-btn'}
                  style={{ width: '100%', opacity: isEditing ? 1 : 0.7 }}
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          {isEditing && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div className="neu-icon-box-sm" style={{ background: 'linear-gradient(145deg, #86efac, #6ee7b7)' }}>
                  <Shield style={{ width: '20px', height: '20px', color: '#065f46' }} />
                </div>
                <h2 className="neu-title" style={{ fontSize: '18px', margin: 0 }}>Change Password (Optional)</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '8px' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={formData.current_password}
                    onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                    placeholder="Enter current password"
                    className="neu-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '8px' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.new_password}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                    placeholder="Enter new password"
                    className="neu-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="neu-subtitle" style={{ display: 'block', marginBottom: '8px' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    placeholder="Confirm new password"
                    className="neu-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid rgba(190, 195, 201, 0.3)' }}>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="neu-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <X style={{ width: '16px', height: '16px' }} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="neu-btn-accent"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Save style={{ width: '16px', height: '16px' }} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Danger Zone */}
          <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(190, 195, 201, 0.3)' }}>
            <div style={{ 
              background: 'linear-gradient(145deg, #fecaca, #fca5a5)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '4px 4px 10px rgba(239, 68, 68, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.7)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <AlertTriangle style={{ width: '20px', height: '20px', color: '#7f1d1d', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#7f1d1d', marginBottom: '8px' }}>Danger Zone</h3>
                  <p style={{ fontSize: '13px', color: '#991b1b', margin: 0, lineHeight: 1.6 }}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteDialog(true)}
                disabled={isEditing || loading}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(145deg, #dc2626, #b91c1c)',
                  color: 'white',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: isEditing || loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isEditing || loading ? 0.5 : 1,
                  boxShadow: '3px 3px 8px rgba(220, 38, 38, 0.4)'
                }}
              >
                <Trash2 style={{ width: '16px', height: '16px' }} />
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
