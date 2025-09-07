import React from 'react';
import VetLayout from './VetLayout';

const kpis = [
  { label: 'Monthly Revenue (INR)', value: '₹ 1,24,000' },
  { label: 'Total Appointments', value: '186' },
  { label: 'Avg. Consultation Time', value: '22 min' },
  { label: 'Top Service', value: 'General Consultation' },
];

export default function VetAnalytics() {
  return (
    <VetLayout title="Analytics & Reports">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="text-xs text-gray-500">{k.label}</div>
              <div className="text-xl font-semibold text-gray-900 mt-1">{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-700 mb-3">Export GST-compliant statements</div>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-2 border rounded" onClick={() => alert('Generating CSV...')}>Download Revenue Report (CSV)</button>
          <button className="px-3 py-2 border rounded" onClick={() => alert('Generating PDF...')}>Download Invoices (PDF)</button>
        </div>
      </div>
    </VetLayout>
  );
}