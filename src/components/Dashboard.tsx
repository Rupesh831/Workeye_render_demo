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
  Zap,
  Target,
  Award,
  TrendingDown,
  Eye,
  Bell,
  Moon,
  Sun
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
  const [darkMode, setDarkMode] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Premium Glassmorphic Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/70 border-b border-white/20 shadow-lg shadow-slate-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Left: Logo & Brand */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50 transform group-hover:scale-105 transition-transform duration-300">
                  <Eye className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Workeye
                </h1>
                <p className="text-xs text-slate-500 font-medium">Premium Workspace Analytics</p>
              </div>
            </div>

            {/* Center: Navigation Pills */}
            <nav className="hidden md:flex items-center space-x-2 bg-white/50 backdrop-blur-xl rounded-full p-1.5 shadow-inner shadow-slate-200/50 border border-white/60">
              <button
                onClick={() => setView('overview')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  view === 'overview'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                    : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 inline mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => navigate('/analytics')}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all duration-300"
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setView('members')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  view === 'members'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                    : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                }`}
              >
                <UsersIcon className="w-4 h-4 inline mr-2" />
                Team
              </button>
              <button
                onClick={() => navigate('/attendance')}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-white/80 hover:text-slate-900 transition-all duration-300"
              >
                <ClipboardList className="w-4 h-4 inline mr-2" />
                Attendance
              </button>
            </nav>

            {/* Right: Actions & Profile */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <button className="relative p-3 rounded-full hover:bg-white/80 transition-all duration-300 group">
                <Bell className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {/* Settings */}
              <button 
                onClick={() => navigate('/configuration')}
                className="p-3 rounded-full hover:bg-white/80 transition-all duration-300 group"
              >
                <Settings className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-3 p-2 pr-4 rounded-full hover:bg-white/80 transition-all duration-300 group"
                >
                  <div className="relative">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <span className="text-white font-bold text-sm">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                    {/* Profile Header */}
                    <div className="p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center ring-4 ring-white/30">
                          <span className="text-white font-bold text-xl">
                            {userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg">{userName}</h3>
                          <p className="text-blue-100 text-sm">{user?.email || 'Administrator'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-3 space-y-1">
                      <button
                        onClick={() => navigate('/profile')}
                        className="w-full px-4 py-3.5 flex items-center space-x-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-2xl transition-all duration-200 group"
                      >
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <UserCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-sm text-slate-800 font-semibold block">My Profile</span>
                          <span className="text-xs text-slate-500">View and edit profile</span>
                        </div>
                      </button>

                      <button
                        onClick={handleDownloadTracker}
                        disabled={downloadingTracker}
                        className="w-full px-4 py-3.5 flex items-center space-x-4 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-2xl transition-all duration-200 group disabled:opacity-50"
                      >
                        <div className="w-11 h-11 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Download className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-sm text-slate-800 font-semibold block">
                            {downloadingTracker ? 'Downloading...' : 'Download Tracker'}
                          </span>
                          <span className="text-xs text-slate-500">Get desktop app</span>
                        </div>
                      </button>

                      <div className="my-2 border-t border-slate-200"></div>

                      <button
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                        className="w-full px-4 py-3.5 flex items-center space-x-4 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-2xl transition-all duration-200 group"
                      >
                        <div className="w-11 h-11 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <LogOut className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-sm text-red-600 font-semibold block">Sign Out</span>
                          <span className="text-xs text-red-400">End your session</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-12">
        {error && (
          <div className="mb-8 p-5 bg-red-50/80 backdrop-blur-xl border border-red-200/50 rounded-3xl flex items-start space-x-4 shadow-lg shadow-red-100/50 animate-in slide-in-from-top-4 duration-500">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-900">Unable to load dashboard</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Premium Stats Grid */}
        {view === 'overview' && (
          <>
            {/* Greeting Section */}
            <div className="mb-8 animate-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-4xl font-bold text-slate-900 mb-2">
                Welcome back, {userName} 👋
              </h2>
              <p className="text-slate-500 text-lg">
                Here's what's happening with your team today
              </p>
            </div>

            {/* Stats Cards - Apple Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {/* Total Employees Card */}
              <div className="group relative animate-in slide-in-from-bottom-4 duration-700 delay-100">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                <div className="relative bg-white/80 backdrop-blur-2xl rounded-3xl p-8 border border-white/60 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Live</span>
                  </div>
                  <h3 className="text-5xl font-black text-slate-900 mb-2 tracking-tight">{stats.total}</h3>
                  <p className="text-sm font-semibold text-slate-600 mb-3">Total Team Members</p>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="flex items-center text-green-600 font-semibold">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                      {stats.active} active
                    </span>
                    <span className="flex items-center text-amber-600 font-semibold">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-1.5"></span>
                      {stats.idle} idle
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Now Card */}
              <div className="group relative animate-in slide-in-from-bottom-4 duration-700 delay-200">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                <div className="relative bg-white/80 backdrop-blur-2xl rounded-3xl p-8 border border-white/60 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-green-200/50 transition-all duration-500 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                      <Activity className="w-8 h-8 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      {Math.round((stats.active / (stats.total || 1)) * 100)}%
                    </span>
                  </div>
                  <h3 className="text-5xl font-black text-slate-900 mb-2 tracking-tight">{stats.active}</h3>
                  <p className="text-sm font-semibold text-slate-600 mb-3">Active Right Now</p>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-1000"
                      style={{ width: `${(stats.active / (stats.total || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Screen Time Card */}
              <div className="group relative animate-in slide-in-from-bottom-4 duration-700 delay-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                <div className="relative bg-white/80 backdrop-blur-2xl rounded-3xl p-8 border border-white/60 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-purple-200/50 transition-all duration-500 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Avg</span>
                  </div>
                  <h3 className="text-5xl font-black text-slate-900 mb-2 tracking-tight">{stats.avgScreenTime}<span className="text-3xl text-slate-400">h</span></h3>
                  <p className="text-sm font-semibold text-slate-600 mb-3">Screen Time</p>
                  <p className="text-xs text-slate-500 font-medium">
                    {(stats.totalActiveTime / (stats.total || 1)).toFixed(1)}h active work time
                  </p>
                </div>
              </div>

              {/* Productivity Card */}
              <div className="group relative animate-in slide-in-from-bottom-4 duration-700 delay-400">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                <div className="relative bg-white/80 backdrop-blur-2xl rounded-3xl p-8 border border-white/60 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-orange-200/50 transition-all duration-500 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      <TrendingUp className="w-3 h-3" />
                      <span>+5%</span>
                    </div>
                  </div>
                  <h3 className="text-5xl font-black text-slate-900 mb-2 tracking-tight">{stats.avgProductivity}<span className="text-3xl text-slate-400">%</span></h3>
                  <p className="text-sm font-semibold text-slate-600 mb-3">Team Productivity</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-1000"
                        style={{ width: `${stats.avgProductivity}%` }}
                      ></div>
                    </div>
                    <Award className="w-4 h-4 text-orange-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filters Section - Apple Style */}
            <div className="mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-500">
              <div className="bg-white/60 backdrop-blur-2xl rounded-3xl p-6 border border-white/60 shadow-xl shadow-slate-200/30">
                <div className="flex items-center space-x-3 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                    <Filter className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Smart Filters</h3>
                    <p className="text-sm text-slate-500">Refine your team view instantly</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search Input */}
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search team members..."
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/70 border border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium placeholder:text-slate-400 shadow-sm"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-4 py-4 bg-white/70 border border-slate-200/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="">All Status</option>
                    <option value="active">🟢 Active</option>
                    <option value="idle">🟡 Idle</option>
                    <option value="offline">⚫ Offline</option>
                  </select>
                </div>

                {/* Active Filters Badge */}
                {(nameFilter || statusFilter) && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-600 font-medium">Active filters:</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {members.length} result{members.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setNameFilter('');
                        setStatusFilter('');
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Employee Table - Premium Design */}
            <div className="animate-in slide-in-from-bottom-4 duration-700 delay-600">
              <div className="bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Team Overview</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Real-time monitoring and performance insights
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-slate-600 shadow-sm">
                        Last updated: {lastRefresh.toLocaleTimeString()}
                      </span>
                      <button
                        onClick={fetchDashboardData}
                        disabled={loading}
                        className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 hover:scale-105"
                      >
                        <Activity className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
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
            </div>
          </>
        )}

        {/* Detail View */}
        {view === 'detail' && selectedEmployee && (
          <div className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden animate-in slide-in-from-right-4 duration-500">
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
          <div className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden animate-in slide-in-from-right-4 duration-500">
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
