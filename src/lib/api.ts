import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, PaginatedResponse } from '@/types';

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
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
      tokenManager.removeTokens();
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  refreshToken: async () => {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  changePassword: async (data: { current_password: string; new_password: string }) => {
    try {
      const response = await api.post('/auth/change-password', data);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  updateProfile: async (data: any) => {
    try {
      const response = await api.put('/admin/profile', data);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
};

// Contacts API
export const contactsApi = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string; label?: string }) => {
    try {
      const response = await api.get('/contacts', { params });
      return handleApiResponse<PaginatedResponse<any>>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await api.get(`/contacts/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  create: async (data: any) => {
    try {
      const response = await api.post('/contacts', data);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/contacts/${id}`, data);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  delete: async (id: string) => {
    try {
      const response = await api.delete(`/contacts/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  block: async (id: string) => {
    try {
      const response = await api.post(`/contacts/${id}/block`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  unblock: async (id: string) => {
    try {
      const response = await api.post(`/contacts/${id}/unblock`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },

  search: async (query: string, params?: any) => {
    try {
      const response = await api.get('/contacts/search', { params: { ...params, search: query } });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },

  bulkUpdate: async (ids: string[], data: any) => {
    try {
      const response = await api.put('/contacts/bulk', { ids, data });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },

  bulkDelete: async (ids: string[]) => {
    try {
      const response = await api.delete('/contacts/bulk', { data: { ids } });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },

  addLabel: async (contactId: string, labelId: string) => {
    try {
      const response = await api.post(`/contacts/${contactId}/labels/${labelId}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },

  removeLabel: async (contactId: string, labelId: string) => {
    try {
      const response = await api.delete(`/contacts/${contactId}/labels/${labelId}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
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
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
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
    }
  },
};

// Labels API
export const labelsApi = {
  getAll: async () => {
    try {
      const response = await api.get('/labels');
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },

  create: async (data: any) => {
    try {
      const response = await api.post('/labels', data);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },

  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/labels/${id}`, data);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/labels/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
};

// Admins API
export const adminsApi = {
  getAll: async () => {
    try {
      const response = await api.get('/admin/users');
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
};

// Sessions API
export const sessionsApi = {
  getAll: async () => {
    try {
      const response = await api.get('/sessions');
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await api.get(`/sessions/by-id/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  getByName: async (name: string) => {
    try {
      const response = await api.get(`/sessions/by-name/${name}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  create: async (data: any) => {
    try {
      const response = await api.post('/sessions', data);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/sessions/by-id/${id}`, data);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  delete: async (id: string) => {
    try {
      const response = await api.delete(`/sessions/by-id/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  start: async (name: string) => {
    try {
      const response = await api.post(`/sessions/by-name/${name}/start`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  stop: async (name: string) => {
    try {
      const response = await api.post(`/sessions/by-name/${name}/stop`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  restart: async (name: string) => {
    try {
      const response = await api.post(`/sessions/by-name/${name}/restart`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  getQR: async (name: string) => {
    try {
      const response = await api.get(`/sessions/by-name/${name}/qr`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  getStatus: async (name: string) => {
    try {
      const response = await api.get(`/sessions/by-name/${name}/status`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },

  logout: async (name: string) => {
    try {
      const response = await api.post(`/sessions/by-name/${name}/logout`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },

  sync: async () => {
    try {
      const response = await api.post('/sessions/sync');
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },

  getActiveCount: async () => {
    try {
      const response = await api.get('/sessions/active/count');
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
};

// Messages API
export const messagesApi = {
  getByContact: async (contactId: string, params?: { page?: number; per_page?: number }) => {
    try {
      const response = await api.get(`/messages/contact/${contactId}`, { params });
      return handleApiResponse<PaginatedResponse<any>>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  send: async (data: any) => {
    try {
      const response = await api.post('/messages/send', data);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  sendMedia: async (data: FormData) => {
    try {
      const response = await api.post('/messages/send-media', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  markAsRead: async (id: string) => {
    try {
      const response = await api.post(`/messages/${id}/read`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  search: async (query: string, params?: any) => {
    try {
      const response = await api.get('/messages/search', { params: { query, ...params } });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
};

// Tickets API
export const ticketsApi = {
  getAll: async (params?: any) => {
    try {
      const response = await api.get('/tickets', { params });
      return handleApiResponse<PaginatedResponse<any>>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await api.get(`/tickets/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  create: async (data: any) => {
    try {
      const response = await api.post('/tickets', data);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/tickets/${id}`, data);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  assign: async (id: string, adminId: string) => {
    try {
      const response = await api.post(`/tickets/${id}/assign`, { admin_id: adminId });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  close: async (id: string, resolution?: string) => {
    try {
      const response = await api.post(`/tickets/${id}/close`, { resolution });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  getAgentPerformance: async (params?: any) => {
    try {
      const response = await api.get('/dashboard/agent-performance', { params });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  getMessageMetrics: async (params?: any) => {
    try {
      const response = await api.get('/dashboard/message-metrics', { params });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  getResponseTimeMetrics: async (params?: any) => {
    try {
      const response = await api.get('/dashboard/response-time', { params });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
};

// Reports API
export const reportsApi = {
  generate: async (type: string, filters?: any) => {
    try {
      const response = await api.post('/reports/generate', { type, filters });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
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
    }
  },
};

// Admin API
export const adminApi = {
  getAll: async (params?: any) => {
    try {
      const response = await api.get('/admins', { params });
      return handleApiResponse<PaginatedResponse<any>>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  create: async (data: any) => {
    try {
      const response = await api.post('/admins', data);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/admins/${id}`, data);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
  
  delete: async (id: string) => {
    try {
      const response = await api.delete(`/admins/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
    }
  },
};

export default api; 