import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUsers, 
  FaUserShield, 
  FaUserCog, 
  FaDatabase, 
  FaSearch, 
  FaFilter, 
  FaEllipsisH, 
  FaCheck, 
  FaBan, 
  FaTrash, 
  FaEdit,
  FaUserPlus,
  FaDownload,
  FaSort,
  FaSortUp,
  FaSortDown
} from 'react-icons/fa';
import DashboardLayout from '../components/layout/DashboardLayout';
import useApi from '../hooks/useApi';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';

const Users = () => {
  const api = useApi();
  const toast = useToast();
  
  // Calculate user total spending from payments/bookings
  const calculateUserSpending = async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}/spending`);
      return `₹${(response?.data?.totalSpent || 0).toLocaleString()}`;
    } catch (error) {
      console.warn('Could not fetch user spending:', error);
      return '₹0';
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingApproval: 0,
    suspendedUsers: 0
  });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, userId: null, count: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch users and stats from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch users list
        const response = await api.get('/admin/piq/users');
        
        if (response && response.users) {
          const userIds = response.users.map(u => Number(u.user_id));
          
          // Fetch bulk user stats (pets, appointments)
          let statsMap = {};
          if (userIds.length > 0) {
            try {
              statsMap = await api.post('/admin/stats/bulk-user-stats', { userIds });
            } catch (err) {
              console.warn('Failed to load user stats:', err);
            }
          }
          
          // Transform API data to match component format
          const transformedUsers = await Promise.all(response.users.map(async u => ({
            id: Number(u.user_id),
            name: u.user_full_name || u.user_email_id || 'Unknown',
            email: u.user_email_id || '',
            phone: u.user_mobile_no || 'N/A',
            address: u.user_location || 'N/A',
            role: 'Pet Owner',
            status: u.user_status === 'active' ? 'Active' : u.user_status === 'inactive' ? 'Suspended' : 'Pending',
            lastActive: formatLastActive(u.last_login),
            registeredDate: formatDate(u.created_at),
            pets: statsMap[u.user_id]?.pets || 0,
            totalSpent: await calculateUserSpending(u.user_id)
          })));
          
          setUsersData(transformedUsers);
          
          // Calculate stats
          const activeCount = transformedUsers.filter(u => u.status === 'Active').length;
          const pendingCount = transformedUsers.filter(u => u.status === 'Pending').length;
          const suspendedCount = transformedUsers.filter(u => u.status === 'Suspended').length;
          
          setUserStats({
            totalUsers: transformedUsers.length,
            activeUsers: activeCount,
            pendingApproval: pendingCount,
            suspendedUsers: suspendedCount
          });
        }
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('Failed to load users. Please try again.');
        setUsersData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [api]);
  
  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  const formatLastActive = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  // Filter and sort users
  const filteredAndSortedUsers = usersData
    .filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || user.status.toLowerCase() === filterStatus.toLowerCase();
      const matchesRole = filterRole === 'all' || user.role.toLowerCase() === filterRole.toLowerCase();
      
      return matchesSearch && matchesStatus && matchesRole;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'email') {
        comparison = a.email.localeCompare(b.email);
      } else if (sortField === 'role') {
        comparison = a.role.localeCompare(b.role);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === 'registeredDate') {
        // Simple date comparison for demo purposes
        comparison = new Date(a.registeredDate) - new Date(b.registeredDate);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

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

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredAndSortedUsers.map(user => user.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle individual user selection
  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Handle user status update
  const handleStatusChange = async (userId, newStatus) => {
    try {
      const apiStatus = newStatus === 'Active' ? 'active' : newStatus === 'Suspended' ? 'inactive' : 'pending';
      await api.patch(`/admin/users/${userId}`, { user_status: apiStatus });
      
      // Update local state
      setUsersData(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
      
      toast.success(`User status updated to ${newStatus} successfully!`);
    } catch (err) {
      console.error('Failed to update user status:', err);
      toast.error('Failed to update user status. Please try again.');
    }
  };
  
  // Handle bulk actions
  const handleBulkAction = (action) => {
    if (selectedUsers.length === 0) {
      toast.warning('Please select at least one user');
      return;
    }
    
    setConfirmDialog({
      isOpen: true,
      action,
      userId: null,
      count: selectedUsers.length
    });
  };
  
  // Execute bulk action after confirmation
  const executeBulkAction = async () => {
    const { action } = confirmDialog;
    setIsProcessing(true);
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const userId of selectedUsers) {
        try {
          if (action === 'Approve') {
            const apiStatus = 'active';
            await api.patch(`/admin/users/${userId}`, { user_status: apiStatus });
            setUsersData(prevUsers =>
              prevUsers.map(user =>
                user.id === userId ? { ...user, status: 'Active' } : user
              )
            );
          } else if (action === 'Suspend') {
            const apiStatus = 'inactive';
            await api.patch(`/admin/users/${userId}`, { user_status: apiStatus });
            setUsersData(prevUsers =>
              prevUsers.map(user =>
                user.id === userId ? { ...user, status: 'Suspended' } : user
              )
            );
          } else if (action === 'Delete') {
            await api.delete(`/admin/users/${userId}`);
            setUsersData(prevUsers => prevUsers.filter(user => user.id !== userId));
          }
          successCount++;
        } catch (err) {
          console.error(`Failed to ${action} user ${userId}:`, err);
          failCount++;
        }
      }
      
      // Clear selection
      setSelectedUsers([]);
      setSelectAll(false);
      
      // Show results
      if (failCount === 0) {
        toast.success(`Successfully ${action.toLowerCase()}ed ${successCount} user(s)`);
      } else {
        toast.warning(`${action} completed: ${successCount} succeeded, ${failCount} failed`);
      }
      
      // Refresh stats
      const activeCount = usersData.filter(u => u.status === 'Active').length;
      const pendingCount = usersData.filter(u => u.status === 'Pending').length;
      const suspendedCount = usersData.filter(u => u.status === 'Suspended').length;
      setUserStats({
        totalUsers: usersData.length,
        activeUsers: activeCount,
        pendingApproval: pendingCount,
        suspendedUsers: suspendedCount
      });
    } catch (err) {
      console.error(`Failed to ${action} users:`, err);
      toast.error(`Failed to ${action} users. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <FaUsers className="text-indigo-600 text-2xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            </div>
            <p className="text-gray-500 mt-1">View and manage all user accounts</p>
          </div>
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors"
              onClick={() => {
                // Create a CSV string from the filtered users
                const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'Role', 'Status', 'Last Active', 'Registered Date', 'Pets', 'Total Spent'];
                const csvRows = [headers];
                
                filteredAndSortedUsers.forEach(user => {
                  csvRows.push([
                    user.id,
                    user.name,
                    user.email,
                    user.phone,
                    user.address,
                    user.role,
                    user.status,
                    user.lastActive,
                    user.registeredDate,
                    user.pets,
                    user.totalSpent
                  ]);
                });
                
                const csvString = csvRows.map(row => row.join(',')).join('\n');
                
                // Create a Blob and download link
                const blob = new Blob([csvString], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('hidden', '');
                a.setAttribute('href', url);
                a.setAttribute('download', `users-report-${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            >
              <FaDownload /> Export
            </button>
            <button 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-2 hover:bg-indigo-700 transition-colors"
              onClick={() => {
                // Show a modal or form to add a new user
                const name = prompt("Enter user name:");
                if (!name) return;
                
                const email = prompt("Enter user email:");
                if (!email) return;
                
                const role = prompt("Enter user role (Pet Owner, Service Provider, Admin, Moderator):", "Pet Owner");
                if (!role) return;
                
                // In a real app, this would send data to an API
                console.log("Adding new user:", { name, email, role });
                alert(`User ${name} added successfully!`);
                
                // Simulate adding the user to the list
                // In a real app, this would be handled by state management after API response
                const newUser = {
                  id: usersData.length + 1,
                  name,
                  email,
                  role,
                  status: 'Pending',
                  lastActive: 'Never',
                  registeredDate: new Date().toLocaleDateString(),
                  pets: 0
                };
                
                // This is just for demonstration - in a real app you would update state properly
                console.log("New user object:", newUser);
              }}
            >
              <FaUserPlus /> Add User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{userStats.totalUsers}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <FaUsers className="text-indigo-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{userStats.activeUsers}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaCheck className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Approval</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{userStats.pendingApproval}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <FaUserCog className="text-amber-600 text-xl" />
              </div>
            </div>
            <button 
              className="text-xs text-amber-600 mt-2 inline-block hover:underline"
              onClick={() => setFilterStatus('pending')}
            >
              Review pending users →
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Suspended Users</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{userStats.suspendedUsers}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <FaBan className="text-red-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/users/profiles" 
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
            >
              <div className="bg-indigo-100 p-3 rounded-full">
                <FaUsers className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">User Profiles</h3>
                <p className="text-sm text-gray-500">View and manage all user accounts</p>
              </div>
            </Link>
            
            <Link 
              to="/users/roles" 
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
            >
              <div className="bg-purple-100 p-3 rounded-full">
                <FaUserShield className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">User Roles</h3>
                <p className="text-sm text-gray-500">Assign and manage user permissions</p>
              </div>
            </Link>
            
            <Link 
              to="/users/activity" 
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
            >
              <div className="bg-blue-100 p-3 rounded-full">
                <FaDatabase className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Activity Logs</h3>
                <p className="text-sm text-gray-500">View user activity and audit logs</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading users...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <div className="text-red-600 text-xl">⚠️</div>
            <div className="flex-grow">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
        
        {!loading && !error && (
          <>
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-grow max-w-md">
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
              
              <select
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="pet owner">Pet Owners</option>
                <option value="service provider">Service Providers</option>
                <option value="admin">Admins</option>
                <option value="moderator">Moderators</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200 flex flex-wrap items-center justify-between gap-4">
            <div className="text-indigo-700 font-medium">
              {selectedUsers.length} users selected
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-green-700 transition-colors"
                onClick={() => handleBulkAction('Approve')}
              >
                <FaCheck size={12} /> Approve
              </button>
              <button 
                className="px-3 py-1.5 bg-amber-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-amber-700 transition-colors"
                onClick={() => handleBulkAction('Suspend')}
              >
                <FaBan size={12} /> Suspend
              </button>
              <button 
                className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-red-700 transition-colors"
                onClick={() => handleBulkAction('Delete')}
              >
                <FaTrash size={12} /> Delete
              </button>
              <button 
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setSelectedUsers([]);
                  setSelectAll(false);
                }}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* User List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      User {getSortIcon('name')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('role')}>
                    <div className="flex items-center">
                      Role {getSortIcon('role')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      Status {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address & Spending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('registeredDate')}>
                    <div className="flex items-center">
                      Registered {getSortIcon('registeredDate')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">{user.name.charAt(0)}{user.name.split(' ')[1]?.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 
                          user.role === 'Moderator' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'Service Provider' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 
                          user.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastActive}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      <div className="truncate" title={user.address}>
                        {user.address}
                      </div>
                      <div className="text-xs font-medium text-green-600 mt-1">
                        Total Spent: {user.totalSpent}
                      </div>
                      {user.pets > 0 && (
                        <div className="text-xs text-gray-400">
                          {user.pets} pet{user.pets > 1 ? 's' : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.registeredDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center space-x-2">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900" 
                          title="Edit User"
                          onClick={() => alert(`Edit user ${user.name}`)}
                        >
                          <FaEdit />
                        </button>
                        {user.status === 'Active' ? (
                          <button 
                            className="text-red-600 hover:text-red-900" 
                            title="Suspend User"
                            onClick={() => handleStatusChange(user.id, 'Suspended')}
                          >
                            <FaBan />
                          </button>
                        ) : user.status === 'Suspended' ? (
                          <button 
                            className="text-green-600 hover:text-green-900" 
                            title="Activate User"
                            onClick={() => handleStatusChange(user.id, 'Active')}
                          >
                            <FaCheck />
                          </button>
                        ) : (
                          <button 
                            className="text-green-600 hover:text-green-900" 
                            title="Approve User"
                            onClick={() => handleStatusChange(user.id, 'Active')}
                          >
                            <FaCheck />
                          </button>
                        )}
                        <button 
                          className="text-red-600 hover:text-red-900" 
                          title="Delete User"
                          onClick={() => {
                            setSelectedUsers([user.id]);
                            setConfirmDialog({
                              isOpen: true,
                              action: 'Delete',
                              userId: user.id,
                              count: 1
                            });
                          }}
                        >
                          <FaTrash />
                        </button>
                        <div className="relative group">
                          <button className="text-gray-500 hover:text-gray-700" title="More Options">
                            <FaEllipsisH />
                          </button>
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                            <button 
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => alert(`View profile for ${user.name}`)}
                            >
                              View Full Profile
                            </button>
                            <button 
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => alert(`View activity for ${user.name}`)}
                            >
                              View Activity
                            </button>
                            <button 
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => alert(`Reset password for ${user.name}`)}
                            >
                              Reset Password
                            </button>
                            <button 
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => alert(`Impersonate ${user.name}`)}
                            >
                              Login as User
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredAndSortedUsers.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-gray-500">No users found matching your filters.</p>
            </div>
          )}
          
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{filteredAndSortedUsers.length}</span> of <span className="font-medium">{usersData.length}</span> users
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled>
                Next
              </button>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null, userId: null, count: 0 })}
        onConfirm={executeBulkAction}
        title={`${confirmDialog.action} Users`}
        message={`Are you sure you want to ${confirmDialog.action?.toLowerCase()} ${confirmDialog.count} user(s)? This action cannot be undone.`}
        confirmText={confirmDialog.action}
        type={confirmDialog.action === 'Delete' ? 'danger' : 'warning'}
        isLoading={isProcessing}
      />
    </DashboardLayout>
  );
};

export default Users;