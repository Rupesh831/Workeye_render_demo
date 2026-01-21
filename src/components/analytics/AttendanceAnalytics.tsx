/**
 * ATTENDANCE ANALYTICS - Simple redirect to attendance page
 * ==========================================================
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

interface Props {
  memberId: number | null;
  startDate: string;
  endDate: string;
}

const AttendanceAnalytics: React.FC<Props> = ({ memberId }) => {
  const navigate = useNavigate();

  const handleViewFullAttendance = () => {
    if (memberId) {
      navigate(`/attendance/${memberId}`);
    } else {
      navigate('/attendance');
    }
  };

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Attendance Records</h2>
          <p className="text-slate-600 mb-8">
            View detailed attendance information in the dedicated attendance page
          </p>
        </div>
        
        <button
          onClick={handleViewFullAttendance}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
        >
          <ExternalLink className="w-5 h-5" />
          View Full Attendance
        </button>
      </div>
    </div>
  );
};

export default AttendanceAnalytics;
