import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const formatDateTimeLocal = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
};

export default function UserRescheduleAppointment() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser, tokens } = useAuth();
  const accessToken = tokens?.access?.token;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [appt, setAppt] = useState(null);
  const [when, setWhen] = useState(''); // datetime-local value

  const minDateTime = useMemo(() => {
    // No past times
    const now = new Date();
    return formatDateTimeLocal(now.toISOString());
  }, []);

  useEffect(() => {
    if (!accessToken || !id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_URL}/appointments/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Failed to load appointment');
        if (!cancelled) {
          setAppt(data);
          setWhen(formatDateTimeLocal(data.appointment_date));
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load appointment');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [accessToken, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!when) return;
    setSubmitting(true);
    setError('');
    try {
      const iso = new Date(when).toISOString();
      const res = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ appointment_date: iso }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to reschedule appointment');
      navigate('/user/appointments', { state: { toast: 'Appointment rescheduled successfully' } });
    } catch (e) {
      setError(e.message || 'Failed to reschedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <FaArrowLeft /> Back
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-50">
              <FaCalendarAlt className="text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Reschedule Appointment</h1>
          </div>

          {loading ? (
            <div className="text-gray-600">Loading…</div>
          ) : error ? (
            <div className="text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>
          ) : appt ? (
            <>
              {/* Current details */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2"><FaCalendarAlt className="text-purple-600" /><span>{new Date(appt.appointment_date).toLocaleString()}</span></div>
                  <div className="flex items-center gap-2"><FaClock className="text-purple-600" /><span>{appt.appointment_type}</span></div>
                  <div className="flex items-center gap-2 md:col-span-2"><FaMapMarkerAlt className="text-purple-600" /><span>{appt.appointment_comments || 'No notes'}</span></div>
                </div>
              </div>

              {/* Reschedule form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Date & Time</label>
                  <input
                    type="datetime-local"
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                    min={minDateTime}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Please choose a future time.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    <FaCheck /> {submitting ? 'Rescheduling…' : 'Confirm Reschedule'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/user/appointments')}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg"
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-gray-600">Appointment not found.</div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}