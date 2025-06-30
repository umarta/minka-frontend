// Debug utilities for authentication
import { tokenManager } from './api';
import { useAuthStore } from './stores/auth';

// Global debug object for browser console
declare global {
  interface Window {
    authDebug: typeof authDebug;
  }
}

export const authDebug = {
  // Check current auth state
  checkAuthState: () => {
    const state = useAuthStore.getState();
    console.group('🔍 Auth State Debug');
    console.log('User:', state.user);
    console.log('Is Authenticated:', state.isAuthenticated);
    console.log('Is Loading:', state.isLoading);
    console.log('Error:', state.error);
    console.groupEnd();
    return state;
  },

  // Check tokens in localStorage
  checkTokens: () => {
    const token = tokenManager.getToken();
    const refreshToken = tokenManager.getRefreshToken();
    
    console.group('🔑 Token Debug');
    console.log('Auth Token exists:', !!token);
    console.log('Auth Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'null');
    console.log('Refresh Token exists:', !!refreshToken);
    console.log('Refresh Token (first 20 chars):', refreshToken ? refreshToken.substring(0, 20) + '...' : 'null');
    
    // Try to decode JWT to see expiry
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        console.log('Token expires at:', new Date(payload.exp * 1000));
        console.log('Token is expired:', Date.now() > payload.exp * 1000);
      } catch (e) {
        console.log('Could not decode token:', e);
      }
    }
    console.groupEnd();
    
    return { token, refreshToken };
  },

  // Clear all tokens and state
  clearAuth: () => {
    console.log('🧹 Clearing all auth data...');
    tokenManager.removeTokens();
    useAuthStore.getState().logout();
    console.log('✅ Auth data cleared');
  },

  // Force token refresh
  refreshToken: async () => {
    console.log('🔄 Forcing token refresh...');
    try {
      await useAuthStore.getState().refreshToken();
      console.log('✅ Token refreshed successfully');
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
    }
  },

  // Force auth initialization
  initAuth: async () => {
    console.log('🔄 Forcing auth initialization...');
    try {
      await useAuthStore.getState().initializeAuth();
      console.log('✅ Auth initialized successfully');
    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
    }
  },

  // Test API call with current token
  testApiCall: async () => {
    console.log('📞 Testing API call with current token...');
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${baseURL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${tokenManager.getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      return { status: response.status, data };
    } catch (error) {
      console.error('❌ API call failed:', error);
      return { error };
    }
  },

  // Show all debug info
  showAll: () => {
    authDebug.checkAuthState();
    authDebug.checkTokens();
  }
};

// Make debug available globally in browser
if (typeof window !== 'undefined') {
  window.authDebug = authDebug;
  console.log('🔧 Auth debug tools available at window.authDebug');
  console.log('Available methods:');
  console.log('- authDebug.showAll() - Show all auth info');
  console.log('- authDebug.checkAuthState() - Check current auth state');
  console.log('- authDebug.checkTokens() - Check tokens in localStorage');
  console.log('- authDebug.clearAuth() - Clear all auth data');
  console.log('- authDebug.refreshToken() - Force token refresh');
  console.log('- authDebug.initAuth() - Force auth initialization');
  console.log('- authDebug.testApiCall() - Test API call with current token');
} 