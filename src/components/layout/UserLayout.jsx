import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserSidebar from './UserSidebar';
import { FaBell, FaSearch, FaUser, FaShoppingCart, FaClock, FaCalendarAlt, FaSignOutAlt } from 'react-icons/fa';

const UserLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [notificationCount] = useState(3); // Can be updated dynamically from context/state

  const profileImage = currentUser?.profile_picture_url || currentUser?.profileImage;
  
  // Load cart count from localStorage on mount
  const [dynamicCartCount, setDynamicCartCount] = useState(0);
  
  useEffect(() => {
    try {
      const existingCart = JSON.parse(localStorage.getItem('petStoreCart') || '[]');
      const totalQuantity = existingCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      setDynamicCartCount(totalQuantity);
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  }, []);
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Check if sidebar is minimized on component mount
  useEffect(() => {
    const savedMinimizedState = localStorage.getItem('userSidebarMinimized');
    if (savedMinimizedState !== null) {
      setSidebarMinimized(JSON.parse(savedMinimizedState));
    }
  }, []);
  
  // Listen for changes to the minimized state in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const minimizedState = localStorage.getItem('userSidebarMinimized');
      if (minimizedState !== null) {
        setSidebarMinimized(JSON.parse(minimizedState));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userSidebarMinimizedChange', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userSidebarMinimizedChange', handleStorageChange);
    };
  }, []);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex h-full w-full bg-gray-50 overflow-x-hidden">
      {/* Sidebar */}
      <UserSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 
          ${sidebarMinimized ? 'lg:ml-20' : 'lg:ml-72'}`}
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-3 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-full max-w-xs sm:max-w-sm">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 w-full"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Date and Time Section */}
            <div className="hidden lg:flex items-center gap-4 mr-2">
              {/* Date */}
              <div className="flex items-center gap-1 text-gray-600">
                <FaCalendarAlt className="text-[#145ae6] text-sm" />
                <div className="text-xs font-medium">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-1 text-gray-600">
                <FaClock className="text-[#145ae6] text-sm" />
                <div className="text-xs font-medium">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/user/cart')}
              className="relative p-2 text-gray-500 hover:text-[#145ae6] transition-colors"
              title="Shopping Cart"
            >
              <FaShoppingCart size={20} />
              {dynamicCartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#145ae6] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {dynamicCartCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => navigate('/user/notifications')}
              className="relative p-2 text-gray-500 hover:text-[#145ae6] transition-colors"
              title="Notifications"
            >
              <FaBell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#145ae6] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 max-w-[40vw] sm:max-w-none">
              <Link to="/user/settings" className="flex items-center gap-2 hover:opacity-90">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-blue-100">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FaUser className="text-[#145ae6]" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {currentUser?.user_full_name
                    || currentUser?.name
                    || [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ')
                    || (currentUser?.email ? currentUser.email.split('@')[0] : '')
                    || 'User'}
                </span>
              </Link>
              <button
                onClick={async () => { try { await logout(); } catch (_) {} }}
                className="ml-2 inline-flex items-center gap-1 text-xs text-gray-600 hover:text-red-600"
                title="Log out"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-500">
          <p>© 2025 PawsIQ. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default UserLayout;