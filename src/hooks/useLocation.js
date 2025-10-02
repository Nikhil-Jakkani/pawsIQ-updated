import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const LOCATION_STORAGE_KEY = 'user_location_data';
const LOCATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Hook to manage user geolocation with browser permission prompt
 * Stores location as "City, State" format using reverse geocoding
 */
export const useLocation = () => {
  const [location, setLocation] = useState(null); // { city, state, formatted, lat, lng, timestamp }
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load stored location on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const age = Date.now() - (parsed.timestamp || 0);
        
        // Use cached location if less than 24h old
        if (age < LOCATION_TTL_MS && parsed.formatted) {
          setLocation(parsed);
          setPermissionStatus('granted');
        } else {
          // Clear expired location
          localStorage.removeItem(LOCATION_STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error('[Location] Failed to load stored location:', err);
      localStorage.removeItem(LOCATION_STORAGE_KEY);
    }
  }, []);

  /**
   * Reverse geocode coordinates to "City, State" format
   */
  const reverseGeocode = async (lat, lng) => {
    try {
      // Using Nominatim (OpenStreetMap) - free, no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PawsIQ/1.0', // Required by Nominatim
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();
      const address = data.address || {};

      // Extract city and state
      const city = address.city || address.town || address.village || address.county || '';
      const state = address.state || '';

      return {
        city,
        state,
        formatted: city && state ? `${city}, ${state}` : city || state || 'Unknown Location',
        country: address.country || '',
      };
    } catch (err) {
      console.error('[Location] Reverse geocoding failed:', err);
      // Fallback to coordinates
      return {
        city: '',
        state: '',
        formatted: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
        country: '',
      };
    }
  };

  /**
   * Request location permission and get current position
   */
  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      const errMsg = 'Geolocation is not supported by your browser';
      setError(errMsg);
      toast.error(errMsg);
      return null;
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Reverse geocode to get city, state
            const geocoded = await reverseGeocode(latitude, longitude);

            const locationData = {
              lat: latitude,
              lng: longitude,
              city: geocoded.city,
              state: geocoded.state,
              formatted: geocoded.formatted,
              country: geocoded.country,
              timestamp: Date.now(),
            };

            // Store in state and localStorage
            setLocation(locationData);
            setPermissionStatus('granted');
            localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));

            toast.success(`Location set to ${geocoded.formatted}`);
            resolve(locationData);
          } catch (err) {
            console.error('[Location] Error processing location:', err);
            setError('Failed to process location');
            toast.error('Failed to process location');
            resolve(null);
          } finally {
            setIsLoading(false);
          }
        },
        (err) => {
          console.error('[Location] Geolocation error:', err);
          let errorMessage = 'Unable to retrieve your location';
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
              setPermissionStatus('denied');
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case err.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'An unknown error occurred';
          }

          setError(errorMessage);
          toast.error(errorMessage);
          setIsLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }, []);

  /**
   * Clear stored location
   */
  const clearLocation = useCallback(() => {
    setLocation(null);
    setPermissionStatus('prompt');
    setError(null);
    localStorage.removeItem(LOCATION_STORAGE_KEY);
    toast.info('Location cleared');
  }, []);

  /**
   * Get formatted location string for API calls
   */
  const getFormattedLocation = useCallback(() => {
    return location?.formatted || null;
  }, [location]);

  return {
    location,
    permissionStatus,
    isLoading,
    error,
    requestLocation,
    clearLocation,
    getFormattedLocation,
    hasLocation: !!location?.formatted,
  };
};

export default useLocation;
