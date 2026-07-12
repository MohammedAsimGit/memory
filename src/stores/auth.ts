import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  activeProfile: 'me' | 'her' | null;
  rememberProfile: boolean;
  deviceToken: string | null;
  deviceId: string | null;
  deviceName: string | null;
  isDeviceTrusted: boolean;
  setAuth: (token: string) => void;
  logout: () => void;
  setActiveProfile: (profile: 'me' | 'her') => void;
  setRememberProfile: (remember: boolean) => void;
  clearProfile: () => void;
  setDeviceToken: (token: string, deviceId?: string, deviceName?: string) => void;
  setDeviceTrusted: (trusted: boolean) => void;
  clearDevice: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      activeProfile: null,
      rememberProfile: false,
      deviceToken: null,
      deviceId: null,
      deviceName: null,
      isDeviceTrusted: false,
      setAuth: (token: string) => set({ isAuthenticated: true, token }),
      logout: () => set({
        isAuthenticated: false,
        token: null,
        activeProfile: null,
        deviceToken: null,
        deviceId: null,
        deviceName: null,
        isDeviceTrusted: false,
      }),
      setActiveProfile: (profile: 'me' | 'her') => set({ activeProfile: profile }),
      setRememberProfile: (remember: boolean) => set({ rememberProfile: remember }),
      clearProfile: () => set({ activeProfile: null }),
      setDeviceToken: (token: string, deviceId?: string, deviceName?: string) => set({
        deviceToken: token,
        deviceId: deviceId || null,
        deviceName: deviceName || null,
        isDeviceTrusted: true,
      }),
      setDeviceTrusted: (trusted: boolean) => set({ isDeviceTrusted: trusted }),
      clearDevice: () => set({
        deviceToken: null,
        deviceId: null,
        deviceName: null,
        isDeviceTrusted: false,
      }),
    }),
    { name: 'our-story-auth' }
  )
);
