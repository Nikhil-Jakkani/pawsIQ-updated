import React, { useEffect, useState } from 'react';
import { FaMapMarkerAlt, FaTimes, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { useLocation } from '../../hooks/useLocation';
import { useAuth } from '../../context/AuthContext';

/**
 * Location permission prompt component
 * Shows after login to request user's location for provider filtering
 */
const LocationPrompt = ({ onLocationSet, autoRequest = false }) => {
  const { location, permissionStatus, isLoading, error, requestLocation, clearLocation, hasLocation } = useLocation();
  const { currentUser, authFetch } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check if user has dismissed the prompt in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('location_prompt_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Show prompt if user is logged in, doesn't have location, and hasn't dismissed
  useEffect(() => {
    if (currentUser && !hasLocation && !isDismissed && permissionStatus !== 'denied') {
      // Small delay to avoid showing immediately on login
      const timer = setTimeout(() => {
        setIsVisible(true);
        
        // Auto-request if enabled (e.g., right after login)
        if (autoRequest) {
          handleRequestLocation();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [currentUser, hasLocation, isDismissed, permissionStatus, autoRequest]);

  // Sync location to backend when it changes
  useEffect(() => {
    if (location?.formatted && currentUser && authFetch) {
      syncLocationToBackend(location.formatted);
    }
  }, [location?.formatted, currentUser]);

  const syncLocationToBackend = async (locationString) => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';
      const response = await authFetch(`${API_URL}/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_location: locationString }),
      });

      if (response.ok) {
        console.log('[LocationPrompt] Location synced to backend:', locationString);
        if (onLocationSet) {
          onLocationSet(locationString);
        }
      } else {
        console.warn('[LocationPrompt] Failed to sync location to backend');
      }
    } catch (err) {
      console.error('[LocationPrompt] Error syncing location:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRequestLocation = async () => {
    const result = await requestLocation();
    if (result) {
      // Location successfully retrieved
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('location_prompt_dismissed', 'true');
  };

  const handleRetry = () => {
    handleRequestLocation();
  };

  if (!isVisible || !currentUser) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
      <div className="bg-white rounded-lg shadow-2xl border border-indigo-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <FaMapMarkerAlt className="text-lg" />
            <h3 className="font-semibold">Enable Location</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white hover:text-indigo-200 transition-colors"
            aria-label="Dismiss"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center gap-3 text-gray-700">
              <FaSpinner className="animate-spin text-indigo-600 text-xl" />
              <div>
                <p className="font-medium">Getting your location...</p>
                <p className="text-sm text-gray-500">This may take a moment</p>
              </div>
            </div>
          ) : error || permissionStatus === 'denied' ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-red-700">
                <FaExclamationTriangle className="text-xl mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Location Access Denied</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {error || 'Please enable location access in your browser settings to see nearby service providers.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRetry}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Skip
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-700">
                Allow location access to see service providers near you. We'll show you vets, groomers, and other pet care services in your area.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleRequestLocation}
                  disabled={isLoading || isSyncing}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSyncing ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <FaMapMarkerAlt />
                      Enable Location
                    </>
                  )}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Not Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        {!isLoading && !error && (
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <FaMapMarkerAlt className="text-indigo-500" />
              Your location will be helpful to show services near you
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPrompt;
