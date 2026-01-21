import React, { useState, useEffect, useMemo } from 'react';
import { getAppsAnalytics } from '../../utils/analyticsApi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Monitor, AlertCircle, Clock, TrendingUp } from 'lucide-react';

interface Props {
  memberId: number | null;
  startDate: string;
  endDate: string;
}

const ApplicationAnalytics: React.FC<Props> = ({ memberId, startDate, endDate }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) {
      setError('Please select a member to view application analytics');
      setLoading(false);
      return;
    }
    loadData();
  }, [memberId, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAppsAnalytics(memberId!, startDate, endDate);
      setLogs(data);
    } catch (err: any) {
      console.error('Application analytics error:', err);
      setError(err.message || 'Failed to load application data');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // COMPREHENSIVE ANALYTICS CALCULATIONS
  const analytics = useMemo(() => {
    if (!logs.length) return null;

    // Filter logs strictly within date range
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      return logDate >= startDate && logDate <= endDate;
    });

    if (!filteredLogs.length) return null;

    // Calculate time per app
    const appMap: Record<string, number> = {};
    const appHourlyMap: Record<string, Record<number, number>> = {};

    filteredLogs.forEach(log => {
      const app = log.app_name || 'Unknown';
      const duration = log.duration_seconds || 0;
      const hour = new Date(log.timestamp).getHours();

      // Total duration per app
      appMap[app] = (appMap[app] || 0) + duration;

      // Hourly breakdown per app
      if (!appHourlyMap[app]) {
        appHourlyMap[app] = {};
      }
      appHourlyMap[app][hour] = (appHourlyMap[app][hour] || 0) + duration;
    });

    // Sort apps by duration
    const sortedApps = Object.entries(appMap)
      .map(([name, seconds]) => ({
        name,
        hours: seconds / 3600,
        seconds,
        percentage: 0 // Will calculate below
      }))
      .sort((a, b) => b.hours - a.hours);

    // Calculate percentages
    const totalSeconds = sortedApps.reduce((sum, app) => sum + app.seconds, 0);
    sortedApps.forEach(app => {
      app.percentage = totalSeconds > 0 ? (app.seconds / totalSeconds) * 100 : 0;
    });

    // Top 10 apps for horizontal bar
    const topApps = sortedApps.slice(0, 10).map(app => ({
      name: app.name.length > 25 ? app.name.substring(0, 22) + '...' : app.name,
      hours: Number(app.hours.toFixed(2)),
      percentage: app.percentage.toFixed(1)
    }));

    // Top 5 for pie chart
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const pieData = sortedApps.slice(0, 5).map((app, i) => ({
      name: app.name,
      value: Number(app.hours.toFixed(2)),
      percentage: app.percentage,
      color: COLORS[i % COLORS.length]
    }));

    // Heatmap data (top 5 apps x 24 hours)
    const heatmapData = [];
    const top5Apps = sortedApps.slice(0, 5);
    
    for (let hour = 0; hour < 24; hour++) {
      const hourData: any = { hour: `${hour}:00` };
      top5Apps.forEach(app => {
        const appHourly = appHourlyMap[app.name] || {};
        hourData[app.name] = Number(((appHourly[hour] || 0) / 3600).toFixed(2));
      });
      heatmapData.push(hourData);
    }

    // Statistics
    const stats = {
      totalApps: Object.keys(appMap).length,
      totalHours: totalSeconds / 3600,
      avgHoursPerApp: totalSeconds / 3600 / Object.keys(appMap).length,
      topApp: sortedApps[0],
      mostUsedHour: findPeakHour(appHourlyMap)
    };

    return {
      topApps,
      pieData,
      heatmapData,
      stats,
      COLORS,
      top5AppNames: top5Apps.map(app => app.name)
    };
  }, [logs, startDate, endDate]);

  // Helper function to find peak usage hour
  const findPeakHour = (hourlyMap: Record<string, Record<number, number>>) => {
    const hourTotals: Record<number, number> = {};
    Object.values(hourlyMap).forEach(appHours => {
      Object.entries(appHours).forEach(([hour, duration]) => {
        const h = parseInt(hour);
        hourTotals[h] = (hourTotals[h] || 0) + duration;
      });
    });

    const peak = Object.entries(hourTotals)
      .sort(([, a], [, b]) => b - a)[0];
    
    return peak ? {
      hour: parseInt(peak[0]),
      hours: peak[1] / 3600
    } : { hour: 0, hours: 0 };
  };

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

  if (!analytics) {
    return (
      <div className="text-center py-20 text-gray-500">
        <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p>No application data available for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Application Analytics</h2>
        <p className="text-sm text-slate-500 mt-1">
          Tracking {analytics.stats.totalApps} applications across {analytics.stats.totalHours.toFixed(1)} hours
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <Monitor className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-700">Total Apps</h3>
          </div>
          <p className="text-3xl font-bold text-blue-900">{analytics.stats.totalApps}</p>
          <p className="text-sm text-gray-600 mt-1">Unique applications</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-medium text-gray-700">Total Time</h3>
          </div>
          <p className="text-3xl font-bold text-green-900">{analytics.stats.totalHours.toFixed(1)}h</p>
          <p className="text-sm text-gray-600 mt-1">Across all apps</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-700">Top Application</h3>
          </div>
          <p className="text-xl font-bold text-purple-900 truncate">
            {analytics.stats.topApp.name.length > 15 
              ? analytics.stats.topApp.name.substring(0, 12) + '...' 
              : analytics.stats.topApp.name}
          </p>
          <p className="text-sm text-gray-600 mt-1">{analytics.stats.topApp.hours.toFixed(1)}h</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-medium text-gray-700">Peak Hour</h3>
          </div>
          <p className="text-3xl font-bold text-amber-900">
            {analytics.stats.mostUsedHour.hour}:00
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {analytics.stats.mostUsedHour.hours.toFixed(1)}h usage
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Applications - Horizontal Bar */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 10 Applications by Duration
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.topApps} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={150} 
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => [`${value} hours`, 'Duration']}
              />
              <Bar dataKey="hours" fill="#3B82F6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Usage Share - Pie Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 5 Usage Share
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={analytics.pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => 
                  `${name.length > 12 ? name.substring(0, 9) + '...' : name}: ${percentage.toFixed(1)}%`
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => `${value} hours`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap - Hourly Usage Pattern */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Hourly Usage Pattern (Top 5 Applications)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 sticky left-0 bg-white">
                  Hour
                </th>
                {analytics.top5AppNames.map((appName, idx) => (
                  <th key={idx} className="text-center py-3 px-4 font-semibold text-gray-700 min-w-[100px]">
                    <div className="truncate" title={appName}>
                      {appName.length > 12 ? appName.substring(0, 9) + '...' : appName}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analytics.heatmapData.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900 sticky left-0 bg-white">
                    {row.hour}
                  </td>
                  {analytics.top5AppNames.map((appName, appIdx) => {
                    const value = row[appName] || 0;
                    const intensity = Math.min(value / 1, 1); // Normalize to 0-1, max 1 hour
                    const bgColor = value > 0 
                      ? `rgba(59, 130, 246, ${0.1 + intensity * 0.7})`
                      : 'transparent';
                    
                    return (
                      <td 
                        key={appIdx} 
                        className="py-3 px-4 text-center"
                        style={{ backgroundColor: bgColor }}
                      >
                        <span className={`text-sm ${value > 0.5 ? 'text-white font-medium' : 'text-gray-700'}`}>
                          {value > 0 ? value.toFixed(2) : '-'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          * Values represent hours of usage. Darker cells indicate higher usage.
        </p>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Applications</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Application</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Duration</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Share</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topApps.map((app, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">#{idx + 1}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{app.name}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{app.hours}h</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      {app.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ApplicationAnalytics;
