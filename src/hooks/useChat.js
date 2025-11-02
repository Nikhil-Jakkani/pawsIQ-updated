import { useCallback } from 'react';
import useApi from './useApi.js';

const buildQueryString = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'All') {
      params.append(key, value);
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

const useChat = () => {
  const api = useApi();

  const listConversations = useCallback(
    async (filters = {}) => {
      const query = buildQueryString(filters);
      const response = await api.get(`/support/chat/conversations${query}`);
      return response.data;
    },
    [api]
  );

  const createConversation = useCallback(
    async (payload) => {
      const response = await api.post('/support/chat/conversations', payload);
      return response.data;
    },
    [api]
  );

  const getConversation = useCallback(
    async (conversationId) => {
      const response = await api.get(`/support/chat/conversations/${conversationId}`);
      return response.data;
    },
    [api]
  );

  const listMessages = useCallback(
    async (conversationId, params = {}) => {
      const query = buildQueryString(params);
      const response = await api.get(`/support/chat/conversations/${conversationId}/messages${query}`);
      return response.data;
    },
    [api]
  );

  const sendMessage = useCallback(
    async (conversationId, payload) => {
      const response = await api.post(`/support/chat/conversations/${conversationId}/messages`, payload);
      return response.data;
    },
    [api]
  );

  const updateConversation = useCallback(
    async (conversationId, payload) => {
      const response = await api.patch(`/support/chat/conversations/${conversationId}`, payload);
      return response.data;
    },
    [api]
  );

  const markRead = useCallback(
    async (conversationId) => {
      await api.post(`/support/chat/conversations/${conversationId}/read`, {});
    },
    [api]
  );

  return {
    buildQueryString,
    listConversations,
    createConversation,
    getConversation,
    listMessages,
    sendMessage,
    updateConversation,
    markRead,
  };
};

export default useChat;
