import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.jsx';

const resolveSocketUrl = () => {
  const explicit = import.meta.env?.VITE_SOCKET_URL;
  if (explicit) {
    return explicit;
  }

  const apiUrl = import.meta.env?.VITE_API_URL;
  if (apiUrl && apiUrl.startsWith('http')) {
    try {
      const url = new URL(apiUrl);
      return `${url.protocol}//${url.host}`;
    } catch (_) {
      // fall through to defaults
    }
  }

  if (typeof window !== 'undefined') {
    if (!apiUrl || apiUrl.startsWith('/')) {
      // Same-origin API proxy (production or dev proxy)
      return window.location.origin;
    }
  }

  // Development fallback
  return 'http://localhost:4000';
};

const SOCKET_URL = resolveSocketUrl();

const useChatSocket = () => {
  const { tokens } = useAuth();
  const socketRef = useRef(null);
  const prevTokenRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    const accessToken = tokens?.access?.token;

    // No token - disconnect if connected
    if (!accessToken) {
      setConnected(false);
      disconnect();
      prevTokenRef.current = null;
      return undefined;
    }

    // Token unchanged - skip reconnection
    if (accessToken === prevTokenRef.current) {
      return undefined;
    }

    prevTokenRef.current = accessToken;

    // If socket exists and is connected, update auth without reconnecting
    if (socketRef.current?.connected) {
      socketRef.current.auth = { token: accessToken };
      return undefined;
    }

    // Create new socket only if needed
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: accessToken },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 3, // Reduced from 5 to avoid spam
    });

    socketRef.current = socket;

    const handleConnect = () => {
      setConnected(true);
    };

    const handleDisconnect = (reason) => {
      if (reason !== 'io client disconnect') {
        console.warn('[Chat] WebSocket disconnected, chat will work in polling mode');
      }
      setConnected(false);
    };

    const handleConnectError = (error) => {
      // Silent failure - chat works without WebSocket via REST API
      setConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('session:error', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('session:error', handleDisconnect);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tokens?.access?.token, disconnect]);

  const emit = useCallback((event, payload) => {
    if (!socketRef.current) return;
    socketRef.current.emit(event, payload);
  }, []);

  const on = useCallback((event, handler) => {
    if (!socketRef.current) return () => { };
    socketRef.current.on(event, handler);
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
    };
  }, []);

  const joinConversation = useCallback(
    (conversationId) => {
      if (!conversationId) return;
      emit('joinConversation', conversationId);
    },
    [emit]
  );

  const leaveConversation = useCallback(
    (conversationId) => {
      if (!conversationId) return;
      emit('leaveConversation', conversationId);
    },
    [emit]
  );

  const emitTyping = useCallback(
    (conversationId, typing) => {
      if (!conversationId) return;
      emit('typing', { conversationId, typing });
    },
    [emit]
  );

  return useMemo(
    () => ({
      connected,
      socket: socketRef.current,
      emit,
      on,
      joinConversation,
      leaveConversation,
      emitTyping,
      disconnect,
    }),
    [connected, emit, on, joinConversation, leaveConversation, emitTyping, disconnect]
  );
};

export default useChatSocket;
