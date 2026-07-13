'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import type { ChatMessage } from '@/types/chat';

export function useSocket() {
  const socket = getSocket();
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const {
    addMessage,
    updateMessage,
    removeMessage,
    setIsPartnerOnline,
    setPartnerLastSeen,
    setPartnerTyping,
  } = useChatStore();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      socket.emit('joinConversation', 'main');
    });

    socket.on('receiveMessage', (message: ChatMessage) => {
      addMessage(message);
      socket.emit('messageDelivered', { messageId: message._id, conversationId: 'main' });
    });

    socket.on('messageUpdated', (message: ChatMessage) => {
      updateMessage(message._id, message);
    });

    socket.on('messageDeleted', (data: { messageId: string; deletedFor: string }) => {
      if (data.deletedFor === 'both') {
        removeMessage(data.messageId);
      } else {
        updateMessage(data.messageId, { isDeleted: true });
      }
    });

    socket.on('messageSeen', (data: { messageId: string }) => {
      updateMessage(data.messageId, { seen: true });
    });

    socket.on('messageDelivered', (data: { messageId: string }) => {
      updateMessage(data.messageId, { delivered: true });
    });

    socket.on('messageReactionUpdated', (data: { messageId: string; reactions: { sender: string; emoji: string }[] }) => {
      updateMessage(data.messageId, { reactions: data.reactions });
    });

    socket.on('partnerOnline', () => {
      setIsPartnerOnline(true);
    });

    socket.on('partnerOffline', (data: { lastSeen: string }) => {
      setIsPartnerOnline(false);
      setPartnerLastSeen(data.lastSeen);
    });

    socket.on('partnerTyping', () => {
      setPartnerTyping(true);
    });

    socket.on('partnerStopTyping', () => {
      setPartnerTyping(false);
    });

    socket.on('connect_error', () => {
      setIsPartnerOnline(false);
    });

    return () => {
      socket.emit('leaveConversation', 'main');
      socket.off('connect');
      socket.off('receiveMessage');
      socket.off('messageUpdated');
      socket.off('messageDeleted');
      socket.off('messageSeen');
      socket.off('messageDelivered');
      socket.off('messageReactionUpdated');
      socket.off('partnerOnline');
      socket.off('partnerOffline');
      socket.off('partnerTyping');
      socket.off('partnerStopTyping');
      socket.off('connect_error');
    };
  }, [activeProfile, addMessage, updateMessage, removeMessage, setIsPartnerOnline, setPartnerLastSeen, setPartnerTyping]);

  const sendMessage = useCallback((data: { content: string; type?: string; replyTo?: string; attachments?: any[] }) => {
    socket.emit('sendMessage', {
      conversationId: 'main',
      sender: activeProfile || 'me',
      ...data,
    });
  }, [activeProfile]);

  const startTyping = useCallback(() => {
    socket.emit('typing', { conversationId: 'main', sender: activeProfile || 'me' });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { conversationId: 'main', sender: activeProfile || 'me' });
    }, 3000);
  }, [activeProfile]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stopTyping', { conversationId: 'main', sender: activeProfile || 'me' });
  }, [activeProfile]);

  const markSeen = useCallback((messageId: string) => {
    socket.emit('messageSeen', { messageId, conversationId: 'main' });
  }, []);

  const sendReaction = useCallback((messageId: string, emoji: string) => {
    socket.emit('addReaction', { messageId, conversationId: 'main', sender: activeProfile || 'me', emoji });
  }, [activeProfile]);

  const editMessage = useCallback((messageId: string, content: string) => {
    socket.emit('editMessage', { messageId, conversationId: 'main', content });
  }, []);

  const deleteMessage = useCallback((messageId: string, deleteFor: 'me' | 'both') => {
    socket.emit('deleteMessage', { messageId, conversationId: 'main', deleteFor });
  }, []);

  return { sendMessage, startTyping, stopTyping, markSeen, sendReaction, editMessage, deleteMessage, socket };
}
