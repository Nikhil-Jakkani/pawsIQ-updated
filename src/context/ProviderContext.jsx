import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

/**
 * Provider Context
 * Manages provider-specific information and state across the application
 */
const ProviderContext = createContext();

export const ProviderProvider = ({ children }) => {
  const { currentUser, authFetch } = useAuth();
  const [providerInfo, setProviderInfo] = useState(null);
  const [providerType, setProviderType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch provider info on mount or when currentUser changes
  useEffect(() => {
    const role = currentUser?.role?.toLowerCase?.();
    if (role === 'provider') {
      fetchProviderInfo();
    } else {
      setProviderInfo(null);
      setProviderType(null);
    }
  }, [currentUser]);

  const fetchProviderInfo = async () => {
    if (!authFetch) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await authFetch('/api/v1/provider/me', {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
          setProviderInfo(null);
          setProviderType(null);
          return;
        }

        const errorText = await response.text().catch(() => 'Failed to fetch provider info');
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setProviderInfo(data);
      setProviderType(data?.providerType || data?.serv_provider_type || data?.type || null);
    } catch (err) {
      console.error('Failed to fetch provider info:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProviderInfo = async (updates) => {
    if (!authFetch) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await authFetch('/api/v1/provider/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to update provider info');
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setProviderInfo(data);
      setProviderType(data?.providerType || data?.serv_provider_type || data?.type || providerType);
      return data;
    } catch (err) {
      console.error('Failed to update provider info:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderMetrics = async () => {
    if (!authFetch) return null;

    try {
      const response = await authFetch('/api/v1/provider/metrics', {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorText = await response.text().catch(() => 'Failed to fetch provider metrics');
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to fetch provider metrics:', err);
      return null;
    }
  };

  const value = {
    providerInfo,
    providerType,
    isLoading,
    error,
    fetchProviderInfo,
    updateProviderInfo,
    getProviderMetrics,
  };

  return (
    <ProviderContext.Provider value={value}>
      {children}
    </ProviderContext.Provider>
  );
};

export const useProvider = () => {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error('useProvider must be used within a ProviderProvider');
  }
  return context;
};