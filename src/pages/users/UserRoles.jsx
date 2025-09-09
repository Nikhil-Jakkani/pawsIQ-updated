import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUsers, 
  FaSearch, 
  FaFilter, 
  FaEllipsisH, 
  FaCheck, 
  FaBan, 
  FaTrash, 
  FaEdit, 
  FaPlus, 
  FaDownload, 
  FaArrowLeft,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaKey,
  FaUserShield,
  FaLock,
  FaUnlock
} from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';
import useApi from '../../hooks/useApi';

const UserRoles = () => {
  const api = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.get('/admin/roles');
        if (!alive) return;
        setRoles(Array.isArray(data?.results) ? data.results : []);
      } catch (e) {
        if (!alive) return;
        setError('Failed to load roles');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [api]);
  
  // Dynamic roles from API
  const rolesData = roles;

  // Filter roles based on search term
  const filteredRoles = rolesData.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Handle bulk actions
  const handleBulkAction = (action) => {
    console.log(`Performing ${action} on roles:`, selectedRoles);
    // In a real app, you would call an API to perform the action
    alert(`${action} action would be performed on ${selectedRoles.length} roles`);
  };

  // Handle view role details
  const handleViewRole = (role) => {
    setCurrentRole(role);
    setShowRoleModal(true);
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
              <h1 className="text-2xl font-bold text-gray-800">User Roles</h1>
              <p className="text-gray-500">Manage role-based access control</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-2 hover:bg-indigo-700 transition-colors"
              onClick={() => alert('Add new role functionality would be implemented here')}
            >
              <FaPlus /> Add New Role
            </button>
            <button 
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors"
              onClick={() => alert('Export functionality would be implemented here')}
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
                onClick={() => handleBulkAction('Delete')}
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

        {/* Roles Table */}
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
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={selectedRoles.includes(role.id)}
                          onChange={() => handleSelectRole(role.id)}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">{role.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">{role.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{role.usersCount} users</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        {Object.entries(role.permissions).some(([_, perms]) => perms.view) && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">View</span>
                        )}
                        {Object.entries(role.permissions).some(([_, perms]) => perms.create) && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Create</span>
                        )}
                        {Object.entries(role.permissions).some(([_, perms]) => perms.edit) && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Edit</span>
                        )}
                        {Object.entries(role.permissions).some(([_, perms]) => perms.delete) && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Delete</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewRole(role)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => alert(`Edit role: ${role.name}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Role"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => alert(`Delete role: ${role.name}`)}
                          className="text-red-600 hover:text-red-900"
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
        </div>

        {/* Role Details Modal */}
        {showRoleModal && currentRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">Role Details: {currentRole.name}</h2>
                  <button 
                    onClick={() => setShowRoleModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Role Name</p>
                      <p className="text-base text-gray-900">{currentRole.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Users with this role</p>
                      <p className="text-base text-gray-900">{currentRole.usersCount}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-base text-gray-900">{currentRole.description}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Permissions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(currentRole.permissions).map(([module, permissions]) => (
                      <div key={module} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 capitalize mb-2">{module}</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">View</span>
                            {permissions.view ? (
                              <FaCheck className="text-green-500" />
                            ) : (
                              <FaBan className="text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Create</span>
                            {permissions.create ? (
                              <FaCheck className="text-green-500" />
                            ) : (
                              <FaBan className="text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Edit</span>
                            {permissions.edit ? (
                              <FaCheck className="text-green-500" />
                            ) : (
                              <FaBan className="text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Delete</span>
                            {permissions.delete ? (
                              <FaCheck className="text-green-500" />
                            ) : (
                              <FaBan className="text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert(`Edit role: ${currentRole.name}`);
                    setShowRoleModal(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Edit Role
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserRoles;