/**
 * ANALYTICS PAGE - Comprehensive Employee Analytics
 * ==================================================
 * Client-side computations with lazy loading
 */

import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  TrendingUp,
  Activity,
  Monitor,
  Globe,
  Clock,
  BarChart3,
  Loader2
} from 'lucide-react';

// Lazy load analytics components
const AttendanceAnalytics = lazy(() => import('./analytics/AttendanceAnalytics'));
const ActivityAnalytics = lazy(() => import('./analytics/ActivityAnalytics'));
const ApplicationAnalytics = lazy(() => import('./analytics/ApplicationAnalytics'));
const WebsiteAnalytics = lazy(() => import('./analytics/WebsiteAnalytics'));
const AppVsWebComparison = lazy(() => import('./analytics/AppVsWebComparison'));
const IdleTimeAnalytics = lazy(() => import('./analytics/IdleTimeAnalytics'));
const WorkBehaviorAnalytics = lazy(() => import('./analytics/WorkBehaviorAnalytics'));

const AnalyticsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'attendance');
  const [memberId, setMemberId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Initialize memberId from URL parameters
  useEffect(() => {
    const memberIdParam = searchParams.get('memberId');
    if (memberIdParam) {
      setMemberId(parseInt(memberIdParam));
    }
  }, []);

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive employee performance metrics</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member ID (Optional)
            </label>
            <input
              type="number"
              value={memberId || ''}
              onChange={(e) => setMemberId(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Leave empty for all members"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
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
                <span className="ml-3 text-gray-600">Loading analytics...</span>
              </div>
            }
          >
            {renderAnalytics()}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
