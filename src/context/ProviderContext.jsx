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
    if (currentUser?.role && currentUser.role !== 'User') {
      fetchProviderInfo();
    }
  }, [currentUser]);

  const fetchProviderInfo = async () => {
    if (!authFetch) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await authFetch('/api/v1/providers/profile', {
        method: 'GET',
      });

      setProviderInfo(response.data);
      setProviderType(response.data.type);
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

      const response = await authFetch('/api/v1/providers/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      setProviderInfo(response.data);
      return response.data;
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
      const response = await authFetch('/api/v1/providers/metrics', {
        method: 'GET',
      });
      return response.data;
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