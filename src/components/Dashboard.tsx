import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeeOverviewTable } from './EmployeeOverviewTable';
import { 
  Activity, 
  Users, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

// Employee interface
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

  // Normalize API response
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
    
    const lastActivity = member.last_activity || 'Never';
    
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
      lastActivity: lastActivity,
      productivity: member.productivity || 0,
      screenshots: member.screenshots || [],
      screenshotsCount: member.screenshots_count || 0
    };
  };

  // Fetch dashboard data
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
    const avgScreenTime = total > 0 ? (totalScreenTime / total).toFixed(1) : '0.0';
    
    const totalProductivity = members.reduce((sum, m) => sum + m.productivity, 0);
    const avgProductivity = total > 0 ? Math.round(totalProductivity / total) : 0;
    
    return {
      total,
      active,
      idle,
      offline,
      avgScreenTime,
      avgProductivity
    };
  }, [members]);

  return (
    <div className="p-6 w-full">
      {/* Error Alert */}
      {error && (
        <div 
          className="mb-6 p-4 bg-red-50 rounded-2xl flex items-start space-x-3"
          style={{
            boxShadow: '4px 4px 10px rgba(239, 68, 68, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.7)',
          }}
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error loading dashboard</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Employees */}
        <div 
          className="bg-[#e8ecf3] rounded-3xl p-6 transition-all hover:scale-105"
          style={{
            boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div 
              className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center"
              style={{
                boxShadow: '3px 3px 6px rgba(167, 139, 250, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)',
              }}
            >
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.total}</h3>
          <p className="text-sm text-gray-500 font-medium">Total Employees</p>
          <p className="text-xs text-gray-400 mt-1">Active members</p>
        </div>

        {/* Active Now */}
        <div 
          className="bg-[#e8ecf3] rounded-3xl p-6 transition-all hover:scale-105"
          style={{
            boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div 
              className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center"
              style={{
                boxShadow: '3px 3px 6px rgba(34, 197, 94, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)',
              }}
            >
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.active}</h3>
          <p className="text-sm text-gray-500 font-medium">Active Now</p>
          <p className="text-xs text-green-500 mt-1">● Online</p>
        </div>

        {/* Avg Screen Time */}
        <div 
          className="bg-[#e8ecf3] rounded-3xl p-6 transition-all hover:scale-105"
          style={{
            boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div 
              className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center"
              style={{
                boxShadow: '3px 3px 6px rgba(96, 165, 250, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)',
              }}
            >
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.avgScreenTime}h</h3>
          <p className="text-sm text-gray-500 font-medium">Avg Screen Time</p>
          <p className="text-xs text-gray-400 mt-1">Per employee</p>
        </div>

        {/* Productivity */}
        <div 
          className="bg-[#e8ecf3] rounded-3xl p-6 transition-all hover:scale-105"
          style={{
            boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div 
              className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center"
              style={{
                boxShadow: '3px 3px 6px rgba(251, 146, 60, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)',
              }}
            >
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.avgProductivity}%</h3>
          <p className="text-sm text-gray-500 font-medium">Avg Productivity</p>
          <p className="text-xs text-gray-400 mt-1">Team average</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Activity Trends Chart */}
        <div 
          className="lg:col-span-2 bg-[#e8ecf3] rounded-3xl p-6"
          style={{
            boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Activity Trends</h3>
              <p className="text-sm text-gray-500 mt-1">Weekly performance</p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-[#e8ecf3] rounded-lg transition-all"
                style={{
                  boxShadow: 'inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff',
                }}
              >
                Day
              </button>
              <button 
                className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg"
                style={{
                  boxShadow: '3px 3px 8px rgba(99, 102, 241, 0.3)',
                }}
              >
                Week
              </button>
              <button 
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-[#e8ecf3] rounded-lg transition-all"
                style={{
                  boxShadow: 'inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff',
                }}
              >
                Month
              </button>
            </div>
          </div>
          
          {/* Bar Chart */}
          <div className="h-64 flex items-end justify-between space-x-2">
            {[60, 80, 70, 90, 75, 85, 95, 70, 80, 75, 85, 90].map((height, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full rounded-t-xl transition-all hover:scale-105 cursor-pointer"
                  style={{
                    height: `${height}%`,
                    background: index % 2 === 0 
                      ? 'linear-gradient(to top, #818cf8, #a78bfa)' 
                      : 'linear-gradient(to top, #6366f1, #8b5cf6)',
                    boxShadow: '3px 3px 8px rgba(99, 102, 241, 0.3)',
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Status Donut */}
        <div 
          className="bg-[#e8ecf3] rounded-3xl p-6"
          style={{
            boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Team Status</h3>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>
          
          {/* Donut Chart */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#d1d9e6" strokeWidth="12"/>
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="url(#gradient1)" 
                  strokeWidth="12"
                  strokeDasharray={`${stats.total > 0 ? (stats.active / stats.total) * 251.2 : 0} 251.2`}
                  style={{
                    filter: 'drop-shadow(2px 2px 4px rgba(34, 197, 94, 0.3))',
                  }}
                />
                <circle 
                  cx="50" cy="50" r="40" 
                  fill="none" 
                  stroke="url(#gradient2)" 
                  strokeWidth="12"
                  strokeDasharray={`${stats.total > 0 ? (stats.idle / stats.total) * 251.2 : 0} 251.2`}
                  strokeDashoffset={`-${stats.total > 0 ? (stats.active / stats.total) * 251.2 : 0}`}
                  style={{
                    filter: 'drop-shadow(2px 2px 4px rgba(251, 146, 60, 0.3))',
                  }}
                />
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981"/>
                    <stop offset="100%" stopColor="#34d399"/>
                  </linearGradient>
                  <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b"/>
                    <stop offset="100%" stopColor="#fbbf24"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-green-600"></div>
                <span className="text-sm text-gray-600">Active</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600"></div>
                <span className="text-sm text-gray-600">Idle</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.idle}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-500"></div>
                <span className="text-sm text-gray-600">Offline</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.offline}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div 
        className="bg-[#e8ecf3] rounded-3xl overflow-hidden"
        style={{
          boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
        }}
      >
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
            <p className="text-sm text-gray-500 mt-1">
              {members.length} member{members.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-[#e8ecf3] rounded-2xl text-sm font-medium focus:outline-none cursor-pointer"
              style={{
                boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff',
              }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="offline">Offline</option>
            </select>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl transition-all hover:scale-105 disabled:opacity-50"
              style={{
                boxShadow: '4px 4px 10px rgba(99, 102, 241, 0.3)',
              }}
            >
              <Activity className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <EmployeeOverviewTable
          employees={members}
          onEmployeeClick={(employee: Employee) => {
            navigate(`/employee/${employee.id}`);
          }}
        />
      </div>
    </div>
  );
}
