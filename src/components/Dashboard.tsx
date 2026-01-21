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
  Calendar,
  Package,
  ShoppingBag
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

  // Neumorphic shadow styles
  const neumorphicStyle = {
    boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
  };

  const neumorphicInsetStyle = {
    boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff',
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#e8ecf3] via-[#e8ecf3] to-[#d4dae6] overflow-hidden">
      {/* Sidebar with Neumorphism */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#e8ecf3] transition-all duration-300 ease-in-out flex flex-col`}
        style={{
          boxShadow: '5px 0 15px rgba(163, 177, 198, 0.3)',
        }}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6">
          {sidebarOpen && (
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center"
                style={{
                  boxShadow: '4px 4px 8px rgba(99, 102, 241, 0.3), -2px -2px 6px rgba(255, 255, 255, 0.8)',
                }}
              >
                <Eye className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Dashon</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg transition-all"
            style={neumorphicStyle}
          >
            {sidebarOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
          </button>
        </div>

        {/* Navigation with Neumorphism */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          <button
            onClick={() => setView('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
              view === 'overview'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'text-gray-600'
            }`}
            style={view === 'overview' ? { boxShadow: '4px 4px 12px rgba(99, 102, 241, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.6)' } : neumorphicStyle}
          >
            <LayoutDashboard className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Dashboard</span>}
          </button>

          <button
            onClick={() => navigate('/analytics')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-gray-600 transition-all"
            style={neumorphicStyle}
          >
            <BarChart3 className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Analytics</span>}
          </button>

          <button
            onClick={() => setView('members')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
              view === 'members'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'text-gray-600'
            }`}
            style={view === 'members' ? { boxShadow: '4px 4px 12px rgba(99, 102, 241, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.6)' } : neumorphicStyle}
          >
            <UsersIcon className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Team</span>}
          </button>

          <button
            onClick={() => navigate('/attendance')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-gray-600 transition-all"
            style={neumorphicStyle}
          >
            <ClipboardList className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Attendance</span>}
          </button>

          <button
            onClick={() => navigate('/configuration')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-gray-600 transition-all"
            style={neumorphicStyle}
          >
            <Settings className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Settings</span>}
          </button>
        </nav>

        {/* User Profile */}
        <div className="p-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-full flex items-center space-x-3 p-3 rounded-2xl transition-all"
              style={neumorphicStyle}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
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
              <div 
                className="absolute bottom-full left-0 right-0 mb-2 bg-[#e8ecf3] rounded-2xl overflow-hidden"
                style={{
                  boxShadow: '8px 8px 20px rgba(163, 177, 198, 0.6), -8px -8px 20px rgba(255, 255, 255, 0.9)',
                }}
              >
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full px-4 py-3 flex items-center space-x-3 transition-colors hover:bg-[#d4dae6]"
                >
                  <UserCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Profile</span>
                </button>
                <button
                  onClick={handleDownloadTracker}
                  disabled={downloadingTracker}
                  className="w-full px-4 py-3 flex items-center space-x-3 transition-colors hover:bg-[#d4dae6]"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {downloadingTracker ? 'Downloading...' : 'Download Tracker'}
                  </span>
                </button>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full px-4 py-3 flex items-center space-x-3 transition-colors hover:bg-red-50"
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
        <header 
          className="h-20 bg-[#e8ecf3] px-8 flex items-center justify-between"
          style={{
            boxShadow: '0 4px 12px rgba(163, 177, 198, 0.3)',
          }}
        >
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Analytics Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Track your team's performance</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search with Neumorphism */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="w-64 pl-10 pr-4 py-2.5 bg-[#e8ecf3] rounded-2xl focus:outline-none transition-all text-sm text-gray-700"
                style={neumorphicInsetStyle}
              />
            </div>

            {/* Calendar Icon */}
            <button 
              className="p-2.5 bg-[#e8ecf3] rounded-2xl transition-all hover:scale-105"
              style={neumorphicStyle}
            >
              <Calendar className="w-5 h-5 text-gray-600" />
            </button>

            {/* Notifications */}
            <button 
              className="relative p-2.5 bg-[#e8ecf3] rounded-2xl transition-all hover:scale-105"
              style={neumorphicStyle}
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full shadow-lg"></span>
            </button>

            {/* User Avatar */}
            <div 
              className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                boxShadow: '4px 4px 10px rgba(99, 102, 241, 0.4), -2px -2px 8px rgba(255, 255, 255, 0.7)',
              }}
            >
              <span className="text-white font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8">
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

          {view === 'overview' && (
            <>
              {/* Analytics Overview Stats Cards - Neumorphism */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                {/* Card 1 - Total */}
                <div 
                  className="bg-[#e8ecf3] rounded-3xl p-6 transition-all hover:scale-105"
                  style={neumorphicStyle}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center"
                        style={{
                          boxShadow: '3px 3px 6px rgba(167, 139, 250, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)',
                        }}
                      >
                        <Users className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">2056</h3>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Employees</p>
                  <div className="mt-2 text-xs text-gray-400">+8% from yesterday</div>
                </div>

                {/* Card 2 - Active */}
                <div 
                  className="bg-[#e8ecf3] rounded-3xl p-6 transition-all hover:scale-105"
                  style={neumorphicStyle}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center"
                        style={{
                          boxShadow: '3px 3px 6px rgba(251, 146, 60, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)',
                        }}
                      >
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">7456</h3>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Active Now</p>
                  <div className="mt-2 text-xs text-gray-400">+5% from yesterday</div>
                </div>

                {/* Card 3 - Screen Time */}
                <div 
                  className="bg-[#e8ecf3] rounded-3xl p-6 transition-all hover:scale-105"
                  style={neumorphicStyle}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center"
                        style={{
                          boxShadow: '3px 3px 6px rgba(96, 165, 250, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)',
                        }}
                      >
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">4657</h3>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Screen Time</p>
                  <div className="mt-2 text-xs text-gray-400">+1% from yesterday</div>
                </div>

                {/* Card 4 - Productivity */}
                <div 
                  className="bg-[#e8ecf3] rounded-3xl p-6 transition-all hover:scale-105"
                  style={neumorphicStyle}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center"
                        style={{
                          boxShadow: '3px 3px 6px rgba(244, 114, 182, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)',
                        }}
                      >
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">4765</h3>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Productivity</p>
                  <div className="mt-2 text-xs text-gray-400">+3% from yesterday</div>
                </div>
              </div>

              {/* Revenue Chart and Order Status */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                {/* Revenue Chart - 2 columns */}
                <div 
                  className="col-span-2 bg-[#e8ecf3] rounded-3xl p-6"
                  style={neumorphicStyle}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Revenue</h3>
                      <p className="text-sm text-gray-500 mt-1">Monthly performance</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-[#e8ecf3] rounded-lg"
                        style={{
                          boxShadow: 'inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff',
                        }}
                      >
                        Day
                      </button>
                      <button 
                        className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg"
                        style={{
                          boxShadow: '3px 3px 8px rgba(99, 102, 241, 0.3), -1px -1px 4px rgba(255, 255, 255, 0.5)',
                        }}
                      >
                        Week
                      </button>
                      <button 
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-[#e8ecf3] rounded-lg"
                        style={{
                          boxShadow: 'inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff',
                        }}
                      >
                        Month
                      </button>
                    </div>
                  </div>
                  
                  {/* Bar Chart Visualization */}
                  <div className="h-64 flex items-end justify-between space-x-3">
                    {[60, 80, 70, 90, 75, 85, 95, 70, 80, 75, 85, 90].map((height, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full rounded-t-xl transition-all hover:scale-105"
                          style={{
                            height: `${height}%`,
                            background: index % 2 === 0 
                              ? 'linear-gradient(to top, #818cf8, #a78bfa)' 
                              : 'linear-gradient(to top, #6366f1, #8b5cf6)',
                            boxShadow: '3px 3px 8px rgba(99, 102, 241, 0.3), -1px -1px 4px rgba(255, 255, 255, 0.5)',
                          }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Status - Donut Chart */}
                <div 
                  className="bg-[#e8ecf3] rounded-3xl p-6"
                  style={neumorphicStyle}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Order Status</h3>
                    <div className="flex items-center space-x-1">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Donut Chart */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-40 h-40">
                      <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        {/* Background circle */}
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#d1d9e6" strokeWidth="12"/>
                        {/* Gradient segments */}
                        <circle 
                          cx="50" cy="50" r="40" 
                          fill="none" 
                          stroke="url(#gradient1)" 
                          strokeWidth="12"
                          strokeDasharray="75 251.2"
                          style={{
                            filter: 'drop-shadow(2px 2px 4px rgba(99, 102, 241, 0.3))',
                          }}
                        />
                        <circle 
                          cx="50" cy="50" r="40" 
                          fill="none" 
                          stroke="url(#gradient2)" 
                          strokeWidth="12"
                          strokeDasharray="62.8 251.2"
                          strokeDashoffset="-75"
                          style={{
                            filter: 'drop-shadow(2px 2px 4px rgba(139, 92, 246, 0.3))',
                          }}
                        />
                        <circle 
                          cx="50" cy="50" r="40" 
                          fill="none" 
                          stroke="url(#gradient3)" 
                          strokeWidth="12"
                          strokeDasharray="50.24 251.2"
                          strokeDashoffset="-137.8"
                          style={{
                            filter: 'drop-shadow(2px 2px 4px rgba(168, 85, 247, 0.3))',
                          }}
                        />
                        <defs>
                          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1"/>
                            <stop offset="100%" stopColor="#818cf8"/>
                          </linearGradient>
                          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6"/>
                            <stop offset="100%" stopColor="#a78bfa"/>
                          </linearGradient>
                          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a855f7"/>
                            <stop offset="100%" stopColor="#c084fc"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <p className="text-2xl font-bold text-gray-900">2,045</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm"></div>
                        <span className="text-sm text-gray-600">On Hold</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">1,246</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm"></div>
                        <span className="text-sm text-gray-600">Delivered</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">639</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 shadow-sm"></div>
                        <span className="text-sm text-gray-600">Received</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">160</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Best Selling Categories and Recent Orders */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Best Selling Categories */}
                <div 
                  className="bg-[#e8ecf3] rounded-3xl p-6"
                  style={neumorphicStyle}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Best Selling Categories</h3>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { name: 'Drones', value: '$10,000', color: 'from-blue-500 to-blue-600' },
                      { name: 'Cosmetics', value: '$8,000', color: 'from-purple-500 to-purple-600' },
                    ].map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className={`w-10 h-10 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center`}
                            style={{
                              boxShadow: '3px 3px 6px rgba(99, 102, 241, 0.3), -2px -2px 4px rgba(255, 255, 255, 0.6)',
                            }}
                          >
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{category.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{category.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Orders */}
                <div 
                  className="bg-[#e8ecf3] rounded-3xl p-6"
                  style={neumorphicStyle}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { id: '#SK1234', time: '12:30 PM', price: '$200.00', status: 'Pending', color: 'orange' },
                      { id: '#SK1235', time: '12:15 PM', price: '$350.00', status: 'Completed', color: 'green' },
                    ].map((order, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center"
                            style={{
                              boxShadow: '3px 3px 6px rgba(99, 102, 241, 0.3), -2px -2px 4px rgba(255, 255, 255, 0.6)',
                            }}
                          >
                            <ShoppingBag className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">{order.id}</p>
                            <p className="text-xs text-gray-500">{order.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{order.price}</p>
                          <span 
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              order.color === 'orange' 
                                ? 'bg-orange-100 text-orange-600' 
                                : 'bg-green-100 text-green-600'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Employee Table */}
              <div 
                className="bg-[#e8ecf3] rounded-3xl overflow-hidden"
                style={neumorphicStyle}
              >
                <div className="px-6 py-4 flex items-center justify-between">
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
                      className="px-4 py-2 bg-[#e8ecf3] rounded-2xl text-sm font-medium focus:outline-none"
                      style={neumorphicInsetStyle}
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="idle">Idle</option>
                      <option value="offline">Offline</option>
                    </select>
                    <button
                      onClick={fetchDashboardData}
                      disabled={loading}
                      className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl transition-all hover:scale-105 disabled:opacity-50"
                      style={{
                        boxShadow: '4px 4px 10px rgba(99, 102, 241, 0.3), -2px -2px 6px rgba(255, 255, 255, 0.6)',
                      }}
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
            <div 
              className="bg-[#e8ecf3] rounded-3xl overflow-hidden"
              style={neumorphicStyle}
            >
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
            <div 
              className="bg-[#e8ecf3] rounded-3xl overflow-hidden"
              style={neumorphicStyle}
            >
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
