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
  fetchAvailableServices,
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

const ServiceForm = ({ service, availableServices = [], onSubmit, onCancel }) => {
  const isEditing = Boolean(service);
  const [formData, setFormData] = useState({
    serviceId: service?.serviceId ?? '',
    customTitle: service?.customTitle ?? '',
    customDescription: service?.customDescription ?? '',
    isActive: service?.active ?? true,
  });

  const selectedService = availableServices.find(
    (item) => item.services_id === Number(formData.serviceId)
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isEditing && !formData.serviceId) return;

    const payload = isEditing
      ? {
          custom_title: formData.customTitle || undefined,
          custom_description: formData.customDescription || undefined,
          is_active: formData.isActive,
        }
      : {
          services_id: Number(formData.serviceId),
          custom_title: formData.customTitle || undefined,
          custom_description: formData.customDescription || undefined,
          is_active: formData.isActive,
        };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isEditing ? 'Edit Service' : 'Add New Service'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Service from Master List
              </label>
              <select
                name="serviceId"
                value={formData.serviceId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                <option value="">-- Select a service --</option>
                {availableServices.map((item) => (
                  <option key={item.services_id} value={item.services_id}>
                    {item.service_title} — ₹{item.service_price_amt}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose a service from the master list to add it to your offerings.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Title <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              type="text"
              name="customTitle"
              value={formData.customTitle}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Override default title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Description <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              name="customDescription"
              value={formData.customDescription}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Provide additional details"
            />
          </div>

          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-xs text-gray-500">Toggle to show or hide this service to customers.</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="sr-only"
              />
              <span
                className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ${
                  formData.isActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                    formData.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </span>
            </label>
          </div>

          {(isEditing || selectedService) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div>
                <p className="text-xs text-blue-600 uppercase tracking-wide">Base Price</p>
                <p className="text-lg font-semibold text-blue-900">
                  ₹{(isEditing ? service?.price : selectedService?.service_price_amt) ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600 uppercase tracking-wide">Duration</p>
                <p className="text-lg font-semibold text-blue-900">
                  {(isEditing ? service?.duration : selectedService?.service_duration) ?? 0} mins
                </p>
              </div>
            </div>
          )}

          <div className="flex space-x-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors font-semibold"
            >
              {isEditing ? 'Update Service' : 'Add Service'}
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
  const {
    services = [],
    availableServices = [],
    loading = false,
    error = null,
  } = useSelector((state) => state.services || {});

  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);

  useEffect(() => {
    if (authFetch) {
      dispatch(fetchServices({ authFetch }));
      dispatch(fetchAvailableServices({ authFetch }));
    }
  }, [dispatch, authFetch]);

  const handleCreate = (payload) => {
    dispatch(createService({ data: payload, authFetch }))
      .unwrap()
      .then(() => setShowForm(false))
      .catch(() => {});
  };

  const handleEdit = (id) => {
    const service = services.find((s) => s.id === id);
    setEditingService(service);
    setShowForm(true);
  };

  const handleUpdate = (payload) => {
    if (!editingService) return;
    dispatch(
      updateService({
        id: editingService.id,
        data: payload,
        authFetch,
      })
    )
      .unwrap()
      .then(() => {
        setShowForm(false);
        setEditingService(null);
      })
      .catch(() => {});
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
        data: { is_active: !service.active },
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
          <div className="space-y-10">
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

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Available Services to Add</h2>
                <span className="text-sm text-gray-500">{availableServices.length} available</span>
              </div>
              {availableServices.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  You have already added every service from the master list.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableServices.map((svc) => (
                    <div key={svc.services_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{svc.service_title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {svc.service_description || 'No description provided.'}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-600">
                          {svc.service_type || 'Service'}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 mt-4 text-sm text-gray-700">
                        <span className="flex items-center gap-1">
                          <FaRupeeSign className="text-green-600" />₹{svc.service_price_amt}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaClock className="text-blue-600" />{svc.service_duration} mins
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Service Form Modal */}
        {showForm && (
          <ServiceForm
            service={editingService}
            availableServices={availableServices}
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