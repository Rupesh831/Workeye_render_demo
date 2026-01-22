// UPDATED: 2026-01-22 11:25 IST - Neumorphism design system applied
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeeOverviewTable } from './EmployeeOverviewTable';
import { 
  Activity, 
  Users, 
  TrendingUp,
  MapPin,
  Target,
  UserX,
  Camera,
  Clock,
  RefreshCw
} from 'lucide-react';

interface Employee {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: 'active' | 'idle' | 'offline';
  screenTime: number;
  activeTime: number;
  idleTime: number;
  lastActivity: string;
  productivity: number;
  screenshots: any[];
  screenshotsCount?: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'idle' | 'offline'>('');

  const normalizeEmployee = (member: any): Employee => {
    const screenTimeSeconds = member.screen_time || 0;
    const activeTimeSeconds = member.active_time || 0;
    const idleTimeSeconds = member.idle_time || 0;
    
    const screenTime = screenTimeSeconds / 3600;
    const activeTime = activeTimeSeconds / 3600;
    const idleTime = idleTimeSeconds / 3600;
    
    let status: 'active' | 'idle' | 'offline' = 'offline';
    const rawStatus = (member.status || '').toLowerCase().trim();
    
    if (rawStatus === 'active') {
      status = 'active';
    } else if (rawStatus === 'idle') {
      status = 'idle';
    } else if (rawStatus === 'offline') {
      status = 'offline';
    } else {
      const lastActivityAt = member.last_activity_at || member.last_heartbeat_at;
      if (lastActivityAt) {
        const timeSinceActivity = Date.now() - new Date(lastActivityAt).getTime();
        const minutesSinceActivity = timeSinceActivity / 60000;
        
        if (minutesSinceActivity < 2) {
          status = 'active';
        } else if (minutesSinceActivity < 10) {
          status = 'idle';
        } else {
          status = 'offline';
        }
      }
    }
    
    return {
      id: member.id,
      name: member.name || 'Unknown',
      email: member.email || 'no-email@example.com',
      avatar: member.avatar || '',
      role: member.position || 'Member',
      status: status,
      screenTime: screenTime,
      activeTime: activeTime,
      idleTime: idleTime,
      lastActivity: member.last_activity || 'Never',
      productivity: member.productivity || 0,
      screenshots: member.screenshots || [],
      screenshotsCount: member.screenshots_count || 0
    };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      const url = `/api/dashboard/stats${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://workeye-render-demo-backend.onrender.com'}${url}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      
      if (data?.members) {
        const normalized = data.members.map(normalizeEmployee);
        setMembers(normalized);
      }
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.status === 'active').length;
    const idle = members.filter(m => m.status === 'idle').length;
    const offline = members.filter(m => m.status === 'offline').length;
    
    const totalScreenTime = members.reduce((sum, m) => sum + m.screenTime, 0);
    const avgScreenTime = total > 0 ? (totalScreenTime / total) : 0;
    
    const totalProductivity = members.reduce((sum, m) => sum + m.productivity, 0);
    const avgProductivity = total > 0 ? (totalProductivity / total) : 0;
    
    const activeRate = total > 0 ? ((active / total) * 100) : 0;
    
    const totalScreenshots = members.reduce((sum, m) => sum + (m.screenshotsCount || 0), 0);
    
    return {
      total,
      active,
      idle,
      offline,
      avgScreenTime: avgScreenTime.toFixed(1),
      avgProductivity: Math.round(avgProductivity),
      activeRate: activeRate.toFixed(1),
      totalScreenshots
    };
  }, [members]);

  return (
    <div style={{ minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="neu-title" style={{ fontSize: '32px', margin: 0 }}>Analytics</h1>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="neu-btn-accent"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}
        >
          <RefreshCw style={{ width: '16px', height: '16px' }} className={loading ? 'rotate-animation' : ''} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Refresh</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top 3 KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {/* Total Employees */}
          <div className="neu-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <p className="neu-subtitle" style={{ marginBottom: '8px' }}>TOTAL EMPLOYEES</p>
                <h2 className="neu-title" style={{ fontSize: '36px', margin: 0 }}>{stats.total}</h2>
              </div>
              <div className="neu-icon-box" style={{ background: 'linear-gradient(145deg, #c4b5fd, #a78bfa)' }}>
                <Users style={{ width: '24px', height: '24px', color: '#5b21b6' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp style={{ width: '14px', height: '14px', color: '#10b981' }} />
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>7265.4% increase</span>
            </div>
          </div>

          {/* Active Rate */}
          <div className="neu-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <p className="neu-subtitle" style={{ marginBottom: '8px' }}>ACTIVE RATE</p>
                <h2 className="neu-title" style={{ fontSize: '36px', margin: 0 }}>{stats.activeRate}%</h2>
              </div>
              <div className="neu-icon-box" style={{ background: 'linear-gradient(145deg, #86efac, #6ee7b7)' }}>
                <Activity style={{ width: '24px', height: '24px', color: '#065f46' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp style={{ width: '14px', height: '14px', color: '#10b981' }} />
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>2.3% increase</span>
            </div>
          </div>

          {/* Avg Productivity */}
          <div className="neu-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <p className="neu-subtitle" style={{ marginBottom: '8px' }}>AVG PRODUCTIVITY</p>
                <h2 className="neu-title" style={{ fontSize: '36px', margin: 0 }}>{stats.avgProductivity}%</h2>
              </div>
              <div className="neu-icon-box" style={{ background: 'linear-gradient(145deg, #67e8f9, #22d3ee)' }}>
                <Target style={{ width: '24px', height: '24px', color: '#164e63' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp style={{ width: '14px', height: '14px', color: '#10b981' }} />
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>5.1% increase</span>
            </div>
          </div>
        </div>

        {/* 6 Secondary Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          <div className="neu-card-flat" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div className="neu-icon-box-sm" style={{ background: 'linear-gradient(145deg, #c4b5fd, #a78bfa)' }}>
                <Users style={{ width: '20px', height: '20px', color: '#5b21b6' }} />
              </div>
              <h3 className="neu-title" style={{ fontSize: '24px', margin: 0 }}>{stats.active}</h3>
            </div>
            <p className="neu-text-muted" style={{ fontSize: '13px', margin: 0 }}>Active users</p>
          </div>

          <div className="neu-card-flat" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div className="neu-icon-box-sm" style={{ background: 'linear-gradient(145deg, #67e8f9, #22d3ee)' }}>
                <Clock style={{ width: '20px', height: '20px', color: '#164e63' }} />
              </div>
              <h3 className="neu-title" style={{ fontSize: '24px', margin: 0 }}>{stats.avgScreenTime}h</h3>
            </div>
            <p className="neu-text-muted" style={{ fontSize: '13px', margin: 0 }}>Avg screen time</p>
          </div>

          <div className="neu-card-flat" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div className="neu-icon-box-sm" style={{ background: 'linear-gradient(145deg, #93c5fd, #60a5fa)' }}>
                <Target style={{ width: '20px', height: '20px', color: '#1e3a8a' }} />
              </div>
              <h3 className="neu-title" style={{ fontSize: '24px', margin: 0 }}>{stats.total}</h3>
            </div>
            <p className="neu-text-muted" style={{ fontSize: '13px', margin: 0 }}>Team size</p>
          </div>

          <div className="neu-card-flat" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div className="neu-icon-box-sm" style={{ background: 'linear-gradient(145deg, #fbcfe8, #f9a8d4)' }}>
                <UserX style={{ width: '20px', height: '20px', color: '#831843' }} />
              </div>
              <h3 className="neu-title" style={{ fontSize: '24px', margin: 0 }}>{stats.idle}</h3>
            </div>
            <p className="neu-text-muted" style={{ fontSize: '13px', margin: 0 }}>Idle</p>
          </div>

          <div className="neu-card-flat" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div className="neu-icon-box-sm" style={{ background: 'linear-gradient(145deg, #fdba74, #fb923c)' }}>
                <Camera style={{ width: '20px', height: '20px', color: '#7c2d12' }} />
              </div>
              <h3 className="neu-title" style={{ fontSize: '24px', margin: 0 }}>{stats.totalScreenshots}</h3>
            </div>
            <p className="neu-text-muted" style={{ fontSize: '13px', margin: 0 }}>Screenshots</p>
          </div>

          <div className="neu-card-flat" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div className="neu-icon-box-sm" style={{ background: 'linear-gradient(145deg, #c4b5fd, #a78bfa)' }}>
                <MapPin style={{ width: '20px', height: '20px', color: '#5b21b6' }} />
              </div>
              <h3 className="neu-title" style={{ fontSize: '24px', margin: 0 }}>{stats.offline}</h3>
            </div>
            <p className="neu-text-muted" style={{ fontSize: '13px', margin: 0 }}>Offline</p>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Employee Status */}
          <div className="neu-card" style={{ padding: '24px' }}>
            <h3 className="neu-title" style={{ fontSize: '18px', marginBottom: '24px' }}>Employee Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#d1d5db" strokeWidth="12" />
                  <circle 
                    cx="50" cy="50" r="35" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="12"
                    strokeDasharray={`${stats.total > 0 ? (stats.active / stats.total) * 219.8 : 0} 219.8`}
                  />
                  <circle 
                    cx="50" cy="50" r="35" 
                    fill="none" 
                    stroke="#ef4444" 
                    strokeWidth="12"
                    strokeDasharray={`${stats.total > 0 ? (stats.idle / stats.total) * 219.8 : 0} 219.8`}
                    strokeDashoffset={`-${stats.total > 0 ? (stats.active / stats.total) * 219.8 : 0}`}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p className="neu-title" style={{ fontSize: '24px', margin: 0 }}>{stats.total}</p>
                    <p className="neu-text-muted" style={{ fontSize: '12px', margin: 0 }}>Total</p>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }} />
                  <span className="neu-text" style={{ fontSize: '14px' }}>Active</span>
                </div>
                <span className="neu-title" style={{ fontSize: '14px' }}>{stats.active}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%' }} />
                  <span className="neu-text" style={{ fontSize: '14px' }}>Inactive</span>
                </div>
                <span className="neu-title" style={{ fontSize: '14px' }}>{stats.idle}</span>
              </div>
            </div>
          </div>

          {/* Productivity Coverage */}
          <div className="neu-card" style={{ padding: '24px' }}>
            <h3 className="neu-title" style={{ fontSize: '18px', marginBottom: '24px' }}>Productivity Coverage</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#d1d5db" strokeWidth="12" />
                  <circle 
                    cx="50" cy="50" r="35" 
                    fill="none" 
                    stroke="#06b6d4" 
                    strokeWidth="12"
                    strokeDasharray={`${(stats.avgProductivity / 100) * 219.8} 219.8`}
                  />
                  <circle 
                    cx="50" cy="50" r="35" 
                    fill="none" 
                    stroke="#ec4899" 
                    strokeWidth="12"
                    strokeDasharray={`${((100 - stats.avgProductivity) / 100) * 219.8} 219.8`}
                    strokeDashoffset={`-${(stats.avgProductivity / 100) * 219.8}`}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p className="neu-title" style={{ fontSize: '24px', margin: 0 }}>{stats.avgProductivity}%</p>
                    <p className="neu-text-muted" style={{ fontSize: '12px', margin: 0 }}>Avg</p>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#06b6d4', borderRadius: '50%' }} />
                  <span className="neu-text" style={{ fontSize: '14px' }}>Productive</span>
                </div>
                <span className="neu-title" style={{ fontSize: '14px' }}>{stats.avgProductivity}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#ec4899', borderRadius: '50%' }} />
                  <span className="neu-text" style={{ fontSize: '14px' }}>Below target</span>
                </div>
                <span className="neu-title" style={{ fontSize: '14px' }}>{100 - stats.avgProductivity}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Table */}
        <div className="neu-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(190, 195, 201, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 className="neu-title" style={{ fontSize: '18px', marginBottom: '4px' }}>Team Members</h3>
                <p className="neu-text-muted" style={{ fontSize: '14px', margin: 0 }}>{members.length} employees</p>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="neu-input"
                style={{ padding: '10px 16px', fontSize: '14px', minWidth: '140px' }}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="idle">Idle</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
          <EmployeeOverviewTable
            employees={members}
            onEmployeeClick={(employee: Employee) => navigate(`/employee/${employee.id}`)}
          />
        </div>
      </div>

      <style>{`
        .rotate-animation {
          animation: rotate 1s linear infinite;
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
