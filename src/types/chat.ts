export interface ChatMessage {
  _id: string;
  conversationId: string;
  sender: 'me' | 'her';
  content: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'document' | 'emoji';
  replyTo?: string;
  reactions: { sender: string; emoji: string }[];
  isEdited: boolean;
  isDeleted: boolean;
  deletedFor: string[];
  seen: boolean;
  delivered: boolean;
  pinned: boolean;
  favorited: boolean;
  attachments: { url: string; type: string; name?: string; size?: number; duration?: number; thumbnail?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatTyping {
  conversationId: string;
  sender: 'me' | 'her';
  isTyping: boolean;
  lastTyped: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isPartnerOnline: boolean;
  partnerLastSeen: string | null;
  partnerTyping: boolean;
  myTyping: boolean;
  searchQuery: string;
  searchResults: ChatMessage[];
  replyingTo: ChatMessage | null;
  editingMessage: ChatMessage | null;
  selectedMessage: ChatMessage | null;
  showSearch: boolean;
  showMenu: boolean;
  showImageViewer: boolean;
  viewerImages: string[];
  viewerIndex: number;
  setMessages: (messages: ChatMessage[]) => void;
  prependMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  setIsLoading: (v: boolean) => void;
  setIsPartnerOnline: (v: boolean) => void;
  setPartnerLastSeen: (v: string | null) => void;
  setPartnerTyping: (v: boolean) => void;
  setMyTyping: (v: boolean) => void;
  setSearchQuery: (q: string) => void;
  setSearchResults: (r: ChatMessage[]) => void;
  setReplyingTo: (m: ChatMessage | null) => void;
  setEditingMessage: (m: ChatMessage | null) => void;
  setSelectedMessage: (m: ChatMessage | null) => void;
  setShowSearch: (v: boolean) => void;
  setShowMenu: (v: boolean) => void;
  openImageViewer: (images: string[], index: number) => void;
  closeImageViewer: () => void;
}
