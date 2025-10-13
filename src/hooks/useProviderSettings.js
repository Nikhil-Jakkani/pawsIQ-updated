import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const useProviderSettings = () => {
  const { tokens } = useAuth();
  const accessToken = tokens?.access?.token;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
      };
      return fetch(url, { ...options, headers });
    },
    [accessToken]
  );

  const uploadPhoto = useCallback(
    async (file, variant = 'profile') => {
      setLoading(true);
      setError(null);
      try {
        // 1. Get signed upload URL
        const urlRes = await authFetch(`${API_URL}/provider/settings/photos/upload-url`, {
          method: 'POST',
          body: JSON.stringify({ fileName: file.name, variant }),
        });
        const urlData = await urlRes.json();
        
        if (!urlRes.ok) {
          throw new Error(urlData.message || 'Failed to get upload URL');
        }

        // 2. Upload file to Supabase
        const uploadRes = await fetch(urlData.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload photo');
        }

        setLoading(false);
        return {
          path: urlData.path,
          publicUrl: urlData.publicUrl,
        };
      } catch (err) {
        setError(err.message);
        setLoading(false);
        throw err;
      }
    },
    [authFetch]
  );

  const updateProfile = useCallback(
    async (profileData) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`${API_URL}/provider/me`, {
          method: 'PATCH',
          body: JSON.stringify(profileData),
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || 'Failed to update profile');
        }

        setLoading(false);
        return data;
      } catch (err) {
        setError(err.message);
        setLoading(false);
        throw err;
      }
    },
    [authFetch]
  );

  const updatePassword = useCallback(
    async (currentPassword, newPassword) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`${API_URL}/provider/settings/password`, {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || 'Failed to update password');
        }

        setLoading(false);
        return data;
      } catch (err) {
        setError(err.message);
        setLoading(false);
        throw err;
      }
    },
    [authFetch]
  );

  return {
    loading,
    error,
    uploadPhoto,
    updateProfile,
    updatePassword,
  };
};
