import React, { useState, useEffect, useMemo } from 'react';
import { getAppsAnalytics, getWebsitesAnalytics } from '../../utils/analyticsApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, AlertCircle } from 'lucide-react';

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
      setError('Please select a member'); 
      setLoading(false); 
      return; 
    }
    (async () => {
      try {
        setLoading(true); 
        setError(null);
        const [apps, webs] = await Promise.all([
          getAppsAnalytics(memberId!, startDate, endDate),
          getWebsitesAnalytics(memberId!, startDate, endDate)
        ]);
        setAppLogs(apps); 
        setWebLogs(webs);
      } catch (err: any) { 
        setError(err.message); 
      } finally { 
        setLoading(false); 
      }
    })();
  }, [memberId, startDate, endDate]);

  const analytics = useMemo(() => {
    const appTime = appLogs.reduce((sum, log) => sum + log.duration_seconds, 0) / 3600;
    const webTime = webLogs.reduce((sum, log) => sum + log.duration_seconds, 0) / 3600;
    const pieData = [
      { name: 'Applications', value: appTime, color: '#3B82F6' },
      { name: 'Websites', value: webTime, color: '#8B5CF6' }
    ];
    return { appTime, webTime, pieData };
  }, [appLogs, webLogs]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>;
  if (error) return <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"><AlertCircle className="w-5 h-5 text-red-600" /><p className="text-red-800">{error}</p></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Application Time</h3>
          <p className="text-3xl font-bold text-blue-900">{analytics.appTime.toFixed(1)}h</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Website Time</h3>
          <p className="text-3xl font-bold text-purple-900">{analytics.webTime.toFixed(1)}h</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={analytics.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {analytics.pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AppVsWebComparison;
