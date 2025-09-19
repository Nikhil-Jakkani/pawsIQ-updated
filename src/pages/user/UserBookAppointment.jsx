import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaArrowLeft, FaPaw, FaMapMarkerAlt, FaClock, FaMoneyBillWave, FaCheck, FaChevronRight, FaCalendarCheck, FaSearch, FaFilter, FaUserMd, FaCut, FaDog, FaHome, FaWalking } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const UserBookAppointment = () => {
  const navigate = useNavigate();
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
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  // useRefs for scrolling
  const petSectionRef = useRef(null);
  const serviceSectionRef = useRef(null);
  const providerSectionRef = useRef(null);
  const dateTimeSectionRef = useRef(null);
  const notesSectionRef = useRef(null);

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
     // Scroll to notes section
     notesSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Combine date and time to ISO string
  const combineDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return '';

    // Parse time string
    const [time, meridiem] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);

    // Adjust hours for AM/PM
    let adjustedHours = hours;
    if (meridiem?.toUpperCase() === 'PM' && hours < 12) {
      adjustedHours += 12;
    } else if (meridiem?.toUpperCase() === 'AM' && hours === 12) {
      adjustedHours = 0; // Midnight
    }

    // Create Date object (use UTC to avoid timezone issues)
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(5, 7)) - 1; // Month is 0-indexed
    const day = parseInt(dateStr.substring(8, 10));

    const utcDate = Date.UTC(year, month, day, adjustedHours, minutes, 0, 0);
    const d = new Date(utcDate);

    return d.toISOString();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessToken) return;
    setIsSubmitting(true);
    try {
      // const booked_dtm = combineDateTime(formData.date, formData.timeSlot);
      // if (!booked_dtm || Number.isNaN(new Date(booked_dtm).getTime()) || new Date(booked_dtm).getTime() <= Date.now()) {
      //   throw new Error('Date for booking needs to be a future date/time');
      // }

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
      navigate('/user/appointments');
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
          </div>

          {/* Find a Service */}
          <div ref={serviceSectionRef} className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Find a Service</h3>
            <p className="text-gray-600">Search and select a service to continue booking</p>

            {/* Service Selection */}
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-gray-700">Specific Service</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allServices.map(service => (
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
                      <p className="text-gray-500 text-sm">Duration: {service.duration_minutes} minutes</p>
                      <p className="text-gray-500 text-sm">Price: {formatINR(service.price)}</p>

                      {formData.serviceId === String(service.services_id) && (
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
          </div>

          {/* Choose a Provider */}
          <div ref={providerSectionRef} className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Choose a Provider</h3>
            <p className="text-gray-600">Select a service provider for your appointment</p>

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
                    ${formData.providerId === String(provider.id)
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
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {availableDates.map(date => {
                  const dateObj = new Date(date);
                  const isToday = date === new Date().toISOString().slice(0, 10);
                  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6; // Sunday or Saturday
                  const formattedDate = dateObj.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <button
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      className={`rounded-lg py-2 px-3 text-sm font-medium
                        ${formData.date === date
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                        ${isToday ? 'font-bold' : ''}
                        ${isWeekend ? 'text-red-500' : ''}
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
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => handleTimeSlotSelect(time)}
                      className={`rounded-lg py-2 px-3 text-sm font-medium
                          ${formData.timeSlot === time
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      {time}
                    </button>
                  ))}
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