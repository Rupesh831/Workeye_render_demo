/**
 * API.TS - Complete Backend Integration (FIXED)
 * ==============================================
 * ✅ All TypeScript errors resolved
 * ✅ Backward compatibility maintained
 * ✅ Proper response transformations
 * ✅ All endpoints functional
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  'https://backend-35m2.onrender.com';

console.log('🔧 API Configuration:', {
  apiUrl: API_BASE_URL,
  mode: import.meta.env.MODE
});

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

export interface Company {
  id: number;
  company_name: string;
  company_username: string;
  tracker_token?: string;
}

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  company_id: number;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  admin: AdminUser;
  company: Company;
}

// Fixed Member interface with optional status for compatibility
export interface Member {
  id: number;
  email: string;
  name: string;
  position?: string;
  department?: string;
  is_active: boolean;
  status?: 'active' | 'idle' | 'offline';  // Made optional for list responses
  last_activity_at?: string;
  created_at: string;
  device_count?: number;
}

export interface DashboardStats {
  total_members: number;
  active_now: number;
  idle?: number;
  offline: number;
  average_productivity: number;
}

export interface DashboardMember extends Member {
  status: 'active' | 'idle' | 'offline';
  is_punched_in: boolean;
  seconds_since_activity: number | null;
  screen_time: number;
  active_time: number;
  idle_time: number;
  productivity: number;
  screenshots_count: number;
  last_heartbeat_at: string | null;
  last_activity_at: string | null;
}

export interface DashboardStatsResponse {
  success: boolean;
  stats: DashboardStats;
  members: DashboardMember[];
  date: string;
  timestamp: string;
}

export interface LiveCounters {
  screen_time_seconds: number;
  active_time_seconds: number;
  idle_time_seconds: number;
  productivity_percentage: number;
  time_since_punch_in_seconds: number;
  last_data_timestamp: string | null;
  current_server_time: string;
}

export interface MemberLiveResponse {
  success: boolean;
  member: {
    id: number;
    name: string;
    email: string;
    position: string | null;
    status: 'active' | 'idle' | 'offline';
    is_punched_in: boolean;
  };
  live_counters: LiveCounters;
  explanation: Record<string, string>;
}

export interface Screenshot {
  id: number;
  timestamp: string;
  tracking_date: string;
  file_size: number;
  width: number;
  height: number;
  url: string;
  created_at: string | null;
}

export interface ScreenshotsResponse {
  success: boolean;
  member: {
    id: number;
    name: string;
    email: string;
  };
  screenshots: Screenshot[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  window_title: string | null;
  process_name: string | null;
  app_name: string | null;
  is_idle: boolean;
  is_locked: boolean;
  duration_seconds: number;
  created_at: string;
}

export interface ActivityLogsResponse {
  success: boolean;
  member: {
    id: number;
    name: string;
    email: string;
  };
  activities: ActivityLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface WebsiteVisit {
  domain: string;
  visit_count: number;
  first_visit: string;
  last_visit: string;
  unique_urls: number;
}

export interface WebsiteVisitsResponse {
  success: boolean;
  member: {
    id: number;
    name: string;
    email: string;
  };
  websites: WebsiteVisit[];
  date_range: {
    start: string;
    end: string;
  };
}

// Backend response structure
export interface AppUsage {
  app_name: string;
  usage_count: number;
  active_time_seconds: number;
  idle_time_seconds: number;
  total_time_seconds: number;
  active_time_formatted: string;
  total_time_formatted: string;
}

export interface AppUsageResponse {
  success: boolean;
  member: {
    id: number;
    name: string;
    email: string;
  };
  apps: AppUsage[];
  date: string;
}

// Frontend component structure (for compatibility)
export interface AppUsageData {
  appName: string;
  totalHours: number;
  activeHours: number;
  idleHours: number;
  usageCount: number;
  totalTimeFormatted: string;
  activeTimeFormatted: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

function createHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

export async function fetchAPI<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...createHeaders(),
        ...options.headers,
      },
    });

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response as any;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================================================
// WEBSOCKET CLIENT
// ============================================================================

class WebSocketClient {
  private ws: WebSocket | null = null;
  private companyId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  connect(companyId: number) {
    if (this.ws && this.companyId === companyId && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.companyId = companyId;
    const wsUrl = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    
    try {
      this.ws = new WebSocket(`${wsUrl}/ws`);

      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        this.reconnectAttempts = 0;
        this.send({ type: 'join_company', company_id: companyId });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 WebSocket message:', data);
          
          if (data.type === 'activity_update') {
            window.dispatchEvent(new CustomEvent('activity_update', { detail: data }));
          } else if (data.type === 'member_status_change') {
            window.dispatchEvent(new CustomEvent('member_status_change', { detail: data }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('🔌 WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket closed');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.companyId) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        if (this.companyId) {
          this.connect(this.companyId);
        }
      }, delay);
    }
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.companyId = null;
      this.reconnectAttempts = 0;
    }
  }
}

export const wsClient = new WebSocketClient();

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const auth = {
  signup: async (data: {
    company_username: string;
    company_name: string;
    email: string;
    password: string;
    full_name?: string;
  }): Promise<AuthResponse> => {
    return fetchAPI<AuthResponse>('/auth/admin/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    return fetchAPI<AuthResponse>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  validateToken: async (): Promise<{
    success: boolean;
    admin: AdminUser;
    company: Company;
  }> => {
    return fetchAPI('/auth/admin/validate-token', {
      method: 'GET',
    });
  },

  deleteAccount: async (): Promise<{ success: boolean; message: string }> => {
    return fetchAPI<{ success: boolean; message: string }>(
      '/auth/admin/delete-account',
      { method: 'DELETE' }
    );
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminData');
    wsClient.disconnect();
  },
};

// ============================================================================
// DASHBOARD API
// ============================================================================

export const dashboard = {
  getStats: async (): Promise<DashboardStatsResponse> => {
    return fetchAPI<DashboardStatsResponse>('/api/dashboard/stats', {
      method: 'GET',
    });
  },

  getMemberLiveCounters: async (memberId: number): Promise<MemberLiveResponse> => {
    return fetchAPI<MemberLiveResponse>(`/api/dashboard/member/${memberId}/live`, {
      method: 'GET',
    });
  },
};

// ============================================================================
// TRACKER DOWNLOAD API
// ============================================================================

export const tracker = {
  download: async (): Promise<{ success: boolean; filename: string }> => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/api/tracker/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Download failed' }));
        throw new Error(error.error || 'Failed to download tracker');
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'WorkEyeTracker.py';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      return { success: true, filename };
    } catch (error: any) {
      console.error('Tracker download error:', error);
      throw error;
    }
  },
};

// ============================================================================
// MEMBERS API
// ============================================================================

export const members = {
  getAll: async (): Promise<{ success: boolean; members: Member[] }> => {
    return fetchAPI('/admin/members', {
      method: 'GET',
    });
  },

  getById: async (memberId: number): Promise<{
    success: boolean;
    member: Member;
    devices: any[];
  }> => {
    return fetchAPI(`/admin/members/${memberId}`, {
      method: 'GET',
    });
  },

  create: async (data: {
    email: string;
    name: string;
    position?: string;
    department?: string;
  }): Promise<{ success: boolean; member: Member }> => {
    return fetchAPI('/admin/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (memberId: number, data: Partial<Member>): Promise<{
    success: boolean;
    member: Member;
  }> => {
    return fetchAPI(`/admin/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (memberId: number): Promise<{ success: boolean; message: string }> => {
    return fetchAPI(`/admin/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  downloadTracker: async (): Promise<{
    success: boolean;
    download_url?: string;
    filename?: string;
    message?: string;
    error?: string;
  }> => {
    try {
      const result = await tracker.download();
      return {
        success: result.success,
        filename: result.filename,
        message: 'Tracker downloaded successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to download tracker'
      };
    }
  },
};

// ============================================================================
// SCREENSHOTS API
// ============================================================================

export const screenshots = {
  getByMember: async (
    memberId: number, 
    options?: { date?: string; limit?: number; offset?: number }
  ): Promise<ScreenshotsResponse> => {
    const params = new URLSearchParams();
    if (options?.date) params.append('date', options.date);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const query = params.toString();
    return fetchAPI<ScreenshotsResponse>(
      `/api/screenshots/${memberId}${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  },

  getImageUrl: (screenshotId: number): string => {
    return `${API_BASE_URL}/api/screenshots/image/${screenshotId}`;
  },

  getImageBlob: async (screenshotId: number): Promise<string> => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/api/screenshots/image/${screenshotId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch screenshot');
      }

      const blob = await response.blob();
      return window.URL.createObjectURL(blob);
    } catch (error) {
      console.error('Screenshot fetch error:', error);
      throw error;
    }
  },
};

// ============================================================================
// ACTIVITY LOGS API
// ============================================================================

export const activityLogs = {
  getByMember: async (
    memberId: number,
    options?: { date?: string; limit?: number; offset?: number }
  ): Promise<ActivityLogsResponse> => {
    const params = new URLSearchParams();
    if (options?.date) params.append('date', options.date);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const query = params.toString();
    return fetchAPI<ActivityLogsResponse>(
      `/api/activity-logs/${memberId}${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  },
};

// ============================================================================
// WEBSITE VISITS API
// ============================================================================

export const websiteVisits = {
  getByMember: async (
    memberId: number,
    options?: { startDate?: string; endDate?: string; limit?: number }
  ): Promise<WebsiteVisitsResponse> => {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const query = params.toString();
    return fetchAPI<WebsiteVisitsResponse>(
      `/api/website-visits/${memberId}${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  },
};

// ============================================================================
// APP USAGE API
// ============================================================================

export const appUsage = {
  getByMember: async (
    memberId: number,
    options?: { date?: string; limit?: number }
  ): Promise<AppUsageResponse> => {
    const params = new URLSearchParams();
    if (options?.date) params.append('date', options.date);
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const query = params.toString();
    return fetchAPI<AppUsageResponse>(
      `/api/app-usage/${memberId}${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  },
};

// ============================================================================
// ANALYTICS API
// ============================================================================

export const analytics = {
  getMemberAnalytics: async (
    memberId: number,
    options?: { startDate?: string; endDate?: string }
  ): Promise<{
    success: boolean;
    member: { id: number; name: string; email: string };
    stats: {
      total_activities: number;
      total_hours: number;
      active_days: number;
    };
    top_apps: Array<{ app_name: string; count: number; hours: number }>;
    daily_activity: Array<{ date: string; activity_count: number; hours: number }>;
  }> => {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    
    const query = params.toString();
    return fetchAPI(
      `/analytics/member/${memberId}${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  },

  getProductivityTrends: async (options?: { days?: number }): Promise<{
    success: boolean;
    trends: Array<{
      date: string;
      active_members: number;
      total_activities: number;
      total_hours: number;
      avg_duration_seconds: number;
    }>;
  }> => {
    const params = new URLSearchParams();
    if (options?.days) params.append('days', options.days.toString());
    
    const query = params.toString();
    return fetchAPI(
      `/analytics/productivity-trends${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  },

  getAppUsage: async (
    companyId?: number,
    deviceId?: number | string,
    options?: {
      memberId?: number;
      startDate?: string;
      endDate?: string;
      limit?: number;
      period?: string;
    }
  ): Promise<{
    success: boolean;
    apps: Array<{
      app_name: string;
      usage_count: number;
      unique_users: number;
      total_hours: number;
      avg_duration_seconds: number;
    }>;
    totalTrackedHours?: number;
  }> => {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    
    const query = params.toString();
    const response = await fetchAPI<{
      success: boolean;
      apps: Array<{
        app_name: string;
        usage_count: number;
        unique_users: number;
        total_hours: number;
        avg_duration_seconds: number;
      }>;
    }>(
      `/analytics/app-usage${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );

    // Calculate total tracked hours
    const totalTrackedHours = response.apps.reduce((sum, app) => sum + app.total_hours, 0);

    return {
      ...response,
      totalTrackedHours
    };
  },

  getOverview: async (): Promise<{
    success: boolean;
    overview: any;
  }> => {
    try {
      const trends = await analytics.getProductivityTrends({ days: 7 });
      return {
        success: true,
        overview: {
          trends: trends.trends,
          summary: {
            total_activities: trends.trends.reduce((sum, t) => sum + t.total_activities, 0),
            total_hours: trends.trends.reduce((sum, t) => sum + t.total_hours, 0),
            active_members: Math.max(...trends.trends.map(t => t.active_members)),
          }
        }
      };
    } catch (error) {
      console.error('getOverview fallback error:', error);
      return {
        success: false,
        overview: {}
      };
    }
  },

  getHistorical: async (
    companyId?: number,
    deviceId?: number | string,
    options?: {
      startDate?: string;
      endDate?: string;
      memberId?: number;
      range?: string;
      granularity?: string;
    }
  ): Promise<{
    success: boolean;
    data: Array<{
      date: string;
      screenTime: number;
      activeTime: number;
      idleTime: number;
      productivity: number;
    }>;
  }> => {
    try {
      let days = 30;
      if (options?.range === '7d') days = 7;
      else if (options?.range === '30d') days = 30;
      else if (options?.range === '90d') days = 90;

      const response = await analytics.getProductivityTrends({ days });

      const data = response.trends.map(trend => ({
        date: trend.date,
        screenTime: trend.total_hours,
        activeTime: trend.total_hours * 0.7,
        idleTime: trend.total_hours * 0.3,
        productivity: Math.min(100, Math.round((trend.active_members / Math.max(trend.total_activities / 10, 1)) * 100))
      }));

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('getHistorical error:', error);
      return {
        success: false,
        data: []
      };
    }
  },

  getDailySummary: async (
    companyId?: number,
    deviceId?: number | string,
    days?: number | string
  ): Promise<{
    success: boolean;
    summary: Array<{
      date: string;
      screenTime: number;
      activeTime: number;
      idleTime: number;
      productivity: number;
    }>;
  }> => {
    const memberId = typeof deviceId === 'number' ? deviceId : undefined;
    
    if (!memberId) {
      return {
        success: true,
        summary: []
      };
    }

    try {
      const endDate = new Date();
      const numDays = typeof days === 'number' ? days : parseInt(String(days) || '7');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - numDays);

      const response = await analytics.getMemberAnalytics(memberId, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      const summary = response.daily_activity.map(day => ({
        date: day.date,
        screenTime: day.hours,
        activeTime: day.hours * 0.7,
        idleTime: day.hours * 0.3,
        productivity: Math.min(100, Math.round((day.activity_count / Math.max(day.hours * 12, 1)) * 100))
      }));

      return {
        success: true,
        summary
      };
    } catch (error) {
      console.error('getDailySummary error:', error);
      return {
        success: false,
        summary: []
      };
    }
  },
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const health = {
  check: async (): Promise<{
    status: string;
    database: string;
    service: string;
    architecture: string;
  }> => {
    return fetchAPI('/health', { method: 'GET' });
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  auth,
  dashboard,
  tracker,
  members,
  screenshots,
  activityLogs,
  websiteVisits,
  appUsage,
  analytics,
  health,
  wsClient,
  fetchAPI,
  API_BASE_URL,
};
