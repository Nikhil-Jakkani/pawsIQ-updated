import React from 'react';
import VetLayout from './VetLayout';

const services = [
  { id: 1, name: 'General Consultation', price: 600, gst: 18 },
  { id: 2, name: 'Vaccination (Core)', price: 800, gst: 12 },
  { id: 3, name: 'Deworming', price: 500, gst: 12 },
  { id: 4, name: 'Video Consultation', price: 400, gst: 18 },
];
const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export default function VetServices() {
  return (
    <VetLayout title="Services & Pricing (GST)">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={() => alert('Show add-service modal')}>Add Service</button>
          <div className="text-sm text-gray-600">Prices in INR; GST added as applicable</div>
        </div>
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
              {services.map(s => {
                const total = s.price + (s.price * s.gst) / 100;
                return (
                  <tr key={s.id} className="text-sm">
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{INR.format(s.price)}</td>
                    <td className="px-3 py-2">{s.gst}%</td>
                    <td className="px-3 py-2">{INR.format(total)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button className="px-2 py-1 text-xs border rounded">Edit</button>
                        <button className="px-2 py-1 text-xs border rounded">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </VetLayout>
  );
}