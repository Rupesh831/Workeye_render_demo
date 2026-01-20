/**
 * ANALYTICS PAGE - Comprehensive Employee Analytics with IST Support
 * ==================================================================
 * Client-side computations with lazy loading and proper date isolation
 */

import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  TrendingUp,
  Activity,
  Monitor,
  Globe,
  Clock,
  BarChart3,
  Loader2,
  ArrowLeft
} from 'lucide-react';

// Lazy load analytics components
const AttendanceAnalytics = lazy(() => import('./analytics/AttendanceAnalytics'));
const ActivityAnalytics = lazy(() => import('./analytics/ActivityAnalytics'));
const ApplicationAnalytics = lazy(() => import('./analytics/ApplicationAnalytics'));
const WebsiteAnalytics = lazy(() => import('./analytics/WebsiteAnalytics'));
const AppVsWebComparison = lazy(() => import('./analytics/AppVsWebComparison'));
const IdleTimeAnalytics = lazy(() => import('./analytics/IdleTimeAnalytics'));
const WorkBehaviorAnalytics = lazy(() => import('./analytics/WorkBehaviorAnalytics'));

// ============================================================================
// IST TIMEZONE HELPERS
// ============================================================================

/**
 * Get current IST date
 */
function getCurrentISTDate(): Date {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return new Date(istTime.getFullYear(), istTime.getMonth(), istTime.getDate());
}

/**
 * Format date to YYYY-MM-DD in IST
 */
function formatDateForAPI(date: Date): string {
  const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate.toISOString().split('T')[0];
}

/**
 * Get date 30 days ago in IST
 */
function getIST30DaysAgo(): string {
  const today = getCurrentISTDate();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return formatDateForAPI(thirtyDaysAgo);
}

/**
 * Get today's date in IST
 */
function getTodayIST(): string {
  return formatDateForAPI(getCurrentISTDate());
}

const AnalyticsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'attendance');
  const [memberId, setMemberId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({
    start: getIST30DaysAgo(),
    end: getTodayIST()
  });

  // Initialize memberId from URL parameters
  useEffect(() => {
    const memberIdParam = searchParams.get('memberId');
    if (memberIdParam) {
      setMemberId(parseInt(memberIdParam));
    }
  }, [searchParams]);

  // Update URL when tab changes
  useEffect(() => {
    const params: Record<string, string> = { tab: activeTab };
    if (memberId) {
      params.memberId = memberId.toString();
    }
    setSearchParams(params);
  }, [activeTab, memberId, setSearchParams]);

  const tabs = [
    { id: 'attendance', label: 'Attendance', icon: <Calendar size={18} /> },
    { id: 'activity', label: 'Activity', icon: <Activity size={18} /> },
    { id: 'applications', label: 'Applications', icon: <Monitor size={18} /> },
    { id: 'websites', label: 'Websites', icon: <Globe size={18} /> },
    { id: 'comparison', label: 'App vs Web', icon: <BarChart3 size={18} /> },
    { id: 'idle', label: 'Idle Time', icon: <Clock size={18} /> },
    { id: 'behavior', label: 'Work Behavior', icon: <TrendingUp size={18} /> },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const renderAnalytics = () => {
    const commonProps = {
      memberId,
      startDate: dateRange.start,
      endDate: dateRange.end
    };

    switch (activeTab) {
      case 'attendance':
        return <AttendanceAnalytics {...commonProps} />;
      case 'activity':
        return <ActivityAnalytics {...commonProps} />;
      case 'applications':
        return <ApplicationAnalytics {...commonProps} />;
      case 'websites':
        return <WebsiteAnalytics {...commonProps} />;
      case 'comparison':
        return <AppVsWebComparison {...commonProps} />;
      case 'idle':
        return <IdleTimeAnalytics {...commonProps} />;
      case 'behavior':
        return <WorkBehaviorAnalytics {...commonProps} date={dateRange.end} />;
      default:
        return <AttendanceAnalytics {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Fixed Header - Dashboard Style */}
      <header className="bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              
              <div>
                <h1 className="text-lg font-semibold text-slate-700">Analytics Dashboard</h1>
              </div>
            </div>

            {/* Right: User Avatar Placeholder */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Added padding for fixed header */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Comprehensive employee performance metrics</h2>
          <p className="text-sm text-slate-500 mt-1">All dates and times are in Indian Standard Time (IST)</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Member ID (Optional)
              </label>
              <input
                type="number"
                value={memberId || ''}
                onChange={(e) => setMemberId(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Leave empty for all members"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                max={getTodayIST()}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                max={getTodayIST()}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md border border-slate-100">
          <div className="border-b border-slate-200">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Analytics Content */}
          <div className="p-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-slate-600">Loading analytics...</span>
                </div>
              }
            >
              {renderAnalytics()}
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;
