'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { getSocket, onConnectionStateChange } from '@/lib/socket';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import type { ChatMessage } from '@/types/chat';

const POLL_INTERVAL = 2000;

export function useSocket() {
  const socket = getSocket();
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const [connectionMode, setConnectionMode] = useState<'socket' | 'polling' | 'connecting'>('connecting');
  const [isConnected, setIsConnected] = useState(false);
  const {
    messages,
    addMessage,
    updateMessage,
    removeMessage,
    setIsPartnerOnline,
    setPartnerLastSeen,
    setPartnerTyping,
  } = useChatStore();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollRef = useRef<string>(new Date().toISOString());
  const mySender = activeProfile || 'me';

  useEffect(() => {
    const unsub = onConnectionStateChange((state) => {
      if (state === 'connected') {
        setConnectionMode('socket');
        setIsConnected(true);
        stopPolling();
      } else if (state === 'connecting') {
        setConnectionMode('connecting');
        setIsConnected(false);
      } else {
        setIsConnected(false);
        setConnectionMode('polling');
        startPolling();
      }
    });

    return () => {
      unsub();
      stopPolling();
    };
  }, []);

  useEffect(() => {
    const handleConnect = () => {
      socket.emit('joinConversation', {
        conversationId: 'main',
        sender: mySender,
      });
    };

    socket.on('connect', handleConnect);

    socket.on('messageSaved', (data: { tempId: string; _id: string; createdAt: string; updatedAt: string }) => {
      const currentMessages = useChatStore.getState().messages;
      const tempMsg = currentMessages.find((m) => m._id === data.tempId);
      if (tempMsg) {
        updateMessage(data.tempId, {
          _id: data._id,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      }
    });

    socket.on('receiveMessage', (message: ChatMessage) => {
      const currentMessages = useChatStore.getState().messages;
      if (!currentMessages.find((m) => m._id === message._id)) {
        addMessage(message);
      }
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

    socket.on('onlineUsers', (data: { senders: string[] }) => {
      const partnerOnline = data.senders.some((s) => s !== mySender);
      setIsPartnerOnline(partnerOnline);
    });

    socket.on('userOnline', (data: { sender: string }) => {
      if (data.sender !== mySender) setIsPartnerOnline(true);
    });

    socket.on('userOffline', (data: { sender: string; lastSeen: string }) => {
      if (data.sender !== mySender) {
        setIsPartnerOnline(false);
        setPartnerLastSeen(data.lastSeen);
      }
    });

    socket.on('partnerTyping', (data: { sender: string }) => {
      if (data.sender !== mySender) setPartnerTyping(true);
    });

    socket.on('partnerStopTyping', (data: { sender: string }) => {
      if (data.sender !== mySender) setPartnerTyping(false);
    });

    socket.on('messageError', (data: { error: string }) => {
      console.error('[Socket] Server error:', data.error);
    });

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.emit('leaveConversation', { conversationId: 'main' });
      socket.off('connect', handleConnect);
      socket.off('messageSaved');
      socket.off('receiveMessage');
      socket.off('messageUpdated');
      socket.off('messageDeleted');
      socket.off('messageSeen');
      socket.off('messageDelivered');
      socket.off('messageReactionUpdated');
      socket.off('onlineUsers');
      socket.off('userOnline');
      socket.off('userOffline');
      socket.off('partnerTyping');
      socket.off('partnerStopTyping');
      socket.off('messageError');
    };
  }, [mySender]);

  function startPolling() {
    if (pollIntervalRef.current) return;
    console.log('[Poll] Starting polling fallback');

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/poll?after=${encodeURIComponent(lastPollRef.current)}&sender=${mySender}`);
        const data = await res.json();

        if (data.messages && data.messages.length > 0) {
          const currentMessages = useChatStore.getState().messages;
          for (const msg of data.messages) {
            if (!currentMessages.find((m) => m._id === msg._id)) {
              addMessage(msg);
            }
          }
          lastPollRef.current = data.messages[data.messages.length - 1].createdAt;
        }

        setIsPartnerOnline(data.online || false);
      } catch (err) {
        console.error('[Poll] Error:', err);
      }
    }, POLL_INTERVAL);
  }

  function stopPolling() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

  const sendMessage = useCallback(async (data: { content: string; type?: string; replyTo?: string; attachments?: any[] }) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const optimisticMessage: ChatMessage = {
      _id: tempId,
      conversationId: 'main',
      sender: mySender,
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
      if (socket.connected) {
        socket.emit('sendMessage', {
          conversationId: 'main',
          sender: mySender,
          content: data.content || '',
          type: data.type || 'text',
          replyTo: data.replyTo,
          attachments: data.attachments || [],
          tempId,
        });
      } else {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: mySender,
            content: data.content || '',
            type: data.type || 'text',
            replyTo: data.replyTo,
            attachments: data.attachments || [],
          }),
        });

        if (!res.ok) throw new Error('Failed to send');
        const saved: ChatMessage = await res.json();
        updateMessage(tempId, { _id: saved._id, createdAt: saved.createdAt, updatedAt: saved.updatedAt });
        lastPollRef.current = new Date().toISOString();
      }
    } catch (err) {
      removeMessage(tempId);
      throw err;
    }
  }, [mySender, addMessage, updateMessage, removeMessage]);

  const startTyping = useCallback(() => {
    if (!socket.connected) return;
    socket.emit('typing', { conversationId: 'main', sender: mySender });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { conversationId: 'main', sender: mySender });
    }, 3000);
  }, [mySender]);

  const stopTyping = useCallback(() => {
    if (!socket.connected) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stopTyping', { conversationId: 'main', sender: mySender });
  }, [mySender]);

  const markSeen = useCallback((messageId: string) => {
    if (!socket.connected) return;
    socket.emit('messageSeen', { messageId, conversationId: 'main' });
  }, []);

  const sendReaction = useCallback(async (messageId: string, emoji: string) => {
    const msg = useChatStore.getState().messages.find((m) => m._id === messageId);
    if (!msg) return;

    const existingIdx = msg.reactions.findIndex((r) => r.sender === mySender);
    let newReactions = [...msg.reactions];
    if (existingIdx >= 0) {
      if (newReactions[existingIdx].emoji === emoji) {
        newReactions.splice(existingIdx, 1);
      } else {
        newReactions[existingIdx] = { sender: mySender, emoji };
      }
    } else {
      newReactions.push({ sender: mySender, emoji });
    }
    updateMessage(messageId, { reactions: newReactions });

    try {
      await fetch(`/api/chat/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactions: newReactions }),
      });
    } catch {
      updateMessage(messageId, { reactions: msg.reactions });
    }
  }, [mySender, updateMessage]);

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
      if (socket.connected) {
        socket.emit('editMessage', { messageId, conversationId: 'main', content });
      }
    } catch {
      updateMessage(messageId, { content: msg.content, isEdited: msg.isEdited });
    }
  }, [updateMessage]);

  const deleteMessage = useCallback(async (messageId: string, deleteFor: 'me' | 'both') => {
    const msg = useChatStore.getState().messages.find((m) => m._id === messageId);
    if (!msg) return;

    if (deleteFor === 'both') removeMessage(messageId);
    else updateMessage(messageId, { isDeleted: true });

    try {
      await fetch(`/api/chat/${messageId}?deleteFor=${deleteFor}`, { method: 'DELETE' });
      if (socket.connected) {
        socket.emit('deleteMessage', { messageId, conversationId: 'main', deleteFor });
      }
    } catch {
      if (deleteFor === 'both') addMessage(msg);
      else updateMessage(messageId, { isDeleted: false });
    }
  }, [removeMessage, updateMessage, addMessage]);

  return {
    sendMessage,
    startTyping,
    stopTyping,
    markSeen,
    sendReaction,
    editMessage,
    deleteMessage,
    isConnected,
    connectionMode,
    socket,
  };
}
