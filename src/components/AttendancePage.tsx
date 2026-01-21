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
  AlertCircle
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
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'idle':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (selectedMember) {
    return <AttendanceDetailView member={selectedMember} onBack={() => setSelectedMember(null)} />;
  }

  return (
    <div className="p-6">
      {error && (
        <div 
          className="mb-6 p-4 bg-red-50 rounded-2xl flex items-start space-x-3"
          style={{ boxShadow: '4px 4px 10px rgba(239, 68, 68, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.7)' }}
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
        <div 
          className="bg-[#e8ecf3] rounded-3xl p-6 transition-all hover:scale-105"
          style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div 
              className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center"
              style={{ boxShadow: '3px 3px 6px rgba(96, 165, 250, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)' }}
            >
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalMembers}</h3>
          <p className="text-sm text-gray-500 font-medium">Total Members</p>
        </div>

        <div 
          className="bg-[#e8ecf3] rounded-3xl p-6 transition-all hover:scale-105"
          style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div 
              className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center"
              style={{ boxShadow: '3px 3px 6px rgba(34, 197, 94, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)' }}
            >
              <LogIn className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.punchedIn}</h3>
          <p className="text-sm text-gray-500 font-medium">Punched In</p>
        </div>

        <div 
          className="bg-[#e8ecf3] rounded-3xl p-6 transition-all hover:scale-105"
          style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div 
              className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center"
              style={{ boxShadow: '3px 3px 6px rgba(251, 146, 60, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)' }}
            >
              <LogOut className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.punchedOut}</h3>
          <p className="text-sm text-gray-500 font-medium">Punched Out</p>
        </div>

        <div 
          className="bg-[#e8ecf3] rounded-3xl p-6 transition-all hover:scale-105"
          style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div 
              className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center"
              style={{ boxShadow: '3px 3px 6px rgba(167, 139, 250, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)' }}
            >
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.active}</h3>
          <p className="text-sm text-gray-500 font-medium">Active Now</p>
        </div>

        <div 
          className="bg-[#e8ecf3] rounded-3xl p-6 transition-all hover:scale-105"
          style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div 
              className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center"
              style={{ boxShadow: '3px 3px 6px rgba(251, 191, 36, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)' }}
            >
              <Moon className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.idle}</h3>
          <p className="text-sm text-gray-500 font-medium">Idle</p>
        </div>

        <div 
          className="bg-[#e8ecf3] rounded-3xl p-6 transition-all hover:scale-105"
          style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div 
              className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center"
              style={{ boxShadow: '3px 3px 6px rgba(156, 163, 175, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.7)' }}
            >
              <Power className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.offline}</h3>
          <p className="text-sm text-gray-500 font-medium">Offline</p>
        </div>
      </div>

      {/* Members Table */}
      <div 
        className="bg-[#e8ecf3] rounded-3xl overflow-hidden"
        style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
      >
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Attendance Records</h3>
            <p className="text-sm text-gray-500 mt-1">{filteredMembers.length} members</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-4 pr-4 py-2 bg-[#e8ecf3] rounded-2xl text-sm focus:outline-none"
                style={{ boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff' }}
              />
            </div>
            <button
              onClick={loadAttendanceData}
              disabled={loading}
              className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl transition-all hover:scale-105 disabled:opacity-50"
              style={{ boxShadow: '4px 4px 10px rgba(99, 102, 241, 0.3)' }}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading attendance...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No members found' : 'No attendance data'}
            </h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search' : 'Attendance data will appear here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Member</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Position</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Punch In</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Punch Out</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Hours</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold"
                          style={{ boxShadow: '3px 3px 6px rgba(99, 102, 241, 0.4)' }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.position || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(member.status)}`}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{formatTime(member.punch_in_time)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{formatTime(member.punch_out_time)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-indigo-600">{formatHours(member.today_hours)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedMember({ id: member.id, name: member.name })}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
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
    </div>
  );
}
