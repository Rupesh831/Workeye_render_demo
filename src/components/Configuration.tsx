import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Settings, Save, RefreshCw, Clock, Camera, Calendar,
  Info, Check, X, ArrowLeft, Loader2, AlertCircle, Building,
  Hash, User, CalendarClock
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

  useEffect(() => {
    fetchConfiguration();
  }, [company?.id]);

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
        await fetchConfiguration(); // Refresh to get latest data
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

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Not set';
    return new Date(isoString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">System Configuration</h1>
                <p className="text-sm text-slate-500">{company?.company_name}</p>
              </div>
            </div>
            <button
              onClick={fetchConfiguration}
              disabled={loading || saving}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-600 mt-1">Configuration updated successfully</p>
            </div>
          </div>
        )}

        {/* Current Configuration Display */}
        {currentConfig && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Current Settings</h2>
              <div className="text-xs text-slate-500">
                ID: #{currentConfig.id}
              </div>
            </div>
            
            {/* Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Hash className="w-4 h-4 text-blue-600" />
                  <p className="text-xs text-slate-600 font-medium">Company ID</p>
                </div>
                <p className="text-lg font-bold text-slate-800">{currentConfig.company_id}</p>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Camera className="w-4 h-4 text-purple-600" />
                  <p className="text-xs text-slate-600 font-medium">Screenshot Interval</p>
                </div>
                <p className="text-lg font-bold text-slate-800">{currentConfig.screenshot_interval_minutes} min</p>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <p className="text-xs text-slate-600 font-medium">Idle Timeout</p>
                </div>
                <p className="text-lg font-bold text-slate-800">{currentConfig.idle_timeout_minutes} min</p>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <CalendarClock className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-slate-600 font-medium">Office Hours</p>
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {currentConfig.office_start_time?.slice(0, 5)} - {currentConfig.office_end_time?.slice(0, 5)}
                </p>
              </div>
              
              <div className="p-3 bg-indigo-50 rounded-lg md:col-span-2">
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <p className="text-xs text-slate-600 font-medium">Working Days</p>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {DAYS_OF_WEEK.filter(d => currentConfig.working_days.includes(d.value))
                    .map(d => d.fullLabel).join(', ')}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              {currentConfig.last_modified_by && (
                <div className="flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Last modified by:</span>
                  <span className="font-medium text-slate-800">{currentConfig.last_modified_by}</span>
                </div>
              )}
              {currentConfig.last_modified_at && (
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Last modified:</span>
                  <span className="font-medium text-slate-800">{formatDateTime(currentConfig.last_modified_at)}</span>
                </div>
              )}
              {currentConfig.created_at && (
                <div className="flex items-center space-x-2 text-sm">
                  <CalendarClock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Created:</span>
                  <span className="font-medium text-slate-800">{formatDateTime(currentConfig.created_at)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Form */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Update Configuration</h2>
          
          <div className="space-y-6">
            {/* Screenshot Interval */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Screenshot Interval (minutes)</span>
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={config.screenshot_interval_minutes}
                onChange={(e) => setConfig({ ...config, screenshot_interval_minutes: parseInt(e.target.value) || 10 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">How often screenshots are captured (1-60 minutes)</p>
            </div>

            {/* Idle Timeout */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span>Idle Timeout (minutes)</span>
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={config.idle_timeout_minutes}
                onChange={(e) => setConfig({ ...config, idle_timeout_minutes: parseInt(e.target.value) || 5 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-slate-500">Time before marking user as idle (1-30 minutes)</p>
            </div>

            {/* Office Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Office Start Time</label>
                <input
                  type="time"
                  value={config.office_start_time.slice(0, 5)}
                  onChange={(e) => setConfig({ ...config, office_start_time: e.target.value + ':00' })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Office End Time</label>
                <input
                  type="time"
                  value={config.office_end_time.slice(0, 5)}
                  onChange={(e) => setConfig({ ...config, office_end_time: e.target.value + ':00' })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Working Days */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-3">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Working Days</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    onClick={() => handleWorkingDayToggle(day.value)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      config.working_days.includes(day.value)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className="hidden sm:inline">{day.label}</span>
                    <span className="sm:hidden">{day.label.charAt(0)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center space-x-4">
            <button
              onClick={saveConfiguration}
              disabled={saving}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => setConfig(currentConfig || config)}
              disabled={saving}
              className="px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Tracker Synchronization</p>
              <p className="text-blue-700">
                Active trackers will automatically fetch these settings from the server. Changes take effect immediately for new sessions and within 5 minutes for active trackers.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Configuration;
