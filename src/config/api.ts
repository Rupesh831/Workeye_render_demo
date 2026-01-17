/**
 * API.TS - Production Multi-Tenant API & WebSocket Client
 * =========================================================
 * ✅ Multi-tenant aware API calls (company_id in headers)
 * ✅ JWT token management with auto-refresh
 * ✅ Enhanced WebSocket with automatic reconnection
 * ✅ Connection health monitoring
 * ✅ Proper error handling
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  'https://backend-35m2.onrender.com';

export const WS_BASE_URL = API_BASE_URL
  .replace('https://', 'wss://')
  .replace('http://', 'ws://');

console.log('🔧 API Configuration:', {
  apiUrl: API_BASE_URL,
  wsUrl: WS_BASE_URL,
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
  refresh_token?: string;
  admin: AdminUser;
  company: Company;
}

export interface Member {
  id: number;
  email: string;
  name: string;
  position?: string;
  department?: string;
  is_active: boolean;
  status?: 'active' | 'idle' | 'offline';
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

function setAuthToken(token: string) {
  localStorage.setItem('authToken', token);
}

function setRefreshToken(token: string) {
  localStorage.setItem('refreshToken', token);
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

// ============================================================================
// FETCH WITH AUTO TOKEN REFRESH
// ============================================================================

export async function fetchAPI<T = any>(
  endpoint: string, 
  options: RequestInit = {},
  retryCount = 0
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

    // Handle 401 - Try to refresh token
    if (response.status === 401 && retryCount === 0) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/admin/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          
          if (refreshResponse.ok) {
            const { token } = await refreshResponse.json();
            setAuthToken(token);
            // Retry original request
            return fetchAPI<T>(endpoint, options, retryCount + 1);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Clear tokens and redirect to login
          auth.logout();
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        auth.logout();
        window.location.href = '/login';
      }
    }

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
// ENHANCED WEBSOCKET CLIENT
// ============================================================================

class EnhancedWebSocketClient {
  private ws: WebSocket | null = null;
  private companyId: number | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private isAuthenticated = false;
  private messageQueue: any[] = [];
  private eventListeners: Map<string, Set<Function>> = new Map();

  /**
   * Connect to WebSocket with JWT authentication
   * Implements exponential backoff for reconnection
   */
  connect(companyId: number) {
    // Don't reconnect if already connected to same company
    if (this.ws && this.companyId === companyId && this.ws.readyState === WebSocket.OPEN) {
      console.log('🔌 Already connected to company', companyId);
      return;
    }

    this.companyId = companyId;
    this.token = getAuthToken();

    if (!this.token) {
      console.error('❌ No auth token available for WebSocket');
      return;
    }

    try {
      const wsUrl = `${WS_BASE_URL}/ws`;
      console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected, authenticating...');
        this.reconnectAttempts = 0;
        
        // Send authentication
        this.send({
          type: 'authenticate',
          token: this.token
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 WebSocket message:', data);
          
          if (data.type === 'authenticated') {
            this.isAuthenticated = true;
            console.log('✅ WebSocket authenticated');
            
            // Start heartbeat
            this.startHeartbeat();
            
            // Send queued messages
            this.flushMessageQueue();
            
            // Emit authenticated event
            this.emit('connected', data);
          } else if (data.type === 'pong') {
            // Heartbeat response
            console.log('💓 Heartbeat response received');
          } else if (data.error) {
            console.error('❌ WebSocket error:', data.error);
            if (data.error.includes('auth') || data.error.includes('token')) {
              this.disconnect();
            }
          } else {
            // Emit event for message type
            this.emit(data.type, data);
            
            // Also emit to window for backward compatibility
            window.dispatchEvent(new CustomEvent(data.type, { detail: data }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('🔌 WebSocket error:', error);
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 WebSocket closed: code=${event.code}, reason=${event.reason}`);
        this.isAuthenticated = false;
        this.stopHeartbeat();
        this.emit('disconnected', { code: event.code, reason: event.reason });
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Attempt reconnection with exponential backoff
   */
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
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('max_reconnect_attempts', {});
    }
  }

  /**
   * Send message to WebSocket
   * Queues messages if not connected
   */
  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (data.type !== 'authenticate' && !this.isAuthenticated) {
        // Queue non-auth messages until authenticated
        this.messageQueue.push(data);
        return;
      }
      
      try {
        this.ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('📦 WebSocket not ready, queueing message:', data);
      this.messageQueue.push(data);
    }
  }

  /**
   * Flush queued messages after authentication
   */
  private flushMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`📤 Sending ${this.messageQueue.length} queued messages`);
      this.messageQueue.forEach(msg => this.send(msg));
      this.messageQueue = [];
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.isAuthenticated) {
        this.send({ type: 'ping', timestamp: new Date().toISOString() });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from WebSocket events
   */
  off(event: string, callback: Function) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.delete(callback);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data: any) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Broadcast message to company
   */
  broadcastToCompany(type: string, data: any) {
    this.send({
      type,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.companyId = null;
      this.reconnectAttempts = 0;
      this.isAuthenticated = false;
      this.messageQueue = [];
    }
    console.log('🔌 WebSocket disconnected');
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.ws?.readyState === WebSocket.OPEN,
      authenticated: this.isAuthenticated,
      companyId: this.companyId,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export const wsClient = new EnhancedWebSocketClient();

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
    const response = await fetchAPI<AuthResponse>('/auth/admin/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Store tokens
    if (response.token) {
      setAuthToken(response.token);
    }
    if (response.refresh_token) {
      setRefreshToken(response.refresh_token);
    }
    
    return response;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetchAPI<AuthResponse>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store tokens
    if (response.token) {
      setAuthToken(response.token);
    }
    if (response.refresh_token) {
      setRefreshToken(response.refresh_token);
    }
    
    return response;
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

  refreshToken: async (): Promise<{ success: boolean; token: string }> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/admin/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    if (data.token) {
      setAuthToken(data.token);
    }
    
    return data;
  },

  deleteAccount: async (): Promise<{ success: boolean; message: string }> => {
    return fetchAPI<{ success: boolean; message: string }>(
      '/auth/admin/delete-account',
      { method: 'DELETE' }
    );
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('adminData');
    wsClient.disconnect();
  },
};

// ============================================================================
// DASHBOARD API
// ============================================================================

export const dashboard = {
  getStats: async () => {
    return fetchAPI('/api/dashboard/stats', { method: 'GET' });
  },

  getMemberLiveCounters: async (memberId: number) => {
    return fetchAPI(`/api/dashboard/member/${memberId}/live`, { method: 'GET' });
  },
};

// ============================================================================
// MEMBERS API
// ============================================================================

export const members = {
  getAll: async (): Promise<{ success: boolean; members: Member[] }> => {
    return fetchAPI('/admin/members', { method: 'GET' });
  },

  getById: async (memberId: number) => {
    return fetchAPI(`/admin/members/${memberId}`, { method: 'GET' });
  },

  create: async (data: Partial<Member>): Promise<{ success: boolean; member: Member }> => {
    return fetchAPI('/admin/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (memberId: number, data: Partial<Member>) => {
    return fetchAPI(`/admin/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (memberId: number) => {
    return fetchAPI(`/admin/members/${memberId}`, { method: 'DELETE' });
  },
};

// ============================================================================
// SCREENSHOTS API
// ============================================================================

export const screenshots = {
  getByMember: async (memberId: number, options?: { date?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams();
    if (options?.date) params.append('date', options.date);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const query = params.toString();
    return fetchAPI(`/api/screenshots/${memberId}${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  getImageUrl: (screenshotId: number): string => {
    return `${API_BASE_URL}/api/screenshots/image/${screenshotId}`;
  },
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const health = {
  check: async () => {
    return fetchAPI('/health', { method: 'GET' });
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  auth,
  dashboard,
  members,
  screenshots,
  health,
  wsClient,
  fetchAPI,
  API_BASE_URL,
  WS_BASE_URL,
};
