import React, { useState, useEffect, useMemo } from 'react';
import { getActivityAnalytics } from '../../utils/analyticsApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertCircle } from 'lucide-react';

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
      const data = await getActivityAnalytics(memberId!, startDate, endDate);
      setLogs(data.logs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    if (!logs.length) return null;

    const byDate: Record<string, { active: number; idle: number }> = {};
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      if (!byDate[date]) byDate[date] = { active: 0, idle: 0 };
      if (log.is_idle || log.is_locked) {
        byDate[date].idle += log.duration_seconds;
      } else {
        byDate[date].active += log.duration_seconds;
      }
    });

    const chartData = Object.entries(byDate).map(([date, data]) => ({
      date,
      active: (data.active / 3600).toFixed(2),
      idle: (data.idle / 3600).toFixed(2),
    })).slice(-30);

    const totalActive = Object.values(byDate).reduce((sum, d) => sum + d.active, 0);
    const totalIdle = Object.values(byDate).reduce((sum, d) => sum + d.idle, 0);
    const ratio = totalActive / (totalActive + totalIdle) * 100;

    return { chartData, totalActive: totalActive / 3600, totalIdle: totalIdle / 3600, ratio };
  }, [logs]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>;
  if (error) return <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"><AlertCircle className="w-5 h-5 text-red-600" /><p className="text-red-800">{error}</p></div>;
  if (!analytics) return <div className="text-center py-20 text-gray-500">No activity data available.</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Total Active</h3>
          <p className="text-3xl font-bold text-green-900">{analytics.totalActive.toFixed(1)}h</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Total Idle</h3>
          <p className="text-3xl font-bold text-amber-900">{analytics.totalIdle.toFixed(1)}h</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Active Ratio</h3>
          <p className="text-3xl font-bold text-blue-900">{analytics.ratio.toFixed(1)}%</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="active" fill="#10B981" name="Active (hours)" stackId="a" />
            <Bar dataKey="idle" fill="#F59E0B" name="Idle (hours)" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityAnalytics;
