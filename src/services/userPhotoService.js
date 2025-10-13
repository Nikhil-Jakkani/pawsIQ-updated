import { supabase } from '../lib/supabaseClient';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

/**
 * User Photo Service
 * Handles user profile photo upload using Supabase Storage with signed URLs
 */

/**
 * Step 1: Get signed upload URL from backend
 */
export const getUploadUrl = async (file, authFetch) => {
  try {
    const response = await authFetch(`${API_URL}/user/profile/photo/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get upload URL');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting upload URL:', error);
    throw error;
  }
};

/**
 * Step 2: Upload file to Supabase Storage using signed URL
 */
export const uploadFile = async (file, uploadUrl, token) => {
  try {
    // Upload using signed URL (no Authorization header needed)
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'x-upsert': 'true',
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Step 3: Confirm upload and get signed viewing URL
 */
export const confirmUpload = async (filePath, authFetch) => {
  try {
    const response = await authFetch(`${API_URL}/user/profile/photo/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to confirm upload');
    }

    return await response.json();
  } catch (error) {
    console.error('Error confirming upload:', error);
    throw error;
  }
};

/**
 * Refresh signed URL (called when URL is about to expire)
 */
export const refreshPhotoUrl = async (authFetch) => {
  try {
    const response = await authFetch(`${API_URL}/user/profile/photo/refresh`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to refresh photo URL');
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing photo URL:', error);
    throw error;
  }
};

/**
 * Complete upload flow (all 3 steps)
 */
export const uploadProfilePhoto = async (file, authFetch, onProgress) => {
  try {
    // Validate file
    if (!file) throw new Error('No file provided');
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed');
    }

    // Step 1: Get upload URL
    onProgress?.(33, 'Getting upload URL...');
    const { uploadUrl, token, filePath } = await getUploadUrl(file, authFetch);

    // Step 2: Upload file
    onProgress?.(66, 'Uploading photo...');
    await uploadFile(file, uploadUrl, token);

    // Step 3: Confirm and get viewing URL
    onProgress?.(100, 'Finalizing...');
    const result = await confirmUpload(filePath, authFetch);

    return result;
  } catch (error) {
    console.error('Error in uploadProfilePhoto:', error);
    throw error;
  }
};
