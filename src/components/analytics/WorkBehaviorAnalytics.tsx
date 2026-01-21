import React, { useState, useEffect, useMemo } from 'react';
import { getAttendanceAnalytics, getActivityAnalytics } from '../../utils/analyticsApi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, Cell
} from 'recharts';
import { Target, AlertCircle, Clock, Zap, TrendingUp, Coffee } from 'lucide-react';

interface Props {
  memberId: number | null;
  date: string; // Single date for detailed view
  startDate: string;
  endDate: string;
}

const WorkBehaviorAnalytics: React.FC<Props> = ({ memberId, date, startDate, endDate }) => {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) {
      setError('Please select a member to view work behavior analytics');
      setLoading(false);
      return;
    }
    loadData();
  }, [memberId, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both attendance and activity data in parallel
      const [attendance, activity] = await Promise.all([
        getAttendanceAnalytics(memberId, startDate, endDate),
        getActivityAnalytics(memberId!, startDate, endDate)
      ]);
      
      setAttendanceData(attendance);
      setActivityData(activity.logs);
    } catch (err: any) {
      console.error('Work behavior analytics error:', err);
      setError(err.message || 'Failed to load work behavior data');
      setAttendanceData([]);
      setActivityData([]);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    if (!attendanceData.length || !activityData.length) {
      return {
        dailyMetrics: [],
        heatmapData: Array.from({ length: 24 }, (_, hour) => ({ hour: `${hour}:00` })),
        stats: {
          avgGapStart: 0,
          avgGapEnd: 0,
          avgFocusPeriods: 0,
          avgWorkIntensity: 0,
          totalFocusPeriods: 0,
          peakProductivityHour: 0,
          peakProductivityHours: 0,
          totalDays: 0
        }
      };
    }

    // Filter data strictly within date range
    const filteredAttendance = attendanceData.filter(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate >= startDate && recordDate <= endDate;
    });

    const filteredActivity = activityData.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      return logDate >= startDate && logDate <= endDate;
    });

    if (!filteredAttendance.length || !filteredActivity.length) {
      return {
        dailyMetrics: [],
        heatmapData: Array.from({ length: 24 }, (_, hour) => ({ hour: `${hour}:00` })),
        stats: {
          avgGapStart: 0,
          avgGapEnd: 0,
          avgFocusPeriods: 0,
          avgWorkIntensity: 0,
          totalFocusPeriods: 0,
          peakProductivityHour: 0,
          peakProductivityHours: 0,
          totalDays: 0
        }
      };
    }

    // Combine attendance and activity data by date
    const dailyBehaviorMap: Record<string, {
      punchIn?: Date;
      punchOut?: Date;
      firstActivity?: Date;
      lastActivity?: Date;
      activeMinutes: number;
      idleMinutes: number;
      focusSessions: number[];
      breakSessions: number[];
      hourlyActivity: Record<number, number>;
    }> = {};

    // Process attendance data
    filteredAttendance.forEach(record => {
      const dateKey = new Date(record.date).toISOString().split('T')[0];
      
      if (!dailyBehaviorMap[dateKey]) {
        dailyBehaviorMap[dateKey] = {
          activeMinutes: 0,
          idleMinutes: 0,
          focusSessions: [],
          breakSessions: [],
          hourlyActivity: {}
        };
      }

      if (record.punch_in_time) {
        dailyBehaviorMap[dateKey].punchIn = new Date(record.punch_in_time);
      }
      if (record.punch_out_time) {
        dailyBehaviorMap[dateKey].punchOut = new Date(record.punch_out_time);
      }
    });

    // Process activity data
    filteredActivity.forEach(log => {
      const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
      const logTime = new Date(log.timestamp);
      const hour = logTime.getHours();
      const duration = log.duration_seconds || 0;

      if (!dailyBehaviorMap[dateKey]) {
        dailyBehaviorMap[dateKey] = {
          activeMinutes: 0,
          idleMinutes: 0,
          focusSessions: [],
          breakSessions: [],
          hourlyActivity: {}
        };
      }

      const dayData = dailyBehaviorMap[dateKey];

      // Track first and last activity
      if (!dayData.firstActivity || logTime < dayData.firstActivity) {
        dayData.firstActivity = logTime;
      }
      if (!dayData.lastActivity || logTime > dayData.lastActivity) {
        dayData.lastActivity = logTime;
      }

      // Track active/idle time
      if (log.is_idle || log.is_locked) {
        dayData.idleMinutes += duration / 60;
        dayData.breakSessions.push(duration);
      } else {
        dayData.activeMinutes += duration / 60;
        dayData.focusSessions.push(duration);
      }

      // Hourly activity distribution
      dayData.hourlyActivity[hour] = (dayData.hourlyActivity[hour] || 0) + duration;
    });

    // Calculate gaps and metrics
    const dailyMetrics = Object.entries(dailyBehaviorMap).map(([date, data]) => {
      // Calculate gaps
      const gapStart = data.punchIn && data.firstActivity 
        ? (data.firstActivity.getTime() - data.punchIn.getTime()) / 1000 / 60
        : 0;
      
      const gapEnd = data.punchOut && data.lastActivity
        ? (data.punchOut.getTime() - data.lastActivity.getTime()) / 1000 / 60
        : 0;

      // Calculate focus periods (continuous active sessions > 15 minutes)
      const focusPeriods = data.focusSessions.filter(s => s > 900).length; // > 15 minutes
      
      // Calculate average focus duration
      const avgFocus = focusPeriods > 0
        ? data.focusSessions.filter(s => s > 900).reduce((a, b) => a + b, 0) / focusPeriods / 60
        : 0;

      // Work intensity (active time / total time)
      const totalTime = data.activeMinutes + data.idleMinutes;
      const workIntensity = totalTime > 0 ? (data.activeMinutes / totalTime) * 100 : 0;

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date,
        gapStart: Math.max(0, gapStart),
        gapEnd: Math.max(0, gapEnd),
        activeHours: data.activeMinutes / 60,
        idleHours: data.idleMinutes / 60,
        focusPeriods,
        avgFocusDuration: avgFocus,
        workIntensity,
        hourlyActivity: data.hourlyActivity,
        punchInTime: data.punchIn?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        punchOutTime: data.punchOut?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        firstActivityTime: data.firstActivity?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        lastActivityTime: data.lastActivity?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    });

    // Create work intensity heatmap (24 hours x days)
    const heatmapData: any[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourRow: any = { hour: `${hour}:00` };
      
      dailyMetrics.forEach(day => {
        const intensity = day.hourlyActivity[hour] || 0;
        hourRow[day.date] = Number((intensity / 3600).toFixed(2)); // Convert to hours
      });
      
      heatmapData.push(hourRow);
    }

    // Calculate overall statistics
    const avgGapStart = dailyMetrics.reduce((sum, d) => sum + d.gapStart, 0) / dailyMetrics.length;
    const avgGapEnd = dailyMetrics.reduce((sum, d) => sum + d.gapEnd, 0) / dailyMetrics.length;
    const avgFocusPeriods = dailyMetrics.reduce((sum, d) => sum + d.focusPeriods, 0) / dailyMetrics.length;
    const avgWorkIntensity = dailyMetrics.reduce((sum, d) => sum + d.workIntensity, 0) / dailyMetrics.length;
    const totalFocusPeriods = dailyMetrics.reduce((sum, d) => sum + d.focusPeriods, 0);

    // Find peak productivity hour (across all days)
    const hourlyTotals: Record<number, number> = {};
    Object.values(dailyBehaviorMap).forEach(day => {
      Object.entries(day.hourlyActivity).forEach(([hour, duration]) => {
        hourlyTotals[parseInt(hour)] = (hourlyTotals[parseInt(hour)] || 0) + duration;
      });
    });

    const peakHour = Object.entries(hourlyTotals)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      dailyMetrics,
      heatmapData,
      stats: {
        avgGapStart,
        avgGapEnd,
        avgFocusPeriods,
        avgWorkIntensity,
        totalFocusPeriods,
        peakProductivityHour: peakHour ? parseInt(peakHour[0]) : 0,
        peakProductivityHours: peakHour ? peakHour[1] / 3600 : 0,
        totalDays: dailyMetrics.length
      }
    };
  }, [attendanceData, activityData, startDate, endDate]);

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
        <h2 className="text-xl font-bold text-slate-900">Work Behavior Analytics</h2>
        <p className="text-sm text-slate-500 mt-1">
          Analyzing work patterns across {analytics.stats.totalDays} days with {analytics.stats.totalFocusPeriods} focus periods
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-700">Avg Start Gap</h3>
          </div>
          <p className="text-3xl font-bold text-blue-900">{analytics.stats.avgGapStart.toFixed(0)}m</p>
          <p className="text-sm text-gray-600 mt-1">Punch-in to first activity</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-700">Focus Periods</h3>
          </div>
          <p className="text-3xl font-bold text-purple-900">{analytics.stats.avgFocusPeriods.toFixed(1)}</p>
          <p className="text-sm text-gray-600 mt-1">Avg per day</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-medium text-gray-700">Work Intensity</h3>
          </div>
          <p className="text-3xl font-bold text-green-900">{analytics.stats.avgWorkIntensity.toFixed(0)}%</p>
          <p className="text-sm text-gray-600 mt-1">Active time ratio</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-2">
            <Coffee className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-medium text-gray-700">Avg End Gap</h3>
          </div>
          <p className="text-3xl font-bold text-amber-900">{analytics.stats.avgGapEnd.toFixed(0)}m</p>
          <p className="text-sm text-gray-600 mt-1">Last activity to punch-out</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Focus Duration Graph */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Focus Periods
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={analytics.dailyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                label={{ value: 'Focus Periods', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="focusPeriods" fill="#8B5CF6" name="Focus Periods (>15min)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Work Intensity */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Work Intensity by Day
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={analytics.dailyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                label={{ value: 'Intensity %', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="workIntensity" fill="#10B981" name="Work Intensity %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gap Analysis */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Time Gap Analysis (Punch vs Activity)
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={analytics.dailyMetrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="gapStart" fill="#3B82F6" name="Start Gap (min)" />
            <Bar dataKey="gapEnd" fill="#F59E0B" name="End Gap (min)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline Table (Gantt-style) */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Timeline</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Punch In</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">First Activity</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Last Activity</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Punch Out</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Start Gap</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">End Gap</th>
              </tr>
            </thead>
            <tbody>
              {analytics.dailyMetrics.map((day, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{day.date}</td>
                  <td className="py-3 px-4 text-center text-blue-700 text-sm">
                    {day.punchInTime || '-'}
                  </td>
                  <td className="py-3 px-4 text-center text-green-700 text-sm">
                    {day.firstActivityTime || '-'}
                  </td>
                  <td className="py-3 px-4 text-center text-green-700 text-sm">
                    {day.lastActivityTime || '-'}
                  </td>
                  <td className="py-3 px-4 text-center text-blue-700 text-sm">
                    {day.punchOutTime || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      day.gapStart > 15 ? 'bg-red-100 text-red-800' :
                      day.gapStart > 5 ? 'bg-amber-100 text-amber-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {day.gapStart.toFixed(0)}m
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      day.gapEnd > 15 ? 'bg-red-100 text-red-800' :
                      day.gapEnd > 5 ? 'bg-amber-100 text-amber-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {day.gapEnd.toFixed(0)}m
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">🎯 Work Behavior Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-slate-700 mb-2">Peak Productivity</h4>
            <p className="text-sm text-slate-600">
              Peak productivity occurs at {analytics.stats.peakProductivityHour}:00 with {analytics.stats.peakProductivityHours.toFixed(1)} hours 
              of total activity across all days.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-slate-700 mb-2">Work Pattern</h4>
            <p className="text-sm text-slate-600">
              Average {analytics.stats.avgGapStart.toFixed(0)} minute delay after punch-in and {analytics.stats.avgWorkIntensity.toFixed(0)}% 
              work intensity suggest {analytics.stats.avgWorkIntensity > 70 ? 'high' : 'moderate'} productivity levels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkBehaviorAnalytics;
