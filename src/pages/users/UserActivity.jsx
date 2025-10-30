import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUsers, 
  FaSearch, 
  FaFilter, 
  FaDownload, 
  FaArrowLeft,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaDatabase,
  FaCalendarAlt,
  FaUserCircle,
  FaGlobe,
  FaMobile,
  FaDesktop,
  FaTabletAlt,
  FaSignInAlt,
  FaSignOutAlt,
  FaEdit,
  FaTrash,
  FaUserPlus,
  FaUserMinus,
  FaExclamationTriangle,
  FaShieldAlt,
  FaCreditCard,
  FaEnvelope,
  FaBell
} from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';
import useApi from '../../hooks/useApi';
import { useToast } from '../../components/common/Toast';

const UserActivity = () => {
  const api = useApi();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [activityLogsData, setActivityLogsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [exporting, setExporting] = useState(false);

  const buildQueryParams = (pageOverride = page) => {
    const params = new URLSearchParams();
    params.set('page', String(pageOverride));
    params.set('limit', String(limit));
    if (searchTerm) params.set('search', searchTerm);
    if (filterAction !== 'all') params.set('action', filterAction);
    if (filterUser !== 'all') params.set('userId', filterUser);
    if (dateRange.start) params.set('startDate', dateRange.start);
    if (dateRange.end) params.set('endDate', dateRange.end);
    if (sortField) params.set('sortField', sortField);
    params.set('sortDirection', sortDirection);
    return params;
  };

  const fetchActivityLogs = async (pageOverride = page) => {
    setLoading(true);
    setError('');
    try {
      const params = buildQueryParams(pageOverride);
      const response = await api.get(`/admin/activity-logs?${params.toString()}`);
      const data = response?.results || response?.data || response || [];
      const normalized = (Array.isArray(data) ? data : []).map((item, index) => ({
        id: item.log_id || item.id || index,
        userId: String(item.user_id || item.userId || item.user?.id || item.user?.user_id || ''),
        userName: item.user_name || item.userName || item.user?.name || 'Unknown User',
        userEmail: item.user_email || item.userEmail || item.user?.email || '—',
        action: (item.action || 'unknown').toLowerCase(),
        description: item.description || item.details || '—',
        timestamp: item.timestamp || item.created_at || item.createdAt || new Date().toISOString(),
        ipAddress: item.ip_address || item.ipAddress || '—',
        device: item.device_type || item.device || 'unknown',
        browser: item.browser || '—',
        location: item.location || item.geo_location || '—'
      }));

      setActivityLogsData(normalized);
      setTotalPages(response?.pagination?.totalPages || response?.totalPages || 1);
      setTotalResults(response?.pagination?.total || response?.total || normalized.length);
      setPage(pageOverride);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
      setError('Unable to load activity logs. Showing cached data.');
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAction, filterUser, dateRange.start, dateRange.end, limit, sortField, sortDirection]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchActivityLogs(1);
    }, 400);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    fetchActivityLogs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const uniqueUsers = useMemo(() => {
    const map = new Map();
    activityLogsData.forEach((log) => {
      if (!map.has(log.userId)) {
        map.set(log.userId, {
          id: log.userId || log.userName,
          label: log.userName || 'Unknown User'
        });
      }
    });
    return Array.from(map.values());
  }, [activityLogsData]);

  // Filter and sort activity logs
  const filteredAndSortedLogs = activityLogsData
    .filter(log => {
      const matchesSearch = 
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesUser = filterUser === 'all' || log.userId === filterUser;

      // Date range filtering
      let matchesDateRange = true;
      if (dateRange.start && dateRange.end) {
        const logDate = new Date(log.timestamp);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        matchesDateRange = logDate >= startDate && logDate <= endDate;
      }
      
      return matchesSearch && matchesAction && matchesUser && matchesDateRange;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'timestamp') {
        comparison = new Date(a.timestamp) - new Date(b.timestamp);
      } else if (sortField === 'userName') {
        comparison = a.userName.localeCompare(b.userName);
      } else if (sortField === 'action') {
        comparison = a.action.localeCompare(b.action);
      } else if (sortField === 'ipAddress') {
        comparison = a.ipAddress.localeCompare(b.ipAddress);
      } else if (sortField === 'location') {
        comparison = a.location.localeCompare(b.location);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleExport = async () => {
    try {
      setExporting(true);
      const rows = filteredAndSortedLogs.length ? filteredAndSortedLogs : activityLogsData;
      if (!rows.length) {
        toast.info('No activity logs to export');
        return;
      }

      const headers = ['Timestamp', 'User Name', 'User Email', 'Action', 'Description', 'IP Address', 'Device', 'Browser', 'Location'];
      const csvContent = [headers.join(',')]
        .concat(rows.map((log) => [
          `"${new Date(log.timestamp).toISOString()}"`,
          `"${(log.userName || '').replace(/"/g, '""')}"`,
          `"${(log.userEmail || '').replace(/"/g, '""')}"`,
          `"${log.action}"`,
          `"${(log.description || '').replace(/"/g, '""')}"`,
          `"${log.ipAddress || ''}"`,
          `"${log.device || ''}"`,
          `"${log.browser || ''}"`,
          `"${(log.location || '').replace(/"/g, '""')}"`
        ].join(',')))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user-activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Activity logs exported successfully');
    } catch (err) {
      console.error('Failed to export activity logs:', err);
      toast.error('Failed to export activity logs');
    } finally {
      setExporting(false);
    }
  };

  // Handle sort click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ml-1 text-gray-400" />;
    return sortDirection === 'asc' ? <FaSortUp className="ml-1 text-indigo-600" /> : <FaSortDown className="ml-1 text-indigo-600" />;
  };

  // Get icon for action type
  const getActionIcon = (action) => {
    switch (action) {
      case 'login':
        return <FaSignInAlt className="text-green-500" />;
      case 'logout':
        return <FaSignOutAlt className="text-gray-500" />;
      case 'profile_update':
        return <FaEdit className="text-blue-500" />;
      case 'password_change':
        return <FaShieldAlt className="text-purple-500" />;
      case 'registration':
        return <FaUserPlus className="text-indigo-500" />;
      case 'account_deactivated':
        return <FaUserMinus className="text-red-500" />;
      case 'login_failed':
        return <FaExclamationTriangle className="text-amber-500" />;
      case 'pet_added':
        return <FaPlus className="text-green-500" />;
      case 'appointment_booked':
        return <FaCalendarAlt className="text-blue-500" />;
      case 'payment_method_added':
        return <FaCreditCard className="text-purple-500" />;
      case 'notification_settings_updated':
        return <FaBell className="text-amber-500" />;
      case 'email_verified':
        return <FaEnvelope className="text-green-500" />;
      default:
        return <FaDatabase className="text-gray-500" />;
    }
  };

  // Get icon for device type
  const getDeviceIcon = (device) => {
    switch (device) {
      case 'desktop':
        return <FaDesktop className="text-gray-600" />;
      case 'mobile':
        return <FaMobile className="text-gray-600" />;
      case 'tablet':
        return <FaTabletAlt className="text-gray-600" />;
      default:
        return <FaGlobe className="text-gray-600" />;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handlePageChange = (direction) => {
    if (direction === 'prev' && page > 1) {
      setPage((prev) => prev - 1);
    } else if (direction === 'next' && page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/users" className="text-gray-500 hover:text-indigo-600">
              <FaArrowLeft />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">User Activity Logs</h1>
              <p className="text-gray-500">Track and monitor user activities</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors"
              onClick={handleExport}
              disabled={exporting || loading}
            >
              <FaDownload /> {exporting ? 'Exporting...' : 'Export Logs'}
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 flex-wrap">
              {/* Search */}
              <div className="relative flex-grow max-w-md">
                <input
                  type="text"
                  placeholder="Search logs..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              {/* Action Filter */}
              <select
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <option value="all">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="registration">Registration</option>
                <option value="profile_update">Profile Update</option>
                <option value="password_change">Password Change</option>
                <option value="pet_added">Pet Added</option>
                <option value="appointment_booked">Appointment Booked</option>
                <option value="payment_method_added">Payment Method Added</option>
                <option value="account_deactivated">Account Deactivated</option>
                <option value="notification_settings_updated">Notification Settings Updated</option>
                <option value="login_failed">Login Failed</option>
                <option value="email_verified">Email Verified</option>
              </select>
              
              {/* User Filter */}
              <select
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
              >
                <option value="all">All Users</option>
                {uniqueUsers.map((user) => (
                  <option key={user.id || user.label} value={user.id || user.label}>{user.label}</option>
                ))}
              </select>
            </div>
            
            {/* Date Range */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">From:</label>
                <input
                  type="date"
                  className="pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">To:</label>
                <input
                  type="date"
                  className="pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
              </div>
              <button
                className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                onClick={() => fetchActivityLogs(1)}
              >
                Apply Filter
              </button>
              <button
                className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setDateRange({ start: '', end: '' });
                  setPage(1);
                }}
              >
                Clear Dates
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
            <p className="mt-4 text-gray-500">Loading activity logs...</p>
          </div>
        ) : (
          <>
          {/* Activity Logs Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('timestamp')}
                    >
                      <div className="flex items-center">
                        Timestamp {getSortIcon('timestamp')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('userName')}
                    >
                      <div className="flex items-center">
                        User {getSortIcon('userName')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('action')}
                    >
                      <div className="flex items-center">
                        Action {getSortIcon('action')}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('ipAddress')}
                    >
                      <div className="flex items-center">
                        IP Address {getSortIcon('ipAddress')}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('location')}
                    >
                      <div className="flex items-center">
                        Location {getSortIcon('location')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <FaUserCircle className="text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                            <div className="text-sm text-gray-500">{log.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className="text-sm text-gray-900 capitalize">{log.action.replace(/_/g, ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">{log.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(log.device)}
                          <span className="text-sm text-gray-900 capitalize">{log.device} - {log.browser}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.location}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalResults)}</span> of{' '}
                    <span className="font-medium">{totalResults}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange('prev')}
                      disabled={page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span className="sr-only">Previous</span>
                      &laquo;
                    </button>
                    <span className="z-10 bg-indigo-50 border-indigo-500 text-indigo-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange('next')}
                      disabled={page === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span className="sr-only">Next</span>
                      &raquo;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserActivity;