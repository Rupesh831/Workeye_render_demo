import React, { useState, useEffect, useMemo } from 'react';
import { getWebsitesAnalytics } from '../../utils/analyticsApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Globe, AlertCircle } from 'lucide-react';

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
      setError('Please select a member'); 
      setLoading(false); 
      return; 
    }
    (async () => {
      try { 
        setLoading(true); 
        setError(null); 
        const data = await getWebsitesAnalytics(memberId!, startDate, endDate); 
        setLogs(data); 
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
    const domainMap: Record<string, number> = {};
    logs.forEach(log => { 
      const domain = log.domain || 'Unknown'; 
      domainMap[domain] = (domainMap[domain] || 0) + log.duration_seconds; 
    });
    const topSites = Object.entries(domainMap).map(([name, seconds]) => ({ 
      name, 
      hours: (seconds / 3600).toFixed(2) 
    }))
      .sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours)).slice(0, 10);
    return { topSites };
  }, [logs]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>;
  if (error) return <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"><AlertCircle className="w-5 h-5 text-red-600" /><p className="text-red-800">{error}</p></div>;
  if (!analytics) return <div className="text-center py-20 text-gray-500">No website data available.</div>;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Websites</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={analytics.topSites}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="hours" fill="#8B5CF6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WebsiteAnalytics;
