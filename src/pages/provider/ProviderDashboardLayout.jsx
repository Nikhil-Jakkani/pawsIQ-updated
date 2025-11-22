import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaHome,
  FaCalendarAlt,
  FaUser,
  FaServicestack,
  FaChartLine,
  FaFileAlt,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaStethoscope,
  FaComments,
} from 'react-icons/fa';

/**
 * Provider Dashboard Layout
 * Provides consistent navigation and layout for all provider pages
 * Uses React Router for navigation and Tailwind CSS for styling
 */
const ProviderDashboardLayout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const providerType = currentUser?.providerType || 'provider';

  /**
   * Get menu items based on provider type
   */
  const getMenuItems = () => {
    const baseMenu = [
      { label: 'Dashboard', path: '/provider/dashboard', icon: FaHome },
      { label: 'Appointments', path: '/provider/appointments', icon: FaCalendarAlt },
      { label: 'Clients', path: '/provider/clients', icon: FaUser },
      { label: 'Messages', path: '/provider/chat', icon: FaComments },
      { label: 'Services', path: '/provider/services', icon: FaServicestack },
      { label: 'Analytics', path: '/provider/analytics', icon: FaChartLine },
    ];

    // Add veterinarian-specific menu items
    if (providerType === 'veterinarian' || providerType === 'vet') {
      baseMenu.splice(4, 0, { label: 'Prescriptions', path: '/provider/prescriptions', icon: FaFileAlt });
      baseMenu.splice(5, 0, { label: 'Lab Reports', path: '/provider/lab-reports', icon: FaFileAlt });
    }

    return baseMenu;
  };

  const menuItems = getMenuItems();

  /**
   * Check if a menu item is currently active
   */
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    const confirm = window.confirm('Are you sure you want to logout?');
    if (confirm) {
      await logout();
    }
  };

  /**
   * MenuItem Component
   */
  const MenuItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <Link
        to={item.path}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${active
          ? 'bg-blue-500 text-white shadow-md'
          : 'text-blue-100 hover:bg-blue-700'
          }`}
      >
        <Icon className={`text-lg ${!sidebarOpen ? 'mx-auto' : 'mr-3'}`} />
        {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'
          } hidden md:flex flex-col bg-gradient-to-b from-blue-600 to-blue-800 text-white transition-all duration-300 ease-in-out overflow-y-auto shadow-lg`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between p-6 border-b border-blue-700">
          <div className="flex items-center gap-2">
            <div className="bg-blue-400 p-2 rounded-lg">
              <FaStethoscope className="text-white text-lg" />
            </div>
            {sidebarOpen && <h1 className="text-2xl font-bold">PawsIQ</h1>}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <MenuItem key={item.path} item={item} />
          ))}
        </nav>

        {/* Bottom Menu */}
        <div className="p-4 space-y-2 border-t border-blue-700">
          <Link
            to="/provider/notifications"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/provider/notifications')
              ? 'bg-blue-500 text-white'
              : 'hover:bg-blue-700 text-blue-100'
              }`}
          >
            <FaBell className={`text-lg ${!sidebarOpen ? 'mx-auto' : 'mr-3'}`} />
            {sidebarOpen && <span className="text-sm font-medium">Notifications</span>}
          </Link>
          <Link
            to="/provider/settings"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/provider/settings')
              ? 'bg-blue-500 text-white'
              : 'hover:bg-blue-700 text-blue-100'
              }`}
          >
            <FaCog className={`text-lg ${!sidebarOpen ? 'mx-auto' : 'mr-3'}`} />
            {sidebarOpen && <span className="text-sm font-medium">Settings</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-lg transition-colors hover:bg-blue-700 text-blue-100 text-left"
          >
            <FaSignOutAlt className={`text-lg ${!sidebarOpen ? 'mx-auto' : 'mr-3'}`} />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
          {/* Left Side - Mobile Menu Toggle & Welcome */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Welcome back, {currentUser?.firstName || 'Provider'}!
              </h2>
              <p className="text-sm text-gray-600 capitalize">
                {providerType.replace('-', ' ')} Dashboard
              </p>
            </div>
          </div>

          {/* Right Side - Notifications & Profile */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FaBell className="text-xl text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <img
                src={currentUser?.profilePhoto || '/7.png'}
                alt={currentUser?.firstName || 'Provider'}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-200 bg-gray-100"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {providerType.replace('-', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gradient-to-b from-blue-600 to-blue-800 text-white px-4 py-4 space-y-2 max-h-96 overflow-y-auto">
            {menuItems.map((item) => (
              <MenuItem key={item.path} item={item} />
            ))}
            <div className="pt-4 border-t border-blue-700 space-y-2">
              <Link
                to="/provider/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaBell className="mr-3 text-lg" />
                <span className="text-sm font-medium">Notifications</span>
              </Link>
              <Link
                to="/provider/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaCog className="mr-3 text-lg" />
                <span className="text-sm font-medium">Settings</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-left"
              >
                <FaSignOutAlt className="mr-3 text-lg" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gray-100">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ProviderDashboardLayout;