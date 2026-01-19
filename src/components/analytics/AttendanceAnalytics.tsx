/**
 * ATTENDANCE ANALYTICS - Client-side computation
 * ==============================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import { getAttendanceAnalytics, AttendanceRecord } from '../../utils/analyticsApi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Calendar, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface Props {
  memberId: number | null;
  startDate: string;
  endDate: string;
}

const AttendanceAnalytics: React.FC<Props> = ({ memberId, startDate, endDate }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [memberId, startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAttendanceAnalytics(memberId || undefined, startDate, endDate);
      setRecords(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // CLIENT-SIDE CALCULATIONS
  const analytics = useMemo(() => {
    if (!records.length) return null;

    const officeStart = 9; // 9 AM
    const officeEnd = 18; // 6 PM

    const calculatedRecords = records.map(record => {
      const duration = record.duration_minutes || 0;
      const punchInHour = record.punch_in_time ? new Date(record.punch_in_time).getHours() : null;
      const punchOutHour = record.punch_out_time ? new Date(record.punch_out_time).getHours() : null;

      return {
        ...record,
        duration_hours: duration / 60,
        is_late: punchInHour ? punchInHour > officeStart : false,
        is_early_leave: punchOutHour ? punchOutHour < officeEnd : false,
      };
    });

    // Stats
    const totalDays = calculatedRecords.length;
    const presentDays = calculatedRecords.filter(r => r.status === 'present').length;
    const lateDays = calculatedRecords.filter(r => r.is_late).length;
    const earlyLeaveDays = calculatedRecords.filter(r => r.is_early_leave).length;
    const avgDuration = calculatedRecords.reduce((sum, r) => sum + r.duration_hours, 0) / totalDays;

    // Chart data for duration per day
    const durationChartData = calculatedRecords.slice(0, 30).reverse().map(r => ({
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: r.duration_hours.toFixed(2),
    }));

    // Streak calculation
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    
    const sortedRecords = [...calculatedRecords].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (let i = 0; i < sortedRecords.length; i++) {
      if (sortedRecords[i].status === 'present') {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    currentStreak = tempStreak;

    return {
      stats: {
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        lateDays,
        earlyLeaveDays,
        avgDuration,
        currentStreak,
        maxStreak,
      },
      durationChartData,
      records: calculatedRecords,
    };
  }, [records]);

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

  if (!analytics) {
    return (
      <div className="text-center py-20 text-gray-500">
        No attendance data available for the selected period.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-700">Present Days</h3>
          </div>
          <p className="text-3xl font-bold text-blue-900">{analytics.stats.presentDays}</p>
          <p className="text-sm text-gray-600 mt-1">Out of {analytics.stats.totalDays} days</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-medium text-gray-700">Avg Duration</h3>
          </div>
          <p className="text-3xl font-bold text-green-900">{analytics.stats.avgDuration.toFixed(1)}h</p>
          <p className="text-sm text-gray-600 mt-1">Per day</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-700">Current Streak</h3>
          </div>
          <p className="text-3xl font-bold text-purple-900">{analytics.stats.currentStreak}</p>
          <p className="text-sm text-gray-600 mt-1">Max: {analytics.stats.maxStreak} days</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-medium text-gray-700">Late Arrivals</h3>
          </div>
          <p className="text-3xl font-bold text-amber-900">{analytics.stats.lateDays}</p>
          <p className="text-sm text-gray-600 mt-1">Days after 9 AM</p>
        </div>
      </div>

      {/* Duration Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Duration (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.durationChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="hours" fill="#3B82F6" name="Hours Worked" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Punch In</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Punch Out</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Duration</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {analytics.records.slice(0, 50).map((record) => (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    {record.punch_in_time 
                      ? new Date(record.punch_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '-'}
                    {record.is_late && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Late</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {record.punch_out_time 
                      ? new Date(record.punch_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '-'}
                    {record.is_early_leave && (
                      <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Early</span>
                    )}
                  </td>
                  <td className="py-3 px-4">{record.duration_hours.toFixed(2)}h</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      record.status === 'present'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
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

export default AttendanceAnalytics;
