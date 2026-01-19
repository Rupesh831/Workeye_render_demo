import React, { useState, useEffect, useMemo } from 'react';
import { getActivityAnalytics } from '../../utils/analyticsApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, AlertCircle } from 'lucide-react';

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
      setError('Please select a member'); 
      setLoading(false); 
      return; 
    }
    (async () => {
      try { 
        setLoading(true); 
        setError(null); 
        const data = await getActivityAnalytics(memberId!, startDate, endDate); 
        setLogs(data.logs); 
      }
      catch (err: any) { 
        setError(err.message); 
      } finally { 
        setLoading(false); 
      }
    })();
  }, [memberId, startDate, endDate]);

  const analytics = useMemo(() => {
    if (!logs.length) return null;
    const idleLogs = logs.filter(log => log.is_idle || log.is_locked);
    const byDate: Record<string, number> = {};
    idleLogs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      byDate[date] = (byDate[date] || 0) + log.duration_seconds;
    });
    const chartData = Object.entries(byDate).map(([date, seconds]) => ({ 
      date, 
      hours: (seconds / 3600).toFixed(2) 
    })).slice(-30);
    const totalIdle = Object.values(byDate).reduce((sum, val) => sum + val, 0) / 3600;
    const avgIdle = totalIdle / Object.keys(byDate).length;
    const sessionCount = idleLogs.length;
    return { chartData, totalIdle, avgIdle, sessionCount };
  }, [logs]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>;
  if (error) return <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"><AlertCircle className="w-5 h-5 text-red-600" /><p className="text-red-800">{error}</p></div>;
  if (!analytics) return <div className="text-center py-20 text-gray-500">No idle time data available.</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Total Idle Time</h3>
          <p className="text-3xl font-bold text-amber-900">{analytics.totalIdle.toFixed(1)}h</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Avg Idle/Day</h3>
          <p className="text-3xl font-bold text-orange-900">{analytics.avgIdle.toFixed(1)}h</p>
        </div>
        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Idle Sessions</h3>
          <p className="text-3xl font-bold text-red-900">{analytics.sessionCount}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Idle Time (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="hours" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IdleTimeAnalytics;
