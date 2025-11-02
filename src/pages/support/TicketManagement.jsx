import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FaTicketAlt, FaSearch, FaFilter, FaSort, FaEye, FaEdit, FaTrash, FaPlus, FaExclamationTriangle, FaCheckCircle, FaClock } from 'react-icons/fa';
import useSupportTickets from '../../hooks/useSupportTickets';

const TicketManagement = () => {
  const { listAdminTickets } = useSupportTickets();
  const [ticketsResponse, setTicketsResponse] = useState({ items: [], pagination: { page: 1, pages: 1, total: 0 } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const serverFilters = useMemo(() => ({
    status: statusFilter === 'All' ? undefined : statusFilter.toLowerCase(),
    priority: priorityFilter === 'All' ? undefined : priorityFilter.toLowerCase(),
    category: categoryFilter === 'All' ? undefined : categoryFilter,
  }), [statusFilter, priorityFilter, categoryFilter]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listAdminTickets(serverFilters);
      setTicketsResponse(data || { items: [], pagination: { page: 1, pages: 1, total: 0 } });
    } catch (err) {
      setError(err?.message || 'Failed to load tickets');
      setTicketsResponse({ items: [], pagination: { page: 1, pages: 1, total: 0 } });
    } finally {
      setLoading(false);
    }
  }, [listAdminTickets, serverFilters]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = useMemo(() => {
    return (ticketsResponse.items || []).filter((ticket) => {
      const requesterName = ticket?.requester?.user_full_name || '';
      const requesterEmail = ticket?.requester?.user_email_id || '';
      const subject = ticket?.subject || '';
      const ticketId = ticket?.ticket_id ? `TKT-${String(ticket.ticket_id).padStart(4, '0')}` : '';

      const matchesSearch =
        ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        requesterEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === 'All' || (ticket.category || '').toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [ticketsResponse.items, searchTerm, categoryFilter]);

  const computedStats = useMemo(() => {
    const base = { open: 0, critical: 0, resolvedToday: 0, averageResponseHours: 0 };
    if (!filteredTickets.length) {
      return base;
    }

    const now = new Date();
    const totals = filteredTickets.reduce((acc, ticket) => {
      const status = (ticket.status || '').toLowerCase();
      const priority = (ticket.priority || '').toLowerCase();
      if (status === 'open' || status === 'in_progress' || status === 'pending') {
        acc.open += 1;
      }
      if (priority === 'critical') {
        acc.critical += 1;
      }
      const resolvedAt = ticket.resolved_at ? new Date(ticket.resolved_at) : null;
      if (resolvedAt && resolvedAt.toDateString() === now.toDateString()) {
        acc.resolvedToday += 1;
      }
      if (ticket.first_response_at && ticket.created_at) {
        const firstResponse = new Date(ticket.first_response_at);
        const created = new Date(ticket.created_at);
        const diffHours = Math.abs(firstResponse.getTime() - created.getTime()) / (1000 * 60 * 60);
        acc.responseTotals += diffHours;
        acc.responseCount += 1;
      }
      return acc;
    }, { open: 0, critical: 0, resolvedToday: 0, responseTotals: 0, responseCount: 0 });

    return {
      open: totals.open,
      critical: totals.critical,
      resolvedToday: totals.resolvedToday,
      averageResponseHours: totals.responseCount ? (totals.responseTotals / totals.responseCount).toFixed(1) : 0,
    };
  }, [filteredTickets]);

  const formatTicketId = (ticketId) => `TKT-${String(ticketId).padStart(4, '0')}`;

  // Status badge color
  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Pending': return 'bg-purple-100 text-purple-800';
      case 'Closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Priority badge color
  const getPriorityBadgeColor = (priority) => {
    switch(priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <FaTicketAlt className="text-indigo-600 text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Support Ticket Management</h1>
            <p className="text-gray-500">View and manage customer support tickets</p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Open Tickets</p>
                <h3 className="text-2xl font-bold text-indigo-600">{computedStats.open}</h3>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <FaTicketAlt className="text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Critical Issues</p>
                <h3 className="text-2xl font-bold text-red-600">{computedStats.critical}</h3>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <FaExclamationTriangle className="text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Resolved Today</p>
                <h3 className="text-2xl font-bold text-green-600">{computedStats.resolvedToday}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaCheckCircle className="text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Avg. Response Time</p>
                <h3 className="text-2xl font-bold text-yellow-600">{computedStats.averageResponseHours}h</h3>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FaClock className="text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-indigo-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tickets by ID, customer, or subject..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Closed">Closed</option>
              </select>
              
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Booking">Booking</option>
                <option value="Payments">Payments</option>
                <option value="Profiles">Profiles</option>
                <option value="Refunds">Refunds</option>
                <option value="Complaints">Complaints</option>
              </select>
              
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <FaPlus size={14} /> New Ticket
              </button>
            </div>
          </div>
        </div>
        
        {/* Tickets Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-indigo-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-6 text-center text-sm text-gray-500">
                      Loading tickets...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-6 text-center text-sm text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.ticket_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                        {formatTicketId(ticket.ticket_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{ticket?.requester?.user_full_name || 'Unknown User'}</div>
                        <div className="text-xs text-gray-500">{ticket?.requester?.user_email_id || '—'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {ticket.subject || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor((ticket.status || '').replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()))}`}>
                          {(ticket.status || 'unknown').replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor((ticket.priority || 'unknown').replace(/\b\w/g, (l) => l.toUpperCase()))}`}>
                          {(ticket.priority || 'unknown').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ticket.category || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ticket.created_at || ticket.created)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ticket?.provider?.serv_provider_name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button className="text-indigo-600 hover:text-indigo-900" title="View">
                            <FaEye />
                          </button>
                          <button className="text-blue-600 hover:text-blue-900" title="Edit">
                            <FaEdit />
                          </button>
                          <button className="text-red-600 hover:text-red-900" title="Delete">
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                      No tickets found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{filteredTickets.length ? 1 : 0}</span> to <span className="font-medium">{filteredTickets.length}</span> of{' '}
                  <span className="font-medium">{ticketsResponse?.pagination?.total || 0}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    aria-current="page"
                    className="z-10 bg-indigo-50 border-indigo-500 text-indigo-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  >
                    1
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </a>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TicketManagement;