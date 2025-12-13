import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { FaCalendarAlt, FaArrowLeft, FaPaw, FaMapMarkerAlt, FaClock, FaMoneyBillWave, FaCheck, FaChevronRight, FaCalendarCheck, FaSearch, FaFilter, FaUserMd, FaCut, FaDog, FaHome, FaWalking, FaTimesCircle } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';
import { useLocation as useUserLocation } from '../../hooks/useLocation';

// Service type icon mapping - matches backend 6 standardized types
const SERVICE_TYPE_ICONS = {
  veterinary: FaUserMd,
  'diagnostic services': FaUserMd,
  boarding: FaHome,
  grooming: FaCut,
  training: FaDog,
  'physical activity': FaWalking,
};

const getServiceIcon = (serviceType) => {
  const type = (serviceType || '').toLowerCase().trim();
  return SERVICE_TYPE_ICONS[type] || FaPaw;
};

// Dynamic service categories - will be populated from backend
const SERVICE_CATEGORIES = [];

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';
const UserBookAppointment = () => {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { tokens, currentUser, authFetch } = useAuth();
  const accessToken = tokens?.access?.token;

  const searchParams = useMemo(() => new URLSearchParams(routerLocation.search), [routerLocation.search]);
  const initialPrefill = useMemo(
    () => ({
      petId: searchParams.get('petId') || '',
      serviceId: searchParams.get('serviceId') || '',
      providerId: searchParams.get('providerId') || '',
      date: searchParams.get('date') || '',
      timeSlot: searchParams.get('time') || '',
      notes: searchParams.get('notes') || '',
    }),
    [searchParams]
  );

  const [formData, setFormData] = useState(() => ({
    petId: initialPrefill.petId ? String(initialPrefill.petId) : '',
    serviceType: '',
    serviceId: initialPrefill.serviceId ? String(initialPrefill.serviceId) : '',
    providerId: initialPrefill.providerId ? String(initialPrefill.providerId) : '',
    date: initialPrefill.date,
    timeSlot: initialPrefill.timeSlot,
    notes: initialPrefill.notes,
  }));

  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [error, setError] = useState('');
  // dynamic services/providers
  const [allServices, setAllServices] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [useLocationFilter, setUseLocationFilter] = useState(true);

  // Group services by service_type
  const filteredServicesByCategory = useMemo(() => {
    const grouped = {};
    
    for (const service of allServices) {
      const type = (service.service_type || '').toLowerCase().trim();
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(service);
    }
    
    return grouped;
  }, [allServices]);
  
  // Generate category list from unique service types
  useEffect(() => {
    const types = [...new Set(allServices.map(s => (s.service_type || '').toLowerCase().trim()))];
    const categories = types.map(type => ({
      id: type,
      label: type.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} services`,
      icon: getServiceIcon(type),
    }));
    setServiceCategories(categories);
  }, [allServices]);

  // useRefs for scrolling
  const petSectionRef = useRef(null);
  const serviceSectionRef = useRef(null);
  const providerSectionRef = useRef(null);
  const dateTimeSectionRef = useRef(null);
  const notesSectionRef = useRef(null);

  useEffect(() => {
    if (!routerLocation.state || typeof routerLocation.state !== 'object') return;
    const payload = routerLocation.state.prefill || routerLocation.state;
    if (!payload) return;

    setFormData((prev) => ({
      ...prev,
      petId: payload.petId ? String(payload.petId) : prev.petId,
      serviceId: payload.serviceId ? String(payload.serviceId) : prev.serviceId,
      providerId: payload.providerId ? String(payload.providerId) : prev.providerId,
      date: payload.date || prev.date,
      timeSlot: payload.timeSlot || payload.time || prev.timeSlot,
      notes: payload.notes || prev.notes,
    }));
  }, [routerLocation.state]);

  const { getFormattedLocation, requestLocation, hasLocation, location: geoLocation } = useUserLocation();
  const effectiveLocation = useMemo(() => {
    const stored = getFormattedLocation?.();
    if (stored) return stored;
    if (currentUser?.user_location) return currentUser.user_location;
    return null;
  }, [currentUser?.user_location, getFormattedLocation]);

  useEffect(() => {
    if (effectiveLocation || hasLocation) return;
    requestLocation?.();
  }, [effectiveLocation, hasLocation, requestLocation]);

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

  useEffect(() => {
    if (!pets.length) return;
    if (formData.petId && pets.some((p) => String(p.id) === String(formData.petId))) {
      serviceSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [pets, formData.petId]);

  // Load services from backend
  useEffect(() => {
    const fetchServices = async () => {
      if (!accessToken) return;
      try {
        // setLoadingServices(true);
        const res = await authFetch(`${API_URL}/services`);
        const data = await res.json().catch(() => ({}));
        const items = Array.isArray(data?.items) ? data.items : [];
        setAllServices(items);
      } finally {
        // setLoadingServices(false);
      }
    };
    fetchServices();
  }, [accessToken]);

  // const iconByType = (type) => {
  //   const t = String(type || '').toLowerCase();
  //   if (t.includes('vet')) return FaUserMd;
  //   if (t.includes('groom')) return FaCut;
  //   if (t.includes('train')) return FaDog;
  //   if (t.includes('board')) return FaHome;
  //   if (t.includes('day')) return FaPaw;
  //   if (t.includes('walk')) return FaWalking;
  //   return FaPaw;
  // };

  // const serviceTypes = React.useMemo(() => {
  //   const uniq = new Map();
  //   for (const s of allServices) {
  //     const key = (s.service_type || 'Other').trim();
  //     if (!uniq.has(key)) uniq.set(key, { id: key.toLowerCase(), name: key, icon: iconByType(key), description: s.service_description || '' });
  //   }
  //   return Array.from(uniq.values());
  // }, [allServices]);

  const availableDates = React.useMemo(() => {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dateString = d.toISOString().slice(0, 10);
      if (d >= now) {
        dates.push(dateString);
      }
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
    // Scroll to service section
    serviceSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle specific service selection
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setFormData((prev) => ({
      ...prev,
      serviceId: '',
    }));
    setProviders([]);
  };

  const handleServiceSelect = async (serviceId) => {
    setFormData({
      ...formData,
      serviceId
    });
    // load providers for this service
    if (!serviceId) return;
    await fetchProviders(serviceId, useLocationFilter);
  };

  // Fetch providers with optional location filter
  const fetchProviders = async (serviceId, applyLocationFilter = useLocationFilter) => {
    if (!serviceId) return;
    try {
      setLoadingProviders(true);
      const locationQuery = applyLocationFilter && (effectiveLocation || geoLocation?.formatted) 
        ? `?location=${encodeURIComponent(effectiveLocation || geoLocation?.formatted)}` 
        : '';
      const res = await authFetch(`${API_URL}/services/${serviceId}/providers${locationQuery}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const items = Array.isArray(data?.items) ? data.items : [];
        // normalize for UI
        setProviders(items.map(p => ({
          id: p.service_provider_id,
          name: p.serv_provider_name || 'Provider',
          title: p.serv_provider_type || 'Service Provider',
          image: 'https://placehold.co/128x128?text=Provider',
          location: p.serv_provider_location || p.provider_src || '—',
          address: p.serv_provider_desc || '—',
          rating: 4.8,
          reviewCount: 0,
        })));
      } else {
        setProviders([]);
      }
    } finally {
      setLoadingProviders(false);
      // Scroll to provider section
      providerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle provider selection
  const handleProviderSelect = (providerId) => {
    setFormData({
      ...formData,
      providerId
    });
    // Scroll to date/time section
    dateTimeSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setFormData((prev) => ({
      ...prev,
      date
    }));
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot) => {
    setFormData((prev) => ({
      ...prev,
      timeSlot
    }));
     // Scroll to notes section
     notesSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Combine date and time to ISO string (preserves local time without timezone shift)
  const combineDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return '';

    const [time, meridiem] = timeStr.split(' ');
    const [hours, minutes] = (time || '').split(':').map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return '';

    let adjustedHours = hours;
    if (meridiem?.toUpperCase() === 'PM' && hours < 12) {
      adjustedHours += 12;
    } else if (meridiem?.toUpperCase() === 'AM' && hours === 12) {
      adjustedHours = 0;
    }

    // Format as YYYY-MM-DDTHH:MM:SS without timezone conversion
    const paddedHours = String(adjustedHours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    return `${dateStr}T${paddedHours}:${paddedMinutes}:00`;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessToken) return;
    
    // Validate required fields
    if (!formData.petId) {
      alert('Please select a pet for the appointment');
      petSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!formData.serviceId) {
      alert('Please select a service for the appointment');
      serviceSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!formData.providerId) {
      alert('Please select a service provider for the appointment');
      providerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!formData.date) {
      alert('Please select a date for the appointment');
      dateTimeSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!formData.timeSlot) {
      alert('Please select a time slot for the appointment');
      dateTimeSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const booked_dtm = combineDateTime(formData.date, formData.timeSlot);
      if (!booked_dtm || Number.isNaN(new Date(booked_dtm).getTime())) {
        throw new Error('Invalid date/time format');
      }
      
      // Check if the selected time is in the future
      const selectedDateTime = new Date(booked_dtm);
      if (selectedDateTime.getTime() <= Date.now()) {
        throw new Error('Please select a future date and time');
      }

      const payload = {
        petId: String(formData.petId),
        serviceId: String(formData.serviceId),
        providerId: formData.providerId ? String(formData.providerId) : null,
        date: formData.date,
        time: formData.timeSlot,
        userId: currentUser?.id,
      };
      const res = await authFetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to create booking');
      
      // Prepare appointment data for confirmation page
      const selectedPet = pets.find(p => String(p.id) === String(formData.petId));
      const selectedService = allServices.find(s => s.services_id === Number(formData.serviceId));
      const selectedProvider = providers.find(p => p.id === Number(formData.providerId));
      
      const appointmentData = {
        pet: selectedPet ? {
          name: selectedPet.name,
          breed: selectedPet.breed,
          type: selectedPet.type,
          image: selectedPet.image,
        } : null,
        service: selectedService ? {
          name: selectedService.service_title || selectedService.service_type,
          duration: selectedService.service_duration || 'N/A',
        } : data.service ? {
          name: data.service.service_title || data.service.service_type,
          duration: data.service.service_duration || 'N/A',
        } : null,
        provider: selectedProvider ? {
          name: selectedProvider.name,
          title: selectedProvider.type,
          image: selectedProvider.image,
          location: selectedProvider.location || selectedProvider.address,
          address: selectedProvider.address,
        } : data.provider ? {
          name: data.provider.serv_provider_name,
          title: data.provider.serv_provider_type,
          image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.provider.serv_provider_name)}`,
          location: data.provider.serv_provider_location,
          address: data.provider.serv_provider_location,
        } : null,
        date: formData.date,
        timeSlot: formData.timeSlot,
        total: selectedService?.custom_price 
          ? selectedService.custom_price - (selectedService.custom_price * (selectedService.discount_percent || 0) / 100)
          : (selectedService?.service_price || data.service?.service_price || 0),
      };
      
      navigate('/user/appointments/confirmation', { state: { appointment: appointmentData } });
    } catch (err) {
      alert(err.message || 'Failed to create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected service details
  // const getSelectedService = () => {
  //   if (!formData.serviceType || !formData.serviceId) return null;
  //   const id = Number(formData.serviceId);
  //   return filteredServices.find(service => service.services_id === id) || null;
  // };

  // Get selected provider details
  // const getSelectedProvider = () => {
  //   if (!formData.providerId) return null;
  //   return providers.find(provider => provider.id === parseInt(formData.providerId));
  // };

  // Get selected pet details
  // const getSelectedPet = () => {
  //   if (!formData.petId) return null;
  //   return pets.find(pet => pet.id === parseInt(formData.petId));
  // };

  return (
    <UserLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-semibold mb-4">Book an Appointment</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Select Your Pet */}
          <div ref={petSectionRef} className="bg-white p-4 rounded-lg border border-gray-200 space-y-6">
            <h3 className="text-lg font-semibold text-gray-700">Select Your Pet</h3>
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
                    ${String(formData.petId) === String(pet.id)
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

                    {String(formData.petId) === String(pet.id) && (
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
          </div>

          {/* Find a Service */}
          <div ref={serviceSectionRef} className="bg-white p-4 rounded-lg border border-gray-200 space-y-6">
            <h3 className="text-lg font-semibold text-gray-700">Find a Service</h3>
            <p className="text-gray-600">Choose a main service to see the related offerings</p>

            {/* Main Service Categories */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-700">Main Service</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {serviceCategories.length === 0 && (
                  <div className="col-span-full bg-gray-50 rounded-lg p-4 text-center text-gray-600">
                    Loading service categories...
                  </div>
                )}
                {serviceCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategorySelect(category.id)}
                      className={`flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left
                        ${selectedCategoryId === category.id
                          ? 'border-blue-500 ring-2 ring-blue-200 shadow-md bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'}`}
                    >
                      <span className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <Icon className="text-blue-500" />
                        {category.label}
                      </span>
                      <span className="text-sm text-gray-600">{category.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specific Service Selection */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-700">Specific Service</h4>
              {filteredServicesByCategory[selectedCategoryId]?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredServicesByCategory[selectedCategoryId].map(service => (
                    <div
                      key={service.services_id}
                      onClick={() => handleServiceSelect(service.services_id)}
                      className={`bg-white rounded-xl overflow-hidden border cursor-pointer transition-all
                        ${formData.serviceId === String(service.services_id)
                          ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                    >
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-800">{service.service_name}</h3>
                        <p className="text-gray-600">{service.service_description}</p>
                        {service.duration_minutes && (
                          <p className="text-gray-500 text-sm">Duration: {service.duration_minutes} minutes</p>
                        )}
                        <div className="text-gray-500 text-sm">
                          {service.custom_price ? (
                            <>
                              <p>
                                Price: <span className="font-semibold">{formatINR(service.custom_price)}</span>
                                {service.discount_percent > 0 && (
                                  <>
                                    <span className="line-through text-gray-400 ml-2">{formatINR(service.price)}</span>
                                    <span className="text-green-600 ml-2">-{service.discount_percent}%</span>
                                  </>
                                )}
                              </p>
                              {service.discount_percent > 0 && (
                                <p className="text-green-600 font-semibold">
                                  Final: {formatINR(service.custom_price - (service.custom_price * service.discount_percent / 100))}
                                </p>
                              )}
                            </>
                          ) : (
                            <p>Price: {formatINR(service.price)}</p>
                          )}
                        </div>

                        {String(formData.serviceId) === String(service.services_id) && (
                          <div className="mt-2 text-blue-600 flex items-center gap-1">
                            <FaCheck />
                            <span className="text-sm font-medium">Selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg p-3 text-sm">
                  No services available in this category yet. Please try a different one.
                </div>
              )}
            </div>
          </div>

          {/* Choose a Provider */}
          <div ref={providerSectionRef} className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Choose a Provider</h3>
                <p className="text-gray-600">Select a service provider for your appointment</p>
              </div>
              
              {/* Location Filter Toggle */}
              {effectiveLocation && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newValue = !useLocationFilter;
                      setUseLocationFilter(newValue);
                      // Refetch providers with new filter setting immediately
                      if (formData.serviceId) {
                        fetchProviders(formData.serviceId, newValue);
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                      useLocationFilter
                        ? 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100'
                        : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {useLocationFilter ? (
                      <>
                        <FaMapMarkerAlt className="text-green-600" />
                        <span>Location: {effectiveLocation}</span>
                        <FaTimesCircle className="text-green-600" />
                      </>
                    ) : (
                      <>
                        <FaMapMarkerAlt className="text-gray-400" />
                        <span>Show All Locations</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {loadingProviders && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 text-sm text-gray-600">Loading providers...</div>
            )}

            {!loadingProviders && providers.length === 0 && (
              <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg p-3 text-sm">
                No providers found for the selected service.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map(provider => (
                <div
                  key={provider.id}
                  onClick={() => handleProviderSelect(provider.id)}
                  className={`bg-white rounded-xl overflow-hidden border cursor-pointer transition-all
                    ${String(formData.providerId) === String(provider.id)
                      ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                >
                  <div className="h-32 overflow-hidden">
                    <img
                      src={provider.image}
                      alt={provider.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800">{provider.name}</h3>
                    <p className="text-gray-600">{provider.title}</p>
                    <div className="flex items-center text-gray-500 text-sm mt-2">
                      <FaMapMarkerAlt className="mr-1" />
                      <span>{provider.location}</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                      <FaClock className="mr-1" />
                      <span>{provider.address}</span>
                    </div>

                    {formData.providerId === String(provider.id) && (
                      <div className="mt-2 text-blue-600 flex items-center gap-1">
                        <FaCheck />
                        <span className="text-sm font-medium">Selected</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pick Date and Time */}
          <div ref={dateTimeSectionRef} className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Pick Date and Time</h3>
            <p className="text-gray-600">Choose when you would like to book your appointment</p>

            {/* Date Selection */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-700">Select a Date</h4>
              {formData.date && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-sm text-green-800">
                  Selected Date: {formData.date}
                </div>
              )}
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {availableDates.map(date => {
                  const dateObj = new Date(date);
                  const isToday = date === new Date().toISOString().slice(0, 10);
                                    const formattedDate = dateObj.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => handleDateSelect(date)}
                      className={`rounded-lg py-2 px-3 text-sm font-medium
                        ${formData.date === date
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                        ${isToday ? 'font-bold' : ''}
                        
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      {formattedDate}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Selection */}
            {formData.date && (
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-gray-700">Select a Time Slot</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {timeSlots.map(time => {
  // disable past time options when booking for today (local time)
  const [t, mer] = time.split(' ');
  const [hh, mm] = t.split(':').map(Number);
  let adj = hh;
  if (mer?.toUpperCase() === 'PM' && hh < 12) adj += 12; else if (mer?.toUpperCase() === 'AM' && hh === 12) adj = 0;
  const todayIso = new Date().toISOString().slice(0, 10);
  const isTodaySel = formData.date === todayIso;
  const now = new Date();
  const disabled = isTodaySel && (adj < now.getHours() || (adj === now.getHours() && mm <= now.getMinutes()));
  return (
    <button
      key={time}
      type="button"
      onClick={() => !disabled && handleTimeSlotSelect(time)}
      disabled={disabled}
      className={`rounded-lg py-2 px-3 text-sm font-medium
          ${formData.timeSlot === time && !disabled
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
    >
      {time}
    </button>
  );
})}

                </div>
              </div>
            )}
          </div>

          {/* Add Notes */}
          <div ref={notesSectionRef} className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Add Notes</h3>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional notes for the appointment?"
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Submitting...' : 'Book Appointment'}
              <FaCheck />
            </button>
          </div>
        </form>
      </div>
    </UserLayout>
  );
};

export default UserBookAppointment;

