/**
 * Shared utility functions for provider dashboards
 */

// Format currency in INR (Indian standards 2025)
export const inr = (n) => 
  new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(n || 0);

// Get IST time
export const nowIST = () => 
  new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

// Normalize booking data from API
export const normalizeBooking = (b, providerProfile) => {
  const d = new Date(b.booked_dtm || b.date || b.appointment_date);
  const date = Number.isNaN(d.getTime()) ? '—' : d.toISOString().slice(0, 10);
  const time = Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return {
    id: b.booking_id || b.id || b.appointment_id,
    date,
    time,
    owner: b.client || b.user_name || b.clientName || b.user_email || '—',
    pet: b.pet || (b.pet_name ? `${b.pet_name} (${b.pet_type || ''})` : '—'),
    reason: b.service || b.service_title || b.service_type || b.appointment_type || '—',
    location: providerProfile?.serv_provider_location || b.location || '—',
    raw: b,
  };
};

// Fetch bookings by status
export const fetchBookingsByStatus = async (authFetch, apiUrl, status, limit = 5) => {
  const res = await authFetch(`${apiUrl}/provider/bookings?status=${encodeURIComponent(status)}&limit=${limit}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Failed to load ${status} bookings`);
  return data?.items || [];
};

// Load provider dashboard data
export const loadProviderDashboard = async (authFetch, apiUrl, providerProfile) => {
  const results = {
    profile: null,
    metrics: {
      todayAppointments: 0,
      activePatients: 0,
      todayRevenue: 0,
      pendingPrescriptions: 0,
    },
    confirmed: [],
    pending: [],
  };

  try {
    // Fetch provider profile first
    const profileRes = await authFetch(`${apiUrl}/provider/me`);
    if (profileRes.ok) {
      const profile = await profileRes.json();
      results.profile = profile;
      
      // Extract metrics from profile if available
      if (profile.performance) {
        results.metrics = {
          todayAppointments: profile.performance.totalBookings || 0,
          activePatients: profile.performance.newClients || 0,
          todayRevenue: profile.performance.earnings || 0,
          pendingPrescriptions: 0,
        };
      }
    }
    
    // Fetch appointments
    const appointmentsRes = await authFetch(`${apiUrl}/provider/appointments?limit=10`);
    if (appointmentsRes.ok) {
      const apptData = await appointmentsRes.json();
      const appointments = Array.isArray(apptData?.items) ? apptData.items : [];
      
      // Separate by status
      results.confirmed = appointments
        .filter(a => a.status === 'Confirmed' || a.booking_status === 'Confirmed')
        .slice(0, 5)
        .map(b => normalizeBooking(b, results.profile));
      
      results.pending = appointments
        .filter(a => a.status === 'Pending' || a.booking_status === 'Pending')
        .slice(0, 5)
        .map(b => normalizeBooking(b, results.profile));
    } else {
      // Fallback to bookings endpoint
      const [confData, pendData] = await Promise.all([
        fetchBookingsByStatus(authFetch, apiUrl, 'Confirmed', 5),
        fetchBookingsByStatus(authFetch, apiUrl, 'Pending', 5),
      ]);
      
      results.confirmed = confData.map(b => normalizeBooking(b, results.profile));
      results.pending = pendData.map(b => normalizeBooking(b, results.profile));
    }
  } catch (error) {
    throw error;
  }

  return results;
};

// Approve booking
export const approveBooking = async (authFetch, apiUrl, bookingId) => {
  const res = await authFetch(`${apiUrl}/provider/bookings/${bookingId}/approve`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Failed to approve booking');
  return data;
};

// Decline booking
export const declineBooking = async (authFetch, apiUrl, bookingId) => {
  const res = await authFetch(`${apiUrl}/provider/bookings/${bookingId}/decline`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Failed to decline booking');
  return data;
};