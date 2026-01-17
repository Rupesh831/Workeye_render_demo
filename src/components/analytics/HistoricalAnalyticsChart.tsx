import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { analytics } from '@/config/api';

interface HistoricalDataPoint {
  date: string;
  screenTime: number;
  activeTime: number;
  idleTime: number;
  productivity: number;
}

interface HistoricalAnalyticsChartProps {
  companyId: number;
  deviceId: string;
  userName: string;
}

export function HistoricalAnalyticsChart({ companyId, deviceId, userName }: HistoricalAnalyticsChartProps) {
  const [chartData, setChartData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<string>('7d');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistoricalData();
  }, [companyId, deviceId, selectedRange]);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await analytics.getHistorical(companyId, deviceId, {
        range: selectedRange,
        granularity: 'daily'
      });

      if (response.success && response.data) {
        // FIXED: Use response.data directly (no response.series property)
        setChartData(response.data);
      }
    } catch (err: any) {
      console.error('Historical data fetch error:', err);
      setError(err.message || 'Failed to load historical data');
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
          <button
            onClick={fetchHistoricalData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Historical Analytics</h3>
        <div className="text-center text-gray-500 py-12">
          No historical data available for the selected period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Historical Analytics</h3>
            <p className="text-slate-500 text-sm">Track performance trends over time</p>
          </div>
        </div>
        
        {/* Range Selector */}
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => handleRangeChange(range)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis tick={{ fontSize: 12 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'productivity') {
                return [`${value.toFixed(0)}%`, 'Productivity'];
              }
              return [`${value.toFixed(2)}h`, name];
            }}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString();
            }}
            contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="screenTime"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Screen Time"
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="activeTime"
            stroke="#10b981"
            strokeWidth={2}
            name="Active Time"
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="idleTime"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Idle Time"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        {chartData.length > 0 && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Avg Screen Time</div>
              <div className="text-2xl font-bold text-blue-900">
                {(chartData.reduce((sum, d) => sum + d.screenTime, 0) / chartData.length).toFixed(1)}h
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Avg Active Time</div>
              <div className="text-2xl font-bold text-green-900">
                {(chartData.reduce((sum, d) => sum + d.activeTime, 0) / chartData.length).toFixed(1)}h
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600 font-medium">Avg Idle Time</div>
              <div className="text-2xl font-bold text-yellow-900">
                {(chartData.reduce((sum, d) => sum + d.idleTime, 0) / chartData.length).toFixed(1)}h
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Avg Productivity</div>
              <div className="text-2xl font-bold text-purple-900">
                {(chartData.reduce((sum, d) => sum + d.productivity, 0) / chartData.length).toFixed(0)}%
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
