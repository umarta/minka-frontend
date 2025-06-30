import { create } from 'zustand';
import { Session, SessionStatus } from '@/types';
import { sessionsApi } from '@/lib/api';
import { getWebSocketManager } from '@/lib/websocket';

// Debounce utility to prevent rapid successive calls
let fetchTimeout: NodeJS.Timeout | null = null;

interface SessionState {
  sessions: Session[];
  selectedSession: Session | null;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  qrCodes: Record<string, string>; // sessionId -> qr code data
  
  // Actions
  fetchSessions: () => Promise<void>;
  createSession: (data: Partial<Session>) => Promise<Session | null>;
  updateSession: (id: string, data: Partial<Session>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  startSession: (sessionName: string) => Promise<void>;
  stopSession: (sessionName: string) => Promise<void>;
  restartSession: (sessionName: string) => Promise<void>;
  logoutSession: (sessionName: string) => Promise<void>;
  syncSessions: () => Promise<void>;
  getQRCode: (sessionName: string) => Promise<string | null>;
  getSessionStatus: (sessionName: string) => Promise<void>;
  selectSession: (session: Session | null) => void;
  
  // Real-time updates
  updateSessionStatus: (sessionId: string, status: SessionStatus) => void;
  updateQRCode: (sessionId: string, qrCode: string) => void;
  
  // Helpers
  clearError: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  selectedSession: null,
  isLoading: false,
  isCreating: false,
  error: null,
  qrCodes: {},

  fetchSessions: async () => {
    const { isLoading } = get();
    
    // Clear any pending timeout
    if (fetchTimeout) {
      clearTimeout(fetchTimeout);
      fetchTimeout = null;
    }
    
    // Prevent duplicate calls
    if (isLoading) {
      console.log('Sessions already being fetched, skipping duplicate call');
      return;
    }
    
    // Debounce rapid successive calls
    return new Promise<void>((resolve) => {
      fetchTimeout = setTimeout(async () => {
        const { isLoading: currentLoading } = get();
        
        // Double-check loading state after timeout
        if (currentLoading) {
          console.log('Sessions fetch already in progress after timeout, skipping');
          resolve();
          return;
        }
        
        set({ isLoading: true, error: null });
        try {
          console.log('Fetching sessions from API...');
          const sessions = await sessionsApi.getAll() as Session[];
          console.log('Sessions fetched successfully:', sessions?.length || 0);
          set({ sessions: sessions || [], isLoading: false });
        } catch (error) {
          console.error('Failed to fetch sessions:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch sessions',
            isLoading: false 
          });
        } finally {
          fetchTimeout = null;
          resolve();
        }
      }, 100); // 100ms debounce
    });
  },

  createSession: async (data: Partial<Session>) => {
    set({ isCreating: true, error: null });
    try {
      const newSession = await sessionsApi.create(data) as Session;
      const currentSessions = get().sessions;
      set({ 
        sessions: [...currentSessions, newSession],
        isCreating: false 
      });
      return newSession;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create session',
        isCreating: false 
      });
      return null;
    }
  },

  updateSession: async (id: string, data: Partial<Session>) => {
    set({ error: null });
    try {
      await sessionsApi.update(id, data);
      const currentSessions = get().sessions;
      const updatedSessions = currentSessions.map(session => 
        session.id === id ? { ...session, ...data } : session
      );
      set({ sessions: updatedSessions });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update session'
      });
    }
  },

  deleteSession: async (id: string) => {
    set({ error: null });
    try {
      await sessionsApi.delete(id);
      const currentSessions = get().sessions;
      set({ 
        sessions: currentSessions.filter(session => session.id !== id)
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete session'
      });
    }
  },

  startSession: async (sessionName: string) => {
    set({ error: null });
    try {
      await sessionsApi.start(sessionName);
      // Update session status optimistically
      const currentSessions = get().sessions;
      const updatedSessions = currentSessions.map(session => 
        session.session_name === sessionName 
          ? { ...session, status: 'starting' as SessionStatus }
          : session
      );
      set({ sessions: updatedSessions });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to start session'
      });
    }
  },

  stopSession: async (sessionName: string) => {
    set({ error: null });
    try {
      await sessionsApi.stop(sessionName);
      // Update session status optimistically
      const currentSessions = get().sessions;
      const updatedSessions = currentSessions.map(session => 
        session.session_name === sessionName 
          ? { ...session, status: 'stopped' as SessionStatus }
          : session
      );
      set({ sessions: updatedSessions });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to stop session'
      });
    }
  },

  restartSession: async (sessionName: string) => {
    set({ error: null });
    try {
      await sessionsApi.restart(sessionName);
      // Update session status optimistically
      const currentSessions = get().sessions;
      const updatedSessions = currentSessions.map(session => 
        session.session_name === sessionName 
          ? { ...session, status: 'starting' as SessionStatus }
          : session
      );
      set({ sessions: updatedSessions });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to restart session'
      });
    }
  },

  logoutSession: async (sessionName: string) => {
    set({ error: null });
    try {
      await sessionsApi.logout(sessionName);
      // Update session status optimistically
      const currentSessions = get().sessions;
      const updatedSessions = currentSessions.map(session => 
        session.session_name === sessionName 
          ? { ...session, status: 'stopped' as SessionStatus, phone_number: undefined }
          : session
      );
      set({ sessions: updatedSessions });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to logout session'
      });
    }
  },

  syncSessions: async () => {
    set({ error: null });
    try {
      await sessionsApi.sync();
      // Refresh sessions after sync
      await get().fetchSessions();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to sync sessions'
      });
    }
  },

  getQRCode: async (sessionName: string) => {
    set({ error: null });
    try {
      const response = await sessionsApi.getQR(sessionName) as any;
      const qrCode = response?.qr_code || response;
      
      // Find session by name to get ID
      const session = get().sessions.find(s => s.session_name === sessionName);
      if (session && qrCode) {
        const currentQRCodes = get().qrCodes;
        set({ qrCodes: { ...currentQRCodes, [session.id]: qrCode } });
      }
      
      return qrCode || null;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get QR code'
      });
      return null;
    }
  },

  getSessionStatus: async (sessionName: string) => {
    set({ error: null });
    try {
      const statusData = await sessionsApi.getStatus(sessionName) as Partial<Session>;
      // Update session with latest status
      const currentSessions = get().sessions;
      const updatedSessions = currentSessions.map(session => 
        session.session_name === sessionName 
          ? { ...session, ...(statusData || {}) }
          : session
      );
      set({ sessions: updatedSessions });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get session status'
      });
    }
  },

  selectSession: (session: Session | null) => {
    set({ selectedSession: session });
  },

  updateSessionStatus: (sessionId: string, status: SessionStatus) => {
    const currentSessions = get().sessions;
    const updatedSessions = currentSessions.map(session => 
      session.id === sessionId ? { ...session, status } : session
    );
    set({ sessions: updatedSessions });
  },

  updateQRCode: (sessionId: string, qrCode: string) => {
    const currentQRCodes = get().qrCodes;
    set({ qrCodes: { ...currentQRCodes, [sessionId]: qrCode } });
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    sessions: [],
    selectedSession: null,
    isLoading: false,
    isCreating: false,
    error: null,
    qrCodes: {},
  }),
}));

// Setup WebSocket listeners
if (typeof window !== 'undefined') {
  const wsManager = getWebSocketManager();
  if (wsManager) {
    // Listen for session status updates
    wsManager.on('session_status_update', (data) => {
      const { sessionId, status } = data;
      useSessionStore.getState().updateSessionStatus(sessionId, status);
    });

    // Listen for QR code updates
    wsManager.on('qr_code_update', (data) => {
      const { sessionId, qrCode } = data;
      useSessionStore.getState().updateQRCode(sessionId, qrCode);
    });
  }
} 