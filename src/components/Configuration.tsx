// UPDATED: 2026-01-21 17:16 IST - Neumorphic Design
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
  }, []);

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
        const loadedConfig: Configuration = {
          id: data.config.id,
          company_id: data.config.company_id,
          screenshot_interval_minutes: data.config.screenshot_interval_minutes,
          idle_timeout_minutes: data.config.idle_timeout_minutes,
          office_start_time: data.config.office_start_time,
          office_end_time: data.config.office_end_time,
          working_days: data.config.working_days,
          last_modified_by: data.config.last_modified_by,
          last_modified_at: data.config.last_modified_at,
          created_at: data.config.created_at
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
      
      const payload = {
        config: {
          screenshot_interval_minutes: config.screenshot_interval_minutes,
          idle_timeout_minutes: config.idle_timeout_minutes,
          office_start_time: config.office_start_time,
          office_end_time: config.office_end_time,
          working_days: config.working_days
        }
      };
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://workeye-render-demo-backend.onrender.com'}/api/configuration`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
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
    try {
      return new Date(isoString).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Status Messages */}
      {error && (
        <div 
          className="mb-6 p-4 bg-red-50 rounded-2xl flex items-start space-x-3"
          style={{ boxShadow: '4px 4px 10px rgba(239, 68, 68, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.7)' }}
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div 
          className="mb-6 p-4 bg-green-50 rounded-2xl flex items-center space-x-3"
          style={{ boxShadow: '4px 4px 10px rgba(34, 197, 94, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.7)' }}
        >
          <Check className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">Configuration saved successfully!</p>
        </div>
      )}

      {hasUnsavedChanges && (
        <div 
          className="mb-6 p-4 bg-yellow-50 rounded-2xl flex items-center space-x-3"
          style={{ boxShadow: '4px 4px 10px rgba(251, 191, 36, 0.2), -2px -2px 6px rgba(255, 255, 255, 0.7)' }}
        >
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-sm font-medium text-yellow-800">You have unsaved changes</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Current Configuration */}
        <div className="lg:col-span-1">
          <div 
            className="bg-[#e8ecf3] rounded-3xl p-6 sticky top-24"
            style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              <span>Current Settings</span>
            </h2>
            
            {currentConfig && (
              <div className="space-y-4">
                {/* Config ID & Company */}
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className="p-3 bg-[#e8ecf3] rounded-2xl"
                    style={{ boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff' }}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Hash className="w-3 h-3 text-gray-500" />
                      <p className="text-xs text-gray-600 font-medium">Config ID</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{currentConfig.id}</p>
                  </div>
                  
                  <div 
                    className="p-3 bg-[#e8ecf3] rounded-2xl"
                    style={{ boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff' }}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Building className="w-3 h-3 text-gray-500" />
                      <p className="text-xs text-gray-600 font-medium">Company</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{currentConfig.company_id}</p>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="space-y-3">
                  <div 
                    className="p-4 bg-[#e8ecf3] rounded-2xl"
                    style={{ boxShadow: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center"
                          style={{ boxShadow: '2px 2px 4px rgba(167, 139, 250, 0.4)' }}
                        >
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Screenshot</span>
                      </div>
                      <Zap className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{currentConfig.screenshot_interval_minutes}</p>
                    <p className="text-xs text-gray-600 mt-1">minutes</p>
                  </div>
                  
                  <div 
                    className="p-4 bg-[#e8ecf3] rounded-2xl"
                    style={{ boxShadow: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center"
                          style={{ boxShadow: '2px 2px 4px rgba(251, 191, 36, 0.4)' }}
                        >
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Idle</span>
                      </div>
                      <Activity className="w-4 h-4 text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{currentConfig.idle_timeout_minutes}</p>
                    <p className="text-xs text-gray-600 mt-1">minutes</p>
                  </div>
                  
                  <div 
                    className="p-4 bg-[#e8ecf3] rounded-2xl"
                    style={{ boxShadow: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff' }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div 
                        className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center"
                        style={{ boxShadow: '2px 2px 4px rgba(34, 197, 94, 0.4)' }}
                      >
                        <CalendarClock className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Office Hours</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {currentConfig.office_start_time?.slice(0, 5)} - {currentConfig.office_end_time?.slice(0, 5)}
                    </p>
                  </div>
                  
                  <div 
                    className="p-4 bg-[#e8ecf3] rounded-2xl"
                    style={{ boxShadow: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff' }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div 
                        className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center"
                        style={{ boxShadow: '2px 2px 4px rgba(99, 102, 241, 0.4)' }}
                      >
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Working Days</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {DAYS_OF_WEEK.filter(d => currentConfig.working_days.includes(d.value)).map(d => (
                        <span 
                          key={d.value} 
                          className="px-2 py-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-medium rounded-lg"
                          style={{ boxShadow: '2px 2px 4px rgba(99, 102, 241, 0.3)' }}
                        >
                          {d.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  {currentConfig.last_modified_by && (
                    <div className="flex items-start space-x-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Last modified by</p>
                        <p className="text-sm font-medium text-gray-800 truncate">{currentConfig.last_modified_by}</p>
                      </div>
                    </div>
                  )}
                  {currentConfig.last_modified_at && (
                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Last modified</p>
                        <p className="text-sm font-medium text-gray-800">{formatDateTime(currentConfig.last_modified_at)}</p>
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
          <div 
            className="bg-[#e8ecf3] rounded-3xl p-6 lg:p-8"
            style={{ boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Update Configuration</h2>
            
            <div className="space-y-6">
              {/* Screenshot Interval */}
              <div 
                className="p-5 bg-[#e8ecf3] rounded-2xl"
                style={{ boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff' }}
              >
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-3">
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
                    className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={config.screenshot_interval_minutes}
                    onChange={(e) => setConfig({ ...config, screenshot_interval_minutes: parseInt(e.target.value) || 1 })}
                    className="w-20 px-3 py-2 bg-[#e8ecf3] rounded-xl text-center font-semibold focus:outline-none"
                    style={{ boxShadow: 'inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff' }}
                  />
                  <span className="text-sm text-gray-700 font-medium">min</span>
                </div>
                <p className="mt-2 text-xs text-gray-600">How often screenshots are captured (1-60 minutes)</p>
              </div>

              {/* Idle Timeout */}
              <div 
                className="p-5 bg-[#e8ecf3] rounded-2xl"
                style={{ boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff' }}
              >
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-3">
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
                    className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-yellow-600"
                  />
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={config.idle_timeout_minutes}
                    onChange={(e) => setConfig({ ...config, idle_timeout_minutes: parseInt(e.target.value) || 1 })}
                    className="w-20 px-3 py-2 bg-[#e8ecf3] rounded-xl text-center font-semibold focus:outline-none"
                    style={{ boxShadow: 'inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff' }}
                  />
                  <span className="text-sm text-gray-700 font-medium">min</span>
                </div>
                <p className="mt-2 text-xs text-gray-600">Time before marking user as idle (1-30 minutes)</p>
              </div>

              {/* Office Hours */}
              <div 
                className="p-5 bg-[#e8ecf3] rounded-2xl"
                style={{ boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff' }}
              >
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-3">
                  <CalendarClock className="w-5 h-5 text-green-600" />
                  <span>Office Hours</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-700 font-medium mb-2">Start Time</label>
                    <input
                      type="time"
                      value={config.office_start_time.slice(0, 5)}
                      onChange={(e) => setConfig({ ...config, office_start_time: e.target.value + ':00' })}
                      className="w-full px-4 py-2 bg-[#e8ecf3] rounded-xl font-medium focus:outline-none"
                      style={{ boxShadow: 'inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 font-medium mb-2">End Time</label>
                    <input
                      type="time"
                      value={config.office_end_time.slice(0, 5)}
                      onChange={(e) => setConfig({ ...config, office_end_time: e.target.value + ':00' })}
                      className="w-full px-4 py-2 bg-[#e8ecf3] rounded-xl font-medium focus:outline-none"
                      style={{ boxShadow: 'inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff' }}
                    />
                  </div>
                </div>
              </div>

              {/* Working Days */}
              <div 
                className="p-5 bg-[#e8ecf3] rounded-2xl"
                style={{ boxShadow: 'inset 5px 5px 10px #d1d9e6, inset -5px -5px 10px #ffffff' }}
              >
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-4">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span>Working Days</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleWorkingDayToggle(day.value)}
                      className={`px-3 py-3 rounded-xl font-semibold text-sm transition-all ${
                        config.working_days.includes(day.value)
                          ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white'
                          : 'bg-[#e8ecf3] text-gray-700'
                      }`}
                      style={config.working_days.includes(day.value)
                        ? { boxShadow: '4px 4px 10px rgba(99, 102, 241, 0.4), -2px -2px 6px rgba(255, 255, 255, 0.7)' }
                        : { boxShadow: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff' }
                      }
                    >
                      <span className="hidden sm:inline">{day.label}</span>
                      <span className="sm:hidden">{day.label.charAt(0)}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-600">Select the days your team works</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={saveConfiguration}
                disabled={saving || !hasUnsavedChanges}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: '6px 6px 16px rgba(99, 102, 241, 0.4), -4px -4px 10px rgba(255, 255, 255, 0.7)' }}
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
                className="sm:w-auto px-6 py-3 bg-[#e8ecf3] text-gray-700 font-semibold rounded-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff' }}
              >
                Reset Changes
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div 
            className="mt-6 bg-[#e8ecf3] rounded-2xl p-5"
            style={{ boxShadow: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff' }}
          >
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-900">
                <p className="font-semibold mb-2">🔄 Automatic Tracker Synchronization</p>
                <ul className="space-y-1 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>All active trackers automatically fetch these settings on startup</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Configuration updates every 5 minutes for running trackers</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>Changes take effect immediately for new tracker sessions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Configuration;
