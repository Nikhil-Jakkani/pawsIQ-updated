import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import ProviderDashboardLayout from './ProviderDashboardLayout';
import {
  FaServicestack,
  FaPlus,
  FaEdit,
  FaTrash,
  FaRupeeSign,
  FaClock,
  FaToggleOn,
  FaToggleOff,
} from 'react-icons/fa';
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
} from '../../store/slices/servicesSlice';

const ServiceCard = ({ service, onEdit, onDelete, onToggle }) => (
  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
      </div>
      <button
        onClick={() => onToggle(service.id)}
        className={`p-2 rounded-lg transition-colors ${
          service.active
            ? 'bg-green-100 text-green-600'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {service.active ? <FaToggleOn /> : <FaToggleOff />}
      </button>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-y border-gray-200">
      <div>
        <p className="flex items-center text-sm text-gray-600">
          <FaRupeeSign className="mr-2 text-green-600" />
          Price: ₹{service.price}
        </p>
      </div>
      <div>
        <p className="flex items-center text-sm text-gray-600">
          <FaClock className="mr-2 text-blue-600" />
          Duration: {service.duration} min
        </p>
      </div>
    </div>

    <div className="mb-4">
      <p className="text-xs text-gray-600">
        Bookings: <span className="font-semibold">{service.bookings || 0}</span>
      </p>
    </div>

    <div className="flex space-x-3">
      <button
        onClick={() => onEdit(service.id)}
        className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
      >
        <FaEdit className="mr-2" />
        Edit
      </button>
      <button
        onClick={() => onDelete(service.id)}
        className="flex-1 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
      >
        <FaTrash className="mr-2" />
        Delete
      </button>
    </div>
  </div>
);

const ServiceForm = ({ service, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(
    service || {
      name: '',
      description: '',
      price: '',
      duration: '',
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {service ? 'Edit Service' : 'Add New Service'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="e.g., Vaccination"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Service description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="30"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors font-semibold"
            >
              {service ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 py-2 rounded-lg transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProviderServices = () => {
  const dispatch = useDispatch();
  const { authFetch } = useAuth();
  const { services = [], loading = false, error = null } = useSelector((state) => state.services || {});
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);

  useEffect(() => {
    if (authFetch) {
      dispatch(fetchServices({ authFetch }));
    }
  }, [dispatch, authFetch]);

  const handleCreate = (formData) => {
    dispatch(createService({ data: formData, authFetch }));
    setShowForm(false);
  };

  const handleEdit = (id) => {
    const service = services.find((s) => s.id === id);
    setEditingService(service);
    setShowForm(true);
  };

  const handleUpdate = (formData) => {
    dispatch(
      updateService({
        id: editingService.id,
        data: formData,
        authFetch,
      })
    );
    setShowForm(false);
    setEditingService(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      dispatch(deleteService({ id, authFetch }));
    }
  };

  const handleToggle = (id) => {
    const service = services.find((s) => s.id === id);
    dispatch(
      updateService({
        id,
        data: { ...service, active: !service.active },
        authFetch,
      })
    );
  };

  return (
    <ProviderDashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Services</h1>
            <p className="text-gray-600 mt-2">Manage your services and pricing.</p>
          </div>
          <button
            onClick={() => {
              setEditingService(null);
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
          >
            <FaPlus className="mr-2" />
            Add Service
          </button>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading services...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaServicestack className="mx-auto text-5xl text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">No services yet</p>
            <p className="text-gray-500 text-sm mt-2">Create your first service to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}

        {/* Service Form Modal */}
        {showForm && (
          <ServiceForm
            service={editingService}
            onSubmit={editingService ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingService(null);
            }}
          />
        )}
      </div>
    </ProviderDashboardLayout>
  );
};

export default ProviderServices;