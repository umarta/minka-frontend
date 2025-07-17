import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, PaginatedResponse, AntiBlockingValidationResult, AntiBlockingConfig, AntiBlockingStats, ContactRiskAssessment, BulkMessageRequest, BulkMessageResponse, WaMeLinkRequest, WaMeLinkResponse } from '@/types';

// Extend AxiosRequestConfig to include retry flag
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('auth_token');
    console.log('🔍 Getting token from localStorage:', token ? token.substring(0, 20) + '...' : 'null');
    return token;
  },
  
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      console.log('💾 Token saved to localStorage:', token.substring(0, 20) + '...');
    }
  },
  
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  },
  
  setRefreshToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', token);
    }
  },
  
  removeTokens: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  },
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token attached to request:', token.substring(0, 20) + '...');
    } else {
      console.log('❌ No token found in localStorage');
    }
    console.log('📡 Request headers:', config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          const { token } = response.data.data;
          tokenManager.setToken(token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        tokenManager.removeTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API response wrapper
const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (response.data.success && response.data.data !== undefined) {
    return response.data.data;
  }
  throw new Error(response.data.error || response.data.message || 'API request failed');
};

// Helper function to extract array from paginated or direct response
const extractArray = <T>(data: T[] | { data: T[] } | PaginatedResponse<T>): T[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
    return (data as any).data;
  }
  return [];
};

// Helper function to extract single item from response
const extractSingle = <T>(data: T | { data: T }): T => {
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as any).data;
  }
  return data as T;
};

// Standardized API response handler for array responses
const handleArrayResponse = <T>(response: AxiosResponse<ApiResponse<T[] | PaginatedResponse<T>>>): T[] => {
  const data = handleApiResponse(response);
  return extractArray(data);
};

// Standardized API response handler for single item responses
const handleSingleResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  const data = handleApiResponse(response);
  return extractSingle(data);
};

const handleApiError = (error: AxiosError<ApiResponse>) => {
  if (error.response?.data) {
    const { message, error: errorMessage, errors } = error.response.data;
    if (errors) {
      // Handle validation errors
      const validationErrors = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ');
      throw new Error(validationErrors);
    }
    // Use message first, then errorMessage as fallback
    throw new Error(message || errorMessage || 'Request failed');
  }
  throw new Error(error.message || 'Network error');
};

// Auth API
export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
      tokenManager.removeTokens();
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  refreshToken: async () => {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  changePassword: async (data: { current_password: string; new_password: string }) => {
    try {
      const response = await api.post('/auth/change-password', data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  updateProfile: async (data: any) => {
    try {
      const response = await api.put('/admin/profile', data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Contacts API
export const contactsApi = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string; label?: string }) => {
    try {
      const response = await api.get('/contacts', { params });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await api.get(`/contacts/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },
  
  create: async (data: any) => {
    try {
      const response = await api.post('/contacts', data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },
  
  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/contacts/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  delete: async (id: string) => {
    try {
      const response = await api.delete(`/contacts/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  block: async (id: string) => {
    try {
      const response = await api.post(`/contacts/${id}/block`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  unblock: async (id: string) => {
    try {
      const response = await api.post(`/contacts/${id}/unblock`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  search: async (query: string, params?: any) => {
    try {
      const response = await api.get('/contacts/search', { params: { ...params, search: query } });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  bulkUpdate: async (ids: string[], data: any) => {
    try {
      const response = await api.put('/contacts/bulk', { ids, data });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  bulkDelete: async (ids: string[]) => {
    try {
      const response = await api.delete('/contacts/bulk', { data: { ids } });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  addLabel: async (contactId: string, labelId: string) => {
    try {
      const response = await api.post(`/contacts/${contactId}/labels/${labelId}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  removeLabel: async (contactId: string, labelId: string) => {
    try {
      const response = await api.delete(`/contacts/${contactId}/labels/${labelId}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  import: async (file: File, options?: any) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (options) {
        formData.append('options', JSON.stringify(options));
      }
      const response = await api.post('/contacts/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  export: async (format: 'csv' | 'excel', params?: any) => {
    try {
      const response = await api.get('/contacts/export', { 
        params: { ...params, format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Takeover management
  setTakeover: async (contactId: string, adminId: string) => {
    try {
      const response = await api.put(`/contacts/${contactId}/takeover`, { admin_id: adminId });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  releaseTakeover: async (contactId: string) => {
    try {
      const response = await api.put(`/contacts/${contactId}/takeover`, { action: 'release' });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getTakeoverStatus: async (contactId: string) => {
    try {
      const response = await api.get(`/contacts/${contactId}/takeover`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },
};

// Labels API
export const labelsApi = {
  getAll: async () => {
    try {
      const response = await api.get('/labels');
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  create: async (data: any) => {
    try {
      const response = await api.post('/labels', data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/labels/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/labels/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Admins API
export const adminsApi = {
  getAll: async () => {
    try {
      const response = await api.get('/admin/users');
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Sessions API
export const sessionsApi = {
  getAll: async () => {
    try {
      const response = await api.get('/sessions');
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await api.get(`/sessions/by-id/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  getByName: async (name: string) => {
    try {
      const response = await api.get(`/sessions/by-name/${name}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  create: async (data: any) => {
    try {
      const response = await api.post('/sessions', data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/sessions/by-id/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  delete: async (id: string) => {
    try {
      const response = await api.delete(`/sessions/by-id/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  start: async (name: string) => {
    try {
      const response = await api.post(`/sessions/by-name/${name}/start`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  stop: async (name: string) => {
    try {
      const response = await api.post(`/sessions/by-name/${name}/stop`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  restart: async (name: string) => {
    try {
      const response = await api.post(`/sessions/by-name/${name}/restart`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  getQR: async (name: string) => {
    try {
      const response = await api.get(`/sessions/by-name/${name}/qr`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  getStatus: async (name: string) => {
    try {
      const response = await api.get(`/sessions/by-name/${name}/status`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  logout: async (name: string) => {
    try {
      const response = await api.post(`/sessions/by-name/${name}/logout`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  sync: async () => {
    try {
      const response = await api.post('/sessions/sync');
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getActiveCount: async () => {
    try {
      const response = await api.get('/sessions/active/count');
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Messages API
export const messagesApi = {
  getByContact: async (contactId: string, params?: { page?: number; limit?: number; query?: string; order?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.query) searchParams.append('query', params.query);
    if (params?.order) searchParams.append('order', params.order);
    
    const response = await api.get(`/messages/contact/${contactId}?${searchParams.toString()}`);
    return response.data;
  },

  getByTicket: async (ticketId: string, params?: { page?: number; per_page?: number; order?: string }) => {
    try {
      const response = await api.get(`/messages/ticket/${ticketId}`, { params });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },
  
  send: async (data: any) => {
    try {
      const response = await api.post('/messages/send/text', data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  sendMedia: async (data: FormData) => {
    try {
      const response = await api.post('/messages/send/media', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  markAsRead: async (ticketId: string) => {
    try {
      const response = await api.put(`/messages/ticket/${ticketId}/read-all`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  markSingleAsRead: async (messageId: string) => {
    try {
      const response = await api.put(`/messages/${messageId}/read`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  search: async (query: string, params?: any) => {
    try {
      const response = await api.get('/messages/search', { params: { query, ...params } });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getAll: async (params?: { page?: number; per_page?: number }) => {
    try {
      const response = await api.get('/messages', { params });
      return handleApiResponse<PaginatedResponse<any>>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/messages/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/messages/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/messages/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getUnreadCount: async (ticketId: string) => {
    try {
      const response = await api.get(`/messages/ticket/${ticketId}/unread-count`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Tickets API
export const ticketsApi = {
  getAll: async (params?: any) => {
    try {
      const response = await api.get('/tickets', { params });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await api.get(`/tickets/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  getByContact: async (contactId: string, params?: any) => {
    try {
      const response = await api.get(`/tickets/contact/${contactId}`, { params });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },
  
  create: async (data: any) => {
    try {
      const response = await api.post('/tickets', data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/tickets/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  assign: async (id: string, adminId: string) => {
    try {
      const response = await api.post(`/tickets/${id}/assign`, { admin_id: adminId });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  close: async (id: string, resolution?: string) => {
    try {
      const response = await api.post(`/tickets/${id}/close`, { resolution });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/tickets/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Dashboard API
export const dashboardApi = {
  getOverview: async () => {
    try {
      const response = await api.get('/dashboards/overview');
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getTicketStats: async (days?: number) => {
    try {
      const response = await api.get('/dashboards/tickets', {
        params: { days: days || 30 }
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getSessionStats: async () => {
    try {
      const response = await api.get('/dashboards/sessions');
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getMessageStats: async (days?: number) => {
    try {
      const response = await api.get('/dashboards/messages', {
        params: { days: days || 30 }
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getRecentActivity: async (limit?: number) => {
    try {
      const response = await api.get('/dashboards/activity', {
        params: { limit: limit || 10 }
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getPerformanceMetrics: async (days?: number) => {
    try {
      const response = await api.get('/dashboards/performance', {
        params: { days: days || 30 }
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getTimeBasedStats: async (period?: string, days?: number) => {
    try {
      const response = await api.get('/dashboards/time-stats', {
        params: { period: period || 'daily', days: days || 30 }
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getAdminWorkload: async () => {
    try {
      const response = await api.get('/dashboards/workload');
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getSystemStatus: async () => {
    try {
      const response = await api.get('/dashboards/system-status');
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },
};

// Reports API
export const reportsApi = {
  generate: async (type: string, filters?: any) => {
    try {
      const response = await api.post('/reports/generate', { type, filters });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  export: async (type: string, format: string, filters?: any) => {
    try {
      const response = await api.post('/reports/export', { type, format, filters }, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Admin API
export const adminApi = {
  getAll: async (params?: any) => {
    try {
      const response = await api.get('/admins', { params });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },
  
  create: async (data: any) => {
    try {
      const response = await api.post('/admins', data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/admins/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
  
  delete: async (id: string) => {
    try {
      const response = await api.delete(`/admins/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// WhatsApp Sync API
export const wahaApi = {
  // Sync messages for a specific contact with upsert logic
  syncContact: async (data: {
    phone_number: string;
    limit?: number;
    upsert_mode?: boolean;
    sync_options?: {
      create_if_new: boolean;
      update_if_exists: boolean;
      skip_duplicates: boolean;
      conflict_resolution: 'server_wins' | 'client_wins' | 'merge';
      include_metadata?: boolean;
    };
  }) => {
    try {
      const response = await api.post('/sync/messages/contact', data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Bulk sync all active contacts with upsert logic
  syncAll: async (data: {
    limit?: number;
    upsert_mode?: boolean;
    sync_options?: {
      create_if_new: boolean;
      update_if_exists: boolean;
      skip_duplicates: boolean;
      conflict_resolution: 'server_wins' | 'client_wins' | 'merge';
      include_metadata?: boolean;
      batch_size?: number;
      parallel_sync?: boolean;
    };
    filters?: {
      active_sessions_only?: boolean;
      last_activity_hours?: number;
    };
  }) => {
    try {
      const response = await api.post('/sync/messages/all', data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Get sync status for a specific contact
  getSyncStatus: async (phoneNumber: string) => {
    try {
      const response = await api.get(`/sync/status/${phoneNumber}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Get all sync statuses
  getAllSyncStatuses: async () => {
    try {
      const response = await api.get('/sync/status/all');
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Get sync history/logs
  getSyncHistory: async (params?: { limit?: number; offset?: number; phone_number?: string }) => {
    try {
      const response = await api.get('/sync/history', { params });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Manually trigger conflict resolution for duplicate records
  resolveConflicts: async (data: {
    phone_number: string;
    conflict_resolution: 'server_wins' | 'client_wins' | 'merge';
    message_ids?: string[];
  }) => {
    try {
      const response = await api.post('/sync/resolve-conflicts', data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Get WAHA session status for sync validation
  getWahaStatus: async (sessionName: string) => {
    try {
      const response = await api.get(`/waha/sessions/${sessionName}/status`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Validate phone number before sync
  validatePhoneNumber: async (phoneNumber: string) => {
    try {
      const response = await api.post('/sync/validate-phone', { phone_number: phoneNumber });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Quick Reply API
export const quickReplyApi = {
  getAll: async (params?: { page?: number; per_page?: number; category?: string }) => {
    try {
      const response = await api.get('/quick-replies', { params });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/quick-replies/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  create: async (data: { title: string; content: string; category: string }) => {
    try {
      const response = await api.post('/quick-replies', data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  update: async (id: string, data: { title?: string; content?: string; category?: string }) => {
    try {
      const response = await api.put(`/quick-replies/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/quick-replies/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getByCategory: async (category: string) => {
    try {
      const response = await api.get(`/quick-replies/category/${category}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  incrementUsage: async (id: string) => {
    try {
      const response = await api.post(`/quick-replies/${id}/increment-usage`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Contact Notes API
export const contactNotesApi = {
  getByContact: async (contactId: string, params?: { page?: number; per_page?: number }) => {
    try {
      const response = await api.get(`/contact-notes/contact/${contactId}`, { params });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/contact-notes/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  create: async (data: { contact_id: string; content: string; type: 'public' | 'private' }) => {
    try {
      const response = await api.post('/contact-notes', data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  update: async (id: string, data: { content?: string; type?: 'public' | 'private' }) => {
    try {
      const response = await api.put(`/contact-notes/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/contact-notes/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Conversations API
export const conversationsApi = {
  getAll: async (params?: { page?: number; per_page?: number }) => {
    try {
      const response = await api.get('/conversations', { params });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/conversations/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  // New method to get conversation detail with all messages
  getConversationDetail: async (contactId: string, params?: {
    mode?: 'unified' | 'ticket-specific';
    page?: number;
    limit?: number;
    include_reactions?: boolean;
    include_receipts?: boolean;
    include_history?: boolean;
    ticket_id?: string;
  }) => {
    try {
      const response = await api.get(`/enhanced-messages/conversation/${contactId}`, { params });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },
};

// Draft Messages API
export const draftMessagesApi = {
  getByContact: async (contactId: string) => {
    try {
      const response = await api.get(`/draft-messages/contact/${contactId}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/draft-messages/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  create: async (data: { contact_id: string; content: string }) => {
    try {
      const response = await api.post('/draft-messages', data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  update: async (id: string, data: { content: string }) => {
    try {
      const response = await api.put(`/draft-messages/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/draft-messages/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  autoSave: async (contactId: string, content: string) => {
    try {
      const response = await api.post('/draft-messages/auto-save', { contact_id: contactId, content });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// --- Anti-Blocking API ---
export const antiBlockingApi = {
  validateMessage: async (payload: {
    contact_id: number;
    session_name: string;
    content: string;
    message_type: string;
    admin_id?: number;
  }): Promise<AntiBlockingValidationResult> => {
    const response = await api.post('/anti-blocking/validate', payload);
    return handleSingleResponse<AntiBlockingValidationResult>(response);
  },

  sendWithAntiBlocking: async (payload: {
    contact_id: number;
    session_name: string;
    content: string;
    message_type: string;
    admin_id: number;
    priority?: string;
  }): Promise<{ success: boolean; message_id?: string; delay_used?: string; risk_level?: string; }> => {
    const response = await api.post('/anti-blocking/send', payload);
    return handleSingleResponse(response);
  },

  getConfig: async (): Promise<AntiBlockingConfig> => {
    const response = await api.get('/anti-blocking/config');
    return handleSingleResponse<AntiBlockingConfig>(response);
  },

  updateConfig: async (config: Partial<AntiBlockingConfig>): Promise<AntiBlockingConfig> => {
    const response = await api.put('/anti-blocking/config', config);
    return handleSingleResponse<AntiBlockingConfig>(response);
  },

  getStats: async (): Promise<AntiBlockingStats> => {
    const response = await api.get('/anti-blocking/stats');
    return handleSingleResponse<AntiBlockingStats>(response);
  },

  getContactRisk: async (contactId: number): Promise<ContactRiskAssessment> => {
    const response = await api.get(`/anti-blocking/contact-risk/${contactId}`);
    return handleSingleResponse<ContactRiskAssessment>(response);
  },

  bulkSend: async (payload: BulkMessageRequest): Promise<BulkMessageResponse> => {
    const response = await api.post('/anti-blocking/bulk-send', payload);
    return handleSingleResponse<BulkMessageResponse>(response);
  },

  generateWaMeLink: async (payload: WaMeLinkRequest): Promise<WaMeLinkResponse> => {
    const response = await api.post('/anti-blocking/wame-link', payload);
    return handleSingleResponse<WaMeLinkResponse>(response);
  },
};

export default api; 