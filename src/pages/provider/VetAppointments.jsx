import React, { useEffect, useMemo, useState } from 'react';
import VetLayout from './VetLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';
const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export default function VetAppointments() {
  const { authFetch, tokens } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Pending');

  const fetchBookings = async () => {
    if (!tokens?.access?.token) return;
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${API_URL}/provider/bookings?status=${encodeURIComponent(status)}&limit=50`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to load bookings');
      const normalized = (data?.items || []).map((b) => {
        const d = new Date(b.booked_dtm);
        const date = Number.isNaN(d.getTime()) ? '—' : d.toISOString().slice(0, 10);
        const time = Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          id: b.booking_id,
          date,
          time,
          owner: b.user_name || b.user_email || '—',
          pet: b.pet_name ? `${b.pet_name} (${b.pet_type || ''})` : '—',
          service: b.service_title || b.service_type || '—',
          fee: b.PIQ_Service_Master?.service_price_amt ?? 0,
          raw: b,
        };
      });
      setItems(normalized);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [status, tokens?.access?.token]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((it) =>
      !q ||
      it.owner.toLowerCase().includes(q) ||
      it.pet.toLowerCase().includes(q) ||
      it.service.toLowerCase().includes(q)
    );
  }, [items, search]);

  const handleApprove = async (id) => {
    try {
      const res = await authFetch(`${API_URL}/provider/bookings/${id}/approve`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to approve booking');
      await fetchBookings();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDecline = async (id) => {
    if (!window.confirm('Decline this booking?')) return;
    try {
      const res = await authFetch(`${API_URL}/provider/bookings/${id}/decline`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to decline booking');
      await fetchBookings();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <VetLayout title="Appointments">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <input className="border rounded px-3 py-2 w-full sm:w-64" placeholder="Search by owner, pet, service" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {loading && (<div className="p-4 text-sm text-gray-600">Loading...</div>)}
        {error && (<div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>)}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">Pet</th>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((a) => (
                <tr key={a.id} className="text-sm">
                  <td className="px-3 py-2">{a.date}</td>
                  <td className="px-3 py-2">{a.time}</td>
                  <td className="px-3 py-2">{a.owner}</td>
                  <td className="px-3 py-2">{a.pet}</td>
                  <td className="px-3 py-2">{a.service}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {status === 'Pending' && (
                        <>
                          <button className="px-2 py-1 text-xs bg-indigo-600 text-white rounded" onClick={() => handleApprove(a.id)}>Approve</button>
                          <button className="px-2 py-1 text-xs border rounded" onClick={() => handleDecline(a.id)}>Decline</button>
                        </>
                      )}
                      {status === 'Confirmed' && (
                        <button className="px-2 py-1 text-xs bg-indigo-600 text-white rounded" onClick={() => window.location.href = '/provider/vet/prescriptions'}>Start</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </VetLayout>
  );
}