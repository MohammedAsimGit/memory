import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  activeProfile: 'me' | 'her' | null;
  rememberProfile: boolean;
  setAuth: (token: string) => void;
  logout: () => void;
  setActiveProfile: (profile: 'me' | 'her') => void;
  setRememberProfile: (remember: boolean) => void;
  clearProfile: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      activeProfile: null,
      rememberProfile: false,
      setAuth: (token: string) => set({ isAuthenticated: true, token }),
      logout: () => set({
        isAuthenticated: false,
        token: null,
        activeProfile: null,
      }),
      setActiveProfile: (profile: 'me' | 'her') => set({ activeProfile: profile }),
      setRememberProfile: (remember: boolean) => set({ rememberProfile: remember }),
      clearProfile: () => set({ activeProfile: null }),
    }),
    { name: 'our-story-auth' }
  )
);
