import React, { useEffect, useState } from 'react';
import VetLayout from './VetLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';
const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export default function VetServices() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        // Primary source: Service Master
        const res = await authFetch(`${API_URL}/services`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || '');
        const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
        const normalized = list.map((s) => ({
          id: s.services_id || s.id || s.service_id,
          name: s.title || s.service_title || s.name || 'Service',
          price: Number(s.base_price ?? s.service_price_amt ?? s.price ?? 0),
          gst: Number(s.gst_pct ?? s.gst ?? 0),
        }));
        if (mounted) setItems(normalized);
      } catch (e) {
        // Fallback: derive from provider bookings (best-effort)
        try {
          const bRes = await authFetch(`${API_URL}/provider/bookings`);
          const bData = await bRes.json().catch(() => ({}));
          if (!bRes.ok) throw new Error(bData?.message || e.message || 'Failed to load services');
          const list = Array.isArray(bData?.items) ? bData.items : (Array.isArray(bData) ? bData : []);
          const byId = new Map();
          list.forEach((b) => {
            const m = b.PIQ_Service_Master || {};
            const id = m.service_id || m.id || b.service_id || b.services_id || b.booking_id;
            const name = m.service_title || b.service_title || 'Service';
            const price = Number(m.service_price_amt ?? b.service_price_amt ?? b.price ?? 0);
            const gst = Number(m.gst_pct ?? b.gst_pct ?? 0);
            if (!byId.has(id)) byId.set(id, { id, name, price, gst });
          });
          if (mounted) setItems(Array.from(byId.values()));
          if (mounted) setError('');
        } catch (e2) {
          if (mounted) setError(e2.message || 'Failed to load services');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [authFetch]);
  return (
    <VetLayout title="Services & Pricing (GST)">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={() => alert('Add Service flow coming soon')}>Add Service</button>
          <div className="text-sm text-gray-600">Prices in INR; GST added as applicable</div>
        </div>
        {error && (<div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded mb-3">{error}</div>)}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500">
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Base Price</th>
                <th className="px-3 py-2">GST %</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(loading ? [] : items).map(s => {
                const total = s.price + (s.price * s.gst) / 100;
                return (
                  <tr key={s.id} className="text-sm">
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{INR.format(s.price)}</td>
                    <td className="px-3 py-2">{s.gst}%</td>
                    <td className="px-3 py-2">{INR.format(total)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button className="px-2 py-1 text-xs border rounded" onClick={() => alert('Edit flow coming soon')}>Edit</button>
                        <button className="px-2 py-1 text-xs border rounded" onClick={() => alert('Delete flow coming soon')}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && items.length === 0 && (
                <tr><td className="px-3 py-3 text-sm text-gray-500" colSpan={5}>No services added yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </VetLayout>
  );
}