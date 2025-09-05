import { supabase } from '../lib/supabaseClient';
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const handleApiError = async (response) => {
  if (response.status === 401) {
    throw new Error('Your session has expired. Please log in again.');
  }
  
  try {
    const errorData = await response.json();
    return new Error(errorData.message || 'An error occurred');
  } catch (e) {
    return new Error('An unexpected error occurred');
  }
};

export const healthRecordService = {
  // Get signed URL for file upload
  getSignedUploadUrl: async (petId, fileName, fileType, token) => {
    if (!petId) {
      throw new Error('Pet ID is required');
    }
    
    if (!token) {
      throw new Error('Authentication token is required');
    }
    
    try {
      const response = await fetch(`${API_URL}/pets/${petId}/health-records/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          fileName: fileName || 'file',
          fileType: fileType || 'application/octet-stream'
        })
      });

      if (!response.ok) {
        throw await handleApiError(response);
      }

      const data = await response.json();
      
      if (!data.signedUrl || !data.path) {
        throw new Error('Invalid response from server');
      }
      
      return data;
      
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
  },

  // Upload file to Supabase using signed upload token
  uploadFile: async (path, uploadToken, file) => {
    if (!path) throw new Error('No upload path provided');
    if (!uploadToken) throw new Error('No upload token provided');
    if (!file) throw new Error('No file provided');

    try {
      const { error } = await supabase.storage
        .from('health-records')
        .uploadToSignedUrl(path, uploadToken, file);

      if (error) {
        throw new Error(error.message || 'Upload failed');
      }

      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  },

  // Create health record
  createHealthRecord: async (petId, recordData, token) => {
    if (!petId) throw new Error('Pet ID is required');
    if (!token) throw new Error('Authentication token is required');
    
    try {
      const response = await fetch(`${API_URL}/pets/${petId}/health-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recordData)
      });

      if (!response.ok) {
        throw await handleApiError(response);
      }

      return response.json();
    } catch (error) {
      console.error('Error creating health record:', error);
      throw error;
    }
  },

  // Get pet's health records
  getPetHealthRecords: async (petId, token) => {
    if (!petId) throw new Error('Pet ID is required');
    if (!token) throw new Error('Authentication token is required');
    
    try {
      const response = await fetch(`${API_URL}/pets/${petId}/health-records`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw await handleApiError(response);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching health records:', error);
      throw error;
    }
  },

  // Delete health record
  deleteHealthRecord: async (recordId, token) => {
    if (!recordId) throw new Error('Record ID is required');
    if (!token) throw new Error('Authentication token is required');
    
    try {
      const response = await fetch(`${API_URL}/health-records/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw await handleApiError(response);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting health record:', error);
      throw error;
    }
  }
};

export default healthRecordService;
