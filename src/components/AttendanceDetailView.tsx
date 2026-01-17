import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Download,
  Filter,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AttendanceDetailViewProps {
  member: {
    id: number;
    name: string;
    email?: string;
    position?: string;
  };
  onBack: () => void;
}

interface AttendanceRecord {
  date: string;
  day: string;
  punch_in: string;
  punch_out: string;
  duration: string;
  duration_seconds: number;
  is_working_day: boolean;
  status: string;
}

interface AttendanceStats {
  total_days: number;
  working_days: number;
  days_present: number;
  days_absent: number;
  attendance_percentage: number;
  total_hours: number;
  average_hours_per_day: number;
}

interface AnalyticsData {
  date?: string;
  week?: string;
  month?: string;
  hours?: number;
  total_hours?: number;
  days_present?: number;
  avg_hours_per_day?: number;
  day_name?: string;
}

export function AttendanceDetailView({ member, onBack }: AttendanceDetailViewProps) {
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyRecords, setDailyRecords] = useState<AttendanceRecord[]>([]);
  const [statistics, setStatistics] = useState<AttendanceStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [memberDetails, setMemberDetails] = useState({
    email: member.email || '',
    position: member.position || '',
    department: ''
  });

  // Fetch attendance data with daily breakdown
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://backend-35m2.onrender.com'}/api/attendance/member/${member.id}?start_date=${dateRange.start}&end_date=${dateRange.end}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      
      if (data.success) {
        setDailyRecords(data.daily_records || []);
        setStatistics(data.statistics || null);
        
        if (data.member) {
          setMemberDetails({
            email: data.member.email || member.email || '',
            position: data.member.position || member.position || '',
            department: data.member.department || ''
          });
        }
      } else {
        throw new Error(data.error || 'Failed to fetch attendance');
      }
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics data for charts
  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://backend-35m2.onrender.com'}/api/attendance/analytics/${member.id}?view=${view}&start_date=${dateRange.start}&end_date=${dateRange.end}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalyticsData(data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [member.id, dateRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [member.id, view, dateRange]);

  // Format date helpers
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatChartDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !statistics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Attendance Details</h1>
                <p className="text-sm text-gray-500">
                  {member.name}
                  {memberDetails.email && ` • ${memberDetails.email}`}
                  {memberDetails.position && ` • ${memberDetails.position}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="hidden md:flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error loading data</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Date Range Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Date Range</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                max={dateRange.end}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                min={dateRange.start}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchAttendanceData}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Apply'}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Showing data from {formatDate(dateRange.start)} to {formatDate(dateRange.end)}
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Total Working Days</div>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{statistics.working_days}</div>
              <div className="text-xs text-gray-500 mt-1">
                of {statistics.total_days} total days
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Days Present</div>
                <Clock className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-600">{statistics.days_present}</div>
              <div className="text-xs text-gray-500 mt-1">
                {statistics.days_absent} days absent
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Total Hours</div>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {statistics.total_hours.toFixed(1)}h
              </div>
              <div className="text-xs text-gray-500 mt-1">
                across all working days
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Attendance %</div>
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {statistics.attendance_percentage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                avg {statistics.average_hours_per_day.toFixed(1)}h/day
              </div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setView('daily')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  view === 'daily'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setView('weekly')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  view === 'weekly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setView('monthly')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  view === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Chart */}
          {analyticsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey={view === 'daily' ? 'date' : view === 'weekly' ? 'week' : 'month'}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (view === 'daily') {
                      return formatChartDate(value);
                    }
                    return value;
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value} hours`, 'Working Hours']}
                  labelFormatter={(label) => {
                    if (view === 'daily') {
                      return formatDate(label);
                    }
                    return label;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={view === 'daily' ? 'hours' : 'total_hours'}
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Hours Worked"
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>No analytics data available for the selected period</p>
            </div>
          )}
        </div>

        {/* Daily Attendance Records Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
            <p className="text-sm text-gray-500 mt-1">
              Daily breakdown from {formatDate(dateRange.start)} to {formatDate(dateRange.end)}
              {dailyRecords.length > 0 && ` (${dailyRecords.length} days)`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Punch In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Punch Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailyRecords.length > 0 ? (
                  dailyRecords.map((record) => (
                    <tr 
                      key={record.date}
                      className={
                        record.status === 'Absent' && record.is_working_day
                          ? 'bg-red-50 hover:bg-red-100'
                          : 'hover:bg-gray-50'
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {record.day}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {record.punch_in}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {record.punch_out}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.duration}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          record.status === 'Present'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'Absent'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No attendance records found for the selected date range
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
