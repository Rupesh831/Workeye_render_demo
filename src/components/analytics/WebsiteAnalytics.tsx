import React, { useState, useEffect, useMemo } from 'react';
import { getWebsitesAnalytics } from '../../utils/analyticsApi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Globe, AlertCircle, TrendingUp, Clock } from 'lucide-react';

interface Props {
  memberId: number | null;
  startDate: string;
  endDate: string;
}

const WebsiteAnalytics: React.FC<Props> = ({ memberId, startDate, endDate }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) {
      setError('Please select a member to view website analytics');
      setLoading(false);
      return;
    }
    loadData();
  }, [memberId, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWebsitesAnalytics(memberId!, startDate, endDate);
      setLogs(data);
    } catch (err: any) {
      console.error('Website analytics error:', err);
      setError(err.message || 'Failed to load website data');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Extract domain from URL
  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Categorize websites (basic categorization)
  const categorizeWebsite = (domain: string): string => {
    const lowerDomain = domain.toLowerCase();
    
    // Productivity
    if (lowerDomain.includes('docs.') || lowerDomain.includes('drive.') || 
        lowerDomain.includes('notion') || lowerDomain.includes('slack') ||
        lowerDomain.includes('github') || lowerDomain.includes('stackoverflow')) {
      return 'Productivity';
    }
    
    // Social Media
    if (lowerDomain.includes('facebook') || lowerDomain.includes('twitter') ||
        lowerDomain.includes('instagram') || lowerDomain.includes('linkedin') ||
        lowerDomain.includes('reddit')) {
      return 'Social Media';
    }
    
    // Entertainment
    if (lowerDomain.includes('youtube') || lowerDomain.includes('netflix') ||
        lowerDomain.includes('spotify') || lowerDomain.includes('twitch')) {
      return 'Entertainment';
    }
    
    // News
    if (lowerDomain.includes('news') || lowerDomain.includes('cnn') ||
        lowerDomain.includes('bbc') || lowerDomain.includes('times')) {
      return 'News';
    }
    
    // Shopping
    if (lowerDomain.includes('amazon') || lowerDomain.includes('shop') ||
        lowerDomain.includes('ebay') || lowerDomain.includes('flipkart')) {
      return 'Shopping';
    }
    
    return 'Other';
  };

  const analytics = useMemo(() => {
    if (!logs.length) {
      return {
        topWebsites: [],
        categoryData: [],
        dailyTrendData: [],
        stats: {
          totalWebsites: 0,
          totalHours: 0,
          totalVisits: 0,
          avgTimePerSite: 0,
          topWebsite: null
        }
      };
    }

    // Filter logs strictly within date range
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      return logDate >= startDate && logDate <= endDate;
    });

    if (!filteredLogs.length) {
      return {
        topWebsites: [],
        categoryData: [],
        dailyTrendData: [],
        stats: {
          totalWebsites: 0,
          totalHours: 0,
          totalVisits: 0,
          avgTimePerSite: 0,
          topWebsite: null
        }
      };
    }

    // Calculate time per website
    const websiteMap: Record<string, { duration: number; visits: number; category: string }> = {};
    const dailyMap: Record<string, number> = {};

    filteredLogs.forEach(log => {
      const domain = log.domain || extractDomain(log.website_url || '');
      const duration = log.duration_seconds || 0;
      const date = new Date(log.timestamp).toISOString().split('T')[0];

      // Per website stats
      if (!websiteMap[domain]) {
        websiteMap[domain] = {
          duration: 0,
          visits: 0,
          category: categorizeWebsite(domain)
        };
      }
      websiteMap[domain].duration += duration;
      websiteMap[domain].visits++;

      // Daily totals
      dailyMap[date] = (dailyMap[date] || 0) + duration;
    });

    // Top websites
    const topWebsites = Object.entries(websiteMap)
      .map(([domain, data]) => ({
        domain,
        hours: data.duration / 3600,
        visits: data.visits,
        category: data.category,
        avgDuration: data.duration / data.visits
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);

    // Category distribution
    const categoryMap: Record<string, number> = {};
    Object.values(websiteMap).forEach(data => {
      categoryMap[data.category] = (categoryMap[data.category] || 0) + data.duration;
    });

    const CATEGORY_COLORS: Record<string, string> = {
      'Productivity': '#10B981',
      'Social Media': '#3B82F6',
      'Entertainment': '#F59E0B',
      'News': '#8B5CF6',
      'Shopping': '#EF4444',
      'Other': '#6B7280'
    };

    const categoryData = Object.entries(categoryMap)
      .map(([category, duration]) => ({
        name: category,
        value: Number((duration / 3600).toFixed(2)),
        color: CATEGORY_COLORS[category] || '#6B7280'
      }))
      .sort((a, b) => b.value - a.value);

    // Daily usage trend
    const dailyTrendData = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, duration]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: Number((duration / 3600).toFixed(2))
      }));

    // Statistics
    const totalHours = Object.values(websiteMap).reduce((sum, data) => sum + data.duration, 0) / 3600;
    const totalWebsites = Object.keys(websiteMap).length;
    const totalVisits = Object.values(websiteMap).reduce((sum, data) => sum + data.visits, 0);
    const avgTimePerSite = totalWebsites > 0 ? totalHours / totalWebsites : 0;

    return {
      topWebsites,
      categoryData,
      dailyTrendData,
      stats: {
        totalWebsites,
        totalHours,
        totalVisits,
        avgTimePerSite,
        topWebsite: topWebsites[0] || null
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Website Analytics</h2>
        <p className="text-sm text-slate-500 mt-1">
          Tracking {analytics.stats.totalWebsites} websites with {analytics.stats.totalVisits} total visits
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-700">Total Websites</h3>
          </div>
          <p className="text-3xl font-bold text-blue-900">{analytics.stats.totalWebsites}</p>
          <p className="text-sm text-gray-600 mt-1">Unique domains</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-medium text-gray-700">Total Time</h3>
          </div>
          <p className="text-3xl font-bold text-green-900">{analytics.stats.totalHours.toFixed(1)}h</p>
          <p className="text-sm text-gray-600 mt-1">Across all sites</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-700">Top Website</h3>
          </div>
          <p className="text-xl font-bold text-purple-900 truncate" title={analytics.stats.topWebsite?.domain}>
            {analytics.stats.topWebsite?.domain.length > 15
              ? analytics.stats.topWebsite.domain.substring(0, 12) + '...'
              : analytics.stats.topWebsite?.domain || 'N/A'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {analytics.stats.topWebsite?.hours.toFixed(1)}h
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-medium text-gray-700">Avg Time/Site</h3>
          </div>
          <p className="text-3xl font-bold text-amber-900">{analytics.stats.avgTimePerSite.toFixed(1)}h</p>
          <p className="text-sm text-gray-600 mt-1">Per website</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Websites Bar Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top 10 Websites by Duration
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.topWebsites} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                dataKey="domain" 
                type="category" 
                width={150}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => value.length > 20 ? value.substring(0, 17) + '...' : value}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name, props: any) => [
                  `${value.toFixed(2)} hours`,
                  `Visits: ${props.payload.visits}`
                ]}
              />
              <Bar dataKey="hours" fill="#10B981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Category Distribution
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={analytics.categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toFixed(1)}h`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `${value} hours`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Usage Trend Line Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Website Usage Trend
        </h3>
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
              dataKey="hours" 
              stroke="#10B981" 
              strokeWidth={3}
              name="Website Usage (hours)"
              dot={{ fill: '#10B981', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Websites</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Website</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Visits</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Duration</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg/Visit</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topWebsites.map((site, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600">#{idx + 1}</td>
                  <td className="py-3 px-4 font-medium text-gray-900" title={site.domain}>
                    {site.domain}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      site.category === 'Productivity' ? 'bg-green-100 text-green-800' :
                      site.category === 'Social Media' ? 'bg-blue-100 text-blue-800' :
                      site.category === 'Entertainment' ? 'bg-amber-100 text-amber-800' :
                      site.category === 'News' ? 'bg-purple-100 text-purple-800' :
                      site.category === 'Shopping' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {site.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">{site.visits}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{site.hours.toFixed(2)}h</td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {(site.avgDuration / 60).toFixed(1)}m
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

export default WebsiteAnalytics;
