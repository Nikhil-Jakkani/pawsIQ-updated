import React from 'react';
import { FaCalendarAlt, FaClock, FaUser, FaPaw, FaMapMarkerAlt, FaCheck, FaTimes } from 'react-icons/fa';

/**
 * Reusable Appointment Card Component
 * @param {Object} appointment - Appointment data
 * @param {boolean} showActions - Whether to show approve/decline buttons
 * @param {function} onApprove - Approve callback
 * @param {function} onDecline - Decline callback
 */
const AppointmentCard = ({ 
  appointment, 
  showActions = false, 
  onApprove, 
  onDecline 
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center text-gray-700">
          <FaCalendarAlt className="mr-2 text-indigo-500" />
          <span className="font-medium">{appointment.date || '—'}</span>
        </div>
        <div className="flex items-center text-gray-700">
          <FaClock className="mr-2 text-indigo-500" />
          <span>{appointment.time || '—'}</span>
        </div>
        <div className="flex items-center text-gray-700">
          <FaUser className="mr-2 text-indigo-500" />
          <span>{appointment.owner || '—'}</span>
        </div>
        <div className="flex items-center text-gray-700">
          <FaPaw className="mr-2 text-indigo-500" />
          <span>{appointment.pet || '—'}</span>
        </div>
        <div className="flex items-center text-gray-700 sm:col-span-2">
          <FaMapMarkerAlt className="mr-2 text-indigo-500" />
          <span className="text-xs">{appointment.location || '—'}</span>
        </div>
        <div className="sm:col-span-2">
          <div className="text-xs text-gray-500">Service:</div>
          <div className="font-medium text-gray-900">{appointment.reason || '—'}</div>
        </div>
      </div>
      
      {showActions && (
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => onApprove && onApprove(appointment.id)}
            className="flex-1 bg-emerald-600 text-white px-3 py-2 rounded text-sm hover:bg-emerald-700 flex items-center justify-center"
          >
            <FaCheck className="mr-1" /> Approve
          </button>
          <button
            onClick={() => onDecline && onDecline(appointment.id)}
            className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 flex items-center justify-center"
          >
            <FaTimes className="mr-1" /> Decline
          </button>
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;