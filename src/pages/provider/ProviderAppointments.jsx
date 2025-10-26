import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import ProviderDashboardLayout from './ProviderDashboardLayout';
import {
  FaCalendarAlt,
  FaFilter,
  FaEye,
  FaCheck,
  FaTimes,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
} from 'react-icons/fa';
import {
  fetchAppointments,
  setFilters,
  updateAppointment,
  cancelAppointment,
} from '../../store/slices/appointmentsSlice';

const AppointmentCard = ({ appointment, onView, onConfirm, onCancel }) => (
  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{appointment.clientName}</h3>
        <p className="text-sm text-gray-600">{appointment.petName}</p>
      </div>
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          appointment.status === 'confirmed'
            ? 'bg-green-100 text-green-800'
            : appointment.status === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {appointment.status}
      </span>
    </div>

    <div className="space-y-2 mb-4">
      <p className="flex items-center text-sm text-gray-700">
        <FaCalendarAlt className="mr-2 text-blue-600" />
        {appointment.date}
      </p>
      <p className="flex items-center text-sm text-gray-700">
        <FaClock className="mr-2 text-blue-600" />
        {appointment.time}
      </p>
      <p className="flex items-center text-sm text-gray-700">
        <FaPhone className="mr-2 text-blue-600" />
        {appointment.clientPhone}
      </p>
      {appointment.location && (
        <p className="flex items-center text-sm text-gray-700">
          <FaMapMarkerAlt className="mr-2 text-blue-600" />
          {appointment.location}
        </p>
      )}
    </div>

    <p className="text-sm text-gray-600 mb-4">{appointment.serviceType}</p>

    <div className="flex space-x-3">
      <button
        onClick={() => onView(appointment.id)}
        className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
      >
        <FaEye className="mr-2" />
        View
      </button>
      {appointment.status === 'pending' && (
        <button
          onClick={() => onConfirm(appointment.id)}
          className="flex-1 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
        >
          <FaCheck className="mr-2" />
          Confirm
        </button>
      )}
      <button
        onClick={() => onCancel(appointment.id)}
        className="flex-1 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
      >
        <FaTimes className="mr-2" />
        Cancel
      </button>
    </div>
  </div>
);

const ProviderAppointments = () => {
  const dispatch = useDispatch();
  const { authFetch } = useAuth();
  const { appointments = [], filters = {}, loading = false, error = null } = useSelector(
    (state) => state.appointments || {}
  );
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    if (authFetch) {
      dispatch(fetchAppointments({ filters, authFetch }));
    }
  }, [dispatch, authFetch]);

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    dispatch(setFilters({ status }));
  };

  const handleView = (id) => {
    // Navigate to appointment details
    console.log('View appointment:', id);
  };

  const handleConfirm = (id) => {
    dispatch(
      updateAppointment({
        id,
        data: { status: 'confirmed' },
        authFetch,
      })
    );
  };

  const handleCancel = (id) => {
    const reason = prompt('Please enter cancellation reason:');
    if (reason) {
      dispatch(cancelAppointment({ id, reason, authFetch }));
    }
  };

  const filteredAppointments =
    selectedStatus === 'all'
      ? appointments
      : appointments.filter((apt) => apt.status === selectedStatus);

  return (
    <ProviderDashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-2">Manage your appointments and schedule.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-4 flex-wrap gap-4">
            <FaFilter className="text-gray-600" />
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  selectedStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaCalendarAlt className="mx-auto text-5xl text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">No appointments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                onView={handleView}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>
    </ProviderDashboardLayout>
  );
};

export default ProviderAppointments;