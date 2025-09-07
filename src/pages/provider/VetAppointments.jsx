import React from 'react';
import VetLayout from './VetLayout';

const appointments = [
  { id: 1, date: '2025-09-07', time: '10:00 AM', owner: 'Amit Sharma', pet: 'Bruno (Labrador)', type: 'Clinic', fee: 800, status: 'Confirmed' },
  { id: 2, date: '2025-09-07', time: '12:15 PM', owner: 'Priya Verma', pet: 'Mittu (Indie Cat)', type: 'Video', fee: 600, status: 'Pending Payment' },
  { id: 3, date: '2025-09-07', time: '04:30 PM', owner: 'Rohit Gupta', pet: 'Simba (GSD)', type: 'Clinic', fee: 900, status: 'Confirmed' },
];

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export default function VetAppointments() {
  return (
    <VetLayout title="Appointments">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <input className="border rounded px-3 py-2 w-full sm:w-64" placeholder="Search by owner, pet, reason" />
          <div className="flex flex-wrap gap-2">
            <select className="border rounded px-3 py-2">
              <option>All Types</option>
              <option>Clinic</option>
              <option>Video</option>
            </select>
            <select className="border rounded px-3 py-2">
              <option>All Status</option>
              <option>Confirmed</option>
              <option>Pending Payment</option>
              <option>Completed</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">Pet</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Fee</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {appointments.map(a => (
                <tr key={a.id} className="text-sm">
                  <td className="px-3 py-2">{a.date}</td>
                  <td className="px-3 py-2">{a.time}</td>
                  <td className="px-3 py-2">{a.owner}</td>
                  <td className="px-3 py-2">{a.pet}</td>
                  <td className="px-3 py-2">{a.type}</td>
                  <td className="px-3 py-2">{INR.format(a.fee)}</td>
                  <td className="px-3 py-2">{a.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button className="px-2 py-1 text-xs bg-indigo-600 text-white rounded" onClick={() => window.location.href = '/provider/vet/prescriptions'}>Start</button>
                      <button className="px-2 py-1 text-xs border rounded" onClick={() => window.location.href = '/appointments/scheduler'}>Reschedule</button>
                      <button className="px-2 py-1 text-xs border rounded" onClick={() => window.location.href = '/transactions/payments'}>Mark Paid</button>
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