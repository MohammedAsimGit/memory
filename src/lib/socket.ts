'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let connectionListeners: ((connected: boolean) => void)[] = [];

export function getSocket(): Socket {
  if (!socket) {
    socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
      connectionListeners.forEach((fn) => fn(true));
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      connectionListeners.forEach((fn) => fn(false));
    });

    socket.on('connect_error', (err) => {
      console.log('[Socket] Connection error:', err.message);
      connectionListeners.forEach((fn) => fn(false));
    });

    socket.on('reconnect', (attempt) => {
      console.log('[Socket] Reconnected after', attempt, 'attempts');
      connectionListeners.forEach((fn) => fn(true));
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log('[Socket] Reconnect attempt:', attempt);
    });

    socket.on('reconnect_error', (err) => {
      console.log('[Socket] Reconnect error:', err.message);
    });

    socket.on('reconnect_failed', () => {
      console.log('[Socket] Reconnect failed');
      connectionListeners.forEach((fn) => fn(false));
    });
  }
  return socket;
}

export function onSocketConnectionChange(fn: (connected: boolean) => void) {
  connectionListeners.push(fn);
  return () => {
    connectionListeners = connectionListeners.filter((f) => f !== fn);
  };
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectionListeners = [];
  }
}
