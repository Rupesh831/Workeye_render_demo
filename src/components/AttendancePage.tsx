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
  Eye,
  ArrowLeft,
  Clock,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProfileDropdown } from './ProfileDropdown';
import { AttendanceDetailView } from './AttendanceDetailView';
import { dashboard as dashboardAPI } from '../config/api';

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
  const { user, company, logout } = useAuth();
  const [membersData, setMembersData] = useState<MemberAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<{ id: number; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadAttendanceData();
    // Refresh every 30 seconds
    const interval = setInterval(loadAttendanceData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAttendanceData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch attendance data from backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://backend-35m2.onrender.com'}/api/attendance/members`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();

      if (data.success && data.members) {
        setMembersData(data.members);
      } else {
        setMembersData([]);
      }

      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error loading attendance data:', err);
      setError(err.message || 'Failed to load attendance data');
      setMembersData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from actual data
  const stats = {
    totalMembers: membersData.length,
    punchedIn: membersData.filter(m => m.is_punched_in).length,
    punchedOut: membersData.filter(m => !m.is_punched_in && m.punch_in_time).length,
    active: membersData.filter(m => m.status === 'active').length,
    idle: membersData.filter(m => m.status === 'idle').length,
    offline: membersData.filter(m => m.status === 'offline').length,
    avgProductivity: membersData.length > 0 
      ? Math.round((membersData.filter(m => m.status === 'active').length / membersData.length) * 100) 
      : 0
  };

  // Filter members
  const filteredMembers = membersData.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.position && member.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (member.department && member.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Format time
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  // Format hours
  const formatHours = (hours: number) => {
    if (hours === 0) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'idle':
        return 'bg-yellow-100 text-yellow-700';
      case 'offline':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    loadAttendanceData();
  };

  if (selectedMember) {
    return (
      <AttendanceDetailView
        member={selectedMember}
        onBack={() => setSelectedMember(null)}
      />
    );
  }

  const userName = user?.full_name || user?.email || 'Admin';
  const userRole = user?.role || 'Admin';
  const companyName = company?.company_name || 'Company';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header - Same as Dashboard */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Work Eye
                  </h1>
                  <span className="text-xs text-slate-500">{companyName}</span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <ProfileDropdown
                adminName={userName}
                adminRole={userRole}
                companyName={companyName}
                onLogout={handleLogout}
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 pb-3">
            <nav className="flex space-x-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 rounded-lg font-medium transition-all text-slate-600 hover:bg-slate-100"
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Dashboard
              </button>
              <button
                className="px-4 py-2 rounded-lg font-medium transition-all bg-blue-100 text-blue-700"
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Attendance
              </button>
            </nav>

            <div className="text-xs text-slate-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
            <div>
              <p className="text-sm font-medium text-red-800">Error loading attendance</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Grid - Dashboard Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Members */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                Total
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalMembers}</h3>
              <p className="text-sm text-slate-500">Team Members</p>
            </div>
          </div>

          {/* Punched In */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <LogIn className="w-6 h-6 text-green-600" />
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                In
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-green-600">{stats.punchedIn}</h3>
              <p className="text-sm text-slate-500">Punched In</p>
            </div>
          </div>

          {/* Punched Out */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <LogOut className="w-6 h-6 text-orange-600" />
              </div>
              <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold">
                Out
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-orange-600">{stats.punchedOut}</h3>
              <p className="text-sm text-slate-500">Punched Out</p>
            </div>
          </div>

          {/* Active Now (from Dashboard) */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">
                Live
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-purple-600">{stats.active}</h3>
              <p className="text-sm text-slate-500">Active Now</p>
            </div>
          </div>

          {/* Idle (from Dashboard) */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Moon className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-semibold">
                Idle
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-yellow-600">{stats.idle}</h3>
              <p className="text-sm text-slate-500">Idle Members</p>
            </div>
          </div>

          {/* Offline (from Dashboard) */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Power className="w-6 h-6 text-slate-600" />
              </div>
              <span className="px-3 py-1 bg-slate-50 text-slate-700 rounded-full text-xs font-semibold">
                Offline
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-slate-600">{stats.offline}</h3>
              <p className="text-sm text-slate-500">Offline</p>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          {/* Search Bar */}
          <div className="p-6 border-b border-slate-100">
            <div className="relative">
              <input
                type="text"
                placeholder="Search members by name, email, position, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">Loading attendance...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchQuery ? 'No members found' : 'No members yet'}
              </h3>
              <p className="text-slate-600">
                {searchQuery ? 'Try adjusting your search criteria' : 'Add team members to start tracking attendance'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Punch In
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Punch Out
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Today's Hours
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{member.name}</p>
                            <p className="text-sm text-slate-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {member.position || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(member.status)}`}>
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700 font-medium">
                          {formatTime(member.punch_in_time)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700 font-medium">
                          {formatTime(member.punch_out_time)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-blue-600">
                          {formatHours(member.today_hours)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedMember({ id: member.id, name: member.name })}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
