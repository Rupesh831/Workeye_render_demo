// UPDATED: 2026-01-22 12:34 IST - Neumorphic design system
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  LogIn, 
  LogOut, 
  Activity, 
  Moon, 
  Power, 
  RefreshCw,
  Clock,
  Zap,
  AlertCircle,
  Search,
  Eye
} from 'lucide-react';
import { AttendanceDetailView } from './AttendanceDetailView';

interface MemberAttendance {
  id: number;
  name: string;
  email: string;
  position?: string;
  department?: string;
  status: 'active' | 'idle' | 'offline';
  is_punched_in: boolean;
  punch_in_time: string | null;
  punch_out_time: string | null;
  today_hours: number;
}

export function AttendancePage() {
  const navigate = useNavigate();
  const [membersData, setMembersData] = useState<MemberAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<{ id: number; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAttendanceData();
    const interval = setInterval(loadAttendanceData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAttendanceData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://workeye-render-demo-backend.onrender.com'}/api/attendance/members`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch attendance data');

      const data = await response.json();
      setMembersData(data.success && data.members ? data.members : []);
    } catch (err: any) {
      console.error('Error loading attendance:', err);
      setError(err.message || 'Failed to load attendance data');
      setMembersData([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalMembers: membersData.length,
    punchedIn: membersData.filter(m => m.is_punched_in).length,
    punchedOut: membersData.filter(m => !m.is_punched_in && m.punch_in_time).length,
    active: membersData.filter(m => m.status === 'active').length,
    idle: membersData.filter(m => m.status === 'idle').length,
    offline: membersData.filter(m => m.status === 'offline').length,
  };

  const filteredMembers = membersData.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.position && member.position.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatHours = (hours: number) => {
    if (hours === 0) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') return 'neu-badge-success';
    if (status === 'idle') return 'neu-badge-warning';
    return 'neu-badge-danger';
  };

  if (selectedMember) {
    return <AttendanceDetailView member={selectedMember} onBack={() => setSelectedMember(null)} />;
  }

  return (
    <div style={{ minHeight: '100vh', padding: '32px' }}>
      {error && (
        <div className="neu-card" style={{ marginBottom: '24px', padding: '16px', background: 'linear-gradient(145deg, #fecaca, #fca5a5)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <AlertCircle style={{ width: '20px', height: '20px', color: '#7f1d1d', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#7f1d1d', margin: 0, marginBottom: '4px' }}>Error</p>
            <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="neu-card-flat" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div className="neu-icon-box-sm" style={{ background: 'linear-gradient(145deg, #93c5fd, #60a5fa)' }}>
              <Users style={{ width: '20px', height: '20px', color: '#1e3a8a' }} />
            </div>
            <h3 className="neu-title" style={{ fontSize: '28px', margin: 0 }}>{stats.totalMembers}</h3>
          </div>
          <p className="neu-text-muted" style={{ margin: 0 }}>Total Members</p>
        </div>

        <div className="neu-card-flat" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div className="neu-icon-box-sm" style={{ background: 'linear-gradient(145deg, #86efac, #6ee7b7)' }}>
              <LogIn style={{ width: '20px', height: '20px', color: '#065f46' }} />
            </div>
            <h3 className="neu-title" style={{ fontSize: '28px', margin: 0 }}>{stats.punchedIn}</h3>
          </div>
          <p className="neu-text-muted" style={{ margin: 0 }}>Punched In</p>
        </div>

        <div className="neu-card-flat" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div className="neu-icon-box-sm" style={{ background: 'linear-gradient(145deg, #fdba74, #fb923c)' }}>
              <LogOut style={{ width: '20px', height: '20px', color: '#7c2d12' }} />
            </div>
            <h3 className="neu-title" style={{ fontSize: '28px', margin: 0 }}>{stats.punchedOut}</h3>
          </div>
          <p className="neu-text-muted" style={{ margin: 0 }}>Punched Out</p>
        </div>

        <div className="neu-card-flat" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div className="neu-icon-box-sm" style={{ background: 'linear-gradient(145deg, #c4b5fd, #a78bfa)' }}>
              <Zap style={{ width: '20px', height: '20px', color: '#5b21b6' }} />
            </div>
            <h3 className="neu-title" style={{ fontSize: '28px', margin: 0 }}>{stats.active}</h3>
          </div>
          <p className="neu-text-muted" style={{ margin: 0 }}>Active Now</p>
        </div>

        <div className="neu-card-flat" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div className="neu-icon-box-sm" style={{ background: 'linear-gradient(145deg, #fde047, #fbbf24)' }}>
              <Moon style={{ width: '20px', height: '20px', color: '#78350f' }} />
            </div>
            <h3 className="neu-title" style={{ fontSize: '28px', margin: 0 }}>{stats.idle}</h3>
          </div>
          <p className="neu-text-muted" style={{ margin: 0 }}>Idle</p>
        </div>

        <div className="neu-card-flat" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div className="neu-icon-box-sm" style={{ background: 'linear-gradient(145deg, #cbd5e1, #94a3b8)' }}>
              <Power style={{ width: '20px', height: '20px', color: '#334155' }} />
            </div>
            <h3 className="neu-title" style={{ fontSize: '28px', margin: 0 }}>{stats.offline}</h3>
          </div>
          <p className="neu-text-muted" style={{ margin: 0 }}>Offline</p>
        </div>
      </div>

      {/* Members Table */}
      <div className="neu-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(190, 195, 201, 0.3)' }}>
          <div>
            <h3 className="neu-title" style={{ fontSize: '20px', marginBottom: '4px' }}>Attendance Records</h3>
            <p className="neu-text-muted" style={{ margin: 0 }}>{filteredMembers.length} members</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <Search style={{ position: 'absolute', width: '18px', height: '18px', color: '#64748b', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neu-input"
                style={{ width: '100%', paddingLeft: '42px', paddingRight: '12px' }}
              />
            </div>
            <button
              onClick={loadAttendanceData}
              disabled={loading}
              className="neu-btn-accent"
              style={{ padding: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <RefreshCw style={{ width: '20px', height: '20px' }} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }} className="animate-spin"></div>
            <p className="neu-text" style={{ fontWeight: 600 }}>Loading attendance...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Users style={{ width: '64px', height: '64px', color: '#cbd5e1', margin: '0 auto 16px' }} />
            <h3 className="neu-title" style={{ fontSize: '18px', marginBottom: '8px' }}>
              {searchQuery ? 'No members found' : 'No attendance data'}
            </h3>
            <p className="neu-text-muted">
              {searchQuery ? 'Try adjusting your search' : 'Attendance data will appear here'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="neu-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Hours</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
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
                      <span className={`neu-badge ${getStatusBadge(member.status)}`}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', marginRight: '6px', background: 'currentColor' }}></span>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className="neu-text" style={{ fontSize: '14px', fontWeight: 600 }}>{formatTime(member.punch_in_time)}</span>
                    </td>
                    <td>
                      <span className="neu-text" style={{ fontSize: '14px', fontWeight: 600 }}>{formatTime(member.punch_out_time)}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#6366f1' }}>{formatHours(member.today_hours)}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedMember({ id: member.id, name: member.name })}
                          className="neu-btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Eye style={{ width: '14px', height: '14px' }} />
                          <span>View</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
