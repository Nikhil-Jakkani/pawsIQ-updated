import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const useProviderPortfolio = () => {
  const { getAuthHeaders } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all portfolio items
   */
  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/portfolio`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }

      const data = await response.json();
      setPortfolioItems(data.data || []);
      return data.data || [];
    } catch (err) {
      setError(err.message);
      console.error('Error fetching portfolio:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  /**
   * Generate signed upload URL for portfolio image
   */
  const generateUploadUrl = useCallback(async (fileName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ file_name: fileName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate upload URL');
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [getAuthHeaders]);

  /**
   * Upload image to Supabase storage
   */
  const uploadImage = useCallback(async (file) => {
    try {
      setLoading(true);
      setError(null);

      // Generate signed upload URL
      const uploadData = await generateUploadUrl(file.name);
      
      if (!uploadData?.upload_url || !uploadData?.token) {
        throw new Error('Invalid upload URL response');
      }

      // Upload file using signed URL
      const uploadResponse = await fetch(uploadData.upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'x-upsert': 'true',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      // Return the file path for database storage
      return uploadData.file_path;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [generateUploadUrl]);

  /**
   * Create new portfolio item
   */
  const createItem = useCallback(async (itemData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create portfolio item');
      }

      const data = await response.json();
      
      // Add to local state
      setPortfolioItems(prev => [...prev, data.data]);
      
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  /**
   * Update portfolio item
   */
  const updateItem = useCallback(async (itemId, itemData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/portfolio/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update portfolio item');
      }

      const data = await response.json();
      
      // Update local state
      setPortfolioItems(prev => 
        prev.map(item => item.portfolio_id === itemId ? data.data : item)
      );
      
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  /**
   * Delete portfolio item
   */
  const deleteItem = useCallback(async (itemId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/portfolio/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete portfolio item');
      }

      // Remove from local state
      setPortfolioItems(prev => prev.filter(item => item.portfolio_id !== itemId));
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Load portfolio on mount
  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return {
    portfolioItems,
    loading,
    error,
    fetchPortfolio,
    uploadImage,
    createItem,
    updateItem,
    deleteItem,
  };
};
