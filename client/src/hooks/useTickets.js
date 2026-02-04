import React, { useState, useCallback } from 'react';
import API from '../services/api';

export const useTickets = (projectId) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
  });

  const fetchTickets = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({ projectId });

      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.assignee !== 'all') params.append('assignee', filters.assignee);

      const response = await API.get(`/tickets?${params}`);
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, filters]);

  const createTicket = async (ticketData) => {
    try {
      const response = await API.post('/tickets', {
        ...ticketData,
        projectId,
      });
      setTickets([response.data.ticket, ...tickets]);
      return { success: true, ticket: response.data.ticket };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  };

  const updateTicket = async (ticketId, ticketData) => {
    try {
      const response = await API.put(`/tickets/${ticketId}`, ticketData);
      setTickets(
        tickets.map((t) => (t._id === ticketId ? response.data.ticket : t))
      );
      return { success: true, ticket: response.data.ticket };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  };

  const updateTicketStatus = async (ticketId, status) => {
    return updateTicket(ticketId, { status });
  };

  const deleteTicket = async (ticketId) => {
    try {
      await API.delete(`/tickets/${ticketId}`);
      setTickets(tickets.filter((t) => t._id !== ticketId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  };

  const searchTickets = async (query) => {
    try {
      const response = await API.get(
        `/tickets/search?projectId=${projectId}&q=${query}`
      );
      return response.data.tickets || [];
    } catch (error) {
      console.error('Error searching tickets:', error);
      return [];
    }
  };

  React.useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    tickets,
    loading,
    filters,
    setFilters,
    fetchTickets,
    createTicket,
    updateTicket,
    updateTicketStatus,
    deleteTicket,
    searchTickets,
  };
};
