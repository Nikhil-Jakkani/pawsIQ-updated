import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import VetLayout from './VetLayout';
import {
  FaCalendarAlt,
  FaRupeeSign,
  FaUserMd,
  FaSyringe,
  FaPrescriptionBottleAlt,
  FaFileMedical,
  FaClipboardList,
  FaNotesMedical,
  FaUserFriends,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaChevronRight,
  FaPaw,
  FaCreditCard,
  FaQrcode,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

// Utility: format currency in INR (Indian standards 2025)
const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

// Utility: IST time
const nowIST = () => new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

const mockToday = new Date().toISOString().slice(0, 10);

const VetDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [istNow, setIstNow] = useState(nowIST());

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'provider' || currentUser.providerType !== 'Veterinarian') {
      navigate('/provider/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const t = setInterval(() => setIstNow(nowIST()), 1000);
    return () => clearInterval(t);
  }, []);

  // Dummy KPI data aligned to Indian context
  const kpis = useMemo(() => ({
    todayAppointments: 7,
    activePatients: 128,
    todayRevenue: 6400, // ₹
    pendingPrescriptions: 3,
  }), []);

  const upcomingAppointments = [
    { id: 1, date: mockToday, time: '10:00 AM', owner: 'Amit Sharma', pet: 'Bruno (Labrador)', reason: 'Annual Vaccination', location: 'Clinic - Andheri East, Mumbai' },
    { id: 2, date: mockToday, time: '12:15 PM', owner: 'Priya Verma', pet: 'Mittu (Indie Cat)', reason: 'Fever & Lethargy', location: 'Video Consult' },
    { id: 3, date: mockToday, time: '04:30 PM', owner: 'Rohit Gupta', pet: 'Simba (GSD)', reason: 'Skin Allergy', location: 'Clinic - Powai, Mumbai' },
  ];

  const recentActivities = [
    { id: 1, type: 'prescription', title: 'Prescription issued to Bruno', time: '20 min ago' },
    { id: 2, type: 'report', title: 'Lab report uploaded for Mittu', time: '1 hour ago' },
    { id: 3, type: 'payment', title: 'UPI payment received via PhonePe', time: '2 hours ago' },
  ];

  const handleLogout = () => { logout(); navigate('/'); };

  if (!currentUser || currentUser.role !== 'provider' || currentUser.providerType !== 'Veterinarian') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <VetLayout title="Dashboard">
      {/* IST indicator under the title (left aligned) */}
      <div className="text-xs text-gray-500 mb-2">IST: {istNow}</div>

      {/* Top: Profile strip */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <FaUserMd />
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500">Welcome</div>
              <div className="text-lg font-semibold text-gray-900">{currentUser.name || 'Veterinarian'}</div>
              <div className="text-xs text-gray-500">Reg. No: MVSC-2025-001 | Maharashtra</div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-xs text-gray-500">Today’s Revenue</div>
              <div className="text-lg font-bold text-emerald-600">{inr(kpis.todayRevenue)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Appointments</div>
              <div className="text-lg font-bold text-indigo-600">{kpis.todayAppointments}</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="p-3 rounded-md bg-indigo-100 text-indigo-600"><FaCalendarAlt /></div>
          <div className="ml-4">
            <div className="text-xs text-gray-500">Today’s Appointments</div>
            <div className="text-xl font-semibold">{kpis.todayAppointments}</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="p-3 rounded-md bg-emerald-100 text-emerald-600"><FaUserFriends /></div>
          <div className="ml-4">
            <div className="text-xs text-gray-500">Active Patients</div>
            <div className="text-xl font-semibold">{kpis.activePatients}</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="p-3 rounded-md bg-yellow-100 text-yellow-700"><FaRupeeSign /></div>
          <div className="ml-4">
            <div className="text-xs text-gray-500">Today’s Revenue</div>
            <div className="text-xl font-semibold">{inr(kpis.todayRevenue)}</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="p-3 rounded-md bg-rose-100 text-rose-600"><FaPrescriptionBottleAlt /></div>
          <div className="ml-4">
            <div className="text-xs text-gray-500">Pending Prescriptions</div>
            <div className="text-xl font-semibold">{kpis.pendingPrescriptions}</div>
          </div>
        </div>
      </div>

      {/* Grid: Appointments + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming appointments */}
        <section className="bg-white rounded-lg shadow overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
            <Link to="/appointments" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center">
              View All <FaChevronRight className="ml-1" />
            </Link>
          </div>
          <ul className="divide-y divide-gray-200">
            {upcomingAppointments.map(a => (
              <li key={a.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{a.owner} • {a.pet}</div>
                    <div className="text-sm text-gray-600">{a.reason}</div>
                    <div className="text-xs text-gray-500 flex items-center mt-1">{a.location}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{a.date} • {a.time}</div>
                    <div className="mt-2 flex space-x-2">
                      <button className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded" onClick={() => navigate('/provider/vet/appointments')}>Start</button>
                      <button className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded" onClick={() => navigate('/appointments/scheduler')}>Reschedule</button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Quick actions (India-first) */}
        <aside className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center p-3 rounded border hover:bg-gray-50" onClick={() => navigate('/provider/vet/services')}>
                Vaccinate
              </button>
              <button className="flex items-center p-3 rounded border hover:bg-gray-50" onClick={() => navigate('/provider/vet/clients')}>
                Add Note
              </button>
              <button className="flex items-center p-3 rounded border hover:bg-gray-50" onClick={() => navigate('/provider/vet/prescriptions')}>
                Rx
              </button>
              <button className="flex items-center p-3 rounded border hover:bg-gray-50" onClick={() => navigate('/provider/vet/labs')}>
                Lab
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payments (UPI)</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-700">UPI QR Ready</div>
              <button className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded" onClick={() => navigate('/transactions/payments')}>Collect</button>
            </div>
            <p className="mt-2 text-xs text-gray-500">GST compliant invoices. Supports UPI apps like GPay, PhonePe, Paytm.</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h3>
            <ul className="space-y-2">
              {recentActivities.map(r => (
                <li key={r.id} className="text-sm text-gray-700 flex items-center justify-between">
                  <span>{r.title}</span>
                  <span className="text-xs text-gray-500">{r.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Compliance & Help */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Compliance (India)</h3>
          <ul className="text-xs text-gray-600 list-disc pl-5 space-y-1">
            <li>eRx with batch & dosage. Exports in PDF with clinic GSTIN.</li>
            <li>Maintains OPD register views for inspection.</li>
            <li>Data stored with Indian date formats and IST timestamps.</li>
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Shortcuts</h3>
          <div className="flex flex-wrap gap-2">
            <Link to="/provider/onboarding/veterinarian-details" className="px-3 py-1.5 text-xs rounded bg-white border">Clinic Profile</Link>
            <Link to="/appointments/scheduler" className="px-3 py-1.5 text-xs rounded bg-white border">Scheduler</Link>
            <Link to="/transactions/payments" className="px-3 py-1.5 text-xs rounded bg-white border">Payouts</Link>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Support</h3>
          <p className="text-xs text-gray-600">Need help? Reach out to our support team 9:00–18:00 IST, Mon–Sat.</p>
        </div>
      </div>
    </VetLayout>
  );
};

export default VetDashboard;