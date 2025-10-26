import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import ProviderDashboardLayout from './ProviderDashboardLayout';
import {
  FaCalendarAlt,
  FaRupeeSign,
  FaUserFriends,
  FaStar,
  FaChartLine,
  FaCheckCircle,
} from 'react-icons/fa';
import { fetchAnalytics, fetchRevenueMetrics } from '../../store/slices/analyticsSlice';
import { fetchAppointments } from '../../store/slices/appointmentsSlice';
import { fetchClients } from '../../store/slices/clientsSlice';

const StatCard = ({ icon: Icon, label, value, trend, trendUp = true }) => (
  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        {trend && (
          <p className={`text-sm mt-2 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${Icon === FaRupeeSign ? 'bg-green-100' : 'bg-blue-100'}`}>
        <Icon className={`text-2xl ${Icon === FaRupeeSign ? 'text-green-600' : 'text-blue-600'}`} />
      </div>
    </div>
  </div>
);

const RecentAppointmentCard = ({ appointment }) => (
  <div className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
    <div className="flex-1">
      <p className="font-semibold text-gray-900">{appointment.clientName}</p>
      <p className="text-sm text-gray-600">{appointment.petName}</p>
    </div>
    <div className="text-right">
      <p className="text-sm font-medium text-gray-900">{appointment.date}</p>
      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
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
  </div>
);

const ProviderDashboard = () => {
  const dispatch = useDispatch();
  const { currentUser, authFetch } = useAuth();
  const { metrics = {}, revenue = {} } = useSelector((state) => state.analytics || {});
  const { appointments = [] } = useSelector((state) => state.appointments || {});
  const { clients = [] } = useSelector((state) => state.clients || {});

  useEffect(() => {
    if (authFetch) {
      // Fetch all data on mount
      dispatch(fetchAnalytics({ authFetch }));
      dispatch(fetchRevenueMetrics({ authFetch }));
      dispatch(fetchAppointments({ authFetch }));
      dispatch(fetchClients({ authFetch }));
    }
  }, [dispatch, authFetch]);

  // Mock recent appointments (in real app, this would come from the appointments slice)
  const recentAppointments = [
    {
      id: 1,
      clientName: 'John Doe',
      petName: 'Max',
      date: 'Today, 2:00 PM',
      status: 'confirmed',
    },
    {
      id: 2,
      clientName: 'Jane Smith',
      petName: 'Bella',
      date: 'Tomorrow, 10:00 AM',
      status: 'pending',
    },
    {
      id: 3,
      clientName: 'Bob Wilson',
      petName: 'Charlie',
      date: 'Dec 20, 3:00 PM',
      status: 'confirmed',
    },
  ];

  const inr = (n) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n || 0);

  return (
    <ProviderDashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your performance overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FaCalendarAlt}
            label="Total Appointments"
            value={metrics.totalAppointments || 24}
            trend="+12% from last month"
            trendUp={true}
          />
          <StatCard
            icon={FaCheckCircle}
            label="Completed"
            value={metrics.completedAppointments || 18}
            trend="75% completion rate"
            trendUp={true}
          />
          <StatCard
            icon={FaRupeeSign}
            label="Total Revenue"
            value={inr(revenue.totalRevenue || 45000)}
            trend="+8% from last month"
            trendUp={true}
          />
          <StatCard
            icon={FaStar}
            label="Average Rating"
            value={metrics.averageRating ? metrics.averageRating.toFixed(1) : 4.8}
            trend="Based on reviews"
            trendUp={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Appointments */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FaCalendarAlt className="mr-3 text-blue-600" />
                Recent Appointments
              </h2>
            </div>
            <div>
              {recentAppointments.length > 0 ? (
                recentAppointments.map((apt) => (
                  <RecentAppointmentCard key={apt.id} appointment={apt} />
                ))
              ) : (
                <div className="p-6 text-center text-gray-600">
                  No appointments scheduled
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h3>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {clients.length || 45}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {inr(revenue.pendingAmount || 12000)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {metrics.totalReviews || 89}
                </p>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                View All Stats
              </button>
            </div>
          </div>
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <FaChartLine className="mr-3 text-green-600" />
            Revenue Trend
          </h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-600">Chart will display revenue trends here</p>
          </div>
        </div>
      </div>
    </ProviderDashboardLayout>
  );
};

export default ProviderDashboard;