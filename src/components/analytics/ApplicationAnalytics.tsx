import React, { useState, useEffect, useMemo } from 'react';
import { getAppsAnalytics } from '../../utils/analyticsApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Monitor, AlertCircle } from 'lucide-react';

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
      setError('Please select a member');
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    if (!logs.length) return null;

    const appMap: Record<string, number> = {};
    logs.forEach(log => {
      const app = log.app_name || 'Unknown';
      appMap[app] = (appMap[app] || 0) + log.duration_seconds;
    });

    const topApps = Object.entries(appMap)
      .map(([name, seconds]) => ({ name, hours: (seconds / 3600).toFixed(2) }))
      .sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours))
      .slice(0, 10);

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];
    const pieData = topApps.slice(0, 5).map((app, i) => ({ name: app.name, value: parseFloat(app.hours), color: COLORS[i] }));

    return { topApps, pieData, COLORS };
  }, [logs]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>;
  if (error) return <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"><AlertCircle className="w-5 h-5 text-red-600" /><p className="text-red-800">{error}</p></div>;
  if (!analytics) return <div className="text-center py-20 text-gray-500">No application data available.</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Applications</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.topApps} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="hours" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Usage Share</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie data={analytics.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                {analytics.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ApplicationAnalytics;
