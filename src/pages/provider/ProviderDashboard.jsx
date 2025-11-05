import React, { useEffect, useMemo } from 'react';
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
  FaCheckCircle,
  FaArrowUp,
  FaArrowRight,
  FaStethoscope,
  FaDumbbell,
  FaCut,
  FaPaw,
  FaFileAlt,
  FaClipboard,
  FaChartLine,
} from 'react-icons/fa';
import { fetchProviderDashboardOverview } from '../../store/slices/providerAnalyticsSlice';
import { PROVIDER_TYPES } from '../../store/slices/providerOnboardingSlice';

/**
 * Stat Card Component
 */
const StatCard = ({ icon: Icon, label, value, trend, trendUp = true, color = 'blue', showTrendIndicator = true }) => {
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
              {showTrendIndicator && (
                <FaArrowUp className={`mr-1 ${!trendUp && 'rotate-180'}`} />
              )}
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
const RecentAppointmentCard = ({ appointment }) => {
  const status = (appointment.status || '').toLowerCase();
  const statusClass =
    status === 'confirmed'
      ? 'bg-green-100 text-green-800'
      : status === 'pending'
      ? 'bg-yellow-100 text-yellow-800'
      : status === 'cancelled'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-800';

  const formattedStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : '—';

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0">
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{appointment.clientName || '—'}</p>
        <p className="text-sm text-gray-600">{appointment.petName || '—'}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{appointment.date}</p>
        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
          {formattedStatus}
        </span>
      </div>
    </div>
  );
};

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
      value={metrics?.consultations ?? 0}
      color="blue"
    />
    <StatCard
      icon={FaFileAlt}
      label="Prescriptions Issued"
      value={metrics?.prescriptionsIssued ?? 0}
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
      value={metrics?.trainingSessions ?? 0}
      color="indigo"
    />
    <StatCard
      icon={FaClipboard}
      label="Progress Reports"
      value={metrics?.progressReports ?? 0}
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
      value={metrics?.groomingSessions ?? 0}
      color="pink"
    />
    <StatCard
      icon={FaCheckCircle}
      label="Completed This Month"
      value={metrics?.completedSessions ?? 0}
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
      value={metrics?.activeBookings ?? 0}
      color="orange"
    />
    <StatCard
      icon={FaCalendarAlt}
      label="Upcoming Sits"
      value={metrics?.upcomingSits ?? 0}
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
    error,
    providerType: analyticsProviderType
  } = useSelector((state) => state.providerAnalytics || {});

  const providerDisplayName = useMemo(() => (
    providerInfo?.serv_provider_name ||
    providerInfo?.name ||
    providerInfo?.provider_name ||
    currentUser?.name ||
    currentUser?.email ||
    'Provider'
  ), [providerInfo, currentUser]);

  const normalizedProviderType = useMemo(() => {
    const rawType = providerType || analyticsProviderType || providerInfo?.providerType || providerInfo?.serv_provider_type;
    if (!rawType) return null;

    const value = rawType.toString().toLowerCase();
    const typeKeyMap = {
      veterinarian: 'veterinarian',
      veterinary: 'veterinarian',
      vet: 'veterinarian',
      trainer: 'trainer',
      training: 'trainer',
      groomer: 'groomer',
      grooming: 'groomer',
      'pet sitter': 'pet_sitter',
      petsitter: 'pet_sitter',
      'pet_sitting': 'pet_sitter',
      'physical activity': 'pet_sitter',
      diagnostics: 'diagnostics',
      'diagnostic services': 'diagnostics',
      boarding: 'boarding',
    };

    return typeKeyMap[value] || value.replace(/[^a-z0-9]+/g, '_');
  }, [providerType, analyticsProviderType, providerInfo]);

  const providerTypeLabel = useMemo(() => (
    providerType || analyticsProviderType || providerInfo?.providerType || providerInfo?.serv_provider_type || 'Provider'
  ), [providerType, analyticsProviderType, providerInfo]);

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

  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-IN'), []);

  const formatNumber = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '0';
    return numberFormatter.format(numeric);
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const recentAppointments = useMemo(() => {
    if (!Array.isArray(fetchedAppointments)) return [];
    return fetchedAppointments.map((apt) => ({
      id: apt.id,
      clientName: apt.clientName,
      petName: apt.petName,
      date: formatDateTime(apt.date),
      status: apt.status,
    }));
  }, [fetchedAppointments]);

  // Currency formatter
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const completionRate = Number(metrics.completionRate || 0);
  const revenueGrowthValue = Number(revenue.revenueGrowth || 0);
  const revenueTrend = Number.isFinite(revenueGrowthValue)
    ? `${revenueGrowthValue >= 0 ? '+' : ''}${revenueGrowthValue.toFixed(1)}% from last month`
    : null;

  const completionTrend = Number.isFinite(completionRate)
    ? `${Math.round(completionRate)}% completion rate`
    : null;

  const averageRating = Number(metrics.averageRating || 0);
  const averageRatingDisplay = averageRating > 0 ? averageRating.toFixed(1) : '—';
  const averageRatingSubtitle = metrics.totalReviews
    ? `Based on ${formatNumber(metrics.totalReviews)} reviews`
    : null;

  const derivedTypeMetrics = normalizedProviderType ? typeMetrics?.[normalizedProviderType] : undefined;

  const navigateToAppointments = () => navigate('/provider/appointments');

  // Get provider-specific widget
  const getProviderWidget = () => {
    const specificMetrics = derivedTypeMetrics || typeMetrics.veterinarian || typeMetrics.trainer || typeMetrics.groomer || typeMetrics.pet_sitter;

    if (!specificMetrics) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6 text-gray-500">
          No type-specific metrics available yet.
        </div>
      );
    }

    switch (normalizedProviderType) {
      case PROVIDER_TYPES.VETERINARIAN:
      case 'veterinarian':
        return <VeterinarianWidget metrics={specificMetrics} />;
      case PROVIDER_TYPES.TRAINER:
      case 'trainer':
        return <TrainerWidget metrics={specificMetrics} />;
      case PROVIDER_TYPES.GROOMER:
      case 'groomer':
        return <GroomerWidget metrics={specificMetrics} />;
      case PROVIDER_TYPES.PET_SITTER:
      case 'pet_sitter':
        return <PetSitterWidget metrics={specificMetrics} />;
      default:
        return null;
    }
  };

  // Get provider-specific icon
  const getProviderIcon = () => {
    const type = normalizedProviderType;
    switch (type) {
      case PROVIDER_TYPES.VETERINARIAN:
      case 'veterinarian':
        return FaStethoscope;
      case PROVIDER_TYPES.TRAINER:
      case 'trainer':
        return FaDumbbell;
      case PROVIDER_TYPES.GROOMER:
      case 'groomer':
        return FaCut;
      case PROVIDER_TYPES.PET_SITTER:
      case 'pet_sitter':
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
                {providerTypeLabel} Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {providerDisplayName}! Here's your performance overview.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg">
            {typeof error === 'string' ? error : 'We ran into a problem loading your dashboard data.'}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={FaCalendarAlt}
            label="Total Appointments"
            value={formatNumber(metrics.totalAppointments || 0)}
            color="blue"
          />
          <StatCard
            icon={FaCheckCircle}
            label="Completed"
            value={formatNumber(metrics.completedAppointments || 0)}
            trend={completionTrend}
            trendUp={true}
            color="green"
          />
          <StatCard
            icon={FaRupeeSign}
            label="Total Revenue"
            value={formatCurrency(revenue.paidAmount || revenue.totalRevenue || 0)}
            trend={revenueTrend}
            trendUp={revenueGrowthValue >= 0}
            color="green"
          />
          <StatCard
            icon={FaStar}
            label="Average Rating"
            value={averageRatingDisplay}
            trend={averageRatingSubtitle}
            trendUp={true}
            showTrendIndicator={Boolean(averageRatingSubtitle && averageRatingSubtitle.includes('Based'))}
            color="purple"
          />
        </div>

        {/* Provider-Specific Widget */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {providerTypeLabel} Specific Metrics
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
              <button
                onClick={navigateToAppointments}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
              >
                View All
                <FaArrowRight className="text-xs" />
              </button>
            </div>
            <div>
              {loading ? (
                <div className="p-6 text-center text-sm text-gray-500">Loading appointments...</div>
              ) : recentAppointments.length > 0 ? (
                recentAppointments.map((apt) => (
                  <RecentAppointmentCard key={apt.id} appointment={apt} />
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500 font-medium">No appointments found.</p>
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
                value={formatNumber(Array.isArray(clients) ? clients.length : 0)}
                icon={FaUserFriends}
                color="blue"
              />
              <QuickStatItem
                label="Pending Amount"
                value={formatCurrency(revenue.pendingAmount || 0)}
                icon={FaRupeeSign}
                color="orange"
              />
              <QuickStatItem
                label="Total Reviews"
                value={formatNumber(metrics.totalReviews || 0)}
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