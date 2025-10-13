import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const useProviderProfile = () => {
  const { currentUser, setCurrentUser, getAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Update provider profile
   */
  const updateProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/provider/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      
      // Update auth context with new user data
      if (setCurrentUser) {
        setCurrentUser(data);
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, setCurrentUser]);

  /**
   * Generate signed upload URL for profile photo
   */
  const generatePhotoUploadUrl = useCallback(async (fileName, variant = 'profile') => {
    try {
      const response = await fetch(`${API_BASE_URL}/provider/settings/photos/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ fileName, variant }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate upload URL');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [getAuthHeaders]);

  /**
   * Upload photo file to Supabase storage
   */
  const uploadPhoto = useCallback(async (file, variant = 'profile') => {
    try {
      setLoading(true);
      setError(null);

      // Generate signed upload URL
      const response = await generatePhotoUploadUrl(file.name, variant);
      const uploadData = response.data || response;
      
      if (!uploadData?.uploadUrl || !uploadData?.token) {
        throw new Error('Invalid upload URL response');
      }

      // Upload file using signed URL and token
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'x-upsert': 'true',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload photo');
      }

      // Return the storage path and public URL
      return {
        path: uploadData.path,
        publicUrl: uploadData.publicUrl,
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [generatePhotoUploadUrl]);

  return {
    profile: currentUser,
    loading,
    error,
    updateProfile,
    uploadPhoto,
    generatePhotoUploadUrl,
  };
};
