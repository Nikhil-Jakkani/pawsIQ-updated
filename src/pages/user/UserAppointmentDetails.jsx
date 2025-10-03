import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaArrowLeft, FaCalendarAlt, FaClock, FaCheck, FaTimes, FaMapMarkerAlt, FaPaw, FaUser, FaCalendarCheck
} from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const toUiStatus = (status) => {
  switch (status) {
    case 'Scheduled':
      return 'upcoming';
    case 'Completed':
      return 'completed';
    case 'Cancelled':
      return 'cancelled';
    default:
      return 'upcoming';
  }
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

  const uiStatus = useMemo(() => toUiStatus(appt?.appointment_status), [appt]);

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
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${uiStatus === 'upcoming' ? 'bg-blue-50' : uiStatus === 'completed' ? 'bg-green-50' : 'bg-red-50' }`}>
                      <FaCalendarAlt className={`${uiStatus === 'upcoming' ? 'text-blue-600' : uiStatus === 'completed' ? 'text-green-600' : 'text-red-600' }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1">{appt.appointment_type}</h3>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <FaPaw className="text-blue-500" />
                        <span className="font-medium">{petInfo.name || 'Pet'}</span>
                        {petInfo.type ? (<><span className="text-gray-400">•</span><span className="capitalize">{petInfo.type}</span></>) : null}
                      </div>
                    </div>
                  </div>

                  <div className={`px-3 py-1.5 rounded-full ${statusBadge().bg} ${statusBadge().text} text-xs font-bold shadow-sm`}>
                    {uiStatus.charAt(0).toUpperCase() + uiStatus.slice(1)}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2"><FaCalendarAlt className="text-blue-600" /><span>{date}</span></div>
                    <div className="flex items-center gap-2"><FaClock className="text-blue-600" /><span>{time}</span></div>
                  </div>
                </div>

                {/* Provider & Booking Info */}
                <div className="space-y-3 mb-4">
                  {(provider || appt.provider_name || appt.providerName || appt.service_provider_id) && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <FaUser className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {provider?.serv_provider_name || provider?.name || appt.provider_name || appt.providerName || 'Service Provider'}
                        </p>
                        <p className="text-xs text-blue-600 font-medium">
                          {provider?.serv_provider_type || provider?.type || 'Service Provider'}
                        </p>
                        {provider?.serv_provider_location && (
                          <p className="text-xs text-gray-500 mt-1">
                            <FaMapMarkerAlt className="inline mr-1" />
                            {provider.serv_provider_location}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Booking & Approval Times */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {appt.created_dtm && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Booked On</p>
                        <p className="text-sm font-medium text-gray-800">
                          {new Date(appt.created_dtm).toLocaleDateString('en-US', { 
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                    {appt.last_updated_dtm && appt.appointment_status === 'Scheduled' && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600 mb-1">Approved On</p>
                        <p className="text-sm font-medium text-gray-800">
                          {new Date(appt.last_updated_dtm).toLocaleDateString('en-US', { 
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location & Notes */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <FaMapMarkerAlt className="text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{appt.location || '—'}</p>
                      <p className="text-xs text-gray-500">{appt.address || '—'}</p>
                    </div>
                  </div>
                  {appt.appointment_comments ? (
                    <div className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                      <p className="font-bold mb-1 text-yellow-800">Notes:</p>
                      <p>{appt.appointment_comments}</p>
                    </div>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {uiStatus === 'upcoming' && (
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