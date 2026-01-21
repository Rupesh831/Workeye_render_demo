import React, { useState, useEffect, useMemo } from 'react';
import { getActivityAnalytics } from '../../utils/analyticsApi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, Cell
} from 'recharts';
import { Clock, AlertCircle, TrendingDown, Moon, Zap } from 'lucide-react';

interface Props {
  memberId: number | null;
  startDate: string;
  endDate: string;
}

const IdleTimeAnalytics: React.FC<Props> = ({ memberId, startDate, endDate }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) {
      setError('Please select a member to view idle time analytics');
      setLoading(false);
      return;
    }
    loadData();
  }, [memberId, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getActivityAnalytics(memberId!, startDate, endDate);
      setLogs(data.logs);
    } catch (err: any) {
      console.error('Idle time analytics error:', err);
      setError(err.message || 'Failed to load idle time data');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    if (!logs.length) {
      return {
        dailyIdleData: [],
        histogramData: [
          { range: '0-5m', count: 0, percentage: 0 },
          { range: '5-10m', count: 0, percentage: 0 },
          { range: '10-15m', count: 0, percentage: 0 },
          { range: '15-30m', count: 0, percentage: 0 },
          { range: '30-60m', count: 0, percentage: 0 },
          { range: '60m+', count: 0, percentage: 0 }
        ],
        stackedComparisonData: [],
        stats: {
          totalIdleHours: 0,
          totalSessions: 0,
          avgIdlePerDay: 0,
          avgSessionDuration: 0,
          avgSessionsPerDay: 0,
          maxIdleSession: 0,
          maxIdleDate: 'N/A',
          peakIdleDay: 'N/A',
          peakIdleHours: 0,
          totalDays: 0
        }
      };
    }

    // Filter logs strictly within date range AND only idle/locked sessions
    const filteredIdleLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      const isInRange = logDate >= startDate && logDate <= endDate;
      const isIdle = log.is_idle || log.is_locked;
      return isInRange && isIdle;
    });

    if (!filteredIdleLogs.length) {
      return {
        dailyIdleData: [],
        histogramData: [
          { range: '0-5m', count: 0, percentage: 0 },
          { range: '5-10m', count: 0, percentage: 0 },
          { range: '10-15m', count: 0, percentage: 0 },
          { range: '15-30m', count: 0, percentage: 0 },
          { range: '30-60m', count: 0, percentage: 0 },
          { range: '60m+', count: 0, percentage: 0 }
        ],
        stackedComparisonData: [],
        stats: {
          totalIdleHours: 0,
          totalSessions: 0,
          avgIdlePerDay: 0,
          avgSessionDuration: 0,
          avgSessionsPerDay: 0,
          maxIdleSession: 0,
          maxIdleDate: 'N/A',
          peakIdleDay: 'N/A',
          peakIdleHours: 0,
          totalDays: 0
        }
      };
    }

    // Calculate idle sessions per day
    const dailyIdleMap: Record<string, { totalSeconds: number; sessionCount: number; sessions: number[] }> = {};

    filteredIdleLogs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      const duration = log.duration_seconds || 0;

      if (!dailyIdleMap[date]) {
        dailyIdleMap[date] = {
          totalSeconds: 0,
          sessionCount: 0,
          sessions: []
        };
      }

      dailyIdleMap[date].totalSeconds += duration;
      dailyIdleMap[date].sessionCount++;
      dailyIdleMap[date].sessions.push(duration);
    });

    // Daily idle hours chart data
    const dailyIdleData = Object.entries(dailyIdleMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        idleHours: Number((data.totalSeconds / 3600).toFixed(2)),
        sessions: data.sessionCount,
        avgSession: data.sessionCount > 0 ? Number((data.totalSeconds / data.sessionCount / 60).toFixed(1)) : 0
      }));

    // Calculate statistics
    const totalIdleSeconds = Object.values(dailyIdleMap).reduce((sum, data) => sum + data.totalSeconds, 0);
    const totalSessions = Object.values(dailyIdleMap).reduce((sum, data) => sum + data.sessionCount, 0);
    const totalDays = Object.keys(dailyIdleMap).length;

    const avgIdlePerDay = totalDays > 0 ? totalIdleSeconds / totalDays / 3600 : 0;
    const avgSessionDuration = totalSessions > 0 ? totalIdleSeconds / totalSessions / 60 : 0;
    const avgSessionsPerDay = totalDays > 0 ? totalSessions / totalDays : 0;

    // Find max idle session
    let maxIdleSession = 0;
    let maxIdleDate = '';
    Object.entries(dailyIdleMap).forEach(([date, data]) => {
      const maxInDay = Math.max(...data.sessions);
      if (maxInDay > maxIdleSession) {
        maxIdleSession = maxInDay;
        maxIdleDate = date;
      }
    });

    // Create histogram data (session duration distribution)
    // Buckets: 0-5m, 5-10m, 10-15m, 15-30m, 30-60m, 60m+
    const buckets = {
      '0-5m': 0,
      '5-10m': 0,
      '10-15m': 0,
      '15-30m': 0,
      '30-60m': 0,
      '60m+': 0
    };

    filteredIdleLogs.forEach(log => {
      const minutes = (log.duration_seconds || 0) / 60;
      if (minutes <= 5) buckets['0-5m']++;
      else if (minutes <= 10) buckets['5-10m']++;
      else if (minutes <= 15) buckets['10-15m']++;
      else if (minutes <= 30) buckets['15-30m']++;
      else if (minutes <= 60) buckets['30-60m']++;
      else buckets['60m+']++;
    });

    const histogramData = Object.entries(buckets).map(([range, count]) => ({
      range,
      count,
      percentage: totalSessions > 0 ? Number(((count / totalSessions) * 100).toFixed(1)) : 0
    }));

    // Stacked bar data (Active vs Idle comparison)
    const allLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      return logDate >= startDate && logDate <= endDate;
    });

    const dailyComparisonMap: Record<string, { active: number; idle: number }> = {};
    allLogs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      const duration = log.duration_seconds || 0;

      if (!dailyComparisonMap[date]) {
        dailyComparisonMap[date] = { active: 0, idle: 0 };
      }

      if (log.is_idle || log.is_locked) {
        dailyComparisonMap[date].idle += duration;
      } else {
        dailyComparisonMap[date].active += duration;
      }
    });

    const stackedComparisonData = Object.entries(dailyComparisonMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Active: Number((data.active / 3600).toFixed(2)),
        Idle: Number((data.idle / 3600).toFixed(2))
      }));

    // Find peak idle day
    const peakIdleDay = Object.entries(dailyIdleMap).reduce((max, [date, data]) => {
      return data.totalSeconds > max.seconds ? { date, seconds: data.totalSeconds } : max;
    }, { date: '', seconds: 0 });

    return {
      dailyIdleData,
      histogramData,
      stackedComparisonData,
      stats: {
        totalIdleHours: totalIdleSeconds / 3600,
        totalSessions,
        avgIdlePerDay,
        avgSessionDuration,
        avgSessionsPerDay,
        maxIdleSession: maxIdleSession / 60, // in minutes
        maxIdleDate: maxIdleDate ? new Date(maxIdleDate).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }) : 'N/A',
        peakIdleDay: peakIdleDay.date ? new Date(peakIdleDay.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }) : 'N/A',
        peakIdleHours: peakIdleDay.seconds / 3600,
        totalDays
      }
    };
  }, [logs, startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  const HISTOGRAM_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Idle Time Analytics</h2>
        <p className="text-sm text-slate-500 mt-1">
          Analyzing {analytics.stats.totalSessions} idle sessions across {analytics.stats.totalDays} days
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-2">
            <Moon className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-medium text-gray-700">Total Idle Time</h3>
          </div>
          <p className="text-3xl font-bold text-amber-900">{analytics.stats.totalIdleHours.toFixed(1)}h</p>
          <p className="text-sm text-gray-600 mt-1">Avg: {analytics.stats.avgIdlePerDay.toFixed(1)}h/day</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-700">Idle Sessions</h3>
          </div>
          <p className="text-3xl font-bold text-blue-900">{analytics.stats.totalSessions}</p>
          <p className="text-sm text-gray-600 mt-1">Avg: {analytics.stats.avgSessionsPerDay.toFixed(1)}/day</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-700">Avg Session</h3>
          </div>
          <p className="text-3xl font-bold text-purple-900">{analytics.stats.avgSessionDuration.toFixed(1)}m</p>
          <p className="text-sm text-gray-600 mt-1">Per idle session</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-medium text-gray-700">Longest Session</h3>
          </div>
          <p className="text-3xl font-bold text-red-900">{analytics.stats.maxIdleSession.toFixed(0)}m</p>
          <p className="text-sm text-gray-600 mt-1">{analytics.stats.maxIdleDate}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Histogram - Session Distribution */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Idle Session Distribution
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={analytics.histogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="range" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Number of Sessions', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name, props: any) => [
                  `${value} sessions (${props.payload.percentage}%)`,
                  'Count'
                ]}
              />
              <Bar dataKey="count" fill="#F59E0B">
                {analytics.histogramData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={HISTOGRAM_COLORS[index % HISTOGRAM_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Idle Hours */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Idle Hours
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={analytics.dailyIdleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="idleHours" fill="#F59E0B" name="Idle Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stacked Bar - Active vs Idle */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Active vs Idle Time Comparison
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={analytics.stackedComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="Active" stackId="a" fill="#10B981" name="Active Time" />
            <Bar dataKey="Idle" stackId="a" fill="#F59E0B" name="Idle Time" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Idle Time Trend */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Idle Time Trend
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={analytics.dailyIdleData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="left"
              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              label={{ value: 'Sessions', angle: 90, position: 'insideRight' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="idleHours" 
              stroke="#F59E0B" 
              strokeWidth={3}
              name="Idle Hours"
              dot={{ fill: '#F59E0B', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="sessions" 
              stroke="#3B82F6" 
              strokeWidth={3}
              name="Session Count"
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Idle Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Idle Hours</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Sessions</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Avg Session</th>
              </tr>
            </thead>
            <tbody>
              {analytics.dailyIdleData.map((day, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{day.date}</td>
                  <td className="py-3 px-4 text-center text-amber-900 font-medium">
                    {day.idleHours}h
                  </td>
                  <td className="py-3 px-4 text-center text-blue-900">
                    {day.sessions}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700">
                    {day.avgSession}m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">💡 Idle Time Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-slate-700 mb-2">Peak Idle Day</h4>
            <p className="text-sm text-slate-600">
              {analytics.stats.peakIdleDay} had the highest idle time with {analytics.stats.peakIdleHours.toFixed(1)} hours,
              indicating potential workflow interruptions or scheduled breaks.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-slate-700 mb-2">Session Patterns</h4>
            <p className="text-sm text-slate-600">
              Average idle session lasts {analytics.stats.avgSessionDuration.toFixed(1)} minutes with {analytics.stats.avgSessionsPerDay.toFixed(1)} sessions 
              per day, suggesting regular break patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdleTimeAnalytics;
