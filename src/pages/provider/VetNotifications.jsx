import React from 'react';
import VetLayout from './VetLayout';

const notifications = [
  { id: 1, text: 'UPI payment received from Rohit Gupta (₹900)', time: '2h ago' },
  { id: 2, text: 'Appointment confirmed for Priya Verma at 12:15 PM', time: '3h ago' },
  { id: 3, text: 'Lab report ready for Mittu (LFT)', time: '5h ago' },
];

export default function VetNotifications() {
  return (
    <VetLayout title="Notifications">
      <div className="bg-white rounded-lg shadow p-4">
        <ul className="divide-y">
          {notifications.map(n => (
            <li key={n.id} className="py-3">
              <div className="text-sm text-gray-800">{n.text}</div>
              <div className="text-xs text-gray-500">{n.time}</div>
            </li>
          ))}
        </ul>
      </div>
    </VetLayout>
  );
}