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
    if (!accessToken) {
      setConnected(false);
      disconnect();
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: accessToken },
      autoConnect: true,
      reconnection: true,
    });

    socketRef.current = socket;

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleDisconnect);
    socket.on('session:error', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleDisconnect);
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
    if (!socketRef.current) return () => {};
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
