import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiX } from 'react-icons/fi';
import { registerSW } from 'virtual:pwa-register';

const PWAUpdateNotification = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [updateSW, setUpdateSW] = useState(null);

  useEffect(() => {
    // Register SW via VitePWA helper; show prompt when update is available
    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        setShowUpdatePrompt(true);
      },
      onRegisteredSW(swUrl, registration) {
        // Optional: log SW registration
        if (registration) {
          console.log('Service Worker registered:', swUrl);
        }
      },
      onRegisterError(error) {
        console.error('Service worker registration failed:', error);
      },
    });
    setUpdateSW(() => update);
  }, []);

  const handleUpdateClick = () => {
    if (typeof updateSW === 'function') {
      // This will call skipWaiting and optionally reload the page
      updateSW(true);
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white shadow-lg rounded-lg border border-gray-200 p-4 max-w-sm animate-slide-in">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <FiRefreshCw className="text-white text-sm" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">
            Update Available
          </h3>
          <p className="text-gray-600 text-xs mb-3">
            A new version of PawsIQ is available. Update now to get the latest features.
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleUpdateClick}
              className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-600 transition-colors"
            >
              <FiRefreshCw className="text-xs" />
              Update Now
            </button>
            
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FiX className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export default PWAUpdateNotification;