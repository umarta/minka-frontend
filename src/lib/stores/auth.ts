import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResponse } from '@/types';
import { authApi, tokenManager } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (data: { current_password: string; new_password: string }) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authApi.login(credentials) as AuthResponse;
          console.log('🔓 Login response:', response);
          
          // Store tokens
          tokenManager.setToken(response.token);
          if (response.refresh_token) {
            tokenManager.setRefreshToken(response.refresh_token);
          }
          
          // Handle both user and admin response structures
          const userData = response.user || response.admin;
          console.log('👤 User data:', userData);
          
          // Update state
          set({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          console.log('✅ Login successful, auth state updated');
        } catch (error) {
          console.error('❌ Login failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      logout: () => {
        // Clear tokens
        tokenManager.removeTokens();
        
        // Reset state
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        });

        // Call logout API in background (non-blocking)
        authApi.logout().catch(console.error);
      },

             refreshToken: async () => {
         try {
           const response = await authApi.refreshToken() as AuthResponse;
           tokenManager.setToken(response.token);
           
           // Optionally update user data if included in response
           if (response.user) {
             set({ user: response.user });
           }
         } catch (error) {
           // If refresh fails, logout user
           get().logout();
           throw error;
         }
       },

             updateProfile: async (data) => {
         try {
           set({ isLoading: true, error: null });
           
           const updatedUser = await authApi.updateProfile(data) as User;
           
           set({
             user: updatedUser,
             isLoading: false,
             error: null,
           });
         } catch (error) {
           set({
             error: error instanceof Error ? error.message : 'Profile update failed',
             isLoading: false,
           });
           throw error;
         }
       },

      changePassword: async (data) => {
        try {
          set({ isLoading: true, error: null });
          
          await authApi.changePassword(data);
          
          set({
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Password change failed',
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      checkAuth: async () => {
        const token = tokenManager.getToken();
        
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

                 try {
           set({ isLoading: true });
           
           const user = await authApi.getProfile() as User;
           
           set({
             user,
             isAuthenticated: true,
             isLoading: false,
             error: null,
           });
         } catch {
           // If profile fetch fails, logout user
           get().logout();
           set({ isLoading: false });
         }
      },

      initializeAuth: async () => {
        const token = tokenManager.getToken();
        console.log('🔄 Initializing auth, token exists:', !!token);
        
        if (!token) {
          console.log('❌ No token found, setting unauthenticated state');
          set({ 
            isAuthenticated: false, 
            user: null, 
            isLoading: false,
            error: null
          });
          return;
        }

        try {
          set({ isLoading: true, error: null });
          console.log('📞 Fetching user profile to verify token...');
          
          // Verify token is valid by fetching user profile
          const user = await authApi.getProfile() as User;
          console.log('✅ Profile fetched successfully:', user);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          console.log('✅ Auth initialized successfully');
        } catch (error) {
          // If profile fetch fails, clear auth state and tokens
          console.error('❌ Auth initialization failed:', error);
          tokenManager.removeTokens();
          set({ 
            isAuthenticated: false, 
            user: null, 
            isLoading: false,
            error: null
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors for easier state access
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    updateProfile,
    changePassword,
    clearError,
    checkAuth,
    initializeAuth,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    updateProfile,
    changePassword,
    clearError,
    checkAuth,
    initializeAuth,
  };
};

// Helper selectors
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error); 