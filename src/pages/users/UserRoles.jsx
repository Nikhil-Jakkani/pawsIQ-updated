import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUsers, 
  FaSearch, 
  FaPlus, 
  FaDownload, 
  FaArrowLeft,
  FaEye,
  FaEdit,
  FaTrash,
  FaUserShield,
  FaLock,
  FaUnlock,
  FaCheck
} from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';
import useApi from '../../hooks/useApi';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/Toast';

const UserRoles = () => {
  const api = useApi();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, roleId: null });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form state for role creation/editing
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: []
  });
  
  // Available permissions list
  const availablePermissions = [
    { id: 'users.view', label: 'View Users', category: 'Users' },
    { id: 'users.create', label: 'Create Users', category: 'Users' },
    { id: 'users.edit', label: 'Edit Users', category: 'Users' },
    { id: 'users.delete', label: 'Delete Users', category: 'Users' },
    { id: 'providers.view', label: 'View Providers', category: 'Providers' },
    { id: 'providers.approve', label: 'Approve Providers', category: 'Providers' },
    { id: 'providers.edit', label: 'Edit Providers', category: 'Providers' },
    { id: 'providers.delete', label: 'Delete Providers', category: 'Providers' },
    { id: 'bookings.view', label: 'View Bookings', category: 'Bookings' },
    { id: 'bookings.manage', label: 'Manage Bookings', category: 'Bookings' },
    { id: 'payments.view', label: 'View Payments', category: 'Payments' },
    { id: 'payments.manage', label: 'Manage Payments', category: 'Payments' },
    { id: 'analytics.view', label: 'View Analytics', category: 'Analytics' },
    { id: 'settings.manage', label: 'Manage Settings', category: 'Settings' }
  ];
  
  // Fetch roles from API
  useEffect(() => {
    fetchRoles();
  }, []);
  
  const fetchRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/admin/roles');
      setRoles(Array.isArray(data) ? data : data?.results || []);
    } catch (e) {
      console.error('Failed to load roles:', e);
      setError('Failed to load roles');
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  // Filter roles based on search term
  const filteredRoles = roles.filter(role => 
    role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(filteredRoles.map(role => role.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle individual role selection
  const handleSelectRole = (roleId) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter(id => id !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  // Handle create/edit role
  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) {
      toast.warning('Please enter a role name');
      return;
    }
    
    setIsProcessing(true);
    try {
      if (currentRole) {
        // Update existing role
        await api.patch(`/admin/roles/${currentRole.id}`, roleForm);
        toast.success('Role updated successfully');
      } else {
        // Create new role
        await api.post('/admin/roles', roleForm);
        toast.success('Role created successfully');
      }
      
      setShowRoleModal(false);
      setCurrentRole(null);
      setRoleForm({ name: '', description: '', permissions: [] });
      fetchRoles();
    } catch (err) {
      console.error('Failed to save role:', err);
      toast.error('Failed to save role');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete role
  const handleDeleteRole = async () => {
    const { roleId } = confirmDialog;
    setIsProcessing(true);
    
    try {
      await api.delete(`/admin/roles/${roleId}`);
      setRoles(roles.filter(r => r.id !== roleId));
      toast.success('Role deleted successfully');
    } catch (err) {
      console.error('Failed to delete role:', err);
      toast.error('Failed to delete role. It may be assigned to users.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Open edit modal
  const handleEditRole = (role) => {
    setCurrentRole(role);
    setRoleForm({
      name: role.name || '',
      description: role.description || '',
      permissions: role.permissions || []
    });
    setShowRoleModal(true);
  };

  // Open create modal
  const handleCreateRole = () => {
    setCurrentRole(null);
    setRoleForm({ name: '', description: '', permissions: [] });
    setShowRoleModal(true);
  };

  // Toggle permission
  const togglePermission = (permissionId) => {
    if (roleForm.permissions.includes(permissionId)) {
      setRoleForm({
        ...roleForm,
        permissions: roleForm.permissions.filter(p => p !== permissionId)
      });
    } else {
      setRoleForm({
        ...roleForm,
        permissions: [...roleForm.permissions, permissionId]
      });
    }
  };

  // Group permissions by category
  const groupedPermissions = availablePermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

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
              <h1 className="text-2xl font-bold text-gray-800">User Roles</h1>
              <p className="text-gray-500">Manage role-based access control</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-2 hover:bg-indigo-700 transition-colors"
              onClick={handleCreateRole}
            >
              <FaPlus /> Add New Role
            </button>
            <button 
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors"
              onClick={() => toast.info('Export functionality coming soon')}
            >
              <FaDownload /> Export
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search roles..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRoles.length > 0 && (
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200 flex flex-wrap items-center justify-between gap-4">
            <div className="text-indigo-700 font-medium">
              {selectedRoles.length} roles selected
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm flex items-center gap-1 hover:bg-red-700 transition-colors"
                onClick={() => toast.warning('Bulk delete not implemented yet')}
              >
                <FaTrash size={12} /> Delete
              </button>
              <button 
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setSelectedRoles([]);
                  setSelectAll(false);
                }}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading roles...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Roles Table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={selectAll}
                          onChange={handleSelectAll}
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={selectedRoles.includes(role.id)}
                          onChange={() => handleSelectRole(role.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaUserShield className="text-indigo-600 mr-2" />
                          <span className="font-medium text-gray-900">{role.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{role.description || 'No description'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{role.userCount || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {role.permissions?.length || 0} permissions
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          <button 
                            className="text-indigo-600 hover:text-indigo-900"
                            onClick={() => handleEditRole(role)}
                            title="Edit Role"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => setConfirmDialog({ isOpen: true, action: 'Delete', roleId: role.id })}
                            title="Delete Role"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredRoles.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-gray-500">No roles found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Role Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setCurrentRole(null);
          setRoleForm({ name: '', description: '', permissions: [] });
        }}
        title={currentRole ? 'Edit Role' : 'Create New Role'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role Name *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              placeholder="e.g., Content Moderator"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="3"
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              placeholder="Describe the role and its responsibilities..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="border border-gray-300 rounded-md p-4 max-h-96 overflow-y-auto">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                  <div className="space-y-2 ml-4">
                    {perms.map((perm) => (
                      <label key={perm.id} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={roleForm.permissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                        />
                        <span className="ml-2 text-sm text-gray-700">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setShowRoleModal(false);
                setCurrentRole(null);
                setRoleForm({ name: '', description: '', permissions: [] });
              }}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRole}
              disabled={isProcessing}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Saving...' : (currentRole ? 'Update Role' : 'Create Role')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null, roleId: null })}
        onConfirm={handleDeleteRole}
        title="Delete Role"
        message="Are you sure you want to delete this role? Users with this role will lose their permissions."
        confirmText="Delete"
        type="danger"
        isLoading={isProcessing}
      />
    </DashboardLayout>
  );
};

export default UserRoles;
