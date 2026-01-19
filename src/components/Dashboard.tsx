import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeeOverviewTable } from './EmployeeOverviewTable';
import { EmployeeDetailView } from './EmployeeDetailView';
import { MembersManagement } from './MembersManagement';
import { 
  Activity, 
  Users, 
  UserCircle, 
  Clock, 
  AlertCircle, 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Eye, 
  Settings,
  Calendar,
  Zap,
  Target,
  Award,
  Search,
  Filter
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

  // NEW: Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'idle' | 'offline'>('');

  // Normalize API response
  const normalizeEmployee = (member: any): Employee => {
    // Use screen_time (seconds) or screen_time_seconds from API
    const screenTimeSeconds = member.screen_time || 0;
    const activeTimeSeconds = member.active_time || 0;
    const idleTimeSeconds = member.idle_time || 0;
    
    const screenTime = screenTimeSeconds / 3600;
    const activeTime = activeTimeSeconds / 3600;
    const idleTime = idleTimeSeconds / 3600;
    
    let status: 'active' | 'idle' | 'offline' = 'offline';
    const rawStatus = (member.status || '').toLowerCase();
    if (rawStatus === 'active') status = 'active';
    else if (rawStatus === 'idle') status = 'idle';
    
    // Use last_activity from API (already formatted as human-readable)
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
      
      // Build query params for filters
      const params = new URLSearchParams();
      if (nameFilter.trim()) {
        params.append('name', nameFilter.trim());
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      // Call API with filters
      const url = `/api/dashboard/stats${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://backend-35m2.onrender.com'}${url}`,
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

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchDashboardData();
  }, [nameFilter, statusFilter]);

  // WebSocket and auto-refresh
  useEffect(() => {
    if (company?.id) {
      wsClient.connect(company.id);
    }
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => {
      clearInterval(interval);
      wsClient.disconnect();
    };
  }, [company?.id, nameFilter, statusFilter]);

  // Stats calculations
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

    return { 
      total, 
      active, 
      idle, 
      offline, 
      avgProductivity,
      totalScreenTime,
      totalActiveTime
    };
  }, [members]);

  // Clear filters
  const handleClearFilters = () => {
    setNameFilter('');
    setStatusFilter('');
  };

  const hasFilters = nameFilter || statusFilter;

  const companyName = company?.company_name || 'Dashboard';
  const companyId = company?.id || 0;
  const companyUsername = company?.company_username || '';
  const userName = user?.full_name || 'User';
  const userRole = user?.role || 'Admin';


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

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

        {/* Stats Grid - 6 cards in single row */}
        {view === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {/* Total Employees */}
              <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Total Employees</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
                  <p className="text-xs text-slate-400">{stats.active} active, {stats.idle} idle, {stats.offline} offline</p>
                </div>
              </div>

              {/* Active Now */}
              <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Active Now</p>
                  <h3 className="text-2xl font-bold text-green-600">{stats.active}</h3>
                  <p className="text-xs text-slate-400">{Math.round((stats.active / stats.total) * 100) || 0}% of team</p>
                </div>
              </div>

              {/* Avg Screen Time */}
              <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Avg Screen Time</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stats.totalScreenTime.toFixed(1)}h</h3>
                  <p className="text-xs text-slate-400">{stats.totalActiveTime.toFixed(1)}h active time</p>
                </div>
              </div>

              {/* Avg Productivity */}
              <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Avg Productivity</p>
                  <h3 className="text-2xl font-bold text-teal-600">{stats.avgProductivity}%</h3>
                  <p className="text-xs text-slate-400">+5% from yesterday</p>
                </div>
              </div>

              {/* Screenshots Today */}
              <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Camera className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Screenshots Today</p>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {members.reduce((sum, m) => sum + (m.screenshotsCount || 0), 0)}
                  </h3>
                  <p className="text-xs text-slate-400">Captured every 5 min</p>
                </div>
              </div>

              {/* Peak Hours */}
              <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Peak Hours</p>
                  <h3 className="text-2xl font-bold text-slate-800">2-5 PM</h3>
                  <p className="text-xs text-slate-400">Most productive time</p>
                </div>
              </div>
            </div>

            {/* NEW: Filters Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-800">Filter Employees</h3>
                  <p className="text-sm text-slate-500 ml-2">Refine your search with multiple criteria</p>
                </div>
                {hasFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Name Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Search Name
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type employee name..."
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="idle">Idle</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                {/* Advanced Filters Button */}
                <div className="flex items-end">
                  <button className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                    <Filter className="w-4 h-4" />
                    Show Advanced Filters
                  </button>
                </div>
              </div>

              {hasFilters && (
                <div className="mt-4 flex items-center space-x-2 text-sm text-slate-600">
                  <span className="font-medium">Active filters:</span>
                  {nameFilter && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                      Name: {nameFilter}
                    </span>
                  )}
                  {statusFilter && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full capitalize">
                      Status: {statusFilter}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Employee Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-800">All Employees</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Comprehensive view of team activity and performance
                  {hasFilters && ` (${members.length} result${members.length !== 1 ? 's' : ''})`}
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
