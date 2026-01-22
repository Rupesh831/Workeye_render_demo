// UPDATED: 2026-01-22 12:12 IST - Neumorphic design system
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  const isModalOpen = showAddModal || !!editingMember;

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (!isModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isModalOpen]);

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

  const closeModal = () => {
    setShowAddModal(false);
    setEditingMember(null);
    resetForm();
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await membersAPI.create(formData);
      setSuccess('Member added successfully!');
      closeModal();
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
      closeModal();
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
      active: 'neu-badge-success',
      idle: 'neu-badge-warning',
      offline: 'neu-badge-danger'
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

  const modal = isModalOpen
    ? createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            overflowY: 'auto'
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div className="neu-card" style={{ width: '100%', maxWidth: '28rem', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto' }}>
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(190, 195, 201, 0.3)' }}>
                <h3 className="neu-title" style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <UserPlus style={{ width: '24px', height: '24px', color: '#6366f1' }} />
                  <span>{editingMember ? 'Edit Member' : 'Add New Member'}</span>
                </h3>
                <button onClick={closeModal} className="neu-btn-sm" style={{ padding: '8px' }}>
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={editingMember ? handleUpdateMember : handleAddMember} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="neu-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Mail style={{ width: '14px', height: '14px' }} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="neu-input"
                    style={{ width: '100%' }}
                    placeholder="john.doe@company.com"
                    disabled={!!editingMember}
                  />
                </div>

                <div>
                  <label className="neu-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <User style={{ width: '14px', height: '14px' }} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="neu-input"
                    style={{ width: '100%' }}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="neu-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Briefcase style={{ width: '14px', height: '14px' }} />
                    Position
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="neu-input"
                    style={{ width: '100%' }}
                    placeholder="Software Developer"
                  />
                </div>

                <div>
                  <label className="neu-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Building style={{ width: '14px', height: '14px' }} />
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="neu-input"
                    style={{ width: '100%' }}
                    placeholder="Engineering"
                  />
                </div>

                {error && (
                  <div style={{ background: 'linear-gradient(145deg, #fed7aa, #fdba74)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle style={{ width: '16px', height: '16px', color: '#7c2d12', flexShrink: 0 }} />
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#7c2d12', margin: 0 }}>{error}</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                  <button type="button" onClick={closeModal} className="neu-btn" style={{ flex: 1 }} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="neu-btn-accent" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {submitting ? (
                      <>
                        <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                        <span>{editingMember ? 'Updating...' : 'Adding...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle style={{ width: '16px', height: '16px' }} />
                        <span>{editingMember ? 'Update' : 'Add Member'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div style={{ minHeight: '100vh', padding: '32px' }}>
      {/* Success/Error Messages */}
      {success && (
        <div className="neu-card" style={{ marginBottom: '24px', padding: '16px', background: 'linear-gradient(145deg, #d1fae5, #a7f3d0)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle style={{ width: '20px', height: '20px', color: '#065f46' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#065f46', margin: 0 }}>{success}</p>
        </div>
      )}

      {error && !isModalOpen && (
        <div className="neu-card" style={{ marginBottom: '24px', padding: '16px', background: 'linear-gradient(145deg, #fed7aa, #fdba74)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle style={{ width: '20px', height: '20px', color: '#7c2d12' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#7c2d12', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Header Actions */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 auto', maxWidth: '400px' }}>
          <Search style={{ position: 'absolute', width: '20px', height: '20px', color: '#64748b', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neu-input"
            style={{ width: '100%', paddingLeft: '48px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={handleDownloadTracker} disabled={downloadingTracker} className="neu-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(145deg, #86efac, #6ee7b7)', color: '#065f46' }}>
            {downloadingTracker ? (
              <>
                <Loader2 style={{ width: '20px', height: '20px' }} className="animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download style={{ width: '20px', height: '20px' }} />
                <span>Download Tracker</span>
              </>
            )}
          </button>

          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="neu-btn-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Plus style={{ width: '20px', height: '20px' }} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Members Table */}
      {loading ? (
        <div className="neu-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }} className="animate-spin"></div>
          <p className="neu-text" style={{ fontWeight: 600 }}>Loading members...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="neu-card" style={{ padding: '48px', textAlign: 'center' }}>
          <Users style={{ width: '64px', height: '64px', color: '#cbd5e1', margin: '0 auto 16px' }} />
          <h3 className="neu-title" style={{ fontSize: '18px', marginBottom: '8px' }}>
            {searchQuery ? 'No members found' : 'No members yet'}
          </h3>
          <p className="neu-text-muted" style={{ marginBottom: '24px' }}>
            {searchQuery ? 'Try adjusting your search criteria' : 'Add your first team member to get started'}
          </p>
          {!searchQuery && (
            <button onClick={() => { resetForm(); setShowAddModal(true); }} className="neu-btn-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus style={{ width: '20px', height: '20px' }} />
              <span>Add Your First Member</span>
            </button>
          )}
        </div>
      ) : (
        <div className="neu-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="neu-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Devices</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const statusBadge = getStatusBadge(member.status);
                  return (
                    <tr key={member.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(145deg, #7477ff, #5558d9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '16px',
                            boxShadow: '3px 3px 6px rgba(99, 102, 241, 0.4)'
                          }}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="neu-title" style={{ fontSize: '14px', marginBottom: '2px' }}>{member.name}</p>
                            <p className="neu-text-muted" style={{ fontSize: '12px' }}>{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="neu-text" style={{ fontSize: '14px' }}>{member.position || '-'}</span>
                      </td>
                      <td>
                        <span className="neu-text" style={{ fontSize: '14px' }}>{member.department || '-'}</span>
                      </td>
                      <td>
                        <span className={`neu-badge ${statusBadge.className}`}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', marginRight: '6px', background: 'currentColor' }}></span>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td>
                        <span className="neu-text" style={{ fontSize: '14px' }}>{member.device_count || 0}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => handleEditClick(member)} className="neu-btn-sm" title="Edit member" style={{ padding: '8px' }}>
                            <Edit style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button onClick={() => handleDeleteMember(member.id)} className="neu-btn-sm" title="Remove member" style={{ padding: '8px', background: 'linear-gradient(145deg, #fca5a5, #f87171)', color: '#7f1d1d' }}>
                            <Trash2 style={{ width: '16px', height: '16px' }} />
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

      {/* Modal */}
      {modal}
    </div>
  );
}
