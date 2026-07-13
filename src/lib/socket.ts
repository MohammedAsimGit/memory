'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
let stateListeners: ((state: string) => void)[] = [];

function setState(s: string) {
  connectionState = s as any;
  stateListeners.forEach((fn) => fn(s));
}

export function getSocket(): Socket {
  if (!socket) {
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    console.log('[Socket] Creating socket to:', url);

    socket = io(url, {
      path: '/api/socketio',
      transports: ['polling', 'websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      forceNew: false,
    });

    socket.on('connect', () => {
      console.log('[Socket] ✓ Connected, id:', socket?.id);
      setState('connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] ✗ Disconnected:', reason);
      setState('disconnected');
    });

    socket.on('connect_error', (err) => {
      console.log('[Socket] ✗ Error:', err.message);
      setState('disconnected');
    });

    socket.on('reconnect', (attempt) => {
      console.log('[Socket] ✓ Reconnected after', attempt, 'attempts');
      setState('connected');
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log('[Socket] Reconnecting... attempt', attempt);
      setState('connecting');
    });

    socket.on('reconnect_error', (err) => {
      console.log('[Socket] Reconnect error:', err.message);
    });
  }
  return socket;
}

export function getConnectionState(): string {
  return connectionState;
}

export function onConnectionStateChange(fn: (state: string) => void) {
  stateListeners.push(fn);
  return () => {
    stateListeners = stateListeners.filter((f) => f !== fn);
  };
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectionState = 'disconnected';
    stateListeners = [];
  }
}
