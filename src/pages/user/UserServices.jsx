import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaSearch, FaStar, FaFilter, FaCalendarAlt, FaPhone, FaGlobe, FaHeart, FaRegHeart, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';

const UserServices = () => {
  const navigate = useNavigate();
  const api = useApi();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDistance, setFilterDistance] = useState('any');
  const [filterRating, setFilterRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState([2, 5]);
  const [serviceProviders, setServiceProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch service providers from backend
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch all active providers
        const response = await api.get('/admin/piq/providers');
        
        if (response && response.providers) {
          // Transform API data to match component format
          const transformedProviders = response.providers
            .filter(p => p.serv_provider_status === 'active') // Only show active providers
            .map(p => ({
              id: Number(p.service_provider_id),
              name: p.serv_provider_name || 'Service Provider',
              type: (p.serv_provider_type || '').toLowerCase().trim(),
              image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
              rating: 4.8, // TODO: Calculate from reviews
              reviewCount: 0, // TODO: Count from reviews
              distance: 0, // TODO: Calculate from location
              address: p.serv_provider_location || 'N/A',
              phone: p.serv_provider_contact || 'N/A',
              website: p.serv_provider_website || '',
              services: [], // TODO: Fetch provider service offerings
              description: p.serv_provider_desc || 'Professional pet care services'
            }));
          
          setServiceProviders(transformedProviders);
        }
      } catch (err) {
        console.error('Failed to load providers:', err);
        setError('Failed to load service providers. Please try again.');
        setServiceProviders([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProviders();
  }, [api]);
  
  // Filter service providers based on search and filters
  const filteredProviders = serviceProviders.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          provider.services.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || provider.type === filterType;
    
    const matchesDistance = filterDistance === 'any' || 
                            (filterDistance === '1' && provider.distance <= 1) ||
                            (filterDistance === '3' && provider.distance <= 3) ||
                            (filterDistance === '5' && provider.distance <= 5);
    
    const matchesRating = provider.rating >= filterRating;
    
    return matchesSearch && matchesType && matchesDistance && matchesRating;
  });
  
  // Toggle favorite status
  const toggleFavorite = (id) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };
  
  // Service type options - standardized 6 types
  const serviceTypes = [
    { value: 'all', label: 'All Services' },
    { value: 'veterinary', label: 'Veterinary' },
    { value: 'diagnostic services', label: 'Diagnostic Services' },
    { value: 'boarding', label: 'Boarding' },
    { value: 'grooming', label: 'Grooming' },
    { value: 'training', label: 'Training' },
    { value: 'physical activity', label: 'Physical Activity' }
  ];
  
  // Distance options
  const distanceOptions = [
    { value: 'any', label: 'Any Distance' },
    { value: '1', label: 'Within 1 mile' },
    { value: '3', label: 'Within 3 miles' },
    { value: '5', label: 'Within 5 miles' }
  ];
  
  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <FaMapMarkerAlt className="text-green-600 text-2xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Find Pet Services</h1>
            </div>
            <p className="text-gray-500 mt-1">Discover and book services for your pets</p>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for services, providers, etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {serviceTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <FaFilter className="text-gray-500" />
                <span>Filters</span>
                {showFilters ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
              </button>
            </div>
          </div>
          
          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance
                </label>
                <select
                  value={filterDistance}
                  onChange={(e) => setFilterDistance(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {distanceOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Rating
                </label>
                <div className="flex items-center gap-2">
                  {[0, 3, 3.5, 4, 4.5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setFilterRating(rating)}
                      className={`px-3 py-1 rounded-lg border ${
                        filterRating === rating 
                          ? 'bg-green-100 border-green-500 text-green-700' 
                          : 'border-gray-300 hover:border-green-300'
                      }`}
                    >
                      {rating === 0 ? 'Any' : rating+'+'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterDistance('any');
                    setFilterRating(0);
                  }}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading service providers...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && !loading && (
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
        
        {/* Service Provider Cards */}
        {!loading && !error && filteredProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map(provider => (
              <div 
                key={provider.id} 
                className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={provider.image} 
                    alt={provider.name} 
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => toggleFavorite(provider.id)}
                    className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  >
                    {favorites.includes(provider.id) ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FaRegHeart className="text-gray-500" />
                    )}
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    <div className="flex items-center gap-1 text-white">
                      <FaStar className="text-yellow-400" />
                      <span className="font-medium">{provider.rating}</span>
                      <span className="text-sm">({provider.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800">{provider.name}</h3>
                  <div className="flex items-center gap-1 text-gray-600 text-sm mt-1">
                    <FaMapMarkerAlt />
                    <span>{provider.distance} miles away</span>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {provider.services.slice(0, 3).map((service, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium"
                        >
                          {service}
                        </span>
                      ))}
                      {provider.services.length > 3 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium">
                          +{provider.services.length - 3} more
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">{provider.description}</p>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => window.open(`tel:${provider.phone}`)}
                      className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <FaPhone />
                      <span>Call</span>
                    </button>
                    <button 
                      onClick={() => window.open(`https://${provider.website}`, '_blank')}
                      className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <FaGlobe />
                      <span>Website</span>
                    </button>
                    <button 
                      onClick={() => navigate('/user/appointments/new')}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <FaCalendarAlt />
                      <span>Book</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && !error ? (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <div className="bg-green-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
              <FaMapMarkerAlt className="text-green-600 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No services found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' || filterDistance !== 'any' || filterRating > 0
                ? "No services match your search criteria. Try adjusting your filters."
                : "We couldn't find any pet services in your area. Please try a different location."}
            </p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterDistance('any');
                setFilterRating(0);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <FaFilter />
              Reset Filters
            </button>
          </div>
        ) : null}
      </div>
    </UserLayout>
  );
};

export default UserServices;