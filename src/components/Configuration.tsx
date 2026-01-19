import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Settings, Save, RefreshCw, Clock, Camera, Calendar,
  Info, Check, X, ArrowLeft, Loader2, AlertCircle
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
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' }
];

const SCREENSHOT_INTERVALS = [
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '60 minutes' }
];

const IDLE_TIMEOUTS = [
  { value: 1, label: '1 minute' },
  { value: 3, label: '3 minutes' },
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' }
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
        `${import.meta.env.VITE_API_URL || 'https://workeye-render-demo-backend.onrender.com'}/api/configuration?company_id=${company?.id}`,
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
          company_id: company?.id || 0,
          ...data.config,
          last_modified_at: data.updated_at,
          created_at: data.created_at
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
        const updatedConfig = {
          ...config,
          last_modified_at: data.updated_at
        };
        setConfig(updatedConfig);
        setCurrentConfig(updatedConfig);
        
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
    if (!isoString) return 'Never';
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
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                <h1 className="text-xl font-bold text-slate-800">Configuration</h1>
                <p className="text-sm text-slate-500">{company?.company_name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-600 mt-1">Configuration saved successfully</p>
            </div>
          </div>
        )}

        {currentConfig && (
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Info className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-800">Current Configuration</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Screenshot Interval</p>
                <p className="text-lg font-bold text-slate-800">{currentConfig.screenshot_interval_minutes} minutes</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Idle Timeout</p>
                <p className="text-lg font-bold text-slate-800">{currentConfig.idle_timeout_minutes} minutes</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Office Hours</p>
                <p className="text-lg font-bold text-slate-800">
                  {currentConfig.office_start_time?.slice(0, 5)} - {currentConfig.office_end_time?.slice(0, 5)}
                </p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Working Days</p>
                <p className="text-sm font-medium text-slate-800">
                  {DAYS_OF_WEEK.filter(d => currentConfig.working_days.includes(d.value)).map(d => d.label).join(', ')}
                </p>
              </div>
            </div>

            {currentConfig.last_modified_at && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Last modified: {formatDateTime(currentConfig.last_modified_at)}
                  {currentConfig.last_modified_by && ` by ${currentConfig.last_modified_by}`}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Update Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Screenshot Interval</span>
              </label>
              <select
                value={config.screenshot_interval_minutes}
                onChange={(e) => setConfig({ ...config, screenshot_interval_minutes: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {SCREENSHOT_INTERVALS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">How often screenshots are captured</p>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span>Idle Timeout</span>
              </label>
              <select
                value={config.idle_timeout_minutes}
                onChange={(e) => setConfig({ ...config, idle_timeout_minutes: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {IDLE_TIMEOUTS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">Time before marking user as idle</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-3">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Working Days</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    onClick={() => handleWorkingDayToggle(day.value)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      config.working_days.includes(day.value)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center space-x-4">
            <button
              onClick={saveConfiguration}
              disabled={saving}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
              onClick={fetchConfiguration}
              disabled={loading || saving}
              className="px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Configuration Changes</p>
              <p className="text-blue-700">
                Changes to screenshot interval and idle timeout will be applied to all active trackers within 5 minutes.
                Trackers automatically sync configuration from the server.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Configuration;
