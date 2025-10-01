import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import VetLayout from './VetLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';
const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export default function VetServices() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch provider's service offerings from the new API
      const servicesRes = await authFetch(`${API_URL}/provider/services`);
      if (!servicesRes.ok) {
        throw new Error('Failed to load services');
      }
      const data = await servicesRes.json();
      
      const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      const normalized = list.map((s) => ({
        id: s.offering_id || s.id,
        name: s.custom_title || s.service_title || 'Service',
        description: s.custom_description || s.service_description || '',
        price: Number(s.default_price ?? 0),
        gst: 18, // Default GST for veterinary services in India
        duration: Number(s.default_duration ?? 30),
        isActive: s.is_active !== false,
      }));
      
      setItems(normalized);
    } catch (e) {
      console.error('Error in fetchServices:', e);
      setError(e.message || 'Failed to load services');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [authFetch]);
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await authFetch(`${API_URL}/provider/services/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to delete service');
      }
      
      toast.success('Service deleted successfully');
      await fetchServices(); // Reload the list
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(err.message || 'Failed to delete service');
      toast.error(err.message || 'Failed to delete service');
    }
  };

  const handleEdit = async (id) => {
    navigate(`/provider/vet/services/${id}/edit`);
  };

  return (
    <VetLayout title="Services & Pricing (GST)">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <Link
            to="/provider/vet/services/new"
            className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaPlus className="mr-1" /> Add Service
          </Link>
          <div className="text-sm text-gray-600">Prices in INR; GST added as applicable</div>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded mb-3">
            {error}
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GST %
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading services...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No services found. Click "Add Service" to get started.
                  </td>
                </tr>
              ) : (
                items.map((service) => {
                  const total = service.price + (service.price * service.gst) / 100;
                  return (
                    <tr key={service.id} className={!service.isActive ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{service.name}</div>
                            {service.description && (
                              <div className="text-xs text-gray-500 line-clamp-1">{service.description}</div>
                            )}
                            <div className="text-xs text-gray-500">{service.duration} min</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {INR.format(service.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {service.gst}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {INR.format(total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(service.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit service"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete service"
                            disabled={loading}
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </VetLayout>
  );
}