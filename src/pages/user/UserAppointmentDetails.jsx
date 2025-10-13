import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaClock,
  FaCheck,
  FaTimes,
  FaMapMarkerAlt,
  FaPaw,
  FaUser,
  FaCalendarCheck,
  FaInfoCircle,
  FaMoneyBillWave,
  FaPhone,
} from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const toUiStatus = (status, appointmentDate) => {
  const normalized = (status || '').toLowerCase();
  const isPast = appointmentDate ? new Date(appointmentDate).getTime() < Date.now() : false;

  if (['cancelled', 'canceled', 'rejected'].includes(normalized)) return 'cancelled';
  if (['completed', 'done'].includes(normalized)) return 'completed';
  if (['awaiting approval', 'awaiting', 'pending', 'submitted'].includes(normalized)) {
    return isPast ? 'completed' : 'awaiting';
  }
  if (['scheduled', 'confirmed', 'approved'].includes(normalized)) {
    return isPast ? 'completed' : 'upcoming';
  }
  return isPast ? 'completed' : 'upcoming';
};

const formatDateTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '—', time: '' };
  const date = d.toLocaleDateString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return { date, time };
};

const formatStatusLabel = (status = '') => {
  const normalized = status.trim().toLowerCase();
  const mapping = {
    awaiting: 'Awaiting Approval',
    'awaiting approval': 'Awaiting Approval',
    awaitingapproval: 'Awaiting Approval',
    pending: 'Pending',
    submitted: 'Submitted',
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    approved: 'Approved',
    completed: 'Completed',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
    rejected: 'Rejected',
    done: 'Completed',
  };
  if (mapping[normalized]) return mapping[normalized];
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getStatusMessage = (uiStatus, isPastAppointment, appointmentStatusLabel) => {
  switch (uiStatus) {
    case 'awaiting':
      return 'We are waiting for the provider to review this request. You will be notified when the status changes.';
    case 'upcoming':
      return isPastAppointment
        ? 'The scheduled time has passed. The provider may still need to mark this appointment as completed.'
        : 'All set! Please arrive a few minutes early and bring any relevant pet records.';
    case 'completed':
      return appointmentStatusLabel === 'Completed'
        ? 'This appointment is completed. Thanks for taking care of your pet!'
        : 'The appointment window has passed. The provider might still be updating its status.';
    case 'cancelled':
      return 'This appointment has been cancelled. You can schedule a new one anytime from the appointments page.';
    default:
      return 'Appointment status information is currently unavailable.';
  }
};

const getBookingStatusMessage = (bookingStatusLabel) => {
  if (!bookingStatusLabel || bookingStatusLabel === 'Unknown') {
    return 'No booking status has been recorded yet.';
  }
  switch (bookingStatusLabel) {
    case 'Pending':
    case 'Awaiting Approval':
      return 'Booking has been created and is awaiting provider confirmation.';
    case 'Scheduled':
    case 'Confirmed':
    case 'Approved':
      return 'Booking is confirmed with the provider.';
    case 'Completed':
      return 'Booking has been completed successfully.';
    case 'Cancelled':
    case 'Rejected':
      return 'This booking is no longer active.';
    default:
      return `Booking status: ${bookingStatusLabel}`;
  }
};

const formatDuration = (minutes) => {
  if (minutes === null || minutes === undefined) return '—';
  const total = Number(minutes);
  if (!Number.isFinite(total) || total <= 0) return '—';
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (!hours) return `${mins} min${mins === 1 ? '' : 's'}`;
  if (!mins) return `${hours} hr${hours === 1 ? '' : 's'}`;
  return `${hours} hr${hours === 1 ? '' : 's'} ${mins} min${mins === 1 ? '' : 's'}`;
};

const formatPrice = (amount) => {
  if (amount === null || amount === undefined) return '—';
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numeric);
};

const formatDateTimeLong = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function UserAppointmentDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser, tokens } = useAuth();
  const accessToken = tokens?.access?.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appt, setAppt] = useState(null);
  const [petsById, setPetsById] = useState({});
  const [provider, setProvider] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const uiStatus = useMemo(
    () => toUiStatus(appt?.appointment_status, appt?.appointment_date),
    [appt]
  );

  useEffect(() => {
    if (!accessToken || !id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        // Load user pets to map names/types
        const petRes = await fetch(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const petData = await petRes.json().catch(() => ({}));
        const petMap = {};
        (petData?.pets || []).forEach((p) => {
          petMap[String(p.pet_id)] = { name: p.pet_name || 'Pet', type: p.pet_type || '' };
        });
        if (!cancelled) setPetsById(petMap);

        // Load this appointment
        let res;
        if (String(id).startsWith('B')) {
          res = await fetch(`${API_URL}/bookings/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        } else {
          res = await fetch(`${API_URL}/appointments/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Failed to load appointment');
        if (!cancelled) {
          setAppt(data);
          // Provider details are now included in the appointment response
          if (data?.provider_name) {
            setProvider({
              serv_provider_name: data.provider_name,
              serv_provider_type: data.provider_type,
              serv_provider_location: data.provider_location,
            });
          }
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load appointment');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [accessToken, id]);

  const handleCancelAppointment = async () => {
    if (!accessToken || !appt) return;
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      setCancelling(true);
      const res = await fetch(`${API_URL}/appointments/${appt.appointment_id || id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ appointment_status: 'Cancelled' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to cancel appointment');
      navigate('/user/appointments', { state: { toast: 'Appointment cancelled' } });
    } catch (e) {
      alert(e.message || 'Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const statusBadge = () => {
    switch (uiStatus) {
      case 'upcoming':
        return { bg: 'bg-blue-100', text: 'text-blue-800', bar: 'from-blue-400 to-blue-600' };
      case 'completed':
        return { bg: 'bg-green-100', text: 'text-green-800', bar: 'from-green-400 to-green-600' };
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-800', bar: 'from-red-400 to-red-600' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', bar: 'from-gray-400 to-gray-600' };
    }
  };

  const petInfo = appt ? petsById[String(appt.pet_id || appt.petId)] || {} : {};
  const { date, time } = appt ? formatDateTime(appt.appointment_date || appt.booked_dtm) : { date: '', time: '' };
  const isPastAppointment = appt ? new Date(appt.appointment_date).getTime() < Date.now() : false;
  const appointmentStatusLabel = formatStatusLabel(appt?.appointment_status || '');
  const bookingStatusLabel = formatStatusLabel(appt?.booking_status || '');
  const statusMessage = getStatusMessage(uiStatus, isPastAppointment, appointmentStatusLabel);
  const bookingStatusMessage = getBookingStatusMessage(bookingStatusLabel);
  const clinicLocation = appt?.provider_location || appt?.location || 'Location not provided yet';
  const clinicAddress = appt?.address || null;
  const providerContact = appt?.provider_contact || appt?.providerContact || null;
  const serviceTitle = appt?.service_title || appt?.appointment_type;
  const serviceType = appt?.service_type || appt?.appointment_type || 'Service';
  const serviceDuration = formatDuration(appt?.service_duration);
  const servicePrice = formatPrice(appt?.service_price);
  const bookedOn = formatDateTimeLong(appt?.booked_dtm);
  const approvedOn = formatDateTimeLong(appt?.last_updated_dtm);
  const appointmentDateLong = formatDateTimeLong(appt?.appointment_date);
  const canModifyAppointment = uiStatus === 'upcoming' && !isPastAppointment;
  const bookingIdDisplay = appt?.booking_id ? `#${appt.booking_id}` : '—';
  const appointmentIdDisplay = appt?.appointment_id ? `#${appt.appointment_id}` : id;

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <FaArrowLeft /> Back
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className={`h-1 bg-gradient-to-r ${statusBadge().bar}`}></div>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-50">
                <FaCalendarCheck className="text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Appointment Details</h1>
            </div>

            {loading ? (
              <div className="text-gray-600">Loading…</div>
            ) : error ? (
              <div className="text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>
            ) : appt ? (
              <>
                {/* Summary */}
                <div className="flex flex-col gap-5 mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-xl ${
                          uiStatus === 'cancelled'
                            ? 'bg-red-50'
                            : uiStatus === 'completed'
                            ? 'bg-green-50'
                            : uiStatus === 'awaiting'
                            ? 'bg-yellow-50'
                            : 'bg-blue-50'
                        }`}
                      >
                        <FaCalendarAlt
                          className={
                            uiStatus === 'cancelled'
                              ? 'text-red-600'
                              : uiStatus === 'completed'
                              ? 'text-green-600'
                              : uiStatus === 'awaiting'
                              ? 'text-yellow-600'
                              : 'text-blue-600'
                          }
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">{serviceTitle || 'Appointment'}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-gray-600 text-sm">
                          <FaPaw className="text-blue-500" />
                          <span className="font-medium">{petInfo.name || 'Pet'}</span>
                          {petInfo.type ? (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="capitalize">{petInfo.type}</span>
                            </>
                          ) : null}
                          <span className="text-gray-400">•</span>
                          <span>{serviceType}</span>
                          {serviceDuration !== '—' && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span>{serviceDuration}</span>
                            </>
                          )}
                          {servicePrice !== '—' && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span>{servicePrice}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-start">
                      <div
                        className={`px-3 py-1.5 rounded-full ${statusBadge().bg} ${statusBadge().text} text-xs font-bold shadow-sm`}
                      >
                        {appointmentStatusLabel}
                      </div>
                      <div className="text-xs font-mono text-gray-500">
                        Appointment ID: {appointmentIdDisplay}
                      </div>
                      <div className="text-xs font-mono text-gray-500">Booking ID: {bookingIdDisplay}</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FaInfoCircle className="text-slate-500 mt-1" />
                      <div>
                        <p className="text-sm text-slate-700">{statusMessage}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          Scheduled for <span className="font-medium text-slate-700">{appointmentDateLong}</span>
                          {bookingStatusLabel !== 'Unknown' && (
                            <>
                              {' '}
                              · Booking status: <span className="font-medium text-slate-700">{bookingStatusLabel}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <FaCalendarAlt className="text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Appointment Date</p>
                        <p className="text-sm font-semibold text-gray-800">{date}</p>
                        <p className="text-xs text-gray-500">{time}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaClock className="text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Full Timestamp</p>
                        <p className="text-sm font-semibold text-gray-800">{appointmentDateLong}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaCalendarCheck className="text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Booked On</p>
                        <p className="text-sm font-semibold text-gray-800">{bookedOn}</p>
                        <p className="text-xs text-gray-500">{bookingStatusMessage}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Provider & Service Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="border border-blue-100 rounded-lg bg-blue-50 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-full shadow">
                        <FaUser className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {provider?.serv_provider_name || provider?.name || appt?.provider_name || appt?.providerName || 'Service Provider'}
                        </p>
                        <p className="text-xs text-blue-700 font-semibold">
                          {provider?.serv_provider_type || provider?.type || appt?.provider_type || 'Provider'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-blue-500" />
                        <span>{clinicLocation}</span>
                      </div>
                      {clinicAddress ? (
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">↳</span>
                          <span className="leading-snug">{clinicAddress}</span>
                        </div>
                      ) : null}
                      {providerContact ? (
                        <div className="flex items-center gap-2">
                          <FaPhone className="text-blue-500" />
                          <span>{providerContact}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="border border-emerald-100 rounded-lg bg-emerald-50 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-full shadow">
                        <FaMoneyBillWave className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Service Details</p>
                        <p className="text-xs text-emerald-700 font-semibold">{serviceType}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 space-y-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Service Name</p>
                        <p className="text-sm font-medium text-gray-800">{serviceTitle || 'Not specified'}</p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-gray-400">Duration</p>
                          <p className="font-medium text-gray-800">{serviceDuration}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-wide text-gray-400">Estimate</p>
                          <p className="font-semibold text-emerald-700">{servicePrice}</p>
                        </div>
                      </div>
                      {appt?.service_description && (
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">What to expect</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{appt.service_description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes & Additional Info */}
                <div className="space-y-4 mb-6">
                  <div className="border border-violet-100 rounded-lg bg-violet-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-violet-500 font-semibold mb-2">
                      Appointment Notes
                    </p>
                    {appt?.appointment_comments ? (
                      <p className="text-sm text-violet-800 leading-relaxed">{appt.appointment_comments}</p>
                    ) : (
                      <p className="text-sm text-violet-600">No additional notes were provided for this appointment.</p>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-lg p-4 bg-white">
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">
                      Booking Timeline
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-700">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Booked On</p>
                        <p className="font-medium">{bookedOn}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Last Updated</p>
                        <p className="font-medium">{approvedOn}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Booking Status</p>
                        <p className="font-medium">{bookingStatusLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {canModifyAppointment ? (
                    <>
                      <button
                        onClick={() => navigate(`/user/appointments/reschedule/${appt.appointment_id || id}`)}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg"
                      >
                        <FaCalendarAlt /> Reschedule
                      </button>
                      <button
                        onClick={handleCancelAppointment}
                        disabled={cancelling}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg disabled:opacity-50"
                      >
                        <FaTimes /> {cancelling ? 'Cancelling…' : 'Cancel Appointment'}
                      </button>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2">
                      Appointment changes are disabled because it is either completed or in the past.
                    </div>
                  )}
                  <button
                    onClick={() => navigate('/user/appointments')}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg"
                  >
                    <FaCheck /> Done
                  </button>
                </div>
              </>
            ) : (
              <div className="text-gray-600">Appointment not found.</div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}