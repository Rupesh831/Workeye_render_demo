import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface TimelineData {
  time: string;
  active: number;
  idle: number;
  locked?: number;
}

interface ProductivityTimelineChartProps {
  data: TimelineData[];
  title?: string;
  height?: number;
}

export const ProductivityTimelineChart = ({
  data,
  title = 'Activity Timeline',
  height = 300,
}: ProductivityTimelineChartProps) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-4 rounded-lg shadow-lg border border-gray-200"
        >
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {payload[0].payload.time}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-sm" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="text-sm font-bold" style={{ color: entry.color }}>
                {entry.value} min
              </span>
            </div>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-xl p-6 shadow-md"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-sm text-gray-600">Idle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">Locked</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="idleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="lockedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="time"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="active"
            stroke="#10B981"
            strokeWidth={3}
            fill="url(#activeGradient)"
            animationDuration={1500}
            name="Active"
          />
          <Area
            type="monotone"
            dataKey="idle"
            stroke="#F59E0B"
            strokeWidth={2}
            fill="url(#idleGradient)"
            animationDuration={1500}
            name="Idle"
          />
          {data[0]?.locked !== undefined && (
            <Area
              type="monotone"
              dataKey="locked"
              stroke="#EF4444"
              strokeWidth={2}
              fill="url(#lockedGradient)"
              animationDuration={1500}
              name="Locked"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};