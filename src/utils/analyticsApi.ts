/**
 * ANALYTICS API - Client-side analytics service
 * ==============================================
 * Handles all analytics API calls with pagination and caching
 */

import { API_BASE_URL } from '../config/api';

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

export interface AttendanceRecord {
  id: number;
  member_id: number;
  member_name: string;
  date: string;
  punch_in_time: string | null;
  punch_out_time: string | null;
  duration_minutes: number | null;
  status: string;
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  window_title: string | null;
  process_name: string | null;
  app_name: string | null;
  url: string | null;
  domain: string | null;
  is_idle: boolean;
  is_locked: boolean;
  duration_seconds: number;
  tracking_date: string;
  created_at: string;
}

export interface AppLog {
  app_name: string;
  process_name: string | null;
  timestamp: string;
  duration_seconds: number;
  tracking_date: string;
}

export interface WebsiteLog {
  url: string;
  domain: string;
  timestamp: string;
  duration_seconds: number;
  tracking_date: string;
}

export interface WorkBehavior {
  attendance: {
    punch_in_time: string | null;
    punch_out_time: string | null;
    duration_minutes: number | null;
    status: string;
  } | null;
  activities: Array<{
    timestamp: string;
    app_name: string | null;
    is_idle: boolean;
    is_locked: boolean;
    duration_seconds: number;
  }>;
  date: string;
}

/**
 * Get attendance analytics
 */
export async function getAttendanceAnalytics(
  memberId?: number,
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> {
  const token = getAuthToken();
  const params = new URLSearchParams();
  
  if (memberId) params.append('member_id', memberId.toString());
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await fetch(
    `${API_BASE_URL}/analytics/attendance?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch attendance analytics: ${response.statusText}`);
  }

  const data = await response.json();
  return data.records || [];
}

/**
 * Get activity analytics with pagination
 */
export async function getActivityAnalytics(
  memberId: number,
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 50
): Promise<{ logs: ActivityLog[]; pagination: any }> {
  const token = getAuthToken();
  const params = new URLSearchParams({
    member_id: memberId.toString(),
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await fetch(
    `${API_BASE_URL}/analytics/activity?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch activity analytics: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    logs: data.logs || [],
    pagination: data.pagination || {},
  };
}

/**
 * Get application analytics
 */
export async function getAppsAnalytics(
  memberId: number,
  startDate?: string,
  endDate?: string
): Promise<AppLog[]> {
  const token = getAuthToken();
  const params = new URLSearchParams({
    member_id: memberId.toString(),
  });
  
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await fetch(
    `${API_BASE_URL}/analytics/apps?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch apps analytics: ${response.statusText}`);
  }

  const data = await response.json();
  return data.logs || [];
}

/**
 * Get website analytics
 */
export async function getWebsitesAnalytics(
  memberId: number,
  startDate?: string,
  endDate?: string
): Promise<WebsiteLog[]> {
  const token = getAuthToken();
  const params = new URLSearchParams({
    member_id: memberId.toString(),
  });
  
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await fetch(
    `${API_BASE_URL}/analytics/websites?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch websites analytics: ${response.statusText}`);
  }

  const data = await response.json();
  return data.logs || [];
}

/**
 * Get work behavior analytics
 */
export async function getWorkBehaviorAnalytics(
  memberId: number,
  date?: string
): Promise<WorkBehavior> {
  const token = getAuthToken();
  const params = new URLSearchParams({
    member_id: memberId.toString(),
  });
  
  if (date) params.append('date', date);

  const response = await fetch(
    `${API_BASE_URL}/analytics/work-behavior?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch work behavior analytics: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    attendance: data.attendance || null,
    activities: data.activities || [],
    date: data.date,
  };
}
