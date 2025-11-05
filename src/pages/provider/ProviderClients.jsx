import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import ProviderDashboardLayout from './ProviderDashboardLayout';
import { FaUser, FaSearch, FaEye, FaPhone, FaEnvelope } from 'react-icons/fa';
import { fetchClients, setFilters } from '../../store/slices/clientsSlice';

const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e2e8f0" width="100" height="100"/><circle cx="50" cy="38" r="20" fill="%2394a3b8"/><path d="M15 88c5-20 65-20 70 0" fill="%2394a3b8"/></svg>';

const ClientCard = ({ client, onView }) => (
  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-center mb-4">
      <img
        src={client.profilePhoto || DEFAULT_AVATAR}
        alt={client.name}
        className="w-12 h-12 rounded-full object-cover mr-4"
      />
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
        <p className="text-sm text-gray-600">Pets: {client.petCount || 0}</p>
      </div>
    </div>

    <div className="space-y-2 mb-4">
      <p className="flex items-center text-sm text-gray-700">
        <FaPhone className="mr-2 text-blue-600" />
        {client.phone}
      </p>
      <p className="flex items-center text-sm text-gray-700">
        <FaEnvelope className="mr-2 text-blue-600" />
        {client.email}
      </p>
    </div>

    <div className="mb-4">
      <p className="text-xs text-gray-600">Total Appointments: {client.totalAppointments || 0}</p>
      <p className="text-xs text-gray-600">Join Date: {client.joinDate || 'N/A'}</p>
    </div>

    <button
      onClick={() => onView(client.id)}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors flex items-center justify-center"
    >
      <FaEye className="mr-2" />
      View Details
    </button>
  </div>
);

const ProviderClients = () => {
  const dispatch = useDispatch();
  const { authFetch } = useAuth();
  const {
    clients = [],
    filters = {},
    loading = false,
    error = null,
  } = useSelector((state) => state.clients || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    if (authFetch) {
      dispatch(fetchClients({ filters, authFetch }));
    }
  }, [dispatch, authFetch]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    dispatch(setFilters({ search: value }));
  };

  const handleView = (id) => {
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    setSelectedClient(client);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedClient(null);
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProviderDashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-2">Manage and view all your clients.</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients by name..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Clients</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{clients.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Active This Month</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {clients.filter((c) => c.activeThisMonth).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">New This Month</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {clients.filter((c) => c.newThisMonth).length}
            </p>
          </div>
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading clients...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaUser className="mx-auto text-5xl text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">No clients found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onView={handleView}
              />
            ))}
          </div>
        )}

        {showDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6 relative">
              <button
                onClick={handleCloseDetails}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Client Details</h2>
              {selectedClient ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedClient.name}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-800">{selectedClient.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-gray-800">{selectedClient.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Pets</p>
                      <p className="text-gray-800">{selectedClient.petCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Appointments</p>
                      <p className="text-gray-800">{selectedClient.totalAppointments}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Joined</p>
                      <p className="text-gray-800">{selectedClient.joinDate || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Select a client to view details.</p>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCloseDetails}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProviderDashboardLayout>
  );
};

export default ProviderClients;