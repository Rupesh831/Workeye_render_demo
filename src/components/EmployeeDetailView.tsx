import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Activity, Moon, Camera, History, 
  BarChart3, Globe, RefreshCw, ChevronLeft, ChevronRight,
  X, TrendingUp, Target, Zap, Users
} from 'lucide-react';
import { 
  dashboard, 
  screenshots, 
  activityLogs, 
  websiteVisits,
  appUsage 
} from '@/config/api';

// ============================================================================
// HELPER FUNCTIONS - IST TIMEZONE
// ============================================================================

/**
 * Get current IST date (ignoring time)
 */
function getCurrentISTDate(): Date {
  const now = new Date();
  // Convert to IST by adding 5.5 hours
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  // Reset to start of day
  return new Date(istTime.getFullYear(), istTime.getMonth(), istTime.getDate());
}

/**
 * Format date to IST string for display
 */
function formatISTDate(date: Date): string {
  const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate.toLocaleDateString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    day: '2-digit', 
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format date to YYYY-MM-DD in IST
 */
function formatDateForAPI(date: Date): string {
  const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate.toISOString().split('T')[0];
}

/**
 * Format timestamp to IST time
 */
function formatISTTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleTimeString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Format timestamp to full IST datetime
 */
function formatISTDateTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Calculate time ago from IST timestamp
 */
function getTimeAgo(timestamp: string | Date): string {
  const now = new Date();
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Format seconds to HH:MM:SS or MM:SS
 */
function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  } else if (m > 0) {
    return `${m}m ${s}s`;
  } else {
    return `${s}s`;
  }
}

/**
 * Format duration in minutes
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Get status badge color
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'idle':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'offline':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get status icon
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'active':
      return '🟢';
    case 'idle':
      return '🟡';
    case 'offline':
      return '⚫';
    default:
      return '⚫';
  }
}

// ============================================================================
// INTERFACES
// ============================================================================

interface Employee {
  id: number;
  name: string;
  email: string;
  position?: string;
  status: 'active' | 'idle' | 'offline';
  screen_time?: number;
  active_time?: number;
  idle_time?: number;
  productivity?: number;
  last_activity_at?: string;
  is_punched_in?: boolean;
}

interface EmployeeDetailViewProps {
  employee: Employee;
  onBack: () => void;
}

interface LiveCounters {
  screenTimeSeconds: number;
  activeTimeSeconds: number;
  idleTimeSeconds: number;
  productivityPercentage: number;
  lastUpdate: Date;
  serverTime: Date;
}

// ============================================================================
// AUTHENTICATED MODAL IMAGE COMPONENT
// ============================================================================

interface AuthenticatedModalImageProps {
  screenshotId: number;
  timestamp: string;
  windowTitle?: string;
}

function AuthenticatedModalImage({ screenshotId, timestamp, windowTitle }: AuthenticatedModalImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        const blobUrl = await screenshots.getImageBlob(screenshotId);
        setImageSrc(blobUrl);
      } catch (err) {
        console.error('Failed to load modal screenshot:', screenshotId, err);
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [screenshotId]);

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-900">
        <RefreshCw className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <>
      <img 
        src={imageSrc}
        alt="Screenshot"
        className="max-w-full max-h-[90vh] rounded-lg"
      />
      <div className="absolute bottom-4 left-4 bg-white rounded-lg p-4 shadow-lg">
        <p className="text-sm text-gray-600">
          Captured: {formatISTDateTime(timestamp)}
        </p>
        {windowTitle && (
          <p className="text-sm text-gray-800 mt-1">
            Window: {windowTitle}
          </p>
        )}
      </div>
    </>
  );
}

// ============================================================================
// AUTHENTICATED IMAGE COMPONENT
// ============================================================================

interface AuthenticatedImageProps {
  screenshotId: number;
  timestamp: string;
  onClick: () => void;
}

function AuthenticatedImage({ screenshotId, timestamp, onClick }: AuthenticatedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        const blobUrl = await screenshots.getImageBlob(screenshotId);
        setImageSrc(blobUrl);
      } catch (err) {
        console.error('Failed to load screenshot:', screenshotId, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup blob URL on unmount
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [screenshotId]);

  return (
    <div 
      className="relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity aspect-video"
      onClick={onClick}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <Camera className="w-8 h-8" />
        </div>
      )}
      {!loading && !error && imageSrc && (
        <img 
          src={imageSrc}
          alt="Screenshot"
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
        {formatISTTime(timestamp)}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EmployeeDetailView({ employee, onBack }: EmployeeDetailViewProps) {
  const navigate = useNavigate();
  
  // Current IST date state
  const [selectedDate, setSelectedDate] = useState<Date>(getCurrentISTDate());
  const currentDate = formatDateForAPI(selectedDate);
  
  // Tab state - removed 'analytics'
  const [currentTab, setCurrentTab] = useState<'screenshots' | 'activity' | 'websites'>('screenshots');
  
  // Screenshot state
  const [screenshotsData, setScreenshotsData] = useState<any[]>([]);
  const [screenshotsLoading, setScreenshotsLoading] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<any | null>(null);
  
  // Activity state
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  
  // Website state
  const [websites, setWebsites] = useState<any[]>([]);
  const [websitesLoading, setWebsitesLoading] = useState(false);
  
  // Live counters
  const [liveCounters, setLiveCounters] = useState<LiveCounters>({
    screenTimeSeconds: employee.screen_time || 0,
    activeTimeSeconds: employee.active_time || 0,
    idleTimeSeconds: employee.idle_time || 0,
    productivityPercentage: employee.productivity || 0,
    lastUpdate: new Date(),
    serverTime: new Date()
  });

  // ============================================================================
  // DATA FETCHING - WITH DATE ISOLATION
  // ============================================================================

  // Fetch screenshots for selected date
  const fetchScreenshots = async () => {
    try {
      setScreenshotsLoading(true);
      const response = await screenshots.getByMember(employee.id, {
        date: currentDate
      });
      
      if (response && Array.isArray(response)) {
        setScreenshotsData(response);
      } else {
        setScreenshotsData([]);
      }
    } catch (err) {
      console.error('Failed to fetch screenshots:', err);
      setScreenshotsData([]);
    } finally {
      setScreenshotsLoading(false);
    }
  };

  // Fetch activity logs for selected date
  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await activityLogs.getByMember(employee.id, {
        date: currentDate,
        limit: 100
      });
      
      if (response?.activities && Array.isArray(response.activities)) {
        setActivities(response.activities);
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Fetch website visits for selected date
  const fetchWebsites = async () => {
    try {
      setWebsitesLoading(true);
      const response = await websiteVisits.getByMember(employee.id, {
        startDate: currentDate,
        endDate: currentDate,
        limit: 50
      });
      
      if (response?.websites && Array.isArray(response.websites)) {
        setWebsites(response.websites);
      } else {
        setWebsites([]);
      }
    } catch (err) {
      console.error('Failed to fetch websites:', err);
      setWebsites([]);
    } finally {
      setWebsitesLoading(false);
    }
  };

  // Fetch live stats for selected date
  const fetchLiveStats = async () => {
    try {
      const response = await dashboard.getMemberLiveCounters(employee.id);
      
      if (response) {
        setLiveCounters({
          screenTimeSeconds: response.screen_time || 0,
          activeTimeSeconds: response.active_time || 0,
          idleTimeSeconds: response.idle_time || 0,
          productivityPercentage: response.productivity || 0,
          lastUpdate: new Date(),
          serverTime: new Date(response.server_time || Date.now())
        });
      }
    } catch (err) {
      console.error('Failed to fetch live stats:', err);
    }
  };

  // Fetch data when date or tab changes
  useEffect(() => {
    fetchLiveStats();
    
    if (currentTab === 'screenshots') {
      fetchScreenshots();
    } else if (currentTab === 'activity') {
      fetchActivities();
    } else if (currentTab === 'websites') {
      fetchWebsites();
    }
  }, [currentDate, currentTab, employee.id]);

  // ============================================================================
  // DATE NAVIGATION
  // ============================================================================

  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };

  const goToNextDay = () => {
    const today = getCurrentISTDate();
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Don't allow future dates
    if (nextDay <= today) {
      setSelectedDate(nextDay);
    }
  };

  const goToToday = () => {
    setSelectedDate(getCurrentISTDate());
  };

  const isToday = selectedDate.toDateString() === getCurrentISTDate().toDateString();
  const isFutureDisabled = selectedDate.toDateString() === getCurrentISTDate().toDateString();

  // ============================================================================
  // EXTRACT LAST SEEN
  // ============================================================================

  const lastSeen = employee.last_activity_at 
    ? getTimeAgo(employee.last_activity_at)
    : 'Never';

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Employee Header - Dashboard Style */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {employee.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{employee.name}</h1>
                <p className="text-sm text-slate-500">{employee.email}</p>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(employee.status)}`}>
                    {getStatusIcon(employee.status)} {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                  </span>
                  <span className="text-xs text-slate-500">
                    Last seen: {lastSeen}
                  </span>
                </div>
              </div>
            </div>
            
            {/* View Analytics Button */}
            <button
              onClick={() => navigate(`/analytics?memberId=${employee.id}`)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">View Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Dashboard Style (5 cards side by side) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-5 gap-6 mb-8">
          {/* Screen Time */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">Screen Time</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">
              {(liveCounters.screenTimeSeconds / 3600).toFixed(1)}h
            </h3>
            <p className="text-xs text-slate-400">Total today</p>
          </div>

          {/* Active Time */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">Active Time</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">
              {(liveCounters.activeTimeSeconds / 3600).toFixed(1)}h
            </h3>
            <p className="text-xs text-slate-400">Productive hours</p>
          </div>

          {/* Idle Time */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center mb-4">
              <Moon className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">Idle Time</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">
              {(liveCounters.idleTimeSeconds / 3600).toFixed(1)}h
            </h3>
            <p className="text-xs text-slate-400">Inactive periods</p>
          </div>

          {/* Productivity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-teal-600" />
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">Productivity</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">
              {liveCounters.productivityPercentage}%
            </h3>
            <p className="text-xs text-slate-400">Efficiency score</p>
          </div>

          {/* Screenshots */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
              <Camera className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">Screenshots</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">
              {screenshotsData.length}
            </h3>
            <p className="text-xs text-slate-400">Captured today</p>
          </div>
        </div>

        {/* Calendar Date Selector */}
        <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Select Date</h3>
              <p className="text-sm text-slate-500 mt-1">View activity for specific date</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousDay}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="text-center px-4">
                <p className="text-lg font-semibold text-slate-900">{formatISTDate(selectedDate)}</p>
                <p className="text-xs text-slate-500">{isToday ? 'Today' : selectedDate.toLocaleDateString('en-IN', { weekday: 'long' })}</p>
              </div>
              <button
                onClick={goToNextDay}
                disabled={isFutureDisabled}
                className={`p-2 rounded-lg transition-colors ${
                  isFutureDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-slate-100'
                }`}
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
              {!isToday && (
                <button
                  onClick={goToToday}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Today
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs - Removed Analytics */}
        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-slate-200">
            <div className="flex">
              <button
                onClick={() => setCurrentTab('screenshots')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  currentTab === 'screenshots'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Camera className="w-4 h-4 inline mr-2" />
                Screenshots
              </button>
              <button
                onClick={() => setCurrentTab('activity')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  currentTab === 'activity'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <History className="w-4 h-4 inline mr-2" />
                Activity Logs
              </button>
              <button
                onClick={() => setCurrentTab('websites')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  currentTab === 'websites'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Globe className="w-4 h-4 inline mr-2" />
                Websites
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Screenshots Tab */}
            {currentTab === 'screenshots' && (
              <div>
                {screenshotsLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-slate-400" />
                    <p className="text-slate-500">Loading screenshots...</p>
                  </div>
                ) : screenshotsData.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">No screenshots for {formatISTDate(selectedDate)}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {screenshotsData.map((screenshot) => (
                      <AuthenticatedImage
                        key={screenshot.id}
                        screenshotId={screenshot.id}
                        timestamp={screenshot.timestamp}
                        onClick={() => setSelectedScreenshot(screenshot)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activity Logs Tab */}
            {currentTab === 'activity' && (
              <div>
                {activitiesLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-slate-400" />
                    <p className="text-slate-500">Loading activity logs...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">No activity logs for {formatISTDate(selectedDate)}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activities.map((activity, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Activity className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {activity.window_title || activity.app_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-slate-500 truncate">
                              {activity.process_name || activity.app_name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatISTTime(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                        {activity.duration_seconds && (
                          <div className="text-sm font-medium text-slate-600 ml-4">
                            {formatDuration(activity.duration_seconds)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Websites Tab */}
            {currentTab === 'websites' && (
              <div>
                {websitesLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-slate-400" />
                    <p className="text-slate-500">Loading websites...</p>
                  </div>
                ) : websites.length === 0 ? (
                  <div className="text-center py-12">
                    <Globe className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">No website data for {formatISTDate(selectedDate)}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {websites.map((website, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Globe className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {website.domain}
                            </p>
                            {website.url && (
                              <p className="text-sm text-slate-500 truncate">
                                {website.url}
                              </p>
                            )}
                            <p className="text-xs text-slate-400">
                              Last visited: {formatISTTime(website.last_visit)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium text-slate-900">
                            {website.visit_count} visits
                          </p>
                          {website.total_time_seconds && (
                            <p className="text-xs text-slate-500">
                              {formatDuration(website.total_time_seconds)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="max-w-5xl w-full relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 z-10 shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>
            <AuthenticatedModalImage
              screenshotId={selectedScreenshot.id}
              timestamp={selectedScreenshot.timestamp}
              windowTitle={selectedScreenshot.window_title}
            />
          </div>
        </div>
      )}
    </div>
  );
}
