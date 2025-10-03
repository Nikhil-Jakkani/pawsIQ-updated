import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

// Mock service data for development
const MOCK_SERVICES = [
  {
    id: 1,
    name: 'General Checkup',
    description: 'Comprehensive health examination for your pet',
    price: 500,
    gst: 18,
    duration: 30,
    isActive: true
  },
  {
    id: 2,
    name: 'Vaccination',
    description: 'Essential vaccinations for your pet',
    price: 800,
    gst: 18,
    duration: 20,
    isActive: true
  },
  {
    id: 3,
    name: 'Dental Cleaning',
    description: 'Professional dental cleaning for your pet',
    price: 1500,
    gst: 18,
    duration: 45,
    isActive: true
  }
];

export default function ServiceForm() {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    gst: 18, // Default GST rate
    duration: 30, // Default duration in minutes
    isActive: true,
  });

  // Load available services from master
  useEffect(() => {
    const loadAvailableServices = async () => {
      try {
        // Get serviceId from query params if present
        const urlParams = new URLSearchParams(window.location.search);
        const preselectedServiceId = urlParams.get('serviceId');
        
        const res = await authFetch(`${API_URL}/provider/services/available`);
        if (res.ok) {
          const data = await res.json();
          const services = Array.isArray(data?.items) ? data.items : [];
          setAvailableServices(services);
          
          // If serviceId is in URL, pre-select it
          if (preselectedServiceId) {
            setSelectedServiceId(preselectedServiceId);
            const selected = services.find(s => s.services_id === parseInt(preselectedServiceId));
            if (selected) {
              setFormData({
                name: selected.service_title || '',
                description: selected.service_description || '',
                price: selected.service_price_amt || '',
                gst: 18,
                duration: selected.service_duration || 30,
                isActive: true,
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load available services:', err);
      }
    };
    
    if (!id) {
      loadAvailableServices();
    }
  }, [id, authFetch]);

  // Load service data if in edit mode
  useEffect(() => {
    if (!id) return;
    
    const fetchService = async () => {
      setLoading(true);
      try {
        // Fetch the service offering
        try {
          const res = await authFetch(`${API_URL}/provider/services/${id}`);
          const data = await res.json();
          
          if (!res.ok) {
            throw new Error(data?.message || 'Failed to load service');
          }
          
          setSelectedServiceId(data.services_id);
          setFormData({
            name: data.custom_title || data.service_title || '',
            description: data.custom_description || data.service_description || '',
            price: data.default_price || '',
            gst: 18,
            duration: data.default_duration || 30,
            isActive: data.is_active !== false,
          });
        } catch (apiError) {
          console.warn('API not available, using mock data:', apiError);
          // Fallback to mock data
          const mockService = MOCK_SERVICES.find(s => s.id === parseInt(id));
          if (mockService) {
            setFormData({
              name: mockService.name,
              description: mockService.description,
              price: mockService.price,
              gst: mockService.gst,
              duration: mockService.duration,
              isActive: mockService.isActive,
            });
          } else {
            throw new Error('Service not found');
          }
        }
      } catch (err) {
        console.error('Error loading service:', err);
        setError(err.message || 'Failed to load service details. Using demo data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchService();
  }, [id, authFetch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Service name is required');
      return false;
    }
    if (!formData.price || formData.price <= 0) {
      setError('Price must be greater than 0');
      return false;
    }
    if (formData.gst < 0 || formData.gst > 100) {
      setError('GST must be between 0 and 100');
      return false;
    }
    if (formData.duration <= 0) {
      setError('Duration must be greater than 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let res;
      if (id) {
        // Update existing service offering
        const updatePayload = {
          custom_title: formData.name.trim() || undefined,
          custom_description: formData.description.trim() || undefined,
          is_active: formData.isActive,
        };
        
        res = await authFetch(`${API_URL}/provider/services/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data?.message || 'Failed to update service');
        }
        
        toast.success('Service updated successfully');
      } else {
        // Create new service offering
        if (!selectedServiceId) {
          throw new Error('Please select a service from the master list');
        }
        
        const offeringPayload = {
          services_id: parseInt(selectedServiceId),
          custom_title: formData.name.trim() || undefined,
          custom_description: formData.description.trim() || undefined,
          is_active: formData.isActive,
        };
        
        res = await authFetch(`${API_URL}/provider/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(offeringPayload),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data?.message || 'Failed to create service');
        }
        
        toast.success('Service created successfully');
      }
      
      // Redirect back to services list immediately
      navigate('/provider/vet/services');
    } catch (err) {
      console.error('Error saving service:', err);
      setError(err.message || 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
        <h2 className="text-xl font-semibold">
          {id ? 'Edit Service' : 'Add New Service'}
        </h2>
      </div>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {!id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Service from Master List <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    const selected = availableServices.find(s => s.services_id === parseInt(e.target.value));
                    if (selected) {
                      setFormData({
                        ...formData,
                        name: selected.service_title || '',
                        description: selected.service_description || '',
                        price: selected.service_price_amt || '',
                        duration: selected.service_duration || 30,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                  required
                >
                  <option value="">-- Select a service --</option>
                  {availableServices.map(service => (
                    <option key={service.services_id} value={service.services_id}>
                      {service.service_title} - ₹{service.service_price_amt}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select a service from the master list. You can customize the title and description below.
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Service Name {!id && '(Optional)'}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Leave empty to use default name"
                disabled={loading || (!id && !selectedServiceId)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Customize the service name for your practice (optional)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Description {!id && '(Optional)'}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Leave empty to use default description"
                disabled={loading || (!id && !selectedServiceId)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Customize the description for your practice (optional)
              </p>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Active (visible to customers)
              </label>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Price (₹) <span className="text-gray-400">(From Master)</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  className="pl-7 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  placeholder="0.00"
                  disabled
                  readOnly
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Price is set in the master service list and cannot be changed here
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST % <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  name="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="18"
                  disabled={loading}
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes) <span className="text-gray-400">(From Master)</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  placeholder="30"
                  disabled
                  readOnly
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">minutes</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Duration is set in the master service list
              </p>
            </div>
            
            <div className="mt  -2 bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Price Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Base Price:</span>
                <span className="text-right">₹{parseFloat(formData.price || 0).toFixed(2)}</span>
                
                <span className="text-gray-600">GST ({formData.gst}%):</span>
                <span className="text-right">
                  ₹{((formData.price || 0) * (formData.gst || 0) / 100).toFixed(2)}
                </span>
                
                <span className="font-medium text-gray-900">Total Price:</span>
                <span className="font-medium text-right text-gray-900">
                  ₹{((formData.price || 0) * (1 + (formData.gst || 0) / 100)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/provider/vet/services')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            <FaTimes className="inline mr-1" /> Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              'Saving...'
            ) : (
              <>
                <FaSave className="inline mr-1" />
                {id ? 'Update Service' : 'Add Service'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
