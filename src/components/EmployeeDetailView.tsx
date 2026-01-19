import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Activity, Moon, Camera, History, 
  BarChart3, Globe, RefreshCw, ChevronLeft, ChevronRight,
  X, TrendingUp, Target, Zap
} from 'lucide-react';
import { 
  dashboard, 
  screenshots, 
  activityLogs, 
  websiteVisits,
  appUsage 
} from '@/config/api';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
// COMPONENT
// ============================================================================

export function EmployeeDetailView({ employee, onBack }: EmployeeDetailViewProps) {
  // Changed: Removed 'overview' from tabs, added 'analytics', default to 'screenshots'
  const [currentTab, setCurrentTab] = useState<'screenshots' | 'activity' | 'websites' | 'analytics'>('screenshots');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();

  // ============================================================================
  // LIVE COUNTERS STATE - REAL DATA, TICKING EVERY SECOND
  // ============================================================================
  
  const [liveCounters, setLiveCounters] = useState<LiveCounters>({
    screenTimeSeconds: 0,
    activeTimeSeconds: 0,
    idleTimeSeconds: 0,
    productivityPercentage: 0,
    lastUpdate: new Date(),
    serverTime: new Date()
  });
  const [countersLoading, setCountersLoading] = useState(true);

  // ============================================================================
  // SCREENSHOTS STATE
  // ============================================================================
  
  const [screenshotsList, setScreenshotsList] = useState<any[]>([]);
  const [screenshotsLoading, setScreenshotsLoading] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<any | null>(null);
  const [screenshotsPagination, setScreenshotsPagination] = useState({
    offset: 0,
    limit: 20,
    hasMore: true
  });

  // ============================================================================
  // ACTIVITY LOGS STATE
  // ============================================================================
  
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesPagination, setActivitiesPagination] = useState({
    offset: 0,
    limit: 50,
    hasMore: true
  });

  // ============================================================================
  // WEBSITE VISITS STATE
  // ============================================================================
  
  const [websites, setWebsites] = useState<any[]>([]);
  const [websitesLoading, setWebsitesLoading] = useState(false);

  // ============================================================================
  // APP USAGE STATE
  // ============================================================================
  
  const [apps, setApps] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // ============================================================================
  // FETCH LIVE COUNTERS FROM BACKEND
  // ============================================================================
  
  useEffect(() => {
    const fetchLiveCounters = async () => {
      try {
        setCountersLoading(true);
        const response = await dashboard.getMemberLiveCounters(employee.id);
        
        if (response.success) {
          const counters = response.live_counters;
          setLiveCounters({
            screenTimeSeconds: counters.screen_time_seconds || 0,
            activeTimeSeconds: counters.active_time_seconds || 0,
            idleTimeSeconds: counters.idle_time_seconds || 0,
            productivityPercentage: counters.productivity_percentage || 0,
            lastUpdate: new Date(),
            serverTime: new Date(counters.current_server_time || Date.now())
          });
        }
      } catch (error) {
        console.error('Failed to fetch live counters:', error);
      } finally {
        setCountersLoading(false);
      }
    };

    fetchLiveCounters();
    
    // Refresh from backend every 30 seconds
    const interval = setInterval(fetchLiveCounters, 30000);
    
    return () => clearInterval(interval);
  }, [employee.id]);

  // ============================================================================
  // TICK COUNTERS EVERY SECOND (CLIENT-SIDE)
  // ============================================================================
  
  useEffect(() => {
    // Only tick if member is active or idle (not offline)
    if (employee.status === 'offline') {
      return;
    }

    const ticker = setInterval(() => {
      setLiveCounters(prev => {
        const now = new Date();
        const deltaSeconds = Math.floor((now.getTime() - prev.lastUpdate.getTime()) / 1000);
        
        if (deltaSeconds < 1) return prev; // Prevent sub-second updates

        let newScreenTime = prev.screenTimeSeconds + deltaSeconds;
        let newActiveTime = prev.activeTimeSeconds;
        let newIdleTime = prev.idleTimeSeconds;

        // If active, increment active time
        if (employee.status === 'active') {
          newActiveTime += deltaSeconds;
        }
        // If idle, increment idle time
        else if (employee.status === 'idle') {
          newIdleTime += deltaSeconds;
        }

        // Recalculate productivity
        const newProductivity = newScreenTime > 0 
          ? Math.round((newActiveTime / newScreenTime) * 100)
          : 0;

        return {
          screenTimeSeconds: newScreenTime,
          activeTimeSeconds: newActiveTime,
          idleTimeSeconds: newIdleTime,
          productivityPercentage: newProductivity,
          lastUpdate: now,
          serverTime: prev.serverTime
        };
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [employee.status]);

  // ============================================================================
  // FETCH SCREENSHOTS
  // ============================================================================
  
  useEffect(() => {
    if (currentTab === 'screenshots') {
      fetchScreenshots();
    }
  }, [currentTab, currentDate, employee.id]);

  const fetchScreenshots = async () => {
    try {
      setScreenshotsLoading(true);
      const response = await screenshots.getByMember(employee.id, { date: currentDate });
      
      if (response.success) {
        setScreenshotsList(response.screenshots || []);
      }
    } catch (error) {
      console.error('Failed to fetch screenshots:', error);
    } finally {
      setScreenshotsLoading(false);
    }
  };

  // ============================================================================
  // FETCH ACTIVITY LOGS
  // ============================================================================
  
  useEffect(() => {
    if (currentTab === 'activity') {
      fetchActivityLogs();
    }
  }, [currentTab, currentDate, employee.id]);

  const fetchActivityLogs = async () => {
    try {
      setActivitiesLoading(true);
      const response = await activityLogs.getByMember(employee.id, { date: currentDate });
      
      if (response.success) {
        setActivities(response.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // ============================================================================
  // FETCH WEBSITES
  // ============================================================================
  
  useEffect(() => {
    if (currentTab === 'websites') {
      fetchWebsites();
    }
  }, [currentTab, currentDate, employee.id]);

  const fetchWebsites = async () => {
    try {
      setWebsitesLoading(true);
      const response = await websiteVisits.getByMember(employee.id, { startDate: currentDate, endDate: currentDate });
      
      if (response.success) {
        setWebsites(response.websites || []);
      }
    } catch (error) {
      console.error('Failed to fetch websites:', error);
    } finally {
      setWebsitesLoading(false);
    }
  };

  // ============================================================================
  // DATE NAVIGATION
  // ============================================================================
  
  const goToPreviousDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    setCurrentDate(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(currentDate);
    const today = new Date();
    if (date < today) {
      date.setDate(date.getDate() + 1);
      setCurrentDate(date.toISOString().split('T')[0]);
    }
  };

  const isToday = currentDate === new Date().toISOString().split('T')[0];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Overview</span>
        </button>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold shadow-md">
                {employee.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
                <p className="text-gray-600 mt-1">
                  {employee.position || 'Frontend Developer'} • {employee.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(employee.status)}`}>
                    {getStatusIcon(employee.status)} Status: {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">• Last seen: 2 mins ago</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <p className="text-3xl font-bold text-blue-600">{liveCounters.productivityPercentage}%</p>
                <p className="text-sm text-gray-500">Productivity</p>
              </div>
              <button
                onClick={() => navigate(`/analytics?memberId=${employee.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <BarChart3 className="w-4 h-4" />
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Date Selector */}
      <div className="bg-white border border-gray-200 rounded-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            {isToday && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                Today
              </span>
            )}
          </div>

          <button
            onClick={goToNextDay}
            disabled={isToday}
            className={`p-2 rounded-md ${
              isToday ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Live Counters */}
      <div className="bg-white border border-gray-200 rounded-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Live Counters - Today</h2>
        
        {countersLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading counters...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Screen Time */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
                <span className="text-xs text-blue-600 uppercase font-semibold">Screen Time</span>
              </div>
              <p className="text-3xl font-bold text-blue-900">
                {formatSeconds(liveCounters.screenTimeSeconds)}
              </p>
              <p className="text-sm text-blue-700 mt-1">Total time tracked</p>
            </div>

            {/* Active Time */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-6 h-6 text-green-600" />
                <span className="text-xs text-green-600 uppercase font-semibold">Active</span>
              </div>
              <p className="text-3xl font-bold text-green-900">
                {formatSeconds(liveCounters.activeTimeSeconds)}
              </p>
              <p className="text-sm text-green-700 mt-1">Productive time</p>
            </div>

            {/* Idle Time */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Moon className="w-6 h-6 text-yellow-600" />
                <span className="text-xs text-yellow-600 uppercase font-semibold">Idle</span>
              </div>
              <p className="text-3xl font-bold text-yellow-900">
                {formatSeconds(liveCounters.idleTimeSeconds)}
              </p>
              <p className="text-sm text-yellow-700 mt-1">Inactive time</p>
            </div>

            {/* Productivity */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-6 h-6 text-purple-600" />
                <span className="text-xs text-purple-600 uppercase font-semibold">Productivity</span>
              </div>
              <p className="text-3xl font-bold text-purple-900">
                {liveCounters.productivityPercentage}%
              </p>
              <p className="text-sm text-purple-700 mt-1">Efficiency score</p>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          {employee.status === 'active' 
            ? '⏱️ Counters update every second while member is active'
            : employee.status === 'idle'
            ? '💤 Counters paused - member is idle'
            : '⏸️ Counters paused - member is offline'}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-md">
        <div className="border-b border-gray-200">
          <div className="flex">
            {/* Screenshots Tab */}
            <button
              onClick={() => setCurrentTab('screenshots')}
              className={`px-6 py-3 text-sm font-medium ${
                currentTab === 'screenshots'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-1" />
              Screenshots
            </button>

            {/* Activity Tab */}
            <button
              onClick={() => setCurrentTab('activity')}
              className={`px-6 py-3 text-sm font-medium ${
                currentTab === 'activity'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="w-4 h-4 inline mr-1" />
              Activity Logs
            </button>

            {/* Websites Tab */}
            <button
              onClick={() => setCurrentTab('websites')}
              className={`px-6 py-3 text-sm font-medium ${
                currentTab === 'websites'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-1" />
              Websites & Apps
            </button>

            {/* Analytics Tab - NEW */}
            <button
              onClick={() => setCurrentTab('analytics')}
              className={`px-6 py-3 text-sm font-medium ${
                currentTab === 'analytics'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-1" />
              Analytics
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Screenshots Tab Content */}
          {currentTab === 'screenshots' && (
            <div className="space-y-4">
              {screenshotsLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  Loading screenshots...
                </div>
              ) : screenshotsList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Camera className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No screenshots captured for {currentDate}</p>
                  <p className="text-xs mt-1">Screenshots are captured based on configuration settings</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {screenshotsList.map((screenshot) => (
                      <div 
                        key={screenshot.id} 
                        className="border border-gray-200 rounded-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedScreenshot(screenshot)}
                      >
                        <img 
                          src={screenshots.getImageUrl(screenshot.id)}
                          alt={`Screenshot at ${new Date(screenshot.timestamp).toLocaleTimeString()}`}
                          className="w-full h-auto"
                          loading="lazy"
                        />
                        <div className="p-2 bg-gray-50">
                          <p className="text-xs text-gray-600">
                            {new Date(screenshot.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {screenshotsPagination.hasMore && (
                    <div className="text-center">
                      <button
                        onClick={fetchScreenshots}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Activity Logs Tab Content - ENHANCED: Separated Applications and Websites */}
          {currentTab === 'activity' && (
            <div className="space-y-6">
              {activitiesLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  Loading activity logs...
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No activity logs for {currentDate}</p>
                </div>
              ) : (
                <>
                  {/* Applications Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-blue-600" />
                      Applications
                    </h3>
                    <div className="space-y-2">
                      {activities
                        .filter(activity => !activity.url || activity.url === '') // Filter for applications
                        .slice(0, 20)
                        .map((activity, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Activity className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {activity.app_name || activity.process_name || 'Unknown App'}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                  {activity.window_title || 'No title'}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            {activity.duration_seconds && (
                              <div className="text-sm font-medium text-gray-600 ml-4">
                                {formatDuration(activity.duration_seconds)}
                              </div>
                            )}
                          </div>
                        ))}
                      {activities.filter(activity => !activity.url || activity.url === '').length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No application activity recorded</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Websites Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Globe className="w-5 h-5 mr-2 text-green-600" />
                      Websites
                    </h3>
                    <div className="space-y-2">
                      {activities
                        .filter(activity => activity.url && activity.url !== '') // Filter for websites
                        .slice(0, 20)
                        .map((activity, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Globe className="w-5 h-5 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {activity.domain || (() => {
                                    try {
                                      return new URL(activity.url).hostname;
                                    } catch {
                                      return 'Unknown';
                                    }
                                  })()}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                  {activity.url}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            {activity.duration_seconds && (
                              <div className="text-sm font-medium text-gray-600 ml-4">
                                {formatDuration(activity.duration_seconds)}
                              </div>
                            )}
                          </div>
                        ))}
                      {activities.filter(activity => activity.url && activity.url !== '').length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No website activity recorded</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Websites & Apps Tab Content */}
          {currentTab === 'websites' && (
            <div className="space-y-4">
              {websitesLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  Loading websites data...
                </div>
              ) : websites.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Globe className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No website data for {currentDate}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {websites.map((website, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Globe className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {website.domain}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {website.url}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {website.visit_count} visits
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDuration(website.total_time_seconds)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab Content - NEW */}
          {currentTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Employee Analytics</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Comprehensive productivity analysis and patterns for {employee.name}
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="text-sm text-blue-600 mb-1">Average Screen Time</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {(liveCounters.screenTimeSeconds / 3600).toFixed(1)}h
                  </div>
                  <div className="text-xs text-blue-600 mt-1">per day (today)</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <div className="text-sm text-green-600 mb-1">Active Time</div>
                  <div className="text-2xl font-bold text-green-900">
                    {(liveCounters.activeTimeSeconds / 3600).toFixed(1)}h
                  </div>
                  <div className="text-xs text-green-600 mt-1">productive hours (today)</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="text-sm text-purple-600 mb-1">Productivity Score</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {liveCounters.productivityPercentage}%
                  </div>
                  <div className="text-xs text-purple-600 mt-1">efficiency rating (today)</div>
                </div>
              </div>

              {/* Analytics Placeholder */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4">Productivity Trend</h4>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Daily productivity chart</p>
                      <p className="text-xs mt-2 text-gray-400">
                        Showing {employee.name}'s productivity over time
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4">Top Applications</h4>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Application usage breakdown</p>
                      <p className="text-xs mt-2 text-gray-400">
                        Most used apps and time spent
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Enhanced Analytics Coming Soon
                    </p>
                    <p className="text-sm text-blue-700">
                      Detailed charts, productivity patterns, and comprehensive insights will be available here.
                      For now, view the live counters above and activity logs for detailed tracking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="max-w-5xl max-h-[90vh] relative">
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={screenshots.getImageUrl(selectedScreenshot.id)}
              alt="Screenshot"
              className="max-w-full max-h-[90vh] rounded-lg"
            />
            <div className="absolute bottom-4 left-4 bg-white rounded-lg p-4 shadow-lg">
              <p className="text-sm text-gray-600">
                Captured: {new Date(selectedScreenshot.timestamp).toLocaleString()}
              </p>
              {selectedScreenshot.window_title && (
                <p className="text-sm text-gray-800 mt-1">
                  Window: {selectedScreenshot.window_title}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
