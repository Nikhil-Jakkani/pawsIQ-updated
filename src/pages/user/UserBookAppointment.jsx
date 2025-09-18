import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaArrowLeft, FaPaw, FaMapMarkerAlt, FaClock, FaMoneyBillWave, FaCheck, FaChevronRight, FaCalendarCheck, FaSearch, FaFilter, FaUserMd, FaCut, FaDog, FaHome, FaWalking } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const UserBookAppointment = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    petId: '',
    serviceType: '',
    serviceId: '',
    providerId: '',
    date: '',
    timeSlot: '',
    notes: ''
  });

  // Auth and pets from backend
  const { currentUser, tokens, authFetch } = useAuth();
  const accessToken = tokens?.access?.token;
  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [error, setError] = useState('');
  // dynamic services/providers
  const [allServices, setAllServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  useEffect(() => {
    const fetchPets = async () => {
      setError('');
      // Fallback to local mock pets if no access token
      if (!accessToken) {
        const localPets = Array.isArray(currentUser?.pets)
          ? currentUser.pets.map((p) => ({
              id: Number(p.id),
              name: p.name || 'Pet',
              type: (p.type || '').toLowerCase(),
              breed: p.breed || '',
              imagePath: '',
              image: 'https://placehold.co/600x400?text=Pet',
            }))
          : [];
        setPets(localPets);
        return;
      }

      setLoadingPets(true);
      try {
        const res = await authFetch(`${API_URL}/user/profile`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Failed to load pets');
        const mapped = (data?.pets || []).map((p) => ({
          id: Number(p.pet_id ?? p.id),
          name: p.pet_name || p.name || 'Pet',
          type: (p.pet_type || p.type || '').toLowerCase(),
          breed: p.pet_breed || p.breed || '',
          imagePath: p.pet_image || p.imagePath || '',
          image: 'https://placehold.co/600x400?text=Pet',
        }));
        // resolve signed image URLs (6 days)
        const withUrls = await Promise.all(
          mapped.map(async (pet) => {
            if (!pet.imagePath) return pet;
            try {
              const qs = new URLSearchParams({ bucket: 'pets-photos', path: pet.imagePath, expiresIn: String(60 * 60 * 24 * 6) }).toString();
              const urlRes = await authFetch(`${API_URL}/media/signed-url?${qs}`);
              const urlPayload = await urlRes.json().catch(() => ({}));
              if (urlRes.ok && urlPayload?.url) return { ...pet, image: urlPayload.url };
            } catch {
              // Ignore errors when resolving signed image URLs
            }
            return pet;
          })
        );
        setPets(withUrls);
      } catch (e) {
        setError(e.message || 'Failed to load pets');
        // Fallback to local mock pets if available
        const localPets = Array.isArray(currentUser?.pets)
          ? currentUser.pets.map((p) => ({
              id: Number(p.id),
              name: p.name || 'Pet',
              type: (p.type || '').toLowerCase(),
              breed: p.breed || '',
              imagePath: '',
              image: 'https://placehold.co/600x400?text=Pet',
            }))
          : [];
        if (localPets.length) setPets(localPets);
      } finally {
        setLoadingPets(false);
      }
    };
    fetchPets();
  }, [accessToken]);

  // Load services from backend
  useEffect(() => {
    const fetchServices = async () => {
      if (!accessToken) return;
      try {
        setLoadingServices(true);
        const res = await authFetch(`${API_URL}/services`);
        const data = await res.json().catch(() => ({}));
        const items = Array.isArray(data?.items) ? data.items : [];
        setAllServices(items);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, [accessToken]);

  const iconByType = (type) => {
    const t = String(type || '').toLowerCase();
    if (t.includes('vet')) return FaUserMd;
    if (t.includes('groom')) return FaCut;
    if (t.includes('train')) return FaDog;
    if (t.includes('board')) return FaHome;
    if (t.includes('day')) return FaPaw;
    if (t.includes('walk')) return FaWalking;
    return FaPaw;
  };

  const serviceTypes = React.useMemo(() => {
    const uniq = new Map();
    for (const s of allServices) {
      const key = (s.service_type || 'Other').trim();
      if (!uniq.has(key)) uniq.set(key, { id: key.toLowerCase(), name: key, icon: iconByType(key), description: s.service_description || '' });
    }
    return Array.from(uniq.values());
  }, [allServices]);

  const filteredServices = React.useMemo(() => {
    if (!formData.serviceType) return allServices;
    const key = formData.serviceType.toLowerCase();
    return allServices.filter((s) => String(s.service_type || '').toLowerCase() === key);
  }, [allServices, formData.serviceType]);

  // When a service type is selected, auto-select the first specific service and load providers
  useEffect(() => {
    if (!formData.serviceType) return;
    if (!filteredServices || filteredServices.length === 0) return;
    // If no serviceId chosen yet or the chosen one isn't in the filtered list, pick the first
    const first = filteredServices[0];
    if (!formData.serviceId || !filteredServices.some(s => s.services_id === Number(formData.serviceId))) {
      (async () => {
        await handleServiceSelect(first.services_id);
      })();
    }
  }, [formData.serviceType, filteredServices]);

  // providers are loaded dynamically based on selected serviceId

  const availableDates = React.useMemo(() => {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }, []);

  const timeSlots = [
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
  ];

  // Currency formatter for INR
  const formatINR = (value) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle pet selection
  const handlePetSelect = (petId) => {
    setFormData({
      ...formData,
      petId
    });
  };

  // Handle service type selection
  const handleServiceTypeSelect = (serviceType) => {
    setFormData({
      ...formData,
      serviceType,
      serviceId: '',
      providerId: ''
    });
  };

  // Handle specific service selection
  const handleServiceSelect = async (serviceId) => {
    setFormData({
      ...formData,
      serviceId
    });
    // load providers for this service
    if (!serviceId) return;
    try {
      setLoadingProviders(true);
      const res = await authFetch(`${API_URL}/services/${serviceId}/providers`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const items = Array.isArray(data?.items) ? data.items : [];
        // normalize for UI
        setProviders(items.map(p => ({
          id: p.service_provider_id,
          name: p.serv_provider_name || 'Provider',
          title: p.serv_provider_type || 'Service Provider',
          image: 'https://placehold.co/128x128?text=Provider',
          location: p.provider_src || '—',
          address: p.serv_provider_desc || '—',
          rating: 4.8,
          reviewCount: 0,
        })));
      } else {
        setProviders([]);
      }
    } finally {
      setLoadingProviders(false);
    }
  };

  // Handle provider selection
  const handleProviderSelect = (providerId) => {
    setFormData({
      ...formData,
      providerId
    });
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setFormData({
      ...formData,
      date
    });
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot) => {
    setFormData({
      ...formData,
      timeSlot
    });
  };

  // Move to next step
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };

  // Move to previous step
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  // Combine date and time to ISO string
  const combineDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return '';
    const [time, meridiem] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (meridiem && meridiem.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (meridiem && meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
    const d = new Date(`${dateStr}T00:00:00`);
    d.setHours(hours, minutes || 0, 0, 0);
    return d.toISOString();
  };

  // Map selected service to backend enum
  const mapToAppointmentType = () => {
    const st = formData.serviceType;
    const sid = formData.serviceId;
    if (st === 'grooming') return 'Grooming';
    if (st === 'training') return 'Training';
    if (st === 'vet') {
      if (sid === 'vet2') return 'Vaccination';
      return 'Checkup';
    }
    return 'Others';
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessToken) return;
    setIsSubmitting(true);
    try {
      const booked_dtm = combineDateTime(formData.date, formData.timeSlot);
      const dt = new Date(booked_dtm);
      if (!booked_dtm || Number.isNaN(dt.getTime()) || dt.getTime() <= Date.now()) {
        throw new Error('Date for booking needs to be a future date/time');
      }
      const payload = {
        pet_id: Number(formData.petId),
        services_id: Number(formData.serviceId),
        service_provider_id: formData.providerId ? Number(formData.providerId) : undefined,
        booked_dtm,
        booking_comments: formData.notes?.trim() || undefined,
      };
      const res = await authFetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to create booking');
      navigate('/user/appointments');
    } catch (err) {
      alert(err.message || 'Failed to create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected service details
  const getSelectedService = () => {
    if (!formData.serviceType || !formData.serviceId) return null;
    const id = Number(formData.serviceId);
    return filteredServices.find(service => service.services_id === id) || null;
  };

  // Get selected provider details
  const getSelectedProvider = () => {
    if (!formData.providerId) return null;
    return providers.find(provider => provider.id === parseInt(formData.providerId));
  };

  // Get selected pet details
  const getSelectedPet = () => {
    if (!formData.petId) return null;
    return pets.find(pet => pet.id === parseInt(formData.petId));
  };

  // Render step content
  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Select Your Pet</h2>
            <p className="text-gray-600">Choose which pet needs an appointment</p>
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}
            {loadingPets && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 text-sm text-gray-600">Loading pets...</div>
            )}
            {!loadingPets && pets.length === 0 && !error && (
              <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg p-3 text-sm">
                No pets found. Please add a pet to continue.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map(pet => (
                <div 
                  key={pet.id}
                  onClick={() => handlePetSelect(pet.id)}
                  className={`bg-white rounded-xl overflow-hidden border cursor-pointer transition-all
                    ${formData.petId === pet.id 
                      ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                >
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={pet.image} 
                      alt={pet.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        if (e.currentTarget.dataset.refreshed || !pet.imagePath) return;
                        e.currentTarget.dataset.refreshed = '1';
                        // lazy refresh of signed URL
                        (async () => {
                          try {
                            const qs = new URLSearchParams({ bucket: 'pets-photos', path: pet.imagePath, expiresIn: String(60 * 60 * 24 * 6) }).toString();
                            const urlRes = await fetch(`${API_URL}/media/signed-url?${qs}`, {
                              headers: { Authorization: `Bearer ${accessToken}` },
                            });
                            const urlPayload = await urlRes.json().catch(() => ({}));
                            if (urlRes.ok && urlPayload?.url) {
                              setPets((prev) => prev.map((p) => (p.id === pet.id ? { ...p, image: urlPayload.url } : p)));
                            }
                          } catch {
                            // Ignore errors when resolving signed image URLs
                          }       
                        })();
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800">{pet.name}</h3>
                    <p className="text-gray-600">{pet.breed}</p>
                    <p className="text-gray-500 text-sm capitalize">{pet.type}</p>
                    
                    {formData.petId === pet.id && (
                      <div className="mt-2 text-blue-600 flex items-center gap-1">
                        <FaCheck />
                        <span className="text-sm font-medium">Selected</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div 
                onClick={() => navigate('/user/pets/add')}
                className="bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                  <FaPaw className="text-blue-600 text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Add a New Pet</h3>
                <p className="text-gray-500 text-sm text-center mt-1">
                  Don't see your pet? Add a new pet profile
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={nextStep}
                disabled={!formData.petId}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2
                  ${!formData.petId ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>Continue</span>
                <FaChevronRight />
              </button>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Find a Service</h2>
            <p className="text-gray-600">Search and select a service to continue booking</p>

            {/* Service Selection */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search services (e.g., vaccination, grooming, training)"
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) => {
                      const q = e.target.value.toLowerCase();
                      // if user types, soft-select the first matching type
                      const typeMatch = serviceTypes.find(t => t.name.toLowerCase().includes(q));
                      if (typeMatch) {
                        handleServiceTypeSelect(typeMatch.id);
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-500" />
                  <select
                    value={formData.serviceType}
                    onChange={(e) => handleServiceTypeSelect(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    {serviceTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Service Type quick-picks */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {serviceTypes.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleServiceTypeSelect(type.id)}
                    className={`text-left p-3 rounded-lg border transition-all hover:shadow-sm ${formData.serviceType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                  >
                    <div className="text-xl text-blue-600"><type.icon /></div>
                    <div className="text-sm font-medium mt-1">{type.name}</div>
                    <div className="text-xs text-gray-500 line-clamp-2">{type.description}</div>
                  </button>
                ))}
              </div>

              {/* Specific services list */}
              {formData.serviceType && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Select Specific Service</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredServices.map(service => (
                      <div
                        key={service.services_id}
                        onClick={() => handleServiceSelect(service.services_id)}
                        className={`bg-white rounded-lg p-4 border cursor-pointer transition-all ${formData.serviceId === service.services_id ? 'border-blue-500 ring-2 ring-blue-200 shadow-sm' : 'border-gray-200 hover:border-blue-300'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-800">{service.service_title}</h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <FaClock />
                                <span>{service.service_duration} min</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FaMoneyBillWave />
                                <span>${service.service_price_amt}</span>
                              </div>
                            </div>
                          </div>
                          {Number(formData.serviceId) === service.services_id && (
                            <div className="text-blue-600">
                              <FaCheck />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.serviceId}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2
                  ${!formData.serviceId ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>Continue</span>
                <FaChevronRight />
              </button>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Select Provider</h2>
            <p className="text-gray-600">Choose a service provider for your appointment</p>
            
            <div className="space-y-4">
              {loadingProviders && (
                <div className="text-sm text-gray-500">Loading providers...</div>
              )}
              {!loadingProviders && providers.length === 0 && (
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                  No providers found for this service yet. Try another service type or try again later.
                </div>
              )}
              {!loadingProviders && providers.map(provider => (
                  <div 
                    key={provider.id}
                    onClick={() => handleProviderSelect(provider.id)}
                    className={`bg-white rounded-xl p-4 border cursor-pointer transition-all
                      ${formData.providerId === provider.id 
                        ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' 
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <img 
                          src={provider.image} 
                          alt={provider.name} 
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">{provider.name}</h3>
                        <p className="text-gray-600">{provider.title}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`w-4 h-4 ${i < Math.floor(provider.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">{provider.rating} ({provider.reviewCount} reviews)</span>
                        </div>
                      </div>
                      
                      {formData.providerId === provider.id && (
                        <div className="text-blue-600">
                          <FaCheck size={20} />
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                      <FaMapMarkerAlt className="text-gray-500 mt-1" />
                      <div>
                        <p>{provider.location}</p>
                        <p className="text-gray-500">{provider.address}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.providerId}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2
                  ${!formData.providerId ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>Continue</span>
                <FaChevronRight />
              </button>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Select Date & Time</h2>
            <p className="text-gray-600">Choose when you'd like to schedule your appointment</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Select Date</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableDates.map(date => {
                    const dateObj = new Date(date);
                    const formattedDate = dateObj.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    });
                    
                    return (
                      <div 
                        key={date}
                        onClick={() => handleDateSelect(date)}
                        className={`p-3 border rounded-lg text-center cursor-pointer transition-colors
                          ${formData.date === date 
                            ? 'bg-blue-100 border-blue-500 text-blue-700' 
                            : 'border-gray-200 hover:border-blue-300'}`}
                      >
                        <p className="text-sm font-medium">{formattedDate}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {formData.date && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Select Time</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {timeSlots.map(time => (
                      <div 
                        key={time}
                        onClick={() => handleTimeSlotSelect(time)}
                        className={`p-3 border rounded-lg text-center cursor-pointer transition-colors
                          ${formData.timeSlot === time 
                            ? 'bg-blue-100 border-blue-500 text-blue-700' 
                            : 'border-gray-200 hover:border-blue-300'}`}
                      >
                        <p className="text-sm font-medium">{time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any special instructions or information for the provider"
              />
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.date || !formData.timeSlot}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2
                  ${(!formData.date || !formData.timeSlot) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>Review & Confirm</span>
                <FaChevronRight />
              </button>
            </div>
          </div>
        );
        
      case 5:
        const selectedPet = getSelectedPet();
        const selectedService = getSelectedService();
        const selectedProvider = getSelectedProvider();
        const appointmentDate = formData.date ? new Date(formData.date) : null;
        
        return (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <FaCalendarCheck className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Review & Confirm</h2>
                <p className="text-sm text-gray-500">Check details before confirming</p>
              </div>
            </div>

            {/* Minimal summary, aligned with app cards */}
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4 text-left">
                  {/* Pet */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Pet</h4>
                    {selectedPet ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedPet.image}
                          alt={selectedPet.name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{selectedPet.name}</p>
                          {selectedPet.breed ? (
                            <p className="text-xs text-gray-600">{selectedPet.breed}</p>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">—</p>
                    )}
                  </div>

                  {/* Service */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Service</h4>
                    {selectedService ? (
                      <div>
                        <p className="text-sm font-medium text-gray-800">{selectedService.service_title}</p>
                        <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1"><FaClock />{selectedService.service_duration} min</span>
                          <span className="inline-flex items-center gap-1"><FaMoneyBillWave />{formatINR(selectedService.service_price_amt)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">—</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  {/* Provider */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Provider</h4>
                    {selectedProvider ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedProvider.image}
                          alt={selectedProvider.name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{selectedProvider.name}</p>
                          {selectedProvider.title ? (
                            <p className="text-xs text-gray-600">{selectedProvider.title}</p>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">Any available provider</p>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Date & Time</h4>
                    {appointmentDate ? (
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {appointmentDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-gray-600">{formData.timeSlot}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">—</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Location */}
              {selectedProvider ? (
                <div className="p-4">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Location</h4>
                  <div className="flex items-start gap-2 text-sm">
                    <FaMapMarkerAlt className="text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">{selectedProvider.location}</p>
                      <p className="text-gray-600 text-xs">{selectedProvider.address}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Notes */}
              {formData.notes ? (
                <div className="p-4">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Additional Notes</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{formData.notes}</p>
                </div>
              ) : null}

              {/* Payment */}
              <div className="p-4">
                <h4 className="text-xs font-medium text-gray-500 mb-2">Payment Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Service Fee</span><span className="font-medium text-gray-800">{formatINR(selectedService?.service_price_amt || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Tax (8%)</span><span className="font-medium text-gray-800">{formatINR(Number(selectedService?.service_price_amt || 0) * 0.08)}</span></div>
                  <div className="border-t border-gray-200 my-2 pt-2 flex justify-between"><span className="font-medium text-gray-800">Total</span><span className="font-bold text-blue-700">{formatINR(Number(selectedService?.service_price_amt || 0) * 1.08)}</span></div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2 ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <FaCheck />
                    <span>Confirm Appointment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/user/appointments')}
            className="p-2 bg-white rounded-full shadow-sm border border-gray-200 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <FaArrowLeft />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FaCalendarAlt className="text-blue-600 text-2xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Book an Appointment</h1>
            </div>
            <p className="text-gray-500 mt-1">Schedule a service for your pet</p>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between">
            {['Pet', 'Service', 'Provider', 'Date & Time', 'Confirm'].map((step, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;
              
              return (
                <div key={step} className="flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${isActive 
                        ? 'bg-blue-600 text-white' 
                        : isCompleted 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-600'}`}
                  >
                    {isCompleted ? <FaCheck size={12} /> : stepNumber}
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="relative mt-2">
            <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full rounded-full"></div>
            <div 
              className="absolute top-0 left-0 h-1 bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep - 1) * 25}%` }}
            ></div>
          </div>
        </div>
        
        {/* Step Content */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          {renderStepContent()}
        </div>
      </div>
    </UserLayout>
  );
};

export default UserBookAppointment;