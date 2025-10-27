import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

/**
 * Custom hook for making authenticated API requests with automatic token refresh
 * @returns {Object} Methods for making API requests
 */
const useApi = () => {
  const { tokens, setAuthTokens, logout } = useAuth();
  /**
   * Make an authenticated API request with automatic token refresh
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} options - Fetch options (method, headers, body, etc.)
   * @param {boolean} requiresAuth - Whether the request requires authentication
   * @returns {Promise<Object>} Response data
   */
  // Interceptors are defined with let so we can reassign/wrap them later
  let requestInterceptor = (config) => {
    // Add any request headers or modifications here
    return config;
  };

  let responseInterceptor = (response) => {
    // Add any response handling here
    return response;
  };

  const fetchApi = useCallback(async (endpoint, options = {}, requiresAuth = true) => {
    // Apply request interceptor
    const interceptedOptions = requestInterceptor({
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    const url = `${API_URL}${endpoint}`;

    // Add auth header if required
    if (requiresAuth) {
      if (!tokens?.access?.token) {
        console.error('[useApi] ❌ No access token found!');
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Decode token to check role (for debugging) - only log issues
      let decodedPayload = null;
      try {
        const tokenParts = tokens.access.token.split('.');
        if (tokenParts.length === 3) {
          decodedPayload = JSON.parse(atob(tokenParts[1]));
          
          // Check if token is expired
          if (decodedPayload.exp && Date.now() / 1000 > decodedPayload.exp) {
            console.error('[useApi] ⚠️ Token is EXPIRED!', {
              endpoint,
              exp: new Date(decodedPayload.exp * 1000).toISOString()
            });
          }
          
          // Check if role matches what's needed for admin endpoints
          if (endpoint.includes('/admin/') && decodedPayload.role !== 'admin') {
            console.error(`[useApi] ❌ ROLE MISMATCH! Endpoint requires 'admin' but token has role: '${decodedPayload.role}'`, {
              endpoint,
              tokenRole: decodedPayload.role,
              requiredRole: 'admin'
            });
          }
        } else {
          console.error('[useApi] ❌ Invalid token format - expected 3 parts, got:', tokenParts.length);
        }
      } catch (e) {
        console.error('[useApi] ❌ Could not decode token:', e);
      }
      
      interceptedOptions.headers['Authorization'] = `Bearer ${tokens.access.token}`;
    }

    try {
      // Make the initial request with intercepted options
      let response = await fetch(url, interceptedOptions);
      
      // Apply response interceptor
      response = responseInterceptor(response);

      // If token is expired, try to refresh it and retry the request
      if (response.status === 401 && requiresAuth && tokens?.refresh?.token) {
        try {
          // Try unified refresh endpoint first
          let refreshResponse = await fetch(`${API_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: tokens.refresh.token }),
          });

          // Fallback to legacy user endpoint if needed
          if (!refreshResponse.ok) {
            refreshResponse = await fetch(`${API_URL}/user/auth/refresh-tokens`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: tokens.refresh.token }),
            });
          }

          if (refreshResponse.ok) {
            const newTokens = await refreshResponse.json();
            // Support both shapes: { accessToken, refreshToken } or { access: { token }, refresh: {...} }
            let mergedTokens;
            if (newTokens?.accessToken && newTokens?.refreshToken) {
              // Shape: { accessToken, refreshToken }
              mergedTokens = {
                access: { token: newTokens.accessToken },
                refresh: { token: newTokens.refreshToken }
              };
            } else if (newTokens?.access?.token) {
              // Shape: { access: { token }, refresh: { token } }
              mergedTokens = newTokens;
            } else {
              // Fallback: only update access token
              mergedTokens = { ...tokens, access: { ...(tokens.access || {}), token: newTokens.accessToken } };
            }
            setAuthTokens(mergedTokens);
            
            // Build updated headers with the new access token
            const retryHeaders = {
              'Content-Type': 'application/json',
              ...(options.headers || {}),
              'Authorization': `Bearer ${(mergedTokens.access || {}).token}`,
            };

            // Retry the original request with the new token
            response = await fetch(url, {
              ...options,
              headers: retryHeaders,
            });
          } else {
            // If refresh fails, log the user out
            logout();
            throw new Error('Session expired. Please log in again.');
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          logout();
          throw new Error('Session expired. Please log in again.');
        }
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || 'Something went wrong');
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Only show error toast if it's not an auth error (to avoid duplicate messages)
      if (error.message !== 'Session expired. Please log in again.') {
        toast.error(error.message || 'An error occurred. Please try again.');
      }
      
      throw error;
    }
  }, []);

  // Helper methods for common HTTP methods with TypeScript-like type safety
  const get = useCallback((endpoint, options = {}) => 
    fetchApi(endpoint, { ...options, method: 'GET' }), [fetchApi]);

  const post = useCallback((endpoint, data = {}, options = {}) => {
    return fetchApi(endpoint, { 
      ...options, 
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
  }, [fetchApi]);

  const put = useCallback((endpoint, data = {}, options = {}) => 
    fetchApi(endpoint, { 
      ...options, 
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }), [fetchApi]);

  const del = useCallback((endpoint, options = {}) => 
    fetchApi(endpoint, { 
      ...options, 
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }), [fetchApi]);

  const patch = useCallback((endpoint, data = {}, options = {}) => 
    fetchApi(endpoint, { 
      ...options, 
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }), [fetchApi]);
    
  /**
   * Download a file from the server
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {string} filename - The filename to save as
   * @param {Object} options - Additional fetch options
   * @returns {Promise<void>}
   */
  const download = useCallback(async (endpoint, filename, options = {}) => {
    try {
      const response = await fetchApi(endpoint, {
        ...options,
        responseType: 'blob',
      }, true);

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
      throw error;
    }
  }, [fetchApi]);

  /**
   * Upload a file to the server
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {File} file - The file to upload
   * @param {string} fieldName - The field name for the file (default: 'file')
   * @param {Object} data - Additional form data to send with the file
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} Response data
   */
  const upload = useCallback((endpoint, file, fieldName = 'file', data = {}, options = {}) => {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    // Append additional data if provided
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    return fetchApi(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        // Let the browser set the Content-Type with boundary for FormData
        ...(options.headers || {})
      }
    });
  }, [fetchApi]);

  return {
    // Core fetch method
    fetch: fetchApi,
    
    // HTTP methods
    get,
    post,
    put,
    delete: del,
    patch,
    upload,
    download,
    
    // Interceptors
    addRequestInterceptor: (interceptor) => {
      const originalRequest = requestInterceptor;
      requestInterceptor = (config) => interceptor(originalRequest(config));
    },
    
    addResponseInterceptor: (interceptor) => {
      const originalResponse = responseInterceptor;
      responseInterceptor = (response) => interceptor(originalResponse(response));
    }
  };
};

export default useApi;
