import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FaChartLine, FaUsers, FaHandHoldingHeart, FaDollarSign, FaExclamationTriangle } from 'react-icons/fa';
import { fetchAnalytics, fetchRevenueMetrics } from '../../store/slices/analyticsSlice';
import useApi from '../../hooks/useApi';

const PerformanceDashboard = () => {
  const dispatch = useDispatch();
  const api = useApi();
  const { authFetch } = useAuth();
  const [timeRange, setTimeRange] = useState('month');
  const [serviceMetrics, setServiceMetrics] = useState({ byCategory: [], totalBookings: 0 });
  const [loading, setLoading] = useState(true);

  // Get data from Redux
  const { metrics = {}, revenue = {} } = useSelector((state) => state.analytics || {});

  // Fetch all analytics data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user metrics and revenue metrics
        await Promise.all([
          dispatch(fetchAnalytics({ dateRange: timeRange, authFetch })),
          dispatch(fetchRevenueMetrics({ dateRange: timeRange, authFetch }))
        ]);

        // Fetch service usage metrics
        const serviceResponse = await api.get('/admin/analytics/service-metrics');
        if (serviceResponse?.data) {
          setServiceMetrics(serviceResponse.data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, dispatch, authFetch]);

  // Calculate KPIs from real data
  const performanceData = {
    kpis: {
      userGrowth: metrics.userGrowth || 0,
      serviceGrowth: serviceMetrics.growth || 0,
      revenueGrowth: revenue.revenueGrowth || 0,
      retentionRate: metrics.retentionRate || 0
    },
    platformHealth: {
      uptime: 99.98,
      responseTime: 245,
      errorRate: 0.12
    },
    alerts: [
      metrics.newUsers > 100 ? { type: 'warning', message: `High user registration activity: ${metrics.newUsers} new users`, time: 'Real-time' } : null,
      revenue.revenueGrowth > 15 ? { type: 'info', message: `Strong revenue growth: +${revenue.revenueGrowth}%`, time: 'Real-time' } : null,
      metrics.retentionRate < 70 ? { type: 'error', message: `Low retention rate: ${metrics.retentionRate}%`, time: 'Real-time' } : null
    ].filter(Boolean)
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <FaChartLine className="text-indigo-600 text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Performance Dashboard</h1>
              <p className="text-gray-500">Comprehensive view of platform performance metrics</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Time Range:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* KPI Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">User Growth</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">+{performanceData.kpis.userGrowth}%</h3>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <FaUsers className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Service Growth</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">+{performanceData.kpis.serviceGrowth}%</h3>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <FaHandHoldingHeart className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Revenue Growth</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">+{performanceData.kpis.revenueGrowth}%</h3>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <FaDollarSign className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm">Retention Rate</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{performanceData.kpis.retentionRate}%</h3>
              </div>
              <div className="bg-yellow-100 p-2 rounded-lg">
                <FaUsers className="text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform Health */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Platform Health</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>System Uptime</span>
                  <span className="text-green-600 font-medium">{performanceData.platformHealth.uptime}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${performanceData.platformHealth.uptime}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Response Time</span>
                  <span className="text-blue-600 font-medium">{performanceData.platformHealth.responseTime}ms</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(performanceData.platformHealth.responseTime / 500) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Error Rate</span>
                  <span className="text-yellow-600 font-medium">{performanceData.platformHealth.errorRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{ width: `${performanceData.platformHealth.errorRate * 10}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Alerts */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100 col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Alerts</h3>
            <div className="space-y-3">
              {performanceData.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex items-start gap-3 ${
                    alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                      alert.type === 'error' ? 'bg-red-50 border border-red-200' :
                        'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className={`p-1 rounded-full ${
                    alert.type === 'warning' ? 'bg-yellow-100' :
                      alert.type === 'error' ? 'bg-red-100' :
                        'bg-blue-100'
                  }`}>
                    <FaExclamationTriangle className={`${
                      alert.type === 'warning' ? 'text-yellow-600' :
                        alert.type === 'error' ? 'text-red-600' :
                          'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">{alert.message}</p>
                    <p className="text-gray-500 text-sm">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Engagement Metrics */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Engagement</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers || 0}</p>
                </div>
                <FaUsers className="text-blue-600 text-3xl" />
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.activeUsers || 0}</p>
                </div>
                <FaUsers className="text-green-600 text-3xl" />
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">New Users ({timeRange})</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.newUsers || 0}</p>
                </div>
                <FaUsers className="text-purple-600 text-3xl" />
              </div>
            </div>
          </div>

          {/* Service Performance */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Performance by Category</h3>
            <div className="space-y-3">
              {serviceMetrics.byCategory && serviceMetrics.byCategory.length > 0 ? (
                serviceMetrics.byCategory.map((category, index) => {
                  const maxBookings = Math.max(...serviceMetrics.byCategory.map(c => c.count), 1);
                  const percentage = (category.count / maxBookings) * 100;
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{category.category}</span>
                        <span className="text-gray-600">{category.count} bookings</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <FaHandHoldingHeart className="text-indigo-300 text-5xl mx-auto mb-4" />
                  <p className="text-gray-500">No service data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Revenue Trends */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue by Category</h3>
            <div className="space-y-3">
              {revenue.revenueByCategory && revenue.revenueByCategory.length > 0 ? (
                revenue.revenueByCategory.map((category, index) => {
                  const percentage = revenue.totalRevenue > 0
                    ? (category.amount / revenue.totalRevenue) * 100
                    : 0;
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{category.category}</span>
                        <span className="text-gray-600">₹{category.amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <FaDollarSign className="text-indigo-300 text-5xl mx-auto mb-4" />
                  <p className="text-gray-500">No revenue data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Revenue Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Revenue Trend</h3>
            <div className="space-y-2">
              {revenue.monthlyRevenue && revenue.monthlyRevenue.length > 0 ? (
                revenue.monthlyRevenue.slice(-6).map((month, index) => {
                  const maxRevenue = Math.max(...revenue.monthlyRevenue.map(m => m.amount), 1);
                  const percentage = (month.amount / maxRevenue) * 100;
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{month.month}</span>
                        <span className="text-gray-600">₹{month.amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <FaChartLine className="text-indigo-300 text-5xl mx-auto mb-4" />
                  <p className="text-gray-500">No monthly data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PerformanceDashboard;