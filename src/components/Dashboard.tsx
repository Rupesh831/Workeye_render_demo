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
  ClipboardList,
  ArrowLeft,
  Eye,
  Bell,
  Menu,
  X,
  ChevronRight,
  TrendingDown,
  Target,
  Award,
  Calendar
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      
      if (data?.members) {
        const normalized = data.members.map(normalizeEmployee);
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
      a.download = 'workeye-tracker.exe';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download tracker');
    } finally {
      setDownloadingTracker(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [nameFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.status === 'active').length;
    const idle = members.filter(m => m.status === 'idle').length;
    const offline = members.filter(m => m.status === 'offline').length;
    
    const totalScreenTime = members.reduce((sum, m) => sum + m.screenTime, 0);
    const totalActiveTime = members.reduce((sum, m) => sum + m.activeTime, 0);
    const avgScreenTime = total > 0 ? (totalScreenTime / total).toFixed(1) : '0.0';
    
    const totalProductivity = members.reduce((sum, m) => sum + m.productivity, 0);
    const avgProductivity = total > 0 ? Math.round(totalProductivity / total) : 0;
    
    return {
      total,
      active,
      idle,
      offline,
      avgScreenTime,
      avgProductivity,
      totalActiveTime
    };
  }, [members]);

  const userName = user?.full_name || company?.company_name || 'User';
  const companyUsername = company?.company_username || '';
  const companyId = company?.id || 0;

  return (
    <div className="flex h-screen bg-[#f5f6fa] overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col`}>
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Dashon</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          <button
            onClick={() => setView('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              view === 'overview'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Dashboard</span>}
          </button>

          <button
            onClick={() => navigate('/analytics')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
          >
            <BarChart3 className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Analytics</span>}
          </button>

          <button
            onClick={() => setView('members')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              view === 'members'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <UsersIcon className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Team</span>}
          </button>

          <button
            onClick={() => navigate('/attendance')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
          >
            <ClipboardList className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Attendance</span>}
          </button>

          <button
            onClick={() => navigate('/configuration')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Settings className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Settings</span>}
          </button>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              {sidebarOpen && (
                <>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </>
              )}
            </button>

            {showProfileDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors"
                >
                  <UserCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Profile</span>
                </button>
                <button
                  onClick={handleDownloadTracker}
                  disabled={downloadingTracker}
                  className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {downloadingTracker ? 'Downloading...' : 'Download Tracker'}
                  </span>
                </button>
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Track your team's performance</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="w-64 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
              />
            </div>

            {/* Calendar Icon */}
            <button className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
              <Calendar className="w-5 h-5 text-gray-600" />
            </button>

            {/* Notifications */}
            <button className="relative p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error loading dashboard</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {view === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                {/* Card 1 */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</h3>
                  <p className="text-sm text-gray-500 font-medium">Total Employees</p>
                </div>

                {/* Card 2 */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.active}</h3>
                  <p className="text-sm text-gray-500 font-medium">Active Now</p>
                </div>

                {/* Card 3 */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.avgScreenTime}h</h3>
                  <p className="text-sm text-gray-500 font-medium">Avg Screen Time</p>
                </div>

                {/* Card 4 */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.avgProductivity}%</h3>
                  <p className="text-sm text-gray-500 font-medium">Productivity</p>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                {/* Revenue Chart (Placeholder) */}
                <div className="col-span-2 bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Activity Overview</h3>
                      <p className="text-sm text-gray-500 mt-1">Team activity patterns</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                        Day
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg">
                        Week
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                        Month
                      </button>
                    </div>
                  </div>
                  {/* Placeholder for chart */}
                  <div className="h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-indigo-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Activity chart visualization</p>
                    </div>
                  </div>
                </div>

                {/* Order Status (Donut Chart Placeholder) */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Team Status</h3>
                  </div>
                  {/* Donut chart placeholder */}
                  <div className="flex items-center justify-center h-48">
                    <div className="relative">
                      <div className="w-40 h-40 rounded-full border-[20px] border-indigo-500" style={{ 
                        borderColor: 'transparent',
                        borderTopColor: '#6366f1',
                        borderRightColor: '#8b5cf6',
                        borderBottomColor: '#a855f7',
                        borderLeftColor: '#c084fc'
                      }}></div>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Active</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{stats.active}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Idle</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{stats.idle}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600">Offline</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{stats.offline}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Table */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
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
                      className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="idle">Idle</option>
                      <option value="offline">Offline</option>
                    </select>
                    <button
                      onClick={fetchDashboardData}
                      disabled={loading}
                      className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Activity className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
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
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <MembersManagement 
                companyUsername={companyUsername}
                companyId={companyId}
                onMembersUpdate={fetchDashboardData}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
