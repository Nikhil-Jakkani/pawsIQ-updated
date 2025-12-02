import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import ProviderDashboardLayout from './ProviderDashboardLayout';
import {
  FaChartLine,
  FaCalendarAlt,
  FaRupeeSign,
  FaStar,
  FaUsers,
} from 'react-icons/fa';
import { fetchProviderDashboardOverview } from '../../store/slices/providerAnalyticsSlice';

const StatBox = ({ icon: Icon, label, value, bgColor = 'bg-blue-100', textColor = 'text-blue-600' }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className={`${bgColor} p-4 rounded-lg mr-4`}>
        <Icon className={`text-2xl ${textColor}`} />
      </div>
      <div>
        <p className="text-gray-600 text-sm">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-xl font-semibold text-gray-900 mb-6">{title}</h3>
    {children}
  </div>
);

const ProviderAnalytics = () => {
  const dispatch = useDispatch();
  const { authFetch } = useAuth();
  const {
    metrics = {},
    revenue = {},
    typeMetrics = {},
    loading = false,
    error = null,
  } = useSelector((state) => state.providerAnalytics || {});

  useEffect(() => {
    if (authFetch) {
      dispatch(fetchProviderDashboardOverview({ authFetch }));
    }
  }, [dispatch, authFetch]);

  const inr = useMemo(
    () =>
      (n) =>
        new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(Number(n) || 0),
    []
  );

  const completionRate = metrics.totalAppointments
    ? Math.round((metrics.completedAppointments / metrics.totalAppointments) * 100)
    : 0;

  return (
    <ProviderDashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-2">Track your performance and metrics.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 text-red-700 p-4 rounded-lg">
            {typeof error === 'string' ? error : 'Unable to load analytics data.'}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatBox
            icon={FaCalendarAlt}
            label="Total Appointments"
            value={metrics.totalAppointments || 0}
            bgColor="bg-blue-100"
            textColor="text-blue-600"
          />
          <StatBox
            icon={FaCalendarAlt}
            label="Completed"
            value={metrics.completedAppointments || 0}
            bgColor="bg-green-100"
            textColor="text-green-600"
          />
          <StatBox
            icon={FaCalendarAlt}
            label="Cancelled"
            value={metrics.cancelledAppointments || 0}
            bgColor="bg-red-100"
            textColor="text-red-600"
          />
          <StatBox
            icon={FaUsers}
            label="Total Clients"
            value={metrics.totalClients || 0}
            bgColor="bg-purple-100"
            textColor="text-purple-600"
          />
          <StatBox
            icon={FaStar}
            label="Average Rating"
            value={metrics.averageRating ? metrics.averageRating.toFixed(1) : 0}
            bgColor="bg-yellow-100"
            textColor="text-yellow-600"
          />
        </div>

        {loading && (
          <div className="mb-6 text-sm text-gray-500">Loading analytics...</div>
        )}

        {/* Revenue Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ChartCard title="Revenue Summary">
            <div className="space-y-6">
              <div>
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {inr(revenue.totalRevenue || 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Pending Amount</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {inr(revenue.pendingAmount || 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Withdrawn</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {inr(revenue.withdrawnAmount || 0)}
                </p>
              </div>
            </div>
          </ChartCard>

          {/* Performance Metrics */}
          <ChartCard title="Performance">
            <div className="space-y-6">
              <div>
                <p className="text-gray-600 text-sm">Completion Rate</p>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${completionRate}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">{completionRate}%</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">New Clients (This Period)</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {metrics.newClients || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {metrics.totalReviews || 0}
                </p>
              </div>
            </div>
          </ChartCard>

          {/* Growth Chart Placeholder */}
          <ChartCard title="Growth Trend">
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-600">Chart visualization coming soon</p>
            </div>
          </ChartCard>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Revenue Trend">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-600">Revenue trend chart coming soon</p>
            </div>
          </ChartCard>

          <ChartCard title="Appointment Distribution">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-600">Appointment distribution chart coming soon</p>
            </div>
          </ChartCard>
        </div>
      </div>
    </ProviderDashboardLayout>
  );
};

export default ProviderAnalytics;