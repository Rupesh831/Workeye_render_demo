// UPDATED: 2026-01-22 00:41 IST - Fixed button colors and modal positioning
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, Loader2, UserPlus, Mail, User, Briefcase, Building, CheckCircle, AlertCircle, Users, Search, Download } from 'lucide-react';
import { members as membersAPI, dashboard as dashboardAPI } from '@/config/api';

interface Member {
  id: number;
  email: string;
  name: string;
  position?: string;
  department?: string;
  status: 'active' | 'idle' | 'offline';
  is_active: boolean;
  created_at: string;
  device_count?: number;
  last_activity_at?: string;
}

interface MembersManagementProps {
  companyUsername: string;
  companyId: number;
  onMembersUpdate?: () => void;
}

export function MembersManagement({ companyUsername, companyId, onMembersUpdate }: MembersManagementProps) {
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingTracker, setDownloadingTracker] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    position: '',
    department: ''
  });

  const loadMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      const [membersResponse, dashboardResponse] = await Promise.all([
        membersAPI.getAll(),
        dashboardAPI.getStats()
      ]);

      if (membersResponse.success && membersResponse.members) {
        const statusMap = new Map<number, 'active' | 'idle' | 'offline'>();
        
        if (dashboardResponse?.members) {
          dashboardResponse.members.forEach((dashMember: any) => {
            const status = (dashMember.status || '').toLowerCase();
            if (status === 'active' || status === 'idle' || status === 'offline') {
              statusMap.set(dashMember.id, status as 'active' | 'idle' | 'offline');
            }
          });
        }

        const membersWithStatus: Member[] = membersResponse.members.map(m => ({
          ...m,
          status: statusMap.get(m.id) || 'offline'
        }));
        
        setMembersList(membersWithStatus);
      } else {
        setMembersList([]);
      }
    } catch (err: any) {
      console.error('Error loading members:', err);
      setError(err.message || 'Failed to load members');
      setMembersList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    const intervalId = setInterval(() => {
      loadMembers();
    }, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const resetForm = () => {
    setFormData({ email: '', name: '', position: '', department: '' });
    setError(null);
    setSuccess(null);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await membersAPI.create(formData);
      setSuccess('Member added successfully!');
      setShowAddModal(false);
      resetForm();
      await loadMembers();
      onMembersUpdate?.();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await membersAPI.update(editingMember.id, formData);
      setSuccess('Member updated successfully!');
      setEditingMember(null);
      resetForm();
      await loadMembers();
      onMembersUpdate?.();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member? This action cannot be undone.')) {
      return;
    }

    try {
      await membersAPI.delete(memberId);
      setSuccess('Member removed successfully!');
      await loadMembers();
      onMembersUpdate?.();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete member');
    }
  };

  const handleDownloadTracker = async () => {
    setDownloadingTracker(true);
    setError(null);

    try {
      const response = await membersAPI.downloadTracker();

      if (response.success && response.download_url) {
        const link = document.createElement('a');
        link.href = response.download_url;
        link.download = response.filename || 'WorkEye-Tracker.py';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSuccess('Tracker downloaded successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.error || 'Failed to generate tracker');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to download tracker');
      setTimeout(() => setError(null), 5000);
    } finally {
      setDownloadingTracker(false);
    }
  };

  const handleEditClick = (member: Member) => {
    setEditingMember(member);
    setFormData({
      email: member.email,
      name: member.name,
      position: member.position || '',
      department: member.department || ''
    });
    setError(null);
    setSuccess(null);
  };

  const getStatusBadge = (status: 'active' | 'idle' | 'offline') => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      idle: 'bg-yellow-100 text-yellow-700',
      offline: 'bg-slate-100 text-slate-600'
    };
    
    const labels = {
      active: 'Active',
      idle: 'Idle',
      offline: 'Offline'
    };
    
    return {
      className: styles[status] || styles.offline,
      label: labels[status] || 'Offline'
    };
  };

  const filteredMembers = membersList.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.position && member.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (member.department && member.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6">
      {/* Success/Error Messages */}
      {success && (
        <div 
          className="mb-6 p-4 bg-green-50 rounded-2xl flex items-center gap-3"
          style={{ boxShadow: '4px 4px 10px rgba(34, 197, 94, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.7)' }}
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div 
          className="mb-6 p-4 bg-orange-50 rounded-2xl flex items-center gap-3"
          style={{ boxShadow: '4px 4px 10px rgba(251, 146, 60, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.7)' }}
        >
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <p className="text-sm font-medium text-orange-800">{error}</p>
        </div>
      )}

      {/* Header Actions */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1" style={{ maxWidth: '28rem' }}>
          <Search className="absolute w-5 h-5 text-slate-400" style={{ left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 rounded-2xl focus:outline-none text-slate-900"
            style={{ paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff' }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadTracker}
            disabled={downloadingTracker}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl transition-all hover:shadow-lg font-medium flex items-center gap-2 disabled:opacity-50"
            style={{ boxShadow: '4px 4px 12px rgba(34, 197, 94, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.7)' }}
          >
            {downloadingTracker ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download Tracker</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl transition-all hover:shadow-lg font-medium flex items-center gap-2"
            style={{ boxShadow: '4px 4px 12px rgba(99, 102, 241, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.7)' }}
          >
            <Plus className="w-5 h-5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Members Table */}
      {loading ? (
        <div 
          className="bg-slate-50 rounded-3xl p-12 text-center"
          style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
        >
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ margin: '0 auto 1rem' }}></div>
          <p className="text-slate-600 font-medium">Loading members...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div 
          className="bg-slate-50 rounded-3xl p-12 text-center"
          style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
        >
          <Users className="w-16 h-16 text-slate-300" style={{ margin: '0 auto 1rem' }} />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {searchQuery ? 'No members found' : 'No members yet'}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchQuery
              ? 'Try adjusting your search criteria'
              : 'Add your first team member to get started'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl transition-all hover:shadow-lg font-medium"
              style={{ boxShadow: '4px 4px 12px rgba(99, 102, 241, 0.4)' }}
            >
              <UserPlus className="w-5 h-5" />
              <span>Add Your First Member</span>
            </button>
          )}
        </div>
      ) : (
        <div 
          className="bg-slate-50 rounded-3xl overflow-hidden"
          style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600" style={{ textTransform: 'uppercase' }}>Member</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600" style={{ textTransform: 'uppercase' }}>Position</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600" style={{ textTransform: 'uppercase' }}>Department</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600" style={{ textTransform: 'uppercase' }}>Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600" style={{ textTransform: 'uppercase' }}>Devices</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600" style={{ textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: '1px solid #e2e8f0' }}>
                {filteredMembers.map((member, idx) => {
                  const statusBadge = getStatusBadge(member.status);
                  return (
                    <tr key={member.id} className="hover:bg-slate-100 transition-colors" style={{ borderBottom: idx < filteredMembers.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold"
                            style={{ boxShadow: '3px 3px 6px rgba(99, 102, 241, 0.4)' }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{member.name}</p>
                            <p className="text-sm text-slate-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{member.position || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{member.department || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{member.device_count || 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2" style={{ justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleEditClick(member)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Edit member"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal - FIXED: Proper centered overlay */}
      {(showAddModal || editingMember) && (
        <div className="fixed z-50 overflow-y-auto" style={{ inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="flex items-center justify-center" style={{ minHeight: '100vh', padding: '1rem' }}>
            <div 
              className="bg-slate-50 rounded-3xl w-full"
              style={{ maxWidth: '28rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff' }}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                  <span>{editingMember ? 'Edit Member' : 'Add New Member'}</span>
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMember(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Modal Body */}
              <form
                onSubmit={editingMember ? handleUpdateMember : handleAddMember}
                className="p-6 gap-5"
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Mail className="w-4 h-4 text-slate-400" style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:outline-none text-slate-900"
                    style={{ boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff' }}
                    placeholder="john.doe@company.com"
                    disabled={!!editingMember}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <User className="w-4 h-4 text-slate-400" style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:outline-none text-slate-900"
                    style={{ boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff' }}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Briefcase className="w-4 h-4 text-slate-400" style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Position
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:outline-none text-slate-900"
                    style={{ boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff' }}
                    placeholder="Software Developer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Building className="w-4 h-4 text-slate-400" style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-2xl focus:outline-none text-slate-900"
                    style={{ boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff' }}
                    placeholder="Engineering"
                  />
                </div>

                {error && (
                  <div 
                    className="bg-orange-50 rounded-2xl p-3 flex items-center gap-2"
                    style={{ boxShadow: '2px 2px 6px rgba(251, 146, 60, 0.2)' }}
                  >
                    <AlertCircle className="w-4 h-4 text-orange-600" style={{ flexShrink: 0 }} />
                    <p className="text-sm text-orange-800">{error}</p>
                  </div>
                )}

                <div className="flex gap-3" style={{ paddingTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingMember(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 bg-slate-50 text-slate-700 rounded-2xl transition-all hover:shadow-md font-medium"
                    style={{ boxShadow: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff' }}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl transition-all hover:shadow-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ boxShadow: '4px 4px 12px rgba(99, 102, 241, 0.4)' }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{editingMember ? 'Updating...' : 'Adding...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>{editingMember ? 'Update Member' : 'Add Member'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
