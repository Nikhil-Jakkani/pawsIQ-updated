import React from 'react';
import VetLayout from './VetLayout';

const erx = [
  { id: 101, patient: 'Bruno', owner: 'Amit Sharma', date: '2025-09-07', items: ['Amoxicillin 250mg - 1 tab BID 7d', 'Antihistamine 5mg - 1 tab HS 5d'] },
  { id: 102, patient: 'Mittu', owner: 'Priya Verma', date: '2025-09-05', items: ['Paracetamol 50mg - 1/4 tab TID 3d'] },
];

export default function VetPrescriptions() {
  return (
    <VetLayout title="Prescriptions (eRx)">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <button className="px-3 py-2 bg-indigo-600 text-white rounded">New Prescription</button>
          <div className="text-sm text-gray-600">eRx exports include clinic GSTIN and IST timestamps</div>
        </div>
        <div className="space-y-3">
          {erx.map(r => (
            <div key={r.id} className="border rounded p-3">
              <div className="text-sm text-gray-500">eRx #{r.id} • {r.date}
              </div>
              <div className="font-semibold text-gray-900">{r.patient} <span className="text-gray-600 font-normal">(Owner: {r.owner})</span></div>
              <ul className="list-disc pl-5 text-sm text-gray-800 mt-2">
                {r.items.map((i, idx) => <li key={idx}>{i}</li>)}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="px-2 py-1 text-xs border rounded" onClick={() => alert('Downloading eRx PDF...')}>Download PDF</button>
                <button className="px-2 py-1 text-xs border rounded" onClick={() => window.open('https://wa.me/?text=Your%20eRx%20from%20PawsIQ', '_blank')}>Share via WhatsApp</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </VetLayout>
  );
}