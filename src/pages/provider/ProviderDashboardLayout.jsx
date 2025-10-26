import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDispatch } from 'react-redux';
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
} from 'react-icons/fa';

const ProviderDashboardLayout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const providerType = currentUser?.providerType || 'veterinarian';

  const getMenuItems = () => {
    const baseMenu = [
      { label: 'Dashboard', path: '/provider/dashboard', icon: FaHome },
      { label: 'Appointments', path: '/provider/appointments', icon: FaCalendarAlt },
      { label: 'Clients', path: '/provider/clients', icon: FaUser },
      { label: 'Services', path: '/provider/services', icon: FaServicestack },
      { label: 'Analytics', path: '/provider/analytics', icon: FaChartLine },
    ];

    // Role-specific menu items
    const roleSpecificMenu = {
      veterinarian: [
        { label: 'Prescriptions', path: '/provider/prescriptions', icon: FaFileAlt },
        { label: 'Lab Reports', path: '/provider/lab-reports', icon: FaFileAlt },
      ],
      groomer: [],
      trainer: [],
      boarder: [],
      'diagnostic-center': [
        { label: 'Reports', path: '/provider/reports', icon: FaFileAlt },
      ],
    };

    return [...baseMenu, ...(roleSpecificMenu[providerType] || [])];
  };

  const menuItems = getMenuItems();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-blue-600 to-blue-800 text-white transition-all duration-300 ease-in-out overflow-y-auto`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-blue-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && <h1 className="text-2xl font-bold">PawsIQ</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-blue-700 text-blue-100'
                }`}
              >
                <Icon className={`text-lg ${!sidebarOpen ? 'mx-auto' : 'mr-3'}`} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Menu */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 border-t border-blue-700">
          <Link
            to="/provider/notifications"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/provider/notifications')
                ? 'bg-blue-500 text-white'
                : 'hover:bg-blue-700 text-blue-100'
            }`}
          >
            <FaBell className={`text-lg ${!sidebarOpen ? 'mx-auto' : 'mr-3'}`} />
            {sidebarOpen && <span className="text-sm font-medium">Notifications</span>}
          </Link>
          <Link
            to="/provider/settings"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/provider/settings')
                ? 'bg-blue-500 text-white'
                : 'hover:bg-blue-700 text-blue-100'
            }`}
          >
            <FaCog className={`text-lg ${!sidebarOpen ? 'mx-auto' : 'mr-3'}`} />
            {sidebarOpen && <span className="text-sm font-medium">Settings</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-lg transition-colors hover:bg-blue-700 text-blue-100"
          >
            <FaSignOutAlt className={`text-lg ${!sidebarOpen ? 'mx-auto' : 'mr-3'}`} />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Welcome, {currentUser?.firstName || 'Provider'}
            </h2>
            <p className="text-sm text-gray-600 capitalize">
              {providerType.replace('-', ' ')} Dashboard
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FaBell className="text-xl text-gray-600" />
            </button>
            <img
              src={currentUser?.profilePhoto || 'https://via.placeholder.com/40'}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ProviderDashboardLayout;