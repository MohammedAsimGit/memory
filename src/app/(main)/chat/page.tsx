'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/useToast';
import { useApi } from '@/hooks/useApi';
import type { Settings } from '@/types';
import type { ChatMessage } from '@/types/chat';
import ChatTopBar from '@/components/chat/ChatTopBar';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import TypingIndicator from '@/components/chat/TypingIndicator';
import LongPressMenu from '@/components/chat/LongPressMenu';
import DateSeparator from '@/components/chat/DateSeparator';
import SearchMessages from '@/components/chat/SearchMessages';
import ImageViewer from '@/components/chat/ImageViewer';

export default function ChatPage() {
  const router = useRouter();
  const activeProfile = useAuthStore((s) => s.activeProfile);
  const { data: settings } = useApi<Settings>('/settings');
  const { addToast, ToastContainer } = useToast();
  const {
    messages,
    setMessages,
    prependMessages,
    isLoading,
    setIsLoading,
    partnerTyping,
    showSearch,
    setShowSearch,
    showMenu,
    setShowMenu,
    selectedMessage,
    setSelectedMessage,
    openImageViewer,
  } = useChatStore();

  const { sendMessage, startTyping, stopTyping, markSeen, sendReaction, editMessage, deleteMessage, isConnected } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const oldestDateRef = useRef<string | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  const fetchMessages = useCallback(async (before?: string) => {
    try {
      const url = before
        ? `/api/chat?limit=30&before=${before}`
        : '/api/chat?limit=30';
      const res = await fetch(url);
      const data = await res.json();

      if (data.length < 30) setHasMore(false);

      if (before) {
        prependMessages(data);
      } else {
        setMessages(data);
        if (data.length > 0) {
          oldestDateRef.current = data[0].createdAt;
        }
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [setMessages, prependMessages]);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (!isLoading && messages.length > 0 && prevMessageCountRef.current === 0) {
      setTimeout(() => scrollToBottom(false), 100);
    }
    prevMessageCountRef.current = messages.length;
  }, [isLoading, messages.length, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 0) {
      const container = scrollContainerRef.current;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isNearBottom) {
          setTimeout(() => scrollToBottom(true), 50);
        }
      }
    }
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender !== (activeProfile || 'me')) {
        markSeen(lastMsg._id);
      }
    }
  }, [messages, activeProfile, markSeen]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || !oldestDateRef.current) return;
    setIsLoadingMore(true);
    fetchMessages(oldestDateRef.current);
  }, [isLoadingMore, hasMore, fetchMessages]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 100 && hasMore && !isLoadingMore) {
      handleLoadMore();
    }
  }, [hasMore, isLoadingMore, handleLoadMore]);

  const handleSend = useCallback(async (data: { content: string; type?: string; replyTo?: string; attachments?: any[] }) => {
    try {
      await sendMessage(data);
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) {
      addToast('Message failed to send. Tap to retry.', 'error');
    }
  }, [sendMessage, scrollToBottom, addToast]);

  const handleLongPress = useCallback((msg: ChatMessage) => {
    setSelectedMessage(msg);
    setShowMenu(true);
  }, [setSelectedMessage, setShowMenu]);

  const handleDoubleTap = useCallback((msg: ChatMessage) => {
    sendReaction(msg._id, '❤️');
  }, [sendReaction]);

  const handleCopy = useCallback(() => {
    if (selectedMessage) {
      navigator.clipboard.writeText(selectedMessage.content);
      setShowMenu(false);
    }
  }, [selectedMessage, setShowMenu]);

  const handleReply = useCallback(() => {
    if (selectedMessage) {
      useChatStore.getState().setReplyingTo(selectedMessage);
      setShowMenu(false);
    }
  }, [selectedMessage, setShowMenu]);

  const handleEdit = useCallback(() => {
    if (selectedMessage) {
      useChatStore.getState().setEditingMessage(selectedMessage);
      setShowMenu(false);
    }
  }, [selectedMessage, setShowMenu]);

  const handleDelete = useCallback((deleteFor: 'me' | 'both') => {
    if (selectedMessage) {
      deleteMessage(selectedMessage._id, deleteFor);
      setShowMenu(false);
    }
  }, [selectedMessage, deleteMessage, setShowMenu]);

  const handleFavorite = useCallback(() => {
    if (selectedMessage) {
      const chat = useChatStore.getState();
      chat.updateMessage(selectedMessage._id, { favorited: !selectedMessage.favorited });
      setShowMenu(false);
    }
  }, [selectedMessage, setShowMenu]);

  const handlePin = useCallback(() => {
    if (selectedMessage) {
      const chat = useChatStore.getState();
      chat.updateMessage(selectedMessage._id, { pinned: !selectedMessage.pinned });
      setShowMenu(false);
    }
  }, [selectedMessage, setShowMenu]);

  const shouldShowDate = (msg: ChatMessage, prevMsg?: ChatMessage) => {
    if (!prevMsg) return true;
    const d1 = new Date(msg.createdAt).toDateString();
    const d2 = new Date(prevMsg.createdAt).toDateString();
    return d1 !== d2;
  };

  const shouldShowTail = (msg: ChatMessage, prevMsg?: ChatMessage) => {
    if (!prevMsg) return true;
    return prevMsg.sender !== msg.sender || shouldShowDate(msg, prevMsg);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col">
      <ChatTopBar
        onBack={() => router.push('/home')}
        onSearch={() => setShowSearch(!showSearch)}
        isConnected={isConnected}
      />

      <div
        className="flex-1 overflow-y-auto scrollbar-thin"
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 64px)' }}
      >
        <div className="px-4 py-2 max-w-2xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-5xl mb-4">💌</div>
              <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">
                Start a Conversation
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                Send a sweet message. Every word becomes a cherished memory.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isOwn = msg.sender === (activeProfile || 'me');
                const prevMsg = i > 0 ? messages[i - 1] : undefined;
                const showDate = shouldShowDate(msg, prevMsg);
                const showTail = shouldShowTail(msg, prevMsg);

                return (
                  <div key={msg._id}>
                    {showDate && <DateSeparator date={msg.createdAt} />}
                    <MessageBubble
                      message={msg}
                      isOwn={isOwn}
                      showTail={showTail}
                      onLongPress={handleLongPress}
                      onDoubleTap={handleDoubleTap}
                      onImagePress={(images, idx) => openImageViewer(images, idx)}
                    />
                  </div>
                );
              })}
              <TypingIndicator isTyping={partnerTyping} />
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput
        onSend={handleSend}
        onTyping={startTyping}
        onStopTyping={stopTyping}
      />

      <AnimatePresence>
        {showMenu && selectedMessage && (
          <LongPressMenu
            message={selectedMessage}
            isOwn={selectedMessage.sender === (activeProfile || 'me')}
            onReply={handleReply}
            onCopy={handleCopy}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onFavorite={handleFavorite}
            onPin={handlePin}
            onClose={() => {
              setShowMenu(false);
              setSelectedMessage(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSearch && (
          <SearchMessages
            messages={messages}
            onClose={() => setShowSearch(false)}
            onJumpTo={(id) => {
              const el = document.getElementById(id);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          />
        )}
      </AnimatePresence>

      <ImageViewer />
      <ToastContainer />
    </div>
  );
}
