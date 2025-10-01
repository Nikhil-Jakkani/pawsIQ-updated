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
      
      // Fetch provider profile to get provider type
      const profileRes = await authFetch(`${API_URL}/provider/me`);
      const profile = profileRes.ok ? await profileRes.json() : null;
      const providerType = (profile?.serv_provider_type || 'veterinarian').toLowerCase();
      
      // Fetch available services and current offerings in parallel
      const [availableRes, offeringsRes] = await Promise.all([
        authFetch(`${API_URL}/provider/services/available`),
        authFetch(`${API_URL}/provider/services`)
      ]);
      
      const availableData = availableRes.ok ? await availableRes.json() : { items: [] };
      const offeringsData = offeringsRes.ok ? await offeringsRes.json() : { items: [] };
      
      const availableServices = Array.isArray(availableData?.items) ? availableData.items : [];
      const offerings = Array.isArray(offeringsData?.items) ? offeringsData.items : [];
      
      // Filter services by provider type
      const filterByType = (service) => {
        const serviceType = (service.service_type || '').toLowerCase();
        const serviceSubType = (service.service_sub_type || '').toLowerCase();
        
        // Match provider type with service type
        if (providerType.includes('vet') || providerType.includes('veterinarian')) {
          return serviceType.includes('vet') || serviceType.includes('medical') || 
                 serviceType.includes('health') || serviceType.includes('consultation');
        }
        if (providerType.includes('groomer') || providerType.includes('grooming')) {
          return serviceType.includes('groom') || serviceType.includes('bath') || 
                 serviceType.includes('styling');
        }
        if (providerType.includes('trainer') || providerType.includes('training')) {
          return serviceType.includes('train') || serviceType.includes('behavior');
        }
        if (providerType.includes('boarding') || providerType.includes('sitter')) {
          return serviceType.includes('board') || serviceType.includes('sitting') || 
                 serviceType.includes('daycare');
        }
        return true; // Show all if type unknown
      };
      
      // Filter and combine services
      const filteredAvailable = availableServices.filter(filterByType);
      const allServices = [...offerings, ...filteredAvailable];
      
      // Normalize the data
      const normalized = allServices.map((s) => {
        const isOffering = !!s.offering_id;
        return {
          id: s.offering_id || `available-${s.services_id}`,
          servicesId: s.services_id,
          name: s.custom_title || s.service_title || 'Service',
          description: s.custom_description || s.service_description || '',
          price: Number(s.default_price || s.service_price_amt || 0),
          gst: 18, // Default GST for veterinary services in India
          duration: Number(s.default_duration || s.service_duration || 30),
          isActive: isOffering ? (s.is_active !== false) : false,
          isOffered: isOffering,
          offeringId: s.offering_id,
          serviceType: s.service_type || '',
        };
      });
      
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

  // Separate services into offered and available
  const offeredServices = items.filter(s => s.isOffered);
  const availableServices = items.filter(s => !s.isOffered);

  return (
    <VetLayout title="Services & Pricing (GST)">
      <div className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}

        {/* My Services (Currently Offered) */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">My Services</h2>
            <div className="text-sm text-gray-600">Prices in INR; GST added as applicable</div>
          </div>
          
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
              ) : offeredServices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No services offered yet. Add services from the "Available Services" section below.
                  </td>
                </tr>
              ) : (
                offeredServices.map((service) => {
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
                        {service.isOffered ? (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-50 text-blue-600">
                            Not Offered
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {service.isOffered ? (
                            <>
                              <button
                                onClick={() => handleEdit(service.offeringId)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Edit service"
                              >
                                <FaEdit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(service.offeringId)}
                                className="text-red-600 hover:text-red-900"
                                title="Remove from your offerings"
                                disabled={loading}
                              >
                                <FaTrash className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => navigate(`/provider/vet/services/new?serviceId=${service.servicesId}`)}
                              className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                              title="Add to your offerings"
                            >
                              <FaPlus className="inline mr-1" /> Add
                            </button>
                          )}
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

        {/* Available Services to Add */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Available Services to Add</h2>
            <div className="text-sm text-gray-600">{availableServices.length} services available</div>
          </div>
          
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
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {availableServices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    All available services have been added to your offerings.
                  </td>
                </tr>
              ) : (
                availableServices.map((service) => {
                  const total = service.price + (service.price * service.gst) / 100;
                  return (
                    <tr key={service.id}>
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`/provider/vet/services/new?serviceId=${service.servicesId}`)}
                          className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          title="Add to your offerings"
                        >
                          <FaPlus className="inline mr-1" /> Add Service
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </VetLayout>
  );
}