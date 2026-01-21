import React, { useState, useEffect, useMemo } from 'react';
import { getActivityAnalytics } from '../../utils/analyticsApi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { Activity, AlertCircle, Clock, TrendingUp, Zap } from 'lucide-react';

interface Props {
  memberId: number | null;
  startDate: string;
  endDate: string;
}

const ActivityAnalytics: React.FC<Props> = ({ memberId, startDate, endDate }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) {
      setError('Please select a member to view activity analytics');
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
      console.error('Activity analytics error:', err);
      // Only show error message, don't trigger logout
      setError(err.message || 'Failed to load activity data');
      setLogs([]); // Clear any stale data
    } finally {
      setLoading(false);
    }
  };

  // CLIENT-SIDE ANALYTICS CALCULATIONS with Date Isolation
  const analytics = useMemo(() => {
    // Always return analytics object, even with empty data
    if (!logs.length) {
      return {
        totalActiveHours: 0,
        totalIdleHours: 0,
        avgActivePerDay: 0,
        avgIdlePerDay: 0,
        activeRatio: 0,
        peakDay: { date: 'N/A', hours: 0 },
        stackedData: [],
        lineChartData: [],
        pieChartData: [
          { name: 'Active', value: 0, color: '#10B981' },
          { name: 'Idle', value: 0, color: '#F59E0B' }
        ],
        totalDays: 0,
        activeDays: 0
      };
    }

    // Filter logs strictly within the date range
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      return logDate >= startDate && logDate <= endDate;
    });

    if (!filteredLogs.length) return null;

    // Group by date for daily trends
    const byDate: Record<string, { 
      active: number; 
      idle: number; 
      date: string;
      logCount: number;
    }> = {};

    filteredLogs.forEach(log => {
      const logTimestamp = new Date(log.timestamp);
      const dateKey = logTimestamp.toISOString().split('T')[0];
      
      if (!byDate[dateKey]) {
        byDate[dateKey] = { 
          active: 0, 
          idle: 0, 
          date: dateKey,
          logCount: 0 
        };
      }

      const duration = log.duration_seconds || 0;
      byDate[dateKey].logCount++;

      if (log.is_idle || log.is_locked) {
        byDate[dateKey].idle += duration;
      } else {
        byDate[dateKey].active += duration;
      }
    });

    // Calculate totals
    const totalActive = Object.values(byDate).reduce((sum, d) => sum + d.active, 0);
    const totalIdle = Object.values(byDate).reduce((sum, d) => sum + d.idle, 0);
    const totalTime = totalActive + totalIdle;
    const activeRatio = totalTime > 0 ? (totalActive / totalTime) * 100 : 0;

    // Prepare chart data sorted by date
    const sortedDates = Object.keys(byDate).sort();
    const dailyTrendData = sortedDates.map(dateKey => {
      const data = byDate[dateKey];
      return {
        date: new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        activeHours: Number((data.active / 3600).toFixed(2)),
        idleHours: Number((data.idle / 3600).toFixed(2)),
        totalHours: Number(((data.active + data.idle) / 3600).toFixed(2)),
        ratio: data.active + data.idle > 0 ? Number(((data.active / (data.active + data.idle)) * 100).toFixed(1)) : 0
      };
    });

    // Stacked bar data (Active vs Idle per day)
    const stackedBarData = sortedDates.slice(-30).map(dateKey => {
      const data = byDate[dateKey];
      return {
        date: new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Active: Number((data.active / 3600).toFixed(2)),
        Idle: Number((data.idle / 3600).toFixed(2))
      };
    });

    // Pie chart data
    const pieData = [
      { name: 'Active Time', value: totalActive, color: '#10B981' },
      { name: 'Idle Time', value: totalIdle, color: '#F59E0B' }
    ];

    // Daily statistics
    const avgActivePerDay = totalActive / Object.keys(byDate).length / 3600;
    const avgIdlePerDay = totalIdle / Object.keys(byDate).length / 3600;
    const totalDays = Object.keys(byDate).length;

    // Peak activity day
    const peakDay = Object.entries(byDate).reduce((max, [date, data]) => {
      const current = data.active + data.idle;
      return current > max.value ? { date, value: current } : max;
    }, { date: '', value: 0 });

    return {
      totalActiveHours: totalActive / 3600,
      totalIdleHours: totalIdle / 3600,
      totalHours: totalTime / 3600,
      activeRatio,
      dailyTrendData,
      stackedBarData,
      pieData,
      avgActivePerDay,
      avgIdlePerDay,
      totalDays,
      peakDay: {
        date: peakDay.date ? new Date(peakDay.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }) : 'N/A',
        hours: peakDay.value / 3600
      },
      totalLogs: filteredLogs.length
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Activity Analytics</h2>
        <p className="text-sm text-slate-500 mt-1">
          Analyzing {analytics.totalLogs} activity logs across {analytics.totalDays} days
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-medium text-gray-700">Total Active</h3>
          </div>
          <p className="text-3xl font-bold text-green-900">{analytics.totalActiveHours.toFixed(1)}h</p>
          <p className="text-sm text-gray-600 mt-1">Avg: {analytics.avgActivePerDay.toFixed(1)}h/day</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-medium text-gray-700">Total Idle</h3>
          </div>
          <p className="text-3xl font-bold text-amber-900">{analytics.totalIdleHours.toFixed(1)}h</p>
          <p className="text-sm text-gray-600 mt-1">Avg: {analytics.avgIdlePerDay.toFixed(1)}h/day</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-700">Active Ratio</h3>
          </div>
          <p className="text-3xl font-bold text-blue-900">{analytics.activeRatio.toFixed(1)}%</p>
          <p className="text-sm text-gray-600 mt-1">Of total time</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-700">Peak Day</h3>
          </div>
          <p className="text-xl font-bold text-purple-900">{analytics.peakDay.date}</p>
          <p className="text-sm text-gray-600 mt-1">{analytics.peakDay.hours.toFixed(1)}h total</p>
        </div>
      </div>

      {/* Stacked Bar Chart - Active vs Idle */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active vs Idle Time (Daily)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={analytics.stackedBarData}>
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
            <Bar dataKey="Active" stackId="a" fill="#10B981" name="Active Hours" />
            <Bar dataKey="Idle" stackId="a" fill="#F59E0B" name="Idle Hours" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line Chart - Daily Trend */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={analytics.dailyTrendData}>
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
            <Line 
              type="monotone" 
              dataKey="activeHours" 
              stroke="#10B981" 
              strokeWidth={2}
              name="Active Hours"
              dot={{ fill: '#10B981', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="idleHours" 
              stroke="#F59E0B" 
              strokeWidth={2}
              name="Idle Hours"
              dot={{ fill: '#F59E0B', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="ratio" 
              stroke="#3B82F6" 
              strokeWidth={2}
              name="Active Ratio %"
              dot={{ fill: '#3B82F6', r: 4 }}
              yAxisId="right"
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              label={{ value: 'Ratio %', angle: 90, position: 'insideRight' }}
              tick={{ fontSize: 12 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart - Overall Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => `${(value / 3600).toFixed(2)} hours`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-700 font-medium">Total Days Tracked</span>
              <span className="text-slate-900 font-bold">{analytics.totalDays}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-700 font-medium">Total Hours Logged</span>
              <span className="text-slate-900 font-bold">{analytics.totalHours.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-700 font-medium">Avg Hours/Day</span>
              <span className="text-slate-900 font-bold">{(analytics.totalHours / analytics.totalDays).toFixed(1)}h</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-green-700 font-medium">Active Time</span>
              <span className="text-green-900 font-bold">{analytics.activeRatio.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
              <span className="text-amber-700 font-medium">Idle Time</span>
              <span className="text-amber-900 font-bold">{(100 - analytics.activeRatio).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityAnalytics;
