import { create } from 'zustand';
import type { ChatMessage, ChatState } from '@/types/chat';

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  isLoading: true,
  isPartnerOnline: false,
  partnerLastSeen: null,
  partnerTyping: false,
  myTyping: false,
  searchQuery: '',
  searchResults: [],
  replyingTo: null,
  editingMessage: null,
  selectedMessage: null,
  showSearch: false,
  showMenu: false,
  showImageViewer: false,
  viewerImages: [],
  viewerIndex: 0,

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => {
    if (s.messages.find((m) => m._id === message._id)) return s;
    return { messages: [...s.messages, message] };
  }),
  updateMessage: (id, updates) => set((s) => ({
    messages: s.messages.map((m) => m._id === id ? { ...m, ...updates } : m),
  })),
  removeMessage: (id) => set((s) => ({
    messages: s.messages.filter((m) => m._id !== id),
  })),
  setIsLoading: (v) => set({ isLoading: v }),
  setIsPartnerOnline: (v) => set({ isPartnerOnline: v }),
  setPartnerLastSeen: (v) => set({ partnerLastSeen: v }),
  setPartnerTyping: (v) => set({ partnerTyping: v }),
  setMyTyping: (v) => set({ myTyping: v }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchResults: (r) => set({ searchResults: r }),
  setReplyingTo: (m) => set({ replyingTo: m, editingMessage: null }),
  setEditingMessage: (m) => set({ editingMessage: m, replyingTo: null }),
  setSelectedMessage: (m) => set({ selectedMessage: m }),
  setShowSearch: (v) => set({ showSearch: v }),
  setShowMenu: (v) => set({ showMenu: v }),
  openImageViewer: (images, index) => set({ showImageViewer: true, viewerImages: images, viewerIndex: index }),
  closeImageViewer: () => set({ showImageViewer: false, viewerImages: [], viewerIndex: 0 }),
}));
