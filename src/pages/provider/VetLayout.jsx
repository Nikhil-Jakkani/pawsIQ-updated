import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaPaw, FaBell, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/provider/vet/dashboard', label: 'Dashboard' },
  { to: '/provider/vet/appointments', label: 'Appointments' },
  { to: '/provider/vet/clients', label: 'Clients' },
  { to: '/provider/vet/services', label: 'Services & Pricing' },
  { to: '/provider/vet/prescriptions', label: 'Prescriptions' },
  { to: '/provider/vet/labs', label: 'Lab Reports' },
  { to: '/provider/vet/analytics', label: 'Analytics' },
  { to: '/provider/vet/reviews', label: 'Reviews' },
  { to: '/provider/vet/profile', label: 'Profile' },
  { to: '/provider/vet/portfolio', label: 'Portfolio' },
  { to: '/provider/vet/notifications', label: 'Notifications' },
  { to: '/provider/vet/settings', label: 'Settings' },
];

const VetLayout = ({ title = 'Vet', children }) => {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('VetLayout: currentUser', currentUser);
    console.log('VetLayout: role check', currentUser?.role);
    if (!currentUser || currentUser.role !== 'provider') {
      console.log('VetLayout: redirecting to login');
      navigate('/provider/login');
    }
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button className="md:hidden mr-3" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <FaBars className="h-6 w-6 text-gray-700" />
            </button>
            <FaPaw className="h-7 w-7 text-indigo-600" />
            <h1 className="ml-2 text-lg font-bold text-gray-900">PawsIQ Vet</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-800" aria-label="Notifications" onClick={() => navigate('/provider/vet/notifications')}>
              <FaBell />
            </button>
            <button onClick={handleLogout} className="text-red-600 hover:text-red-700 flex items-center">
              <FaSignOutAlt className="mr-1" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative z-50 bg-white w-72 h-full p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <FaPaw className="h-6 w-6 text-indigo-600" />
                <span className="ml-2 font-semibold">Vet Menu</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} aria-label="Close menu"><FaTimes className="h-6 w-6" /></button>
            </div>
            <nav className="space-y-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `block px-3 py-2 rounded text-sm ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Page body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:block md:col-span-1">
          <div className="bg-white rounded-lg shadow p-3">
            <nav className="space-y-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `block px-3 py-2 rounded text-sm ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="md:col-span-3">
          <div className="text-left">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
            <div className="space-y-4">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VetLayout;