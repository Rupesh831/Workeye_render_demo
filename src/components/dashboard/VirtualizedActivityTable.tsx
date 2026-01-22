import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { useRef, useMemo } from 'react';
import { Clock, Activity, Pause, Lock } from 'lucide-react';
import { format } from 'date-fns';

export interface ActivityData {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'idle' | 'locked' | 'offline';
  activeTime: number;
  idleTime: number;
  lockedTime: number;
  lastActivity: Date;
  productivity: number;
}

interface VirtualizedActivityTableProps {
  data: ActivityData[];
  onRowClick?: (row: ActivityData) => void;
}

export const VirtualizedActivityTable = ({
  data,
  onRowClick,
}: VirtualizedActivityTableProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'idle':
        return 'bg-orange-100 text-orange-700';
      case 'locked':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getProductivityColor = (productivity: number) => {
    if (productivity >= 80) return 'text-green-600';
    if (productivity >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-md overflow-hidden"
    >
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">Live Employee Activity</h3>
        <p className="text-sm text-gray-600 mt-1">{data.length} employees tracked</p>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-7 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
        <div className="col-span-2">Employee</div>
        <div>Status</div>
        <div>Active</div>
        <div>Idle</div>
        <div>Productivity</div>
        <div>Last Activity</div>
      </div>

      {/* Virtualized Table Body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: '600px' }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = data[virtualRow.index];
            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: virtualRow.index * 0.02 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="grid grid-cols-7 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors items-center"
                onClick={() => onRowClick?.(row)}
              >
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {row.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{row.name}</p>
                    <p className="text-xs text-gray-500">{row.email}</p>
                  </div>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
                    {row.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-gray-700 font-medium">
                  {formatTime(row.activeTime)}
                </div>
                <div className="text-sm text-gray-700">
                  {formatTime(row.idleTime)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${row.productivity}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={`h-full ${row.productivity >= 80 ? 'bg-green-500' : row.productivity >= 60 ? 'bg-orange-500' : 'bg-red-500'}`}
                      />
                    </div>
                    <span className={`text-sm font-semibold ${getProductivityColor(row.productivity)}`}>
                      {row.productivity}%
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {format(row.lastActivity, 'HH:mm')}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};