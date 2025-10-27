import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import ProviderDashboardLayout from './ProviderDashboardLayout';
import { FaUser, FaSearch, FaEye, FaPhone, FaEnvelope } from 'react-icons/fa';
import { fetchClients, setFilters } from '../../store/slices/clientsSlice';

const ClientCard = ({ client, onView }) => (
  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-center mb-4">
      <img
        src={client.profilePhoto || 'https://via.placeholder.com/48'}
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
  const { clients = [], filters = {}, loading = false, error = null } = useSelector((state) => state.clients || {});
  const [searchTerm, setSearchTerm] = useState('');

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
    console.log('View client:', id);
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
      </div>
    </ProviderDashboardLayout>
  );
};

export default ProviderClients;