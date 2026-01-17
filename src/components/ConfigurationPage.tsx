import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Camera, 
  Clock, 
  Calendar,
  Save,
  Eye,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Configuration {
  id: number;
  company_id: number;
  screenshot_interval_minutes: number;
  idle_timeout_minutes: number;
  office_start_time: string;
  office_end_time: string;
  working_days: number[];
  last_modified_at: string | null;
  last_modified_by: string | null;
  created_at: string | null;
}

const SCREENSHOT_INTERVALS = [
  { value: 5, label: '5 Minutes' },
  { value: 10, label: '10 Minutes' },
  { value: 15, label: '15 Minutes' },
  { value: 30, label: '30 Minutes' },
  { value: 60, label: '1 Hour' }
];

const IDLE_TIMEOUTS = [
  { value: 1, label: '1 Minute' },
  { value: 2, label: '2 Minutes' },
  { value: 3, label: '3 Minutes' },
  { value: 5, label: '5 Minutes' },
  { value: 10, label: '10 Minutes' },
  { value: 15, label: '15 Minutes' }
];

const WEEKDAYS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' }
];

export function ConfigurationPage() {
  const navigate = useNavigate();
  const { user, company, logout } = useAuth();
  
  const [config, setConfig] = useState<Configuration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    screenshot_interval_minutes: 10,
    idle_timeout_minutes: 5,
    office_start_time: '09:00',
    office_end_time: '18:00',
    working_days: [1, 2, 3, 4, 5] // Monday to Friday
  });

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://backend-35m2.onrender.com'}/api/configuration?company_id=${company?.id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }

      const data = await response.json();

      if (data.success && data.config) {
        // Map JSONB config to component state
        const config = data.config;
        setConfig({
          id: 0,
          company_id: company?.id || 0,
          screenshot_interval_minutes: config.screenshot_interval_minutes || 10,
          idle_timeout_minutes: config.idle_timeout_minutes || 5,
          office_start_time: config.office_start_time || '09:00:00',
          office_end_time: config.office_end_time || '18:00:00',
          working_days: config.working_days || [1, 2, 3, 4, 5],
          last_modified_at: data.updated_at,
          last_modified_by: config.last_modified_by || null,
          created_at: data.created_at || null
        });
        
        setFormData({
          screenshot_interval_minutes: config.screenshot_interval_minutes || 10,
          idle_timeout_minutes: config.idle_timeout_minutes || 5,
          office_start_time: (config.office_start_time || '09:00:00').substring(0, 5),
          office_end_time: (config.office_end_time || '18:00:00').substring(0, 5),
          working_days: config.working_days || [1, 2, 3, 4, 5]
        });
      }
    } catch (err: any) {
      console.error('Error loading configuration:', err);
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://backend-35m2.onrender.com'}/api/configuration`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            company_id: company?.id,
            config: {
              screenshot_interval_minutes: formData.screenshot_interval_minutes,
              idle_timeout_minutes: formData.idle_timeout_minutes,
              office_start_time: `${formData.office_start_time}:00`,
              office_end_time: `${formData.office_end_time}:00`,
              working_days: formData.working_days
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }

      const data = await response.json();

      if (data.success) {
        setSuccess('Configuration saved successfully!');
        // Reload to get updated timestamp
        await loadConfiguration();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error saving configuration:', err);
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // ENHANCED: Format datetime with IST timezone
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata', // Force IST timezone
        hour12: true // Use 12-hour format
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  // NEW: Get current IST time
  const getCurrentISTTime = () => {
    return new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  // Check if there are unsaved changes
  const hasChanges = config ? (
    formData.screenshot_interval_minutes !== config.screenshot_interval_minutes ||
    formData.idle_timeout_minutes !== config.idle_timeout_minutes ||
    formData.office_start_time !== config.office_start_time.substring(0, 5) ||
    formData.office_end_time !== config.office_end_time.substring(0, 5) ||
    JSON.stringify(formData.working_days) !== JSON.stringify(config.working_days)
  ) : false;

  const userName = user?.full_name || user?.email || 'Admin';
  const userRole = user?.role || 'Admin';
  const companyName = company?.company_name || 'Company';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ENHANCED: Timezone Information Card */}
        {config && config.last_modified_at && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Configuration Timezone
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  All times are displayed in Indian Standard Time (IST / UTC+5:30).
                  Configuration changes take effect immediately on all connected trackers.
                </p>
                <div className="mt-2 text-xs text-blue-600">
                  Current time: {getCurrentISTTime()} IST
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {/* ENHANCED: Success message with save time */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
            {config?.last_modified_at && (
              <p className="text-xs text-green-700 mt-2 ml-8">
                Saved at: {formatDateTime(config.last_modified_at)} IST
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !config ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading configuration...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <h1 className="text-2xl font-bold text-white flex items-center">
                <Settings className="w-7 h-7 mr-3" />
                Tracker Configuration
              </h1>
              <p className="text-blue-100 mt-2">
                Configure tracking settings for all employees in your organization
              </p>
            </div>

            {/* Last Modified Info - ENHANCED with IST */}
            {config && config.last_modified_at && (
              <div className="px-8 py-4 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    Last updated: {formatDateTime(config.last_modified_at)}
                    <span className="ml-1 text-xs text-slate-400">(IST)</span>
                  </span>
                </div>
                {config.last_modified_by && (
                  <p className="text-xs text-slate-500 mt-1 ml-6">
                    Modified by: {config.last_modified_by}
                  </p>
                )}
              </div>
            )}

            {/* Configuration Form */}
            <div className="p-8 space-y-8">
              {/* Screenshot Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-blue-600" />
                  Screenshot Interval
                </label>
                <select
                  value={formData.screenshot_interval_minutes}
                  onChange={(e) => setFormData({
                    ...formData,
                    screenshot_interval_minutes: Number(e.target.value)
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  {SCREENSHOT_INTERVALS.map(interval => (
                    <option key={interval.value} value={interval.value}>
                      {interval.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  How often screenshots should be captured from tracked devices
                </p>
              </div>

              {/* Idle Timeout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-yellow-600" />
                  Idle Timeout
                </label>
                <select
                  value={formData.idle_timeout_minutes}
                  onChange={(e) => setFormData({
                    ...formData,
                    idle_timeout_minutes: Number(e.target.value)
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  {IDLE_TIMEOUTS.map(timeout => (
                    <option key={timeout.value} value={timeout.value}>
                      {timeout.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Time of inactivity before marking employee as idle
                </p>
              </div>

              {/* Office Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-green-600" />
                    Office Start Time (IST)
                  </label>
                  <input
                    type="time"
                    value={formData.office_start_time}
                    onChange={(e) => setFormData({
                      ...formData,
                      office_start_time: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-red-600" />
                    Office End Time (IST)
                  </label>
                  <input
                    type="time"
                    value={formData.office_end_time}
                    onChange={(e) => setFormData({
                      ...formData,
                      office_end_time: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Working Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                  Working Days
                </label>
                <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
                  {WEEKDAYS.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        const isSelected = formData.working_days.includes(day.value);
                        if (isSelected) {
                          setFormData({
                            ...formData,
                            working_days: formData.working_days.filter(d => d !== day.value)
                          });
                        } else {
                          setFormData({
                            ...formData,
                            working_days: [...formData.working_days, day.value].sort()
                          });
                        }
                      }}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                        formData.working_days.includes(day.value)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <div className="hidden md:block">{day.label}</div>
                      <div className="md:hidden">{day.short}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select the days employees are expected to work
                </p>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div>
                  {hasChanges && (
                    <p className="text-sm text-yellow-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      You have unsaved changes
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
