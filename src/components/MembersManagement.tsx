import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, Loader2, UserPlus, Mail, User, Briefcase, Building, CheckCircle, AlertCircle, Users, Search, Download } from 'lucide-react';
import { members as membersAPI, dashboard as dashboardAPI } from '@/config/api';

// FIXED: Interface matches backend response exactly (snake_case)
interface Member {
  id: number;
  email: string;
  name: string;
  position?: string;
  department?: string;
  status: 'active' | 'idle' | 'offline';  // Real-time status from dashboard
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

  // Load members with real-time status from dashboard
  const loadMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading members...');
      
      // Fetch both members list and dashboard stats to get real-time status
      const [membersResponse, dashboardResponse] = await Promise.all([
        membersAPI.getAll(),
        dashboardAPI.getStats()
      ]);
      
      console.log('Members Response:', membersResponse);
      console.log('Dashboard Response:', dashboardResponse);

      if (membersResponse.success && membersResponse.members) {
        // Create a status map from dashboard data
        const statusMap = new Map<number, 'active' | 'idle' | 'offline'>();
        
        if (dashboardResponse?.members) {
          dashboardResponse.members.forEach((dashMember: any) => {
            const status = (dashMember.status || '').toLowerCase();
            if (status === 'active' || status === 'idle' || status === 'offline') {
              statusMap.set(dashMember.id, status as 'active' | 'idle' | 'offline');
            }
          });
        }

        // Merge members with real-time status from dashboard
        const membersWithStatus: Member[] = membersResponse.members.map(m => ({
          ...m,
          status: statusMap.get(m.id) || 'offline' // Use dashboard status or default to offline
        }));
        
        setMembersList(membersWithStatus);
      } else if (membersResponse.members) {
        // Handle case where success field might be missing
        const membersWithStatus: Member[] = membersResponse.members.map(m => ({
          ...m,
          status: 'offline'
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
    
    // Refresh status every 30 seconds for real-time updates
    const intervalId = setInterval(() => {
      loadMembers();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      position: '',
      department: ''
    });
    setError(null);
    setSuccess(null);
  };

  // Add member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Creating member:', formData);
      const response = await membersAPI.create(formData);
      console.log('Member created:', response);

      setSuccess('Member added successfully!');
      setShowAddModal(false);
      resetForm();
      await loadMembers();
      onMembersUpdate?.();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error adding member:', err);
      setError(err.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  // Update member
  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Updating member:', editingMember.id, formData);
      await membersAPI.update(editingMember.id, formData);

      setSuccess('Member updated successfully!');
      setEditingMember(null);
      resetForm();
      await loadMembers();
      onMembersUpdate?.();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating member:', err);
      setError(err.message || 'Failed to update member');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete member
  const handleDeleteMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Deleting member:', memberId);
      await membersAPI.delete(memberId);

      setSuccess('Member removed successfully!');
      await loadMembers();
      onMembersUpdate?.();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting member:', err);
      setError(err.message || 'Failed to delete member');
    }
  };

  // Download tracker
  const handleDownloadTracker = async () => {
    setDownloadingTracker(true);
    setError(null);

    try {
      console.log('Downloading tracker...');
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
      console.error('Error downloading tracker:', err);
      setError(err.message || 'Failed to download tracker');
      setTimeout(() => setError(null), 5000);
    } finally {
      setDownloadingTracker(false);
    }
  };

  // Open edit modal
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

  // Get status badge styling
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

  // Filter members
  const filteredMembers = membersList.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.position && member.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (member.department && member.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Team Members
            </h2>
            <p className="text-slate-600 mt-1">Manage your team members and their access</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Download Tracker Button */}
            <button
              onClick={handleDownloadTracker}
              disabled={downloadingTracker}
              className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              title="Download tracker application for members"
            >
              {downloadingTracker ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Tracker
                </>
              )}
            </button>

            {/* Add Member Button */}
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold hover:scale-105"
            >
              <Plus className="w-6 h-6" />
              Add Member
            </button>
          </div>
        </div>

        {/* Search - FIXED: Adjusted padding to prevent icon overlap */}
        <div className="mt-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search members by name, email, position, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800 font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Members Table */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-12 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading members...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-12 text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {searchQuery ? 'No members found' : 'No members yet'}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchQuery
              ? 'Try adjusting your search criteria'
              : 'Add your first team member to get started with tracking'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-medium hover:scale-105"
            >
              <UserPlus className="w-5 h-5" />
              Add Your First Member
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Devices
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => {
                  const statusBadge = getStatusBadge(member.status);
                  return (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{member.name}</p>
                            <p className="text-sm text-slate-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {member.position || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {member.department || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {member.device_count || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(member)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit member"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete member"
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

      {/* Add/Edit Modal */}
      {(showAddModal || editingMember) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-blue-600" />
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingMember(null);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={editingMember ? handleUpdateMember : handleAddMember}
              className="p-6 space-y-5"
            >
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2 text-slate-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="john.doe@company.com"
                  disabled={!!editingMember}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Used for tracker login and notifications
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <User className="w-4 h-4 inline mr-2 text-slate-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-2 text-slate-400" />
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Software Developer"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Building className="w-4 h-4 inline mr-2 text-slate-400" />
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Engineering"
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMember(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingMember ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {editingMember ? 'Update Member' : 'Add Member'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
