import React from 'react';
import VetLayout from './VetLayout';

const labs = [
  { id: 301, patient: 'Bruno', type: 'CBC', date: '2025-09-06', lab: 'Metropolis Mumbai', status: 'Normal' },
  { id: 302, patient: 'Mittu', type: 'LFT', date: '2025-09-06', lab: 'SRL Diagnostics', status: 'Abnormal' },
];

export default function VetLabReports() {
  return (
    <VetLayout title="Lab Reports">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={() => alert('Open upload dialog')}>Upload Report</button>
          <div className="text-sm text-gray-600">Supports PDF, Images. Stores IST timestamps.</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500">
                <th className="px-3 py-2">Patient</th>
                <th className="px-3 py-2">Test</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Lab</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {labs.map(l => (
                <tr key={l.id} className="text-sm">
                  <td className="px-3 py-2">{l.patient}</td>
                  <td className="px-3 py-2">{l.type}</td>
                  <td className="px-3 py-2">{l.date}</td>
                  <td className="px-3 py-2">{l.lab}</td>
                  <td className="px-3 py-2">{l.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button className="px-2 py-1 text-xs border rounded">View</button>
                      <button className="px-2 py-1 text-xs border rounded">Share</button>
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