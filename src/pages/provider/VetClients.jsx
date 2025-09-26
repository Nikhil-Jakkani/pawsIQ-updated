import React, { useEffect, useMemo, useState } from 'react';
import VetLayout from './VetLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

export default function VetClients() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchClients = async () => {
    setLoading(true);
    setError('');
    try {
      // Use provider bookings as source of truth for clients (users)
      const res = await authFetch(`${API_URL}/provider/bookings`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to load clients');
      const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      // Map unique users
      const byKey = new Map();
      list.forEach((b) => {
        const key = b.user_id || b.user_email || b.user_name || b.booking_user_id || b.booking_id;
        if (!key) return;
        const entry = byKey.get(key) || {
          id: key,
          owner: b.user_name || b.user_full_name || b.user_email || '—',
          phone: b.user_phone_number || b.user_phone || '—',
          city: b.user_city || b.address_city || '—',
          pets: [],
        };
        // Attach pet info when present
        const petName = b.pet_name || (b.PIQ_Pet_Master && b.PIQ_Pet_Master.pet_name);
        const petType = (b.pet_type || (b.PIQ_Pet_Master && b.PIQ_Pet_Master.pet_type) || '').toString();
        if (petName) {
          if (!entry.pets.some((p) => p.name === petName)) entry.pets.push({ name: petName, type: petType });
        }
        byKey.set(key, entry);
      });
      setItems(Array.from(byKey.values()));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((c) => !q || c.owner.toLowerCase().includes(q) || c.pets.some((p) => p.name.toLowerCase().includes(q)));
  }, [items, search]);

  return (
    <VetLayout title="Clients / Patients">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <input className="border rounded px-3 py-2 w-full sm:w-64" placeholder="Search by owner, pet" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key==='Enter') fetchClients(); }} />
          <div className="flex gap-2">
            <button className="px-3 py-2 border rounded" onClick={fetchClients}>Refresh</button>
          </div>
        </div>
        {loading && (<div className="p-3 text-sm text-gray-600">Loading...</div>)}
        {error && (<div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded mb-3">{error}</div>)}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="border rounded-lg p-4">
              <div className="font-semibold text-gray-900">{c.owner}</div>
              <div className="text-sm text-gray-600">{c.phone}</div>
              <div className="text-sm text-gray-600">{c.city}</div>
              <div className="mt-2 text-sm text-gray-700">
                Pets: {c.pets.length ? c.pets.map(p => `${p.name} (${p.type})`).join(', ') : '—'}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="px-2 py-1 text-xs border rounded" onClick={() => window.location.href = '/provider/vet/appointments'}>View</button>
                <button className="px-2 py-1 text-xs border rounded" onClick={() => window.location.href = '/appointments/scheduler'}>Book</button>
                <button className="px-2 py-1 text-xs border rounded" onClick={() => window.location.href = '/support/chat'}>Message</button>
              </div>
            </div>
          ))}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-sm text-gray-500">No clients found.</div>
          )}
        </div>
      </div>
    </VetLayout>
  );
}