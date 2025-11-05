import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaPlus, FaSearch, FaFilter, FaEye, FaTimes, FaCheck, FaClock, FaMapMarkerAlt, FaPaw, FaCalendarCheck, FaStar, FaComments } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';
const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const UserAppointments = () => {
  const navigate = useNavigate();
  const { currentUser, tokens, authFetch } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    appointmentId: null,
    rating: 5,
    text: '',
    error: '',
    submitting: false,
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [petsById, setPetsById] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accessToken = tokens?.access?.token;

  const toUiStatus = (status, appointmentDate) => {
    // Check if appointment is in the past
    const appointmentTs = new Date(appointmentDate).getTime();
    const now = Date.now();
    const isPastAppointment = appointmentTs < now;
    
    switch (status) {
      case 'Scheduled':
      case 'Confirmed':
      case 'Approved':
      case 'Awaiting Approval':
      case 'Pending':
      case 'Awaiting':
      case 'Submitted':
        // If appointment is in the past, it's completed; if future, it's upcoming
        return isPastAppointment ? 'completed' : 'upcoming';
      case 'Completed':
        return 'completed';
      case 'Cancelled':
      case 'Rejected':
        return 'cancelled';
      default:
        // Default based on timing
        return isPastAppointment ? 'completed' : 'upcoming';
    }
  };

  // Get the actual status for badge display (separate from filter status)
  const getActualStatus = (status, appointmentDate, fullAppointment = {}) => {
    // Check if appointment is in the past
    const appointmentTs = new Date(appointmentDate).getTime();
    const now = Date.now();
    const isPastAppointment = appointmentTs < now;
    
    switch (status) {
      case 'Awaiting Approval':
      case 'Pending':
      case 'Awaiting':
      case 'Submitted':
        return isPastAppointment ? 'completed' : 'awaiting';
      case 'Scheduled':
        // Provider has approved - show as confirmed
        return isPastAppointment ? 'completed' : 'confirmed';
      case 'Confirmed':
      case 'Approved':
        return isPastAppointment ? 'completed' : 'confirmed';
      case 'Completed':
        return 'completed';
      case 'Cancelled':
      case 'Rejected':
        return 'cancelled';
      default:
        return isPastAppointment ? 'completed' : 'awaiting';
    }
  };

  const formatDateTime = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { date: '—', time: '' };
    const date = d.toISOString().slice(0, 10);
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  };

  const fetchPets = async () => {
    try {
      const res = await authFetch(`${API_URL}/user/profile`);
      if (!res.ok) return;
      const data = await res.json();

      const map = {};
      (data?.pets || []).forEach((p) => {
        const id = String(p.pet_id ?? p.id);
        map[id] = { name: p.pet_name || p.name || 'Pet', type: (p.pet_type || p.type || '').toLowerCase() };
      });
      setPetsById(map);
    } catch (e) {
      // ignore
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${API_URL}/appointments?limit=50`);
      const payload = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setAppointments([]);
        return;
      }
      if (!res.ok) throw new Error(payload?.message || 'Failed to load appointments');
      const apptItems = (payload?.items || []).map((a) => {
        const pet = petsById[String(a.pet_id)] || {};
        const { date, time } = formatDateTime(a.appointment_date);
        const ts = new Date(a.appointment_date).getTime() || 0;
        const providerInfo = a.provider || {};
        const providerIdRaw = providerInfo?.service_provider_id ?? a.service_provider_id;
        const providerId = providerIdRaw !== undefined && providerIdRaw !== null ? Number(providerIdRaw) : null;
        const providerName = providerInfo?.serv_provider_name || a.provider_name || '';
        const providerLocation = providerInfo?.serv_provider_location || a.provider_address || '';
        const providerAverageRatingRaw = providerInfo?.average_rating ?? providerInfo?.averageRating ?? null;
        const providerAverageRating = providerAverageRatingRaw !== null && providerAverageRatingRaw !== undefined
          ? Number(providerAverageRatingRaw)
          : 0;
        const providerTotalReviewsRaw = providerInfo?.total_reviews ?? providerInfo?.totalReviews ?? null;
        const providerTotalReviews = providerTotalReviewsRaw !== null && providerTotalReviewsRaw !== undefined
          ? Number(providerTotalReviewsRaw)
          : 0;
        const bookingIdRaw = a.booking_id ?? a.Booking?.booking_id;
        const bookingId = bookingIdRaw !== undefined && bookingIdRaw !== null ? Number(bookingIdRaw) : null;
        const bookingStatus = a.booking_status ?? a.Booking?.booking_status ?? null;
        const userReviewData = a.user_review || null;
        const userReview = userReviewData
          ? {
              reviewId: userReviewData.review_id ? Number(userReviewData.review_id) : null,
              rating: Number(userReviewData.rating ?? 0),
              reviewText: userReviewData.review_text || '',
              reviewedAt: userReviewData.reviewed_at || null,
            }
          : null;
        const providerImage = providerName
          ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(providerName)}`
          : 'https://api.dicebear.com/7.x/shapes/svg?seed=paws';
        return {
          id: a.appointment_id,
          petId: a.pet_id,
          petName: pet.name || a.pet_name || 'Pet',
          petType: pet.type || (a.pet_type ? String(a.pet_type).toLowerCase() : ''),
          serviceType: a.appointment_type,
          date,
          time,
          status: toUiStatus(a.appointment_status, a.appointment_date), // For filtering
          actualStatus: getActualStatus(a.appointment_status, a.appointment_date, a), // For badge display
          rawStatus: a.appointment_status, // Keep raw status for reference
          bookingStatus,
          bookingId,
          notes: a.appointment_comments || '',
          location: providerName || '—',
          address: providerLocation || '—',
          providerAddress: providerLocation || '—',
          providerId,
          providerName,
          providerAverageRating,
          providerTotalReviews,
          providerImage,
          userReview,
          sortTs: ts,
          rawAppointment: a, // Keep full appointment data for debugging
        };
      });
      // Show only canonical appointments to match DB table
      setAppointments(apptItems.sort((a, b) => (b.sortTs || 0) - (a.sortTs || 0)));
    } catch (e) {
      setError(e.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      await fetchPets();
      await fetchAppointments();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const resetReviewForm = () => {
    setReviewForm({ appointmentId: null, rating: 5, text: '', error: '', submitting: false });
    setHoverRating(0);
  };

  const openReviewForm = (appointmentId) => {
    setReviewForm({ appointmentId, rating: 5, text: '', error: '', submitting: false });
    setHoverRating(0);
  };

  const renderStars = (rating) => {
    const safeRating = Number.isFinite(rating) ? rating : 0;
    return [1, 2, 3, 4, 5].map((value) => {
      const filled = safeRating >= value - 0.25;
      return (
        <FaStar
          key={value}
          className={`${filled ? 'text-yellow-400' : 'text-gray-300'} text-sm`}
        />
      );
    });
  };

  const handleSubmitReview = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (!reviewForm.appointmentId) return;
    const appointment = appointments.find((a) => a.id === reviewForm.appointmentId);
    if (!appointment) {
      setReviewForm((prev) => ({ ...prev, error: 'Unable to find appointment details.' }));
      return;
    }
    if (!appointment.providerId || !appointment.bookingId) {
      setReviewForm((prev) => ({ ...prev, error: 'This appointment is not linked to a provider booking yet.' }));
      return;
    }
    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      setReviewForm((prev) => ({ ...prev, error: 'Select a rating between 1 and 5 stars.' }));
      return;
    }

    setReviewForm((prev) => ({ ...prev, submitting: true, error: '' }));
    try {
      const res = await authFetch(`${API_URL}/providers/${appointment.providerId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: Number(appointment.bookingId),
          rating: Number(reviewForm.rating),
          review_text: reviewForm.text.trim() ? reviewForm.text.trim() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to submit review.');
      }

      await fetchAppointments();
      resetReviewForm();
      alert('Review submitted successfully.');
    } catch (e) {
      setReviewForm((prev) => ({
        ...prev,
        submitting: false,
        error: e?.message || 'Unable to submit review right now.',
      }));
    }
  };

  // Filter appointments based on search term and filter status
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.petName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      appointment.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.providerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.address || '').toLowerCase().includes(searchTerm.toLowerCase());

    const now = Date.now();
    // More inclusive logic for upcoming appointments - include all future appointments
    const appointmentTs = appointment.sortTs || 0;
    const isFutureAppointment = appointmentTs >= now;
    const isUpcomingFuture = appointment.status === 'upcoming' && isFutureAppointment;
    
    const matchesFilter = 
      filterStatus === 'all' ? true :
      filterStatus === 'upcoming' ? isUpcomingFuture :
      appointment.status === filterStatus;


    return matchesSearch && matchesFilter;
  });


  // Cancel appointment handler
  const handleCancelAppointment = async (id) => {
    if (!accessToken) return;
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await authFetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointment_status: 'Cancelled' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to cancel appointment');
      }
      // refresh list
      await fetchAppointments();
    } catch (e) {
      alert(e.message);
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch(status) {
      case 'confirmed':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          icon: <FaCheck className="text-blue-500" />,
          label: 'Confirmed'
        };
      case 'awaiting':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          icon: <FaClock className="text-yellow-500" />,
          label: 'Awaiting Approval'
        };
      case 'completed':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          icon: <FaCheck className="text-green-500" />,
          label: 'Completed'
        };
      case 'cancelled':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          icon: <FaTimes className="text-red-500" />,
          label: 'Cancelled'
        };
      default:
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          icon: <FaClock className="text-yellow-500" />,
          label: 'Awaiting Approval'
        };
    }
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#e3f2fd' }}>
                <FaCalendarAlt className="text-2xl" style={{ color: '#145ae6' }} />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
            </div>
            <p className="text-gray-500 mt-1">Manage your pet service appointments</p>
          </div>
          <button 
            onClick={() => navigate('/user/appointments/new')}
            className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            style={{ backgroundColor: '#145ae6' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0f4bc7'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#145ae6'}
          >
            <FaPlus />
            Book New Appointment
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by pet, service, or provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Appointments</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointment Cards - Enhanced Grid Layout */}
        {loading ? (
          <div className="bg-white rounded-lg p-6 text-center border border-gray-200">Loading appointments...</div>
        ) : error ? (
          <div className="bg-red-50 rounded-lg p-6 text-center border border-red-200 text-red-700">{error}</div>
        ) : filteredAppointments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAppointments.map(appointment => {
              const statusBadge = getStatusBadge(appointment.actualStatus);
              const appointmentDate = new Date(appointment.date);
              const isUpcoming = appointment.status === 'upcoming';
              // Allow reviews for past appointments (completed status or past date)
              const isPastAppointment = appointment.sortTs < Date.now();
              const isReviewEligible =
                appointment.providerId &&
                appointment.bookingId &&
                !appointment.userReview &&
                isPastAppointment;
              const isReviewFormOpen = reviewForm.appointmentId === appointment.id;
              const providerAverage = typeof appointment.providerAverageRating === 'number'
                ? appointment.providerAverageRating
                : 0;
              const providerTotalReviews = typeof appointment.providerTotalReviews === 'number'
                ? appointment.providerTotalReviews
                : 0;
              const statusGradientClass = appointment.actualStatus === 'confirmed'
                ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                : appointment.actualStatus === 'awaiting'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                : appointment.actualStatus === 'completed'
                ? 'bg-gradient-to-r from-green-400 to-green-600'
                : 'bg-gradient-to-r from-red-400 to-red-600';

              return (
                <div 
                  key={appointment.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Card Header with Status */}
                  <div className={`h-2 ${statusGradientClass}`}></div>

                  <div className="p-6">
                    {/* Service Type & Pet Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${
                          appointment.actualStatus === 'confirmed' ? 'bg-blue-50' :
                          appointment.actualStatus === 'awaiting' ? 'bg-yellow-50' :
                          appointment.actualStatus === 'completed' ? 'bg-green-50' :
                          'bg-red-50'
                        }`}>
                          <FaCalendarCheck className={`text-xl ${
                            appointment.actualStatus === 'confirmed' ? 'text-blue-600' :
                            appointment.actualStatus === 'awaiting' ? 'text-yellow-600' :
                            appointment.actualStatus === 'completed' ? 'text-green-600' :
                            'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="text-lg font-bold text-gray-800">{appointment.serviceType}</h3>
                            {appointment.isPendingApproval && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-200 text-yellow-700 border border-yellow-300">
                                Awaiting Approval
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <FaPaw className="text-blue-500" />
                            <span className="font-medium">{appointment.petName}</span>
                            <span className="text-gray-400">•</span>
                            <span className="capitalize">{appointment.petType}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1.5 rounded-full ${statusBadge.bgColor} ${statusBadge.textColor} text-xs font-bold flex items-center gap-1.5 shadow-sm`}>
                        {statusBadge.icon}
                        <span>{statusBadge.label}</span>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                          <FaCalendarAlt className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {appointmentDate.toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-600 font-medium">{appointment.time}</p>
                        </div>
                      </div>
                    </div>

                    {/* Provider Info */}
                    {appointment.providerName && (
                      <div className="flex flex-col gap-3 mb-4">
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <img 
                              src={appointment.providerImage}
                              alt={appointment.providerName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                              onError={(e) => { e.target.src = 'https://api.dicebear.com/7.x/shapes/svg?seed=paws'; }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-bold text-gray-800">{appointment.providerName}</p>
                                <p className="text-xs text-blue-600 font-medium">Service Provider</p>
                              </div>
                              {appointment.providerId && (appointment.actualStatus === 'confirmed' || appointment.actualStatus === 'awaiting') && (
                                <button
                                  onClick={() => navigate('/user/chat', {
                                    state: {
                                      providerId: appointment.providerId,
                                      providerName: appointment.providerName,
                                      serviceType: appointment.serviceType,
                                      petName: appointment.petName,
                                      topic: `Appointment: ${appointment.serviceType} for ${appointment.petName}`,
                                      initialMessage: `Hi! I have an appointment scheduled for ${appointment.date} at ${appointment.time}.`
                                    }
                                  })}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-600 rounded-lg border border-blue-200 transition-colors text-xs font-medium"
                                  title="Chat with provider"
                                >
                                  <FaComments />
                                  <span>Chat</span>
                                </button>
                              )}
                            </div>
                            {appointment.providerAddress && appointment.providerAddress !== '—' && (
                              <p className="text-xs text-gray-500 mt-1">{appointment.providerAddress}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-white border border-blue-100 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {renderStars(providerAverage)}
                            </div>
                            <span className="text-sm font-semibold text-gray-700">
                              {providerAverage ? providerAverage.toFixed(1) : '—'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {providerTotalReviews === 1
                              ? '1 review overall'
                              : `${providerTotalReviews} reviews overall`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    <div className="flex items-center gap-3 mb-4">
                      <FaMapMarkerAlt className="text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{appointment.location}</p>
                        <p className="text-xs text-gray-500">{appointment.address}</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {appointment.notes && (
                      <div className="mb-4 text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                        <p className="font-bold mb-1 text-yellow-800">Notes:</p>
                        <p className="text-gray-700">{appointment.notes}</p>
                      </div>
                    )}

                    {/* Existing review */}
                    {appointment.userReview && (
                      <div className="mb-4 border border-green-100 bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {renderStars(appointment.userReview.rating)}
                          </div>
                          <span className="text-sm font-semibold text-green-700">
                            {appointment.userReview.rating.toFixed(1)} / 5
                          </span>
                        </div>
                        {appointment.userReview.reviewText && (
                          <p className="text-sm text-gray-700 mt-2">{appointment.userReview.reviewText}</p>
                        )}
                        {appointment.userReview.reviewedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Reviewed on {new Date(appointment.userReview.reviewedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                    {/* Inline review form */}
                    {isReviewEligible && (
                      <div className="mb-4 border border-yellow-200 bg-yellow-50 rounded-lg p-3">
                        {isReviewFormOpen ? (
                          <form onSubmit={handleSubmitReview}>
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Rate this provider</p>
                                <div className="flex items-center gap-3">
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((value) => {
                                      const isActive = value <= (hoverRating || reviewForm.rating);
                                      return (
                                        <button
                                          key={value}
                                          type="button"
                                          onClick={() => setReviewForm((prev) => ({ ...prev, rating: value }))}
                                          onMouseEnter={() => setHoverRating(value)}
                                          onMouseLeave={() => setHoverRating(0)}
                                          disabled={reviewForm.submitting}
                                          className="focus:outline-none transition-transform hover:scale-110 disabled:cursor-not-allowed"
                                        >
                                          <FaStar
                                            className={`text-2xl transition-colors ${
                                              isActive ? 'text-yellow-400' : 'text-gray-300'
                                            }`}
                                          />
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <span className="text-base font-semibold text-gray-700">
                                    {reviewForm.rating} / 5
                                  </span>
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                  Optional feedback
                                </label>
                                <textarea
                                  value={reviewForm.text}
                                  maxLength={1000}
                                  onChange={(e) => setReviewForm((prev) => ({ ...prev, text: e.target.value }))}
                                  placeholder="Share more about your experience (optional)"
                                  rows={3}
                                  className="mt-1 w-full rounded-lg border border-yellow-200 bg-white p-2 text-sm text-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                                  disabled={reviewForm.submitting}
                                />
                                <div className="text-xs text-gray-400 mt-1 text-right">
                                  {reviewForm.text.length}/1000
                                </div>
                              </div>
                              {reviewForm.error && (
                                <p className="text-sm text-red-600">{reviewForm.error}</p>
                              )}
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                                  onClick={resetReviewForm}
                                  disabled={reviewForm.submitting}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                                  disabled={reviewForm.submitting}
                                >
                                  {reviewForm.submitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                              </div>
                            </div>
                          </form>
                        ) : (
                          <div>
                            <button
                              type="button"
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-yellow-700 border border-yellow-300 bg-white hover:bg-yellow-100"
                              onClick={() => openReviewForm(appointment.id)}
                            >
                              <FaStar className="text-yellow-500" />
                              Rate this provider
                            </button>
                            <p className="text-xs text-yellow-600 mt-1 text-center">Share your experience with {appointment.providerName}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => navigate(`/user/appointments/${appointment.id}`)}
                        className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <FaEye />
                        View Details
                      </button>

                      {isUpcoming && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => navigate(`/user/appointments/reschedule/${appointment.id}`)}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <FaCalendarAlt />
                            Reschedule
                          </button>

                          <button 
                            onClick={() => handleCancelAppointment(appointment.id)}
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <FaTimes />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#e3f2fd' }}>
              <FaCalendarAlt className="text-2xl" style={{ color: '#145ae6' }} />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No appointments found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? "No appointments match your search criteria. Try adjusting your filters."
                : "You don't have any appointments scheduled. Book your first appointment now!"}
            </p>
            <button 
              onClick={() => navigate('/user/appointments/new')}
              className="text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
              style={{ backgroundColor: '#145ae6' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0f4bc7'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#145ae6'}
            >
              <FaPlus />
              Book New Appointment
            </button>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default UserAppointments;