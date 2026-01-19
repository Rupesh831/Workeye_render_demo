import React, { useState, useEffect } from 'react';
import { getWorkBehaviorAnalytics } from '../../utils/analyticsApi';
import { Briefcase, AlertCircle, Clock, Activity as ActivityIcon } from 'lucide-react';

interface Props { 
  memberId: number | null; 
  startDate: string; 
  endDate: string; 
  date: string; 
}

const WorkBehaviorAnalytics: React.FC<Props> = ({ memberId, date }) => {
  const [data, setData] = useState<any>(null);
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
        const result = await getWorkBehaviorAnalytics(memberId!, date); 
        setData(result); 
      }
      catch (err: any) { 
        setError(err.message); 
      } finally { 
        setLoading(false); 
      }
    })();
  }, [memberId, date]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent"></div></div>;
  if (error) return <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"><AlertCircle className="w-5 h-5 text-red-600" /><p className="text-red-800">{error}</p></div>;
  if (!data) return <div className="text-center py-20 text-gray-500">No data available for this date.</div>;

  const { attendance, activities } = data;
  const punchIn = attendance?.punch_in_time ? new Date(attendance.punch_in_time) : null;
  const punchOut = attendance?.punch_out_time ? new Date(attendance.punch_out_time) : null;
  const firstActivity = activities.length > 0 ? new Date(activities[0].timestamp) : null;
  const lastActivity = activities.length > 0 ? new Date(activities[activities.length - 1].timestamp) : null;

  const gapStart = punchIn && firstActivity ? (firstActivity.getTime() - punchIn.getTime()) / 60000 : 0;
  const gapEnd = punchOut && lastActivity ? (punchOut.getTime() - lastActivity.getTime()) / 60000 : 0;

  return (
    <div className="space-y-6">
      {attendance && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><p className="text-sm text-gray-600">Punch In</p><p className="text-lg font-semibold">{punchIn ? punchIn.toLocaleTimeString() : '-'}</p></div>
            <div><p className="text-sm text-gray-600">Punch Out</p><p className="text-lg font-semibold">{punchOut ? punchOut.toLocaleTimeString() : '-'}</p></div>
            <div><p className="text-sm text-gray-600">Duration</p><p className="text-lg font-semibold">{attendance.duration_minutes ? `${(attendance.duration_minutes / 60).toFixed(1)}h` : '-'}</p></div>
            <div><p className="text-sm text-gray-600">Status</p><p className="text-lg font-semibold capitalize">{attendance.status}</p></div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Gaps Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2"><Clock className="w-5 h-5 text-blue-600" /><p className="font-medium">Start Gap</p></div>
            <p className="text-2xl font-bold text-blue-900">{gapStart.toFixed(0)} min</p>
            <p className="text-sm text-gray-600 mt-1">Between punch-in and first activity</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2"><Clock className="w-5 h-5 text-purple-600" /><p className="font-medium">End Gap</p></div>
            <p className="text-2xl font-bold text-purple-900">{gapEnd.toFixed(0)} min</p>
            <p className="text-sm text-gray-600 mt-1">Between last activity and punch-out</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline ({activities.length} activities)</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {activities.slice(0, 50).map((activity: any, index: number) => (
            <div key={index} className={`p-3 rounded-lg ${activity.is_idle ? 'bg-amber-50' : 'bg-green-50'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <ActivityIcon className={`w-4 h-4 ${activity.is_idle ? 'text-amber-600' : 'text-green-600'}`} />
                  <span className="font-medium">{activity.app_name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                  <span>{(activity.duration_seconds / 60).toFixed(0)} min</span>
                  <span className={`px-2 py-1 rounded text-xs ${activity.is_idle ? 'bg-amber-200 text-amber-800' : 'bg-green-200 text-green-800'}`}>
                    {activity.is_idle ? 'Idle' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkBehaviorAnalytics;
