import { create } from 'zustand';

interface AppState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdding: boolean;
  setIsAdding: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isAdding: false,
  setIsAdding: (v) => set({ isAdding: v }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  darkMode: false,
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
}));
