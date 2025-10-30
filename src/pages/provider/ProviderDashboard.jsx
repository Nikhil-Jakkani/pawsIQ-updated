import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProvider } from '../../context/ProviderContext';
import ProviderDashboardLayout from './ProviderDashboardLayout';
import {
  FaCalendarAlt,
  FaRupeeSign,
  FaUserFriends,
  FaStar,
  FaChartLine,
  FaCheckCircle,
  FaArrowUp,
  FaArrowRight,
  FaStethoscope,
  FaDumbbell,
  FaCut,
  FaPaw,
  FaFileAlt,
  FaClipboard,
} from 'react-icons/fa';
import { fetchProviderDashboardOverview, fetchProviderMetrics, fetchProviderRevenue, fetchProviderTypeMetrics } from '../../store/slices/providerAnalyticsSlice';
import { fetchProviderAppointments } from '../../store/slices/providerAppointmentsSlice';
import { fetchProviderClients } from '../../store/slices/providerClientsSlice';
import { PROVIDER_TYPES } from '../../store/slices/providerOnboardingSlice';

/**
 * Stat Card Component
 */
const StatCard = ({ icon: Icon, label, value, trend, trendUp = true, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 border-blue-500',
    green: 'bg-green-100 text-green-600 border-green-500',
    purple: 'bg-purple-100 text-purple-600 border-purple-500',
    orange: 'bg-orange-100 text-orange-600 border-orange-500',
    pink: 'bg-pink-100 text-pink-600 border-pink-500',
    indigo: 'bg-indigo-100 text-indigo-600 border-indigo-500',
  };

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-3">{value}</p>
          {trend && (
            <div className={`flex items-center mt-3 text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              <FaArrowUp className={`mr-1 ${!trendUp && 'rotate-180'}`} />
              {trend}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="text-2xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * Recent Appointment Card Component
 */
const RecentAppointmentCard = ({ appointment }) => (
  <div className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0">
    <div className="flex-1">
      <p className="font-semibold text-gray-900">{appointment.clientName}</p>
      <p className="text-sm text-gray-600">{appointment.petName}</p>
    </div>
    <div className="text-right">
      <p className="text-sm font-medium text-gray-900">{appointment.date}</p>
      <span
        className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
          appointment.status === 'confirmed'
            ? 'bg-green-100 text-green-800'
            : appointment.status === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
      </span>
    </div>
  </div>
);

/**
 * Quick Stat Item Component
 */
const QuickStatItem = ({ label, value, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    pink: 'text-pink-600',
    indigo: 'text-indigo-600',
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]} opacity-20`}>
          <Icon className="text-2xl" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Veterinarian Dashboard Widget
 */
const VeterinarianWidget = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <StatCard
      icon={FaStethoscope}
      label="Consultations"
      value={metrics?.consultations || 12}
      trend="+3 this week"
      color="blue"
    />
    <StatCard
      icon={FaFileAlt}
      label="Prescriptions Issued"
      value={metrics?.prescriptions || 8}
      trend="+2 this week"
      color="green"
    />
  </div>
);

/**
 * Trainer Dashboard Widget
 */
const TrainerWidget = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <StatCard
      icon={FaDumbbell}
      label="Training Sessions"
      value={metrics?.trainingSessions || 15}
      trend="+4 this month"
      color="indigo"
    />
    <StatCard
      icon={FaClipboard}
      label="Progress Reports"
      value={metrics?.progressReports || 5}
      trend="+1 this week"
      color="purple"
    />
  </div>
);

/**
 * Groomer Dashboard Widget
 */
const GroomerWidget = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <StatCard
      icon={FaCut}
      label="Grooming Sessions"
      value={metrics?.groomingSessions || 10}
      trend="+2 this week"
      color="pink"
    />
    <StatCard
      icon={FaCheckCircle}
      label="Completed This Month"
      value={metrics?.completedSessions || 28}
      trend="+5 from last month"
      color="green"
    />
  </div>
);

/**
 * Pet Sitter Dashboard Widget
 */
const PetSitterWidget = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <StatCard
      icon={FaPaw}
      label="Active Bookings"
      value={metrics?.activeBookings || 6}
      trend="+2 this week"
      color="orange"
    />
    <StatCard
      icon={FaCalendarAlt}
      label="Upcoming Sits"
      value={metrics?.upcomingSits || 12}
      trend="+3 scheduled"
      color="blue"
    />
  </div>
);

/**
 * Provider Dashboard Component
 */
const ProviderDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser, authFetch } = useAuth();
  const { providerType, providerInfo } = useProvider();

  // Redux state - using provider-specific slices
  const { 
    metrics = {}, 
    revenue = {}, 
    typeMetrics = {},
    recentAppointments: fetchedAppointments = [],
    clients = [],
    loading,
    error 
  } = useSelector((state) => state.providerAnalytics || {});

  // Check if user is actually a provider
  useEffect(() => {
    if (currentUser && currentUser.role !== 'provider') {
      console.error('[ProviderDashboard] Access denied: User is not a provider', currentUser);
      alert('Access Denied: You must be logged in as a provider to access this page.');
      navigate('/provider/login');
    }
  }, [currentUser, navigate]);

  // Fetch data on mount - using single overview call for better performance
  useEffect(() => {
    // Only fetch if user is a provider
    if (authFetch && currentUser && currentUser.role === 'provider') {
      // Fetch all dashboard data in one call
      dispatch(fetchProviderDashboardOverview({ authFetch }));
    }
  }, [dispatch, authFetch, currentUser]);

  // Early return if not a provider
  if (currentUser && currentUser.role !== 'provider') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-4">You must be logged in as a provider to access this page.</p>
          <p className="text-gray-500">Redirecting to provider login...</p>
        </div>
      </div>
    );
  }

  // Use fetched appointments or fallback to mock data
  const recentAppointments = fetchedAppointments.length > 0 ? fetchedAppointments.map(apt => ({
    id: apt.id,
    clientName: apt.clientName,
    petName: apt.petName,
    date: new Date(apt.date).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    }),
    status: apt.status,
  })) : [
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

  // Currency formatter
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  // Get provider-specific widget
  const getProviderWidget = () => {
    const providerTypeKey = providerType?.toLowerCase().replace(/[^a-z]/g, '_');
    const specificMetrics = typeMetrics[providerTypeKey] || typeMetrics.veterinarian || typeMetrics.trainer || typeMetrics.groomer || typeMetrics.pet_sitter;
    
    switch (providerType) {
      case PROVIDER_TYPES.VETERINARIAN:
        return <VeterinarianWidget metrics={specificMetrics} />;
      case PROVIDER_TYPES.TRAINER:
        return <TrainerWidget metrics={specificMetrics} />;
      case PROVIDER_TYPES.GROOMER:
        return <GroomerWidget metrics={specificMetrics} />;
      case PROVIDER_TYPES.PET_SITTER:
        return <PetSitterWidget metrics={specificMetrics} />;
      default:
        return null;
    }
  };

  // Get provider-specific icon
  const getProviderIcon = () => {
    switch (providerType) {
      case PROVIDER_TYPES.VETERINARIAN:
        return FaStethoscope;
      case PROVIDER_TYPES.TRAINER:
        return FaDumbbell;
      case PROVIDER_TYPES.GROOMER:
        return FaCut;
      case PROVIDER_TYPES.PET_SITTER:
        return FaPaw;
      default:
        return FaCalendarAlt;
    }
  };

  return (
    <ProviderDashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {React.createElement(getProviderIcon(), { className: 'text-2xl text-blue-600' })}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {providerType} Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {providerInfo?.name || 'Provider'}! Here's your performance overview.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={FaCalendarAlt}
            label="Total Appointments"
            value={metrics.totalAppointments || 24}
            trend="+12% from last month"
            trendUp={true}
            color="blue"
          />
          <StatCard
            icon={FaCheckCircle}
            label="Completed"
            value={metrics.completedAppointments || 18}
            trend="75% completion rate"
            trendUp={true}
            color="green"
          />
          <StatCard
            icon={FaRupeeSign}
            label="Total Revenue"
            value={formatCurrency(revenue.totalRevenue || 45000)}
            trend="+8% from last month"
            trendUp={true}
            color="green"
          />
          <StatCard
            icon={FaStar}
            label="Average Rating"
            value={metrics.averageRating ? metrics.averageRating.toFixed(1) : 4.8}
            trend="Based on 89 reviews"
            trendUp={true}
            color="purple"
          />
        </div>

        {/* Provider-Specific Widget */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {providerType} Specific Metrics
          </h2>
          {getProviderWidget()}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Appointments */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaCalendarAlt className="text-blue-600 text-lg" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Recent Appointments</h2>
              </div>
              <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                View All
                <FaArrowRight className="text-xs" />
              </button>
            </div>
            <div>
              {recentAppointments.length > 0 ? (
                recentAppointments.map((apt) => (
                  <RecentAppointmentCard key={apt.id} appointment={apt} />
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500 font-medium">No appointments scheduled</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
            </div>
            <div className="divide-y divide-gray-200">
              <QuickStatItem
                label="Total Clients"
                value={clients.length || 45}
                icon={FaUserFriends}
                color="blue"
              />
              <QuickStatItem
                label="Pending Amount"
                value={formatCurrency(revenue.pendingAmount || 12000)}
                icon={FaRupeeSign}
                color="orange"
              />
              <QuickStatItem
                label="Total Reviews"
                value={metrics.totalReviews || 89}
                icon={FaStar}
                color="purple"
              />
            </div>
            <div className="p-4">
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                View All Stats
              </button>
            </div>
          </div>
        </div>

        {/* Revenue Chart Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaChartLine className="text-green-600 text-lg" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Revenue Trend</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <FaChartLine className="text-4xl text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">
                  Chart will display revenue trends here
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProviderDashboardLayout>
  );
};

export default ProviderDashboard;