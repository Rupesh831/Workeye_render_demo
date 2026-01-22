// UPDATED: 2026-01-22 11:09 IST - Clean card-based Dashboard UI matching GeoTrack Analytics style
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
    <div className="min-h-screen bg-gray-50">
      {/* Header with refresh */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Top 3 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Employees */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">TOTAL EMPLOYEES</p>
                <h2 className="text-3xl font-bold text-gray-900">{stats.total}</h2>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>7265.4% increase</span>
            </div>
          </div>

          {/* Active Rate */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">ACTIVE RATE</p>
                <h2 className="text-3xl font-bold text-gray-900">{stats.activeRate}%</h2>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>2.3% increase</span>
            </div>
          </div>

          {/* Avg Productivity */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">AVG PRODUCTIVITY</p>
                <h2 className="text-3xl font-bold text-gray-900">{stats.avgProductivity}%</h2>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>5.1% increase</span>
            </div>
          </div>
        </div>

        {/* 6 Secondary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.active}</h3>
            </div>
            <p className="text-xs text-gray-500 font-medium">Active users</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-cyan-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.avgScreenTime}h</h3>
            </div>
            <p className="text-xs text-gray-500 font-medium">Avg screen time</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            </div>
            <p className="text-xs text-gray-500 font-medium">Team size</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.idle}</h3>
            </div>
            <p className="text-xs text-gray-500 font-medium">Idle</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalScreenshots}</h3>
            </div>
            <p className="text-xs text-gray-500 font-medium">Screenshots</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.offline}</h3>
            </div>
            <p className="text-xs text-gray-500 font-medium">Offline</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-6">Employee Status</h3>
            <div className="flex items-center justify-center mb-6">
              <div className="relative" style={{ width: '160px', height: '160px' }}>
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#f3f4f6" strokeWidth="12" />
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                  <span className="text-sm text-gray-600">Active</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                  <span className="text-sm text-gray-600">Inactive</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.idle}</span>
              </div>
            </div>
          </div>

          {/* Productivity Coverage */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-6">Productivity Coverage</h3>
            <div className="flex items-center justify-center mb-6">
              <div className="relative" style={{ width: '160px', height: '160px' }}>
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#f3f4f6" strokeWidth="12" />
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.avgProductivity}%</p>
                    <p className="text-xs text-gray-500">Avg</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full mr-2" />
                  <span className="text-sm text-gray-600">Productive</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.avgProductivity}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-pink-500 rounded-full mr-2" />
                  <span className="text-sm text-gray-600">Below target</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{100 - stats.avgProductivity}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Team Members</h3>
                <p className="text-sm text-gray-500 mt-1">{members.length} employees</p>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
    </div>
  );
}
