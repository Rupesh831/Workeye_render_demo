import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeeOverviewTable } from './EmployeeOverviewTable';
import { EmployeeDetailView } from './EmployeeDetailView';
import { MembersManagement } from './MembersManagement';
import { 
  Activity, 
  Users, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Search,
  Filter,
  Camera,
  Download,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  UsersIcon,
  BarChart3,
  ChevronDown,
  Pause,
  UserCircle,
  ClipboardList
} from 'lucide-react';
import { dashboard, members as membersAPI, wsClient, tracker } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

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
  const { user, company, logout } = useAuth();
  const [members, setMembers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [view, setView] = useState<'overview' | 'detail' | 'members'>('overview');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [downloadingTracker, setDownloadingTracker] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'idle' | 'offline'>('');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize API response
  const normalizeEmployee = (member: any): Employee => {
    const screenTimeSeconds = member.screen_time || 0;
    const activeTimeSeconds = member.active_time || 0;
    const idleTimeSeconds = member.idle_time || 0;
    
    const screenTime = screenTimeSeconds / 3600;
    const activeTime = activeTimeSeconds / 3600;
    const idleTime = idleTimeSeconds / 3600;
    
    // FIXED: Better status detection
    let status: 'active' | 'idle' | 'offline' = 'offline';
    const rawStatus = (member.status || '').toLowerCase().trim();
    
    console.log(`Member ${member.name}: raw status = "${member.status}", normalized = "${rawStatus}"`);
    
    if (rawStatus === 'active') {
      status = 'active';
    } else if (rawStatus === 'idle') {
      status = 'idle';
    } else if (rawStatus === 'offline') {
      status = 'offline';
    } else {
      // Fallback: determine status based on activity
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

  // Fetch dashboard data with filters
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (nameFilter.trim()) {
        params.append('name', nameFilter.trim());
      }
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
      
      console.log('Dashboard API response:', data);
      
      if (data?.members) {
        const normalized = data.members.map(normalizeEmployee);
        console.log('Normalized members:', normalized);
        console.log('Status breakdown:', {
          active: normalized.filter(m => m.status === 'active').length,
          idle: normalized.filter(m => m.status === 'idle').length,
          offline: normalized.filter(m => m.status === 'offline').length
        });
        setMembers(normalized);
      }
      
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Download tracker
  const handleDownloadTracker = async () => {
    try {
      setDownloadingTracker(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://workeye-render-demo-backend.onrender.com'}/api/tracker/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download tracker');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WorkEye-Tracker-${company?.company_name || 'Company'}.py`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Download tracker error:', err);
      alert('Failed to download tracker. Please try again.');
    } finally {
      setDownloadingTracker(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchDashboardData();
  }, [nameFilter, statusFilter]);

  // Check for midnight reset
  useEffect(() => {
    const checkMidnightReset = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Next midnight
      
      const timeUntilMidnight = midnight.getTime() - now.getTime();
      
      console.log(`⏰ Time until midnight reset: ${Math.floor(timeUntilMidnight / 1000 / 60)} minutes`);
      
      // Set timeout to refresh at midnight
      const timeoutId = setTimeout(() => {
        console.log('🌙 Midnight reset triggered! Refreshing dashboard...');
        fetchDashboardData();
        // Schedule next midnight check
        checkMidnightReset();
      }, timeUntilMidnight);
      
      return timeoutId;
    };
    
    const timeoutId = checkMidnightReset();
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // WebSocket and auto-refresh
  useEffect(() => {
    if (company?.id) {
      wsClient.connect(company.id);
    }
    
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => {
      clearInterval(interval);
      wsClient.disconnect();
    };
  }, [company?.id, nameFilter, statusFilter]);

  // Stats calculations - FIXED IDLE COUNT
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.status === 'active').length;
    const idle = members.filter(m => m.status === 'idle').length;
    const offline = members.filter(m => m.status === 'offline').length;
    const avgProductivity = total > 0 
      ? Math.round(members.reduce((sum, m) => sum + m.productivity, 0) / total) 
      : 0;
    const totalScreenTime = members.reduce((sum, m) => sum + m.screenTime, 0);
    const totalActiveTime = members.reduce((sum, m) => sum + m.activeTime, 0);
    const avgScreenTime = total > 0 ? (totalScreenTime / total).toFixed(1) : '0.0';

    return { 
      total, 
      active, 
      idle, 
      offline, 
      avgProductivity,
      totalScreenTime,
      totalActiveTime,
      avgScreenTime
    };
  }, [members]);

  const companyName = company?.company_name || 'Dashboard';
  const companyId = company?.id || 0;
  const companyUsername = company?.company_username || '';
  const userName = user?.full_name || 'User';
  const userEmail = user?.email || '';
  const userRole = user?.role || 'Admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header - Simplified with only text and dropdown */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Title with Dropdown */}
            <div className="flex items-center space-x-4">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  <h1 className="text-lg font-semibold text-slate-700">Real-time employee monitoring</h1>
                  <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${
                    showProfileDropdown ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-slate-50 transition-colors"
                      >
                        <UserCircle className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-slate-700 font-medium">My Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          navigate('/members');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-slate-50 transition-colors"
                      >
                        <UsersIcon className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-slate-700 font-medium">Add Members</span>
                      </button>

                      <button
                        onClick={() => {
                          navigate('/attendance');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-slate-50 transition-colors"
                      >
                        <ClipboardList className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-slate-700 font-medium">Attendance</span>
                      </button>

                      <button
                        onClick={() => {
                          navigate('/configuration');
                          setShowProfileDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-slate-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-slate-700 font-medium">Configuration</span>
                      </button>

                      <button
                        onClick={() => {
                          handleDownloadTracker();
                          setShowProfileDropdown(false);
                        }}
                        disabled={downloadingTracker}
                        className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download className="w-4 h-4 text-slate-600" />
                        <span className="text-sm text-slate-700 font-medium">
                          {downloadingTracker ? 'Downloading...' : 'Download Tracker'}
                        </span>
                      </button>

                      <div className="my-1 border-t border-slate-200"></div>

                      <button
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                        className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-red-50 transition-colors text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: User Avatar */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error loading dashboard</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Grid - 6 cards in SINGLE ROW matching first screenshot */}
        {view === 'overview' && (
          <>
            <div className="grid grid-cols-6 gap-6 mb-8">
              {/* Total Employees */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm text-slate-500 font-medium mb-1">Total Employees</p>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">{stats.total}</h3>
                <p className="text-xs text-slate-400">{stats.active} active, {stats.idle} idle, {stats.offline} offline</p>
              </div>

              {/* Active Now */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm text-slate-500 font-medium mb-1">Active Now</p>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">{stats.active}</h3>
                <p className="text-xs text-slate-400">{Math.round((stats.active / (stats.total || 1)) * 100)}% of team</p>
              </div>

              {/* Avg Screen Time */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-sm text-slate-500 font-medium mb-1">Avg Screen Time</p>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">{stats.avgScreenTime}h</h3>
                <p className="text-xs text-slate-400">{(stats.totalActiveTime / (stats.total || 1)).toFixed(1)}h active time</p>
              </div>

              {/* Avg Productivity */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
                <p className="text-sm text-slate-500 font-medium mb-1">Avg Productivity</p>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">{stats.avgProductivity}%</h3>
                <p className="text-xs text-slate-400">+5% from yesterday</p>
              </div>

              {/* Screenshots Today - Removed "Captured every 5 min" */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-sm text-slate-500 font-medium mb-1">Screenshots Today</p>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">
                  {members.reduce((sum, m) => sum + (m.screenshotsCount || 0), 0)}
                </h3>
              </div>

              {/* Peak Hours */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-sm text-slate-500 font-medium mb-1">Peak Hours</p>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">2-5 PM</h3>
                <p className="text-xs text-slate-400">Most productive time</p>
              </div>
            </div>

            {/* Compact Filters Section */}
            <div className="bg-white rounded-xl shadow-md border border-slate-100 p-4 mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <Filter className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-800">Filter Employees</h3>
                <p className="text-xs text-slate-500">Refine your search with multiple criteria</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Name Filter */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Type employee name..."
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="idle">Idle</option>
                  <option value="offline">Offline</option>
                </select>

                {/* Clear Button */}
                {(nameFilter || statusFilter) && (
                  <button
                    onClick={() => {
                      setNameFilter('');
                      setStatusFilter('');
                    }}
                    className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Employee Table */}
            <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-800">All Employees</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Comprehensive view of team activity and performance
                  {(nameFilter || statusFilter) && ` (${members.length} result${members.length !== 1 ? 's' : ''})`}
                </p>
              </div>
              <EmployeeOverviewTable
                employees={members}
                onEmployeeClick={(employee: Employee) => {
                  setSelectedEmployee(employee);
                  setView('detail');
                }}
              />
            </div>
          </>
        )}

        {/* Detail View */}
        {view === 'detail' && selectedEmployee && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <EmployeeDetailView
              employee={selectedEmployee}
              onBack={() => {
                setSelectedEmployee(null);
                setView('overview');
              }}
            />
          </div>
        )}

        {/* Members Management */}
        {view === 'members' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <MembersManagement 
              companyUsername={companyUsername}
              companyId={companyId}
              onMembersUpdate={fetchDashboardData}
            />
          </div>
        )}
      </main>
    </div>
  );
}
