import React from 'react';
import VetLayout from './VetLayout';

const clients = [
  { id: 1, owner: 'Amit Sharma', phone: '+91 98765 43210', city: 'Mumbai', pets: [{ name: 'Bruno', type: 'Dog' }] },
  { id: 2, owner: 'Priya Verma', phone: '+91 99876 54321', city: 'Delhi', pets: [{ name: 'Mittu', type: 'Cat' }] },
  { id: 3, owner: 'Rohit Gupta', phone: '+91 91234 56789', city: 'Bengaluru', pets: [{ name: 'Simba', type: 'Dog' }] },
];

export default function VetClients() {
  return (
    <VetLayout title="Clients / Patients">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <input className="border rounded px-3 py-2 w-full sm:w-64" placeholder="Search by owner, pet" />
          <button className="px-3 py-2 bg-indigo-600 text-white rounded">Add Client</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(c => (
            <div key={c.id} className="border rounded-lg p-4">
              <div className="font-semibold text-gray-900">{c.owner}</div>
              <div className="text-sm text-gray-600">{c.phone}</div>
              <div className="text-sm text-gray-600">{c.city}</div>
              <div className="mt-2 text-sm text-gray-700">
                Pets: {c.pets.map(p => `${p.name} (${p.type})`).join(', ')}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="px-2 py-1 text-xs border rounded" onClick={() => window.location.href = '/provider/vet/appointments'}>View</button>
                <button className="px-2 py-1 text-xs border rounded" onClick={() => window.location.href = '/appointments/scheduler'}>Book</button>
                <button className="px-2 py-1 text-xs border rounded" onClick={() => window.location.href = '/support/chat'}>Message</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </VetLayout>
  );
}