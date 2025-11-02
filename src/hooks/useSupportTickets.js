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

export const useSupportTickets = () => {
  const api = useApi();

  const listAdminTickets = useCallback(
    async (filters = {}) => {
      const query = buildQueryString(filters);
      const response = await api.get(`/support/tickets${query}`);
      return response.data;
    },
    [api]
  );

  const listMyTickets = useCallback(
    async (filters = {}) => {
      const query = buildQueryString(filters);
      const response = await api.get(`/support/tickets/mine${query}`);
      return response.data;
    },
    [api]
  );

  const getTicket = useCallback(
    async (ticketId) => {
      const response = await api.get(`/support/tickets/${ticketId}`);
      return response.data;
    },
    [api]
  );

  const createTicket = useCallback(
    async (payload) => {
      const response = await api.post('/support/tickets', payload);
      return response.data;
    },
    [api]
  );

  const addMessage = useCallback(
    async ({ ticketId, message_body, attachments }) => {
      const response = await api.post(`/support/tickets/${ticketId}/messages`, {
        message_body,
        attachments,
      });
      return response.data;
    },
    [api]
  );

  const updateStatus = useCallback(
    async ({ ticketId, status }) => {
      const response = await api.patch(`/support/tickets/${ticketId}`, { status });
      return response.data;
    },
    [api]
  );

  const assignTicket = useCallback(
    async ({ ticketId, assigned_to_admin_id }) => {
      const response = await api.post(`/support/tickets/${ticketId}/assign`, { assigned_to_admin_id });
      return response.data;
    },
    [api]
  );

  return {
    buildQueryString,
    listAdminTickets,
    listMyTickets,
    getTicket,
    createTicket,
    addMessage,
    updateStatus,
    assignTicket,
  };
};

export default useSupportTickets;
