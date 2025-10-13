import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import TrainerLayout from './TrainerLayout';
import DashboardKPICard from '../../components/provider/DashboardKPICard';
import DashboardProfileCard from '../../components/provider/DashboardProfileCard';
import AppointmentCard from '../../components/provider/AppointmentCard';
import {
  FaCalendarAlt,
  FaRupeeSign,
  FaUserFriends,
  FaDog,
  FaChartLine,
  FaGraduationCap,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { 
  inr, 
  nowIST, 
  loadProviderDashboard, 
  approveBooking as approveBookingUtil, 
  declineBooking as declineBookingUtil 
} from '../../utils/providerDashboardUtils';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';
const mockToday = new Date().toISOString().slice(0, 10);

const TrainerDashboard = () => {
  const { currentUser, logout, authFetch } = useAuth();
  const navigate = useNavigate();
  const [istNow, setIstNow] = useState(nowIST());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState([]);
  const [confirmed, setConfirmed] = useState([]);
  const [providerProfile, setProviderProfile] = useState(null);
  const [metrics, setMetrics] = useState({
    todayAppointments: 0,
    activeClients: 0,
    todayRevenue: 0,
    trainingSessions: 0,
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'provider') {
      navigate('/provider/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const t = setInterval(() => setIstNow(nowIST()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'provider') {
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]);

  // KPIs computed from real data
  const kpis = useMemo(() => {
    const todayCount = confirmed.filter(a => a.date === mockToday).length + pending.filter(a => a.date === mockToday).length;
    const totalUpcoming = confirmed.length + pending.length;
    
    return {
      todayAppointments: todayCount,
      totalAppointments: totalUpcoming,
      activeClients: metrics.activeClients,
      todayRevenue: metrics.todayRevenue,
      trainingSessions: metrics.trainingSessions,
    };
  }, [confirmed, pending, metrics]);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await loadProviderDashboard(authFetch, API_URL, providerProfile);
      setProviderProfile(data.profile);
      setMetrics({
        todayAppointments: data.metrics.todayAppointments,
        activeClients: data.metrics.activePatients,
        todayRevenue: data.metrics.todayRevenue,
        trainingSessions: data.metrics.pendingPrescriptions || 0,
      });
      setConfirmed(data.confirmed);
      setPending(data.pending);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveBookingUtil(authFetch, API_URL, id);
      await loadDashboard();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDecline = async (id) => {
    if (!window.confirm('Decline this booking?')) return;
    try {
      await declineBookingUtil(authFetch, API_URL, id);
      await loadDashboard();
    } catch (e) {
      alert(e.message);
    }
  };

  if (!currentUser || currentUser.role !== 'provider') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <TrainerLayout title="Dashboard">
      {/* IST indicator */}
      <div className="text-xs text-gray-500 mb-2">IST: {istNow}</div>

      {/* Profile Card */}
      <DashboardProfileCard
        providerType="trainer"
        profile={providerProfile}
        userName={currentUser.name}
        kpis={kpis}
        inr={inr}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashboardKPICard
          icon={<FaCalendarAlt />}
          label="Today's Sessions"
          value={kpis.todayAppointments}
          bgColor="bg-indigo-100"
          textColor="text-indigo-600"
        />
        <DashboardKPICard
          icon={<FaUserFriends />}
          label="Active Clients"
          value={kpis.activeClients}
          bgColor="bg-emerald-100"
          textColor="text-emerald-600"
        />
        <DashboardKPICard
          icon={<FaRupeeSign />}
          label="Today's Revenue"
          value={inr(kpis.todayRevenue)}
          bgColor="bg-yellow-100"
          textColor="text-yellow-700"
        />
        <DashboardKPICard
          icon={<FaGraduationCap />}
          label="Training Programs"
          value={kpis.trainingSessions}
          bgColor="bg-rose-100"
          textColor="text-rose-600"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {/* Pending Sessions */}
      {!loading && pending.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Pending Sessions</h3>
            <Link to="/provider/trainer/appointments" className="text-sm text-indigo-600 hover:text-indigo-700">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {pending.map(appt => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                showActions={true}
                onApprove={handleApprove}
                onDecline={handleDecline}
              />
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Sessions */}
      {!loading && confirmed.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Upcoming Sessions</h3>
            <Link to="/provider/trainer/appointments" className="text-sm text-indigo-600 hover:text-indigo-700">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {confirmed.map(appt => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && pending.length === 0 && confirmed.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FaDog className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Yet</h3>
          <p className="text-gray-500 mb-4">
            You don't have any training sessions scheduled. Start by setting up your availability and services.
          </p>
          <Link
            to="/provider/trainer/services"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Set Up Services
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <Link
          to="/provider/trainer/training-plans"
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-indigo-100 text-indigo-600">
              <FaGraduationCap />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">Training Plans</div>
              <div className="text-xs text-gray-500">Create & manage plans</div>
            </div>
          </div>
        </Link>
        <Link
          to="/provider/trainer/progress"
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-emerald-100 text-emerald-600">
              <FaChartLine />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">Progress Tracking</div>
              <div className="text-xs text-gray-500">Track client progress</div>
            </div>
          </div>
        </Link>
        <Link
          to="/provider/trainer/clients"
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-yellow-100 text-yellow-700">
              <FaUserFriends />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">Clients</div>
              <div className="text-xs text-gray-500">Manage your clients</div>
            </div>
          </div>
        </Link>
      </div>
    </TrainerLayout>
  );
};

export default TrainerDashboard;