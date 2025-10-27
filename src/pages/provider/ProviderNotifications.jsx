import React, { useState } from 'react';
import ProviderDashboardLayout from './ProviderDashboardLayout';
import { FaBell, FaTrash } from 'react-icons/fa';

const NotificationItem = ({ notification, onDelete }) => (
  <div className={`${notification.read ? 'bg-gray-50' : 'bg-blue-50'} p-4 border-l-4 ${notification.read ? 'border-gray-300' : 'border-blue-600'} hover:shadow transition-shadow`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
          {notification.title}
        </p>
        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        <p className="text-xs text-gray-500 mt-2">{notification.timestamp}</p>
      </div>
      <button
        onClick={() => onDelete(notification.id)}
        className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
      >
        <FaTrash />
      </button>
    </div>
  </div>
);

const ProviderNotifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New Appointment',
      message: 'John Doe booked an appointment for Max on Dec 20',
      timestamp: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      title: 'Appointment Reminder',
      message: 'You have an appointment with Jane Smith in 1 hour',
      timestamp: '1 hour ago',
      read: false,
    },
    {
      id: 3,
      title: 'Review Posted',
      message: 'Bob Wilson left a 5-star review',
      timestamp: '3 hours ago',
      read: true,
    },
    {
      id: 4,
      title: 'Payment Received',
      message: 'Payment of ₹1500 received for appointment',
      timestamp: '1 day ago',
      read: true,
    },
  ]);

  const handleDelete = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ProviderDashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-2">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaBell className="mx-auto text-5xl text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">No notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </ProviderDashboardLayout>
  );
};

export default ProviderNotifications;