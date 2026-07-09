import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdding: boolean;
  setIsAdding: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),
      isAdding: false,
      setIsAdding: (v) => set({ isAdding: v }),
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),
      darkMode: false,
      toggleDarkMode: () =>
        set((s) => {
          const next = !s.darkMode;
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', next);
          }
          return { darkMode: next };
        }),
      setDarkMode: (v) =>
        set(() => {
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', v);
          }
          return { darkMode: v };
        }),
    }),
    {
      name: 'our-story-settings',
      partialize: (state) => ({ darkMode: state.darkMode }),
    }
  )
);
