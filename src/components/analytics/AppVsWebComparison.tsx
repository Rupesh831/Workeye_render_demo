import React, { useState, useEffect, useMemo } from 'react';
import { getActivityAnalytics, getAppsAnalytics, getWebsitesAnalytics } from '../../utils/analyticsApi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts';
import { BarChart3, AlertCircle, TrendingUp, Monitor, Globe } from 'lucide-react';

interface Props {
  memberId: number | null;
  startDate: string;
  endDate: string;
}

const AppVsWebComparison: React.FC<Props> = ({ memberId, startDate, endDate }) => {
  const [appLogs, setAppLogs] = useState<any[]>([]);
  const [webLogs, setWebLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) {
      setError('Please select a member to view app vs website comparison');
      setLoading(false);
      return;
    }
    loadData();
  }, [memberId, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both app and website data in parallel
      const [appsData, websitesData] = await Promise.all([
        getAppsAnalytics(memberId!, startDate, endDate),
        getWebsitesAnalytics(memberId!, startDate, endDate)
      ]);
      
      setAppLogs(appsData);
      setWebLogs(websitesData);
    } catch (err: any) {
      console.error('App vs Web comparison error:', err);
      setError(err.message || 'Failed to load comparison data');
      setAppLogs([]);
      setWebLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    if (!appLogs.length && !webLogs.length) {
      return {
        stackedBarData: [],
        lineChartData: [],
        donutData: [
          { name: 'Applications', value: 0, percentage: 0, color: '#3B82F6' },
          { name: 'Websites', value: 0, percentage: 0, color: '#10B981' }
        ],
        stats: {
          totalAppHours: 0,
          totalWebHours: 0,
          totalHours: 0,
          appRatio: 0,
          webRatio: 0,
          avgAppPerDay: 0,
          avgWebPerDay: 0,
          dominant: 'N/A',
          dominantPercentage: 0,
          uniqueApps: 0,
          uniqueWebsites: 0,
          totalDays: 0
        }
      };
    }

    // Filter logs strictly within date range
    const filteredAppLogs = appLogs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      return logDate >= startDate && logDate <= endDate;
    });

    const filteredWebLogs = webLogs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      return logDate >= startDate && logDate <= endDate;
    });

    // Calculate daily totals for apps
    const appDailyMap: Record<string, number> = {};
    filteredAppLogs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      const duration = log.duration_seconds || 0;
      appDailyMap[date] = (appDailyMap[date] || 0) + duration;
    });

    // Calculate daily totals for websites
    const webDailyMap: Record<string, number> = {};
    filteredWebLogs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      const duration = log.duration_seconds || 0;
      webDailyMap[date] = (webDailyMap[date] || 0) + duration;
    });

    // Get all unique dates
    const allDates = Array.from(
      new Set([...Object.keys(appDailyMap), ...Object.keys(webDailyMap)])
    ).sort();

    // Prepare stacked bar chart data (App vs Web per day)
    const stackedBarData = allDates.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Apps: Number(((appDailyMap[date] || 0) / 3600).toFixed(2)),
      Websites: Number(((webDailyMap[date] || 0) / 3600).toFixed(2))
    }));

    // Prepare dual line chart data (trends)
    const lineChartData = allDates.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      appHours: Number(((appDailyMap[date] || 0) / 3600).toFixed(2)),
      webHours: Number(((webDailyMap[date] || 0) / 3600).toFixed(2))
    }));

    // Calculate totals
    const totalAppTime = Object.values(appDailyMap).reduce((sum, val) => sum + val, 0);
    const totalWebTime = Object.values(webDailyMap).reduce((sum, val) => sum + val, 0);
    const totalTime = totalAppTime + totalWebTime;

    const appRatio = totalTime > 0 ? (totalAppTime / totalTime) * 100 : 0;
    const webRatio = totalTime > 0 ? (totalWebTime / totalTime) * 100 : 0;

    // Donut chart data
    const donutData = [
      { name: 'Applications', value: totalAppTime / 3600, percentage: appRatio, color: '#3B82F6' },
      { name: 'Websites', value: totalWebTime / 3600, percentage: webRatio, color: '#10B981' }
    ];

    // Calculate daily averages
    const numDays = allDates.length;
    const avgAppPerDay = numDays > 0 ? totalAppTime / numDays / 3600 : 0;
    const avgWebPerDay = numDays > 0 ? totalWebTime / numDays / 3600 : 0;

    // Find dominant category
    const dominant = totalAppTime > totalWebTime ? 'Applications' : 'Websites';
    const dominantPercentage = Math.max(appRatio, webRatio);

    // Calculate app count vs website count
    const uniqueApps = new Set(filteredAppLogs.map(log => log.app_name || 'Unknown')).size;
    const uniqueWebsites = new Set(filteredWebLogs.map(log => log.domain || log.website_url || 'Unknown')).size;

    return {
      stackedBarData,
      lineChartData,
      donutData,
      stats: {
        totalAppHours: totalAppTime / 3600,
        totalWebHours: totalWebTime / 3600,
        totalHours: totalTime / 3600,
        appRatio,
        webRatio,
        avgAppPerDay,
        avgWebPerDay,
        dominant,
        dominantPercentage,
        uniqueApps,
        uniqueWebsites,
        totalDays: numDays
      }
    };
  }, [appLogs, webLogs, startDate, endDate]);

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
        <h2 className="text-xl font-bold text-slate-900">App vs Website Comparison</h2>
        <p className="text-sm text-slate-500 mt-1">
          Comparing {analytics.stats.uniqueApps} applications vs {analytics.stats.uniqueWebsites} websites across {analytics.stats.totalDays} days
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <Monitor className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-700">App Time</h3>
          </div>
          <p className="text-3xl font-bold text-blue-900">{analytics.stats.totalAppHours.toFixed(1)}h</p>
          <p className="text-sm text-gray-600 mt-1">{analytics.stats.appRatio.toFixed(1)}% of total</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-medium text-gray-700">Website Time</h3>
          </div>
          <p className="text-3xl font-bold text-green-900">{analytics.stats.totalWebHours.toFixed(1)}h</p>
          <p className="text-sm text-gray-600 mt-1">{analytics.stats.webRatio.toFixed(1)}% of total</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-700">Dominant Category</h3>
          </div>
          <p className="text-xl font-bold text-purple-900">{analytics.stats.dominant}</p>
          <p className="text-sm text-gray-600 mt-1">{analytics.stats.dominantPercentage.toFixed(1)}% usage</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-medium text-gray-700">Daily Average</h3>
          </div>
          <p className="text-3xl font-bold text-amber-900">{analytics.stats.totalHours.toFixed(1)}h</p>
          <p className="text-sm text-gray-600 mt-1">
            {analytics.stats.avgAppPerDay.toFixed(1)}h apps + {analytics.stats.avgWebPerDay.toFixed(1)}h web
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stacked Bar Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Usage - Apps vs Websites
          </h3>
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
              <Bar dataKey="Apps" stackId="a" fill="#3B82F6" name="Application Time" />
              <Bar dataKey="Websites" stackId="a" fill="#10B981" name="Website Time" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Overall Time Distribution
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={analytics.donutData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => `${value.toFixed(2)} hours`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {analytics.stats.totalHours.toFixed(1)} hours
            </p>
            <p className="text-sm text-gray-500">Total Screen Time</p>
          </div>
        </div>
      </div>

      {/* Dual Line Chart - Trends */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Usage Trends Over Time
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={analytics.lineChartData}>
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
              dataKey="appHours" 
              stroke="#3B82F6" 
              strokeWidth={3}
              name="Application Hours"
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="webHours" 
              stroke="#10B981" 
              strokeWidth={3}
              name="Website Hours"
              dot={{ fill: '#10B981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Metric</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Applications</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Websites</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">Total Time</td>
                <td className="py-3 px-4 text-center text-blue-900 font-medium">
                  {analytics.stats.totalAppHours.toFixed(2)}h
                </td>
                <td className="py-3 px-4 text-center text-green-900 font-medium">
                  {analytics.stats.totalWebHours.toFixed(2)}h
                </td>
                <td className="py-3 px-4 text-center text-gray-700">
                  {Math.abs(analytics.stats.totalAppHours - analytics.stats.totalWebHours).toFixed(2)}h
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">Percentage</td>
                <td className="py-3 px-4 text-center text-blue-900 font-medium">
                  {analytics.stats.appRatio.toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-center text-green-900 font-medium">
                  {analytics.stats.webRatio.toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-center text-gray-700">
                  {Math.abs(analytics.stats.appRatio - analytics.stats.webRatio).toFixed(1)}%
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">Daily Average</td>
                <td className="py-3 px-4 text-center text-blue-900 font-medium">
                  {analytics.stats.avgAppPerDay.toFixed(2)}h
                </td>
                <td className="py-3 px-4 text-center text-green-900 font-medium">
                  {analytics.stats.avgWebPerDay.toFixed(2)}h
                </td>
                <td className="py-3 px-4 text-center text-gray-700">
                  {Math.abs(analytics.stats.avgAppPerDay - analytics.stats.avgWebPerDay).toFixed(2)}h
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">Unique Count</td>
                <td className="py-3 px-4 text-center text-blue-900 font-medium">
                  {analytics.stats.uniqueApps} apps
                </td>
                <td className="py-3 px-4 text-center text-green-900 font-medium">
                  {analytics.stats.uniqueWebsites} sites
                </td>
                <td className="py-3 px-4 text-center text-gray-700">
                  {Math.abs(analytics.stats.uniqueApps - analytics.stats.uniqueWebsites)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">📊 Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-slate-700 mb-2">Usage Pattern</h4>
            <p className="text-sm text-slate-600">
              {analytics.stats.dominant} dominate with {analytics.stats.dominantPercentage.toFixed(1)}% of total screen time,
              showing a preference for {analytics.stats.dominant === 'Applications' ? 'desktop applications' : 'web-based activities'}.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-slate-700 mb-2">Daily Balance</h4>
            <p className="text-sm text-slate-600">
              On average, {analytics.stats.avgAppPerDay.toFixed(1)} hours spent on applications and {analytics.stats.avgWebPerDay.toFixed(1)} hours 
              on websites per day over the {analytics.stats.totalDays}-day period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppVsWebComparison;
