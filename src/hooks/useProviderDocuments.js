import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const useProviderDocuments = () => {
  const { accessToken } = useAuth();
  const [documents, setDocuments] = useState([]);
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

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/provider/documents`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch documents');
      }

      setDocuments(data.documents || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [authFetch]);

  const uploadDocument = useCallback(
    async (file, documentType) => {
      setLoading(true);
      setError(null);
      try {
        // 1. Get signed upload URL
        const urlRes = await authFetch(`${API_URL}/provider/settings/documents/upload-url`, {
          method: 'POST',
          body: JSON.stringify({ fileName: file.name, documentType }),
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
          throw new Error('Failed to upload document');
        }

        // 3. Save document metadata
        const saveRes = await authFetch(`${API_URL}/provider/documents`, {
          method: 'POST',
          body: JSON.stringify({
            documentType,
            storagePath: urlData.path,
          }),
        });
        const savedDoc = await saveRes.json();

        if (!saveRes.ok) {
          throw new Error(savedDoc.message || 'Failed to save document');
        }

        // Refresh document list
        await fetchDocuments();
        setLoading(false);
        return savedDoc;
      } catch (err) {
        setError(err.message);
        setLoading(false);
        throw err;
      }
    },
    [authFetch, fetchDocuments]
  );

  const deleteDocument = useCallback(
    async (documentId) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`${API_URL}/provider/documents/${documentId}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || 'Failed to delete document');
        }

        // Refresh document list
        await fetchDocuments();
        setLoading(false);
        return data;
      } catch (err) {
        setError(err.message);
        setLoading(false);
        throw err;
      }
    },
    [authFetch, fetchDocuments]
  );

  useEffect(() => {
    if (accessToken) {
      fetchDocuments();
    }
  }, [accessToken, fetchDocuments]);

  return {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    refreshDocuments: fetchDocuments,
  };
};
