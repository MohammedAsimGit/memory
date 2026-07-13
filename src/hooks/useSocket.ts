'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import type { ChatMessage } from '@/types/chat';

let socketConnected = false;

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
    const handleConnect = () => {
      socketConnected = true;
      socket.emit('joinConversation', 'main');
    };

    const handleDisconnect = () => {
      socketConnected = false;
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

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
      socketConnected = false;
      setIsPartnerOnline(false);
    });

    socket.connect();

    return () => {
      socket.emit('leaveConversation', 'main');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
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

  const sendMessage = useCallback(async (data: { content: string; type?: string; replyTo?: string; attachments?: any[] }) => {
    const sender = activeProfile || 'me';
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const optimisticMessage: ChatMessage = {
      _id: tempId,
      conversationId: 'main',
      sender,
      content: data.content || '',
      type: (data.type as any) || 'text',
      replyTo: data.replyTo,
      reactions: [],
      isEdited: false,
      isDeleted: false,
      deletedFor: [],
      seen: false,
      delivered: false,
      pinned: false,
      favorited: false,
      attachments: data.attachments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addMessage(optimisticMessage);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender,
          content: data.content || '',
          type: data.type || 'text',
          replyTo: data.replyTo,
          attachments: data.attachments || [],
        }),
      });

      if (!res.ok) throw new Error('Failed to send');

      const savedMessage: ChatMessage = await res.json();

      updateMessage(tempId, {
        _id: savedMessage._id,
        createdAt: savedMessage.createdAt,
        updatedAt: savedMessage.updatedAt,
      });

      if (socketConnected) {
        socket.emit('sendMessage', {
          conversationId: 'main',
          sender,
          ...data,
          _id: savedMessage._id,
        });
      }

      return savedMessage;
    } catch (err) {
      removeMessage(tempId);
      throw err;
    }
  }, [activeProfile, addMessage, updateMessage, removeMessage]);

  const startTyping = useCallback(() => {
    if (!socketConnected) return;
    socket.emit('typing', { conversationId: 'main', sender: activeProfile || 'me' });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { conversationId: 'main', sender: activeProfile || 'me' });
    }, 3000);
  }, [activeProfile]);

  const stopTyping = useCallback(() => {
    if (!socketConnected) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stopTyping', { conversationId: 'main', sender: activeProfile || 'me' });
  }, [activeProfile]);

  const markSeen = useCallback((messageId: string) => {
    if (!socketConnected) return;
    socket.emit('messageSeen', { messageId, conversationId: 'main' });
  }, []);

  const sendReaction = useCallback(async (messageId: string, emoji: string) => {
    const sender = activeProfile || 'me';

    const msg = useChatStore.getState().messages.find((m) => m._id === messageId);
    if (!msg) return;

    const existingIdx = msg.reactions.findIndex((r) => r.sender === sender);
    let newReactions = [...msg.reactions];
    if (existingIdx >= 0) {
      if (newReactions[existingIdx].emoji === emoji) {
        newReactions.splice(existingIdx, 1);
      } else {
        newReactions[existingIdx] = { sender, emoji };
      }
    } else {
      newReactions.push({ sender, emoji });
    }
    updateMessage(messageId, { reactions: newReactions });

    try {
      await fetch(`/api/chat/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactions: newReactions }),
      });
    } catch (err) {
      updateMessage(messageId, { reactions: msg.reactions });
    }
  }, [activeProfile, updateMessage]);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    const msg = useChatStore.getState().messages.find((m) => m._id === messageId);
    if (!msg) return;

    updateMessage(messageId, { content, isEdited: true });

    try {
      await fetch(`/api/chat/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, isEdited: true }),
      });

      if (socketConnected) {
        socket.emit('editMessage', { messageId, conversationId: 'main', content });
      }
    } catch (err) {
      updateMessage(messageId, { content: msg.content, isEdited: msg.isEdited });
    }
  }, [updateMessage]);

  const deleteMessage = useCallback(async (messageId: string, deleteFor: 'me' | 'both') => {
    const msg = useChatStore.getState().messages.find((m) => m._id === messageId);
    if (!msg) return;

    if (deleteFor === 'both') {
      removeMessage(messageId);
    } else {
      updateMessage(messageId, { isDeleted: true });
    }

    try {
      await fetch(`/api/chat/${messageId}?deleteFor=${deleteFor}`, {
        method: 'DELETE',
      });

      if (socketConnected) {
        socket.emit('deleteMessage', { messageId, conversationId: 'main', deleteFor });
      }
    } catch (err) {
      if (deleteFor === 'both') {
        addMessage(msg);
      } else {
        updateMessage(messageId, { isDeleted: false });
      }
    }
  }, [removeMessage, updateMessage, addMessage]);

  return { sendMessage, startTyping, stopTyping, markSeen, sendReaction, editMessage, deleteMessage, socket };
}
