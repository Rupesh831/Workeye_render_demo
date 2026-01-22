import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

interface AttendanceData {
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  recentCheckIns: Array<{
    id: string;
    name: string;
    time: Date;
    type: 'check-in' | 'check-out';
  }>;
}

interface LiveAttendanceWidgetProps {
  data: AttendanceData;
}

export const LiveAttendanceWidget = ({ data }: LiveAttendanceWidgetProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const attendanceRate = Math.round((data.present / data.totalEmployees) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl p-6 shadow-md"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Live Attendance</h3>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-3 h-3 bg-green-500 rounded-full"
        />
      </div>

      {/* Current Time */}
      <div className="text-center mb-6">
        <p className="text-3xl font-bold text-gray-900">
          {format(currentTime, 'HH:mm:ss')}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {format(currentTime, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-green-50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <UserCheck className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{data.present}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Present</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-red-50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <UserX className="w-5 h-5 text-red-600" />
            <span className="text-2xl font-bold text-red-600">{data.absent}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Absent</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-orange-50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="text-2xl font-bold text-orange-600">{data.late}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Late</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-blue-50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">{data.totalEmployees}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Total</p>
        </motion.div>
      </div>

      {/* Attendance Rate Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
          <span className="text-sm font-bold text-gray-900">{attendanceRate}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${attendanceRate}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-green-400 to-green-600"
          />
        </div>
      </div>

      {/* Recent Check-ins */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h4>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {data.recentCheckIns.map((checkIn, index) => (
            <motion.div
              key={checkIn.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                {checkIn.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{checkIn.name}</p>
                <p className="text-xs text-gray-500">
                  {checkIn.type === 'check-in' ? 'Checked in' : 'Checked out'} at{' '}
                  {format(checkIn.time, 'HH:mm')}
                </p>
              </div>
              <div
                className={`w-2 h-2 rounded-full ${
                  checkIn.type === 'check-in' ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};