import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Settings, Save, RefreshCw, Clock, Camera, Calendar,
  Info, Check, X, ArrowLeft, Loader2, AlertCircle, Building,
  Hash, User, CalendarClock, Activity, Zap, Eye
} from 'lucide-react';

interface Configuration {
  id?: number;
  company_id: number;
  screenshot_interval_minutes: number;
  idle_timeout_minutes: number;
  office_start_time: string;
  office_end_time: string;
  working_days: number[];
  last_modified_by?: string;
  last_modified_at?: string;
  created_at?: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
  { value: 0, label: 'Sun', fullLabel: 'Sunday' }
];

export function Configuration() {
  const { user, company } = useAuth();
  const navigate = useNavigate();
  
  const [config, setConfig] = useState<Configuration>({
    company_id: company?.id || 0,
    screenshot_interval_minutes: 10,
    idle_timeout_minutes: 5,
    office_start_time: '09:00:00',
    office_end_time: '18:00:00',
    working_days: [1, 2, 3, 4, 5]
  });
  
  const [currentConfig, setCurrentConfig] = useState<Configuration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchConfiguration();
  }, [company?.id]);

  // Track unsaved changes
  useEffect(() => {
    if (!currentConfig) {
      setHasUnsavedChanges(false);
      return;
    }

    const hasChanges = (
      config.screenshot_interval_minutes !== currentConfig.screenshot_interval_minutes ||
      config.idle_timeout_minutes !== currentConfig.idle_timeout_minutes ||
      config.office_start_time !== currentConfig.office_start_time ||
      config.office_end_time !== currentConfig.office_end_time ||
      JSON.stringify(config.working_days.sort()) !== JSON.stringify(currentConfig.working_days.sort())
    );

    setHasUnsavedChanges(hasChanges);
  }, [config, currentConfig]);

  // Warn about unsaved changes on page leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !saving) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, saving]);

  const fetchConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://workeye-render-demo-backend.onrender.com'}/api/configuration`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }

      const data = await response.json();
      
      if (data.success && data.config) {
        const loadedConfig = {
          ...data.config,
          company_id: company?.id || 0,
        };
        setConfig(loadedConfig);
        setCurrentConfig(loadedConfig);
        setHasUnsavedChanges(false);
      }
    } catch (err: any) {
      console.error('Error fetching configuration:', err);
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://workeye-render-demo-backend.onrender.com'}/api/configuration`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            company_id: company?.id,
            config: {
              screenshot_interval_minutes: config.screenshot_interval_minutes,
              idle_timeout_minutes: config.idle_timeout_minutes,
              office_start_time: config.office_start_time,
              office_end_time: config.office_end_time,
              working_days: config.working_days
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      if (data.success) {
        setSuccess(true);
        setCurrentConfig({ ...config });
        setHasUnsavedChanges(false);
        await fetchConfiguration();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error('Error saving configuration:', err);
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleWorkingDayToggle = (day: number) => {
    setConfig(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day].sort()
    }));
  };

  const handleReset = () => {
    if (currentConfig) {
      setConfig({ ...currentConfig });
      setHasUnsavedChanges(false);
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Not set';
    return new Date(isoString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center space-x-2">
                  <Settings className="w-7 h-7 text-blue-600" />
                  <span>Tracker Configuration</span>
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Configure tracking settings for {company?.name || 'your organization'}
                </p>
              </div>
            </div>
            <button
              onClick={fetchConfiguration}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3 animate-in fade-in slide-in-from-top-4">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">Configuration saved successfully!</p>
          </div>
        )}

        {hasUnsavedChanges && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800">You have unsaved changes</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Current Configuration */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span>Current Settings</span>
              </h2>
              
              {currentConfig && (
                <div className="space-y-4">
                  {/* Config ID & Company */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Hash className="w-3 h-3 text-slate-500" />
                        <p className="text-xs text-slate-600 font-medium">Config ID</p>
                      </div>
                      <p className="text-sm font-bold text-slate-800">{currentConfig.id}</p>
                    </div>
                    
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Building className="w-3 h-3 text-slate-500" />
                        <p className="text-xs text-slate-600 font-medium">Company</p>
                      </div>
                      <p className="text-sm font-bold text-slate-800">{currentConfig.company_id}</p>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Camera className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-purple-900">Screenshot Interval</span>
                        </div>
                        <Zap className="w-4 h-4 text-purple-500" />
                      </div>
                      <p className="text-2xl font-bold text-purple-900">{currentConfig.screenshot_interval_minutes}</p>
                      <p className="text-xs text-purple-700 mt-1">minutes</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-900">Idle Timeout</span>
                        </div>
                        <Activity className="w-4 h-4 text-yellow-500" />
                      </div>
                      <p className="text-2xl font-bold text-yellow-900">{currentConfig.idle_timeout_minutes}</p>
                      <p className="text-xs text-yellow-700 mt-1">minutes</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <CalendarClock className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Office Hours</span>
                      </div>
                      <p className="text-lg font-bold text-green-900">
                        {currentConfig.office_start_time?.slice(0, 5)} - {currentConfig.office_end_time?.slice(0, 5)}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-900">Working Days</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {DAYS_OF_WEEK.filter(d => currentConfig.working_days.includes(d.value)).map(d => (
                          <span key={d.value} className="px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded">
                            {d.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    {currentConfig.last_modified_by && (
                      <div className="flex items-start space-x-2">
                        <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500">Last modified by</p>
                          <p className="text-sm font-medium text-slate-800 truncate">{currentConfig.last_modified_by}</p>
                        </div>
                      </div>
                    )}
                    {currentConfig.last_modified_at && (
                      <div className="flex items-start space-x-2">
                        <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500">Last modified</p>
                          <p className="text-sm font-medium text-slate-800">{formatDateTime(currentConfig.last_modified_at)}</p>
                        </div>
                      </div>
                    )}
                    {currentConfig.created_at && (
                      <div className="flex items-start space-x-2">
                        <CalendarClock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500">Created</p>
                          <p className="text-sm font-medium text-slate-800">{formatDateTime(currentConfig.created_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:p-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Update Configuration</h2>
              
              <div className="space-y-6">
                {/* Screenshot Interval */}
                <div className="p-5 bg-purple-50 rounded-xl border border-purple-100">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-purple-900 mb-3">
                    <Camera className="w-5 h-5 text-purple-600" />
                    <span>Screenshot Interval</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="60"
                      value={config.screenshot_interval_minutes}
                      onChange={(e) => setConfig({ ...config, screenshot_interval_minutes: parseInt(e.target.value) })}
                      className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={config.screenshot_interval_minutes}
                      onChange={(e) => setConfig({ ...config, screenshot_interval_minutes: parseInt(e.target.value) || 1 })}
                      className="w-20 px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center font-semibold"
                    />
                    <span className="text-sm text-purple-700 font-medium">min</span>
                  </div>
                  <p className="mt-2 text-xs text-purple-700">How often screenshots are captured (1-60 minutes)</p>
                </div>

                {/* Idle Timeout */}
                <div className="p-5 bg-yellow-50 rounded-xl border border-yellow-100">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-yellow-900 mb-3">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span>Idle Timeout</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={config.idle_timeout_minutes}
                      onChange={(e) => setConfig({ ...config, idle_timeout_minutes: parseInt(e.target.value) })}
                      className="flex-1 h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-600"
                    />
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={config.idle_timeout_minutes}
                      onChange={(e) => setConfig({ ...config, idle_timeout_minutes: parseInt(e.target.value) || 1 })}
                      className="w-20 px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-center font-semibold"
                    />
                    <span className="text-sm text-yellow-700 font-medium">min</span>
                  </div>
                  <p className="mt-2 text-xs text-yellow-700">Time before marking user as idle (1-30 minutes)</p>
                </div>

                {/* Office Hours */}
                <div className="p-5 bg-green-50 rounded-xl border border-green-100">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-green-900 mb-3">
                    <CalendarClock className="w-5 h-5 text-green-600" />
                    <span>Office Hours</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-green-700 font-medium mb-2">Start Time</label>
                      <input
                        type="time"
                        value={config.office_start_time.slice(0, 5)}
                        onChange={(e) => setConfig({ ...config, office_start_time: e.target.value + ':00' })}
                        className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-green-700 font-medium mb-2">End Time</label>
                      <input
                        type="time"
                        value={config.office_end_time.slice(0, 5)}
                        onChange={(e) => setConfig({ ...config, office_end_time: e.target.value + ':00' })}
                        className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Working Days */}
                <div className="p-5 bg-indigo-50 rounded-xl border border-indigo-100">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-indigo-900 mb-4">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span>Working Days</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleWorkingDayToggle(day.value)}
                        className={`px-3 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                          config.working_days.includes(day.value)
                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg'
                            : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                        }`}
                      >
                        <span className="hidden sm:inline">{day.label}</span>
                        <span className="sm:hidden">{day.label.charAt(0)}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-indigo-700">Select the days your team works</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  type="button"
                  onClick={saveConfiguration}
                  disabled={saving || !hasUnsavedChanges}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Configuration</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving || !hasUnsavedChanges}
                  className="sm:w-auto px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset Changes
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-2">🔄 Automatic Tracker Synchronization</p>
                  <ul className="space-y-1 text-blue-800">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>All active trackers automatically fetch these settings on startup</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Configuration updates every 5 minutes for running trackers</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Changes take effect immediately for new tracker sessions</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Configuration;
