import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  isTokenExpired,
  shouldRefreshToken,
  validateStoredAuthData,
  cleanInvalidSessionData,
  wasExplicitlyLoggedOut,
  clearLogoutFlag,
  setLogoutFlag,
  getMinutesUntilExpiry
} from '../utils/sessionUtils.js';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const AuthContext = createContext(null);

const decodeRoleFromToken = (token) => {
  if (!token) return null;
  try {
    const parts = token.split?.('.') || [];
    const payload = parts[1];
    if (!payload) return null;

    let normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (normalized.length % 4) {
      normalized += '=';
    }

    const decoded = JSON.parse(atob(normalized));
    if (typeof decoded?.role === 'string') {
      return decoded.role.trim().toLowerCase();
    }
    return null;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Auth] Failed to decode token role:', error?.message || error);
    }
    return null;
  }
};

const getStoredAuth = () => {
  const storedTokens = localStorage.getItem('authTokens');
  const storedUser = localStorage.getItem('user');

  return {
    tokens: storedTokens ? JSON.parse(storedTokens) : null,
    user: storedUser ? JSON.parse(storedUser) : null
  };
};

export const AuthProvider = ({ children }) => {
  const stored = getStoredAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [tokens, setTokens] = useState(() => stored.tokens);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigateRef = useRef();
  const refreshPromiseRef = useRef(null);
  const dashboardCacheRef = useRef({ data: null, ts: 0, promise: null });

  const navigate = useCallback((...args) => {
    if (navigateRef.current) {
      navigateRef.current(...args);
    }
  }, []);

  const NavigationHandler = () => {
    const nav = useNavigate();

    useEffect(() => {
      navigateRef.current = nav;
      return () => {
        navigateRef.current = undefined;
      };
    }, [nav]);

    return null;
  };

  useEffect(() => {
    try {
      // Clean any invalid session data first
      cleanInvalidSessionData();

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      }
    } catch (err) {
      console.error('[Auth] Error loading stored user:', err);
      localStorage.removeItem('user');
    } finally {
      setTimeout(() => {
        const loadingElement = document.getElementById('loading');
        if (loadingElement && loadingElement.style.display !== 'none') {
          loadingElement.style.opacity = '0';
          loadingElement.style.transition = 'opacity 0.3s ease-out';
          setTimeout(() => {
            if (loadingElement) {
              loadingElement.style.display = 'none';
            }
          }, 300);
        }
      }, 100);
    }
  }, []);

  const logout = async () => {
    try {
      if (tokens?.refresh?.token) {
        const role = currentUser?.role || decodeRoleFromToken(tokens?.access?.token) || 'user';

        // Only the user auth router currently exposes a logout endpoint guarded by auth('user').
        // For admin/provider we simply skip the API call to avoid role-mismatch noise.
        if (role === 'user') {
          await fetch(`${API_URL}/user/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(tokens?.access?.token ? { Authorization: `Bearer ${tokens.access.token}` } : {})
            },
            body: JSON.stringify({ refreshToken: tokens.refresh.token })
          });
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setTokens(null);
      localStorage.removeItem('user');
      localStorage.removeItem('authTokens');
      // Remove any legacy keys that may be used by older code paths
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // Set a flag to prevent silent re-login via refresh until user explicitly logs in
      setLogoutFlag();
      navigate('/login');
    }
  };

  const refreshToken = useCallback(async () => {
    if (!tokens?.refresh?.token) {
      console.warn('[Auth] No refresh token available for refresh');
      return null;
    }

    // Check if refresh token is expired before attempting refresh
    if (isTokenExpired(tokens.refresh.token)) {
      console.warn('[Auth] Refresh token is expired');
      logout();
      return null;
    }

    // Detect user role from current user to use correct refresh endpoint
    const userRole = currentUser?.role || 'user';
    console.log('[Auth] Attempting token refresh for role:', userRole);

    try {
      console.log('[Auth] Attempting token refresh...');

      // Always use unified endpoint for all roles
      const refreshEndpoint = `${API_URL}/auth/refresh-token`;

      const response = await fetch(refreshEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refresh.token })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Auth] Token refresh failed:', response.status, errorText);

        // Force logout on 401/403 to prevent infinite loops
        if (response.status === 401 || response.status === 403) {
          console.error('[Auth] Invalid refresh token - forcing logout');
          logout();
          return null;
        }

        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('[Auth] Token refresh successful');

      let nextTokens = {};
      if (data?.access || data?.refresh) {
        nextTokens = {
          access: { ...(data.access || tokens?.access || {}) },
          refresh: { ...(data.refresh || tokens?.refresh || {}) },
        };
      } else if (data?.accessToken || data?.refreshToken) {
        nextTokens = {
          access: { token: data.accessToken, expires: data.accessExpires },
          refresh: { token: data.refreshToken, expires: data.refreshExpires },
        };
      } else {
        throw new Error('Invalid token refresh response format');
      }

      setTokens(nextTokens);
      localStorage.setItem('authTokens', JSON.stringify(nextTokens));
      clearLogoutFlag(); // Clear logout flag on successful refresh
      return nextTokens.access?.token || null;
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error);
      return null;
    }
  }, [tokens, currentUser, logout]);

  const authFetch = useCallback(async (url, options = {}, requiresAuth = true) => {
    if (requiresAuth && !tokens?.access?.token) {
      throw new Error('Not authenticated');
    }
    const baseHeaders = {
      ...(options.headers || {}),
    };
    if (tokens?.access?.token) {
      baseHeaders['Authorization'] = `Bearer ${tokens.access.token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers: baseHeaders,
    });

    if (response.status === 401) {
      if (!refreshPromiseRef.current) {
        refreshPromiseRef.current = (async () => {
          try {
            const newTok = await refreshToken();
            return newTok;
          } finally {
            setTimeout(() => { refreshPromiseRef.current = null; }, 0);
          }
        })();
      }

      const newAccessToken = await refreshPromiseRef.current;
      if (newAccessToken) {
        const retryHeaders = {
          ...(options.headers || {}),
        };
        retryHeaders['Authorization'] = `Bearer ${newAccessToken}`;

        response = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });
      } else {
        navigate('/login');
        throw new Error('Session expired. Please log in again.');
      }
    }
    return response;
  }, [tokens, refreshToken, navigate]);

  const login = async (identifier, password) => {
    setError('');

    if (!identifier || !password) {
      setError('Email/phone and password are required');
      return { success: false };
    }

    // Determine if identifier is email or phone
    const isEmail = /\S+@\S+\.\S+/.test(identifier);
    const payload = isEmail
      ? { email: identifier, password }
      : { phone: identifier, password };

    try {
      const attempts = [
        {
          endpoint: `${API_URL}/auth/login`,
          transform: (data) => ({ user: data?.user, tokens: data?.tokens, raw: data }),
        },
        {
          endpoint: `${API_URL}/user/auth/login`,
          transform: (data) => ({ user: data?.user, tokens: data?.tokens, raw: data }),
        },
        {
          endpoint: `${API_URL}/admin/auth/login`,
          transform: (data) => ({
            user: data?.admin
              ? { ...data.admin, role: 'admin' }
              : data?.user
                ? { ...data.user, role: data.user.role || 'admin' }
                : null,
            tokens: data?.tokens ||
              (data?.accessToken || data?.refreshToken
                ? {
                  access: { token: data.accessToken, expires: data.accessExpires },
                  refresh: { token: data.refreshToken, expires: data.refreshExpires },
                }
                : null),
            raw: data,
          }),
        },
      ];

      let authResult = null;
      for (const attempt of attempts) {
        const response = await fetch(attempt.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          authResult = attempt.transform(data);
          break;
        }
      }

      if (authResult?.user && authResult?.tokens) {
        const normalizedTokens = authResult.tokens?.access
          ? authResult.tokens
          : authResult.tokens
            ? authResult.tokens
            : null;

        if (!normalizedTokens?.access?.token || !normalizedTokens?.refresh?.token) {
          throw new Error('Invalid token response');
        }

        const role = authResult.user.role || 'user';
        const normalizedUser = { ...authResult.user, role };

        setCurrentUser(normalizedUser);
        setTokens(normalizedTokens);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        localStorage.setItem('authTokens', JSON.stringify(normalizedTokens));
        clearLogoutFlag();
        sessionStorage.removeItem('location_prompt_dismissed');
        return { success: true, userType: role };
      }
    } catch (apiError) {
      console.warn('API authentication failed');
    }

    setError('Login failed. Please check your credentials.');
    return { success: false };
  };

  const setCurrentUserData = (userData) => {
    try {
      setCurrentUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (_) {
    }
  };

  const setAuthTokens = (nextTokens) => {
    try {
      setTokens(nextTokens);
      localStorage.setItem('authTokens', JSON.stringify(nextTokens));
      // Clear explicit logout barrier when tokens are set programmatically
      clearLogoutFlag();
    } catch (_) { }
  };

  const isProvider = () => {
    return currentUser && currentUser.role === 'provider';
  };
  const isUser = () => {
    return currentUser && currentUser.role === 'user';
  };

  const isAdmin = () => {
    return currentUser && currentUser.role === 'admin';
  };
  const providerLogin = async (email, password) => {
    setError('');
    if (!email || !password) {
      setError('Email and password are required');
      return { success: false };
    }

    try {
      // Try API authentication first
      const response = await fetch(`${API_URL}/provider/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_email: email, provider_password: password }),
      });
      const data = await response.json();
      if (response.ok) {
        const { user, tokens } = data;
        setCurrentUser(user);
        setTokens(tokens);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authTokens', JSON.stringify(tokens));
        clearLogoutFlag();
        return { success: true, userType: 'provider', user };
      }
    } catch (apiError) {
      // API failed
      console.warn('Provider API authentication failed');
    }


    setError('Login failed. Please check your credentials.');
    return { success: false };
  };

  const providerRegister = async (registrationData) => {
    setError('');
    try {
      // Validate required fields before sending
      const requiredFields = ['provider_name', 'provider_email', 'provider_password', 'provider_contact_number', 'services_offered'];
      const missingFields = requiredFields.filter(field => !registrationData[field]);

      if (missingFields.length > 0) {
        const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
        throw new Error(errorMsg);
      }

      // Clean and validate phone number format
      const cleanPhone = String(registrationData.provider_contact_number).replace(/\s+/g, '');
      if (!/^\d{10}$/.test(cleanPhone)) {
        throw new Error('Phone number must be exactly 10 digits');
      }

      const cleanedData = {
        provider_name: registrationData.provider_name,
        provider_email: (registrationData.provider_email || '').toLowerCase().trim(),
        provider_password: registrationData.provider_password,
        provider_contact_number: cleanPhone,
        services_offered: registrationData.services_offered,
        provider_type: registrationData.provider_type,
        provider_src: registrationData.provider_src,
        provider_desc: registrationData.provider_desc || '',
        provider_experience_years: registrationData.provider_experience_years || '',
        provider_certificates: registrationData.provider_certificates || '',
        provider_insta: registrationData.provider_insta || '',
        provider_fb: registrationData.provider_fb || '',
        how_hear_about_us: registrationData.how_hear_about_us || '',
        is_provider_bgchecked: registrationData.is_provider_bgchecked || false,
      };

      const response = await fetch(`${API_URL}/provider/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('Provider registration error:', data);
        const errorMessage = data?.message || data?.error || 'Provider registration failed';
        throw new Error(errorMessage);
      }

      // Set up authentication after successful registration
      // The API should return user and tokens similar to login response
      if (data?.user && data?.tokens) {
        // API returns user and tokens directly
        const user = { ...data.user, role: 'provider' };
        setCurrentUser(user);
        setTokens(data.tokens);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authTokens', JSON.stringify(data.tokens));
        clearLogoutFlag();
      } else if (data?.provider) {
        // Fallback: if API returns provider object, construct user from it
        const user = {
          ...data.provider,
          role: 'provider',
          // Ensure we have the necessary auth fields
          provider_id: data.provider.provider_id,
          provider_email: data.provider.provider_email || registrationData.provider_email,
        };
        setCurrentUser(user);
        // Even if we don't have tokens from registration, user is now registered and logged in
        localStorage.setItem('user', JSON.stringify(user));
        clearLogoutFlag();
      }

      return data?.provider?.provider_id ? data.provider : true;
    } catch (err) {
      const errorMessage = err.message || 'Provider registration failed';
      console.error('[Auth] Provider registration failed:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  const providerForgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_URL}/provider/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return response.ok;
    } catch (err) {
      return false;
    }
  };

  const adminLogin = async (email, password) => {
    setError('');
    if (!email || !password) {
      setError('Email and password are required');
      return { success: false };
    }

    try {
      const response = await fetch(`${API_URL}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const { user, tokens } = data;
        setCurrentUser({ ...user, role: 'admin' });
        setTokens(tokens);
        localStorage.setItem('user', JSON.stringify({ ...user, role: 'admin' }));
        localStorage.setItem('authTokens', JSON.stringify(tokens));
        clearLogoutFlag();
        return { success: true, userType: 'admin' };
      }

      setError(data?.message || 'Login failed. Please check your credentials.');
      return { success: false };
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Login failed. Please check your credentials.');
      return { success: false };
    }
  };

  const fetchUserDashboard = async () => {
    const now = Date.now();
    const ttlMs = 30_000; // 30s TTL to coalesce parallel requests across widgets
    const cache = dashboardCacheRef.current;
    if (cache.promise) return cache.promise;
    if (cache.data && (now - cache.ts) < ttlMs) return cache.data;

    cache.promise = (async () => {
      try {
        const response = await authFetch(`${API_URL}/user/dashboard`, {
          headers: cache.etag ? { 'If-None-Match': cache.etag } : undefined,
        });
        if (response.status === 304 && cache.data) {
          cache.ts = Date.now();
          return cache.data;
        }
        if (!response.ok) throw new Error('Failed to load dashboard');
        const json = await response.json();
        cache.data = json;
        cache.ts = Date.now();
        const et = response.headers.get('ETag');
        if (et) cache.etag = et;
        return json;
      } finally {
        // Allow setting promise null on next tick so same microtask callers share the promise
        setTimeout(() => { cache.promise = null; }, 0);
      }
    })();
    return cache.promise;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // If user explicitly logged out, do not attempt silent refresh
        if (wasExplicitlyLoggedOut()) {
          setLoading(false);
          return;
        }

        // Check if we need to refresh tokens
        if (tokens?.refresh?.token) {
          const accessToken = tokens?.access?.token;
          const needsRefresh = !accessToken || shouldRefreshToken(accessToken, 5);

          if (needsRefresh) {
            console.log('[Auth] Access token needs refresh, attempting refresh...');
            const newTok = await refreshToken();
            if (newTok) {
              console.log('[Auth] Token refresh successful, user should be authenticated');
              return;
            } else {
              console.warn('[Auth] Token refresh failed');
            }
          } else {
            const minutesLeft = getMinutesUntilExpiry(accessToken);
            console.log(`[Auth] Access token valid for ${minutesLeft} more minutes`);
          }
        }

        if (tokens?.access?.token) {
          const loadSessionForRole = async (role) => {
            switch (role) {
              case 'user': {
                const response = await authFetch(`${API_URL}/user/auth/me`);
                if (response.ok) {
                  const body = await response.json();
                  setCurrentUser({ ...(body || {}), role: 'user' });
                  return true;
                }
                return false;
              }
              case 'provider': {
                const response = await authFetch(`${API_URL}/provider/me`);
                if (response.ok) {
                  const body = await response.json();
                  setCurrentUser({ ...(body || {}), role: 'provider' });
                  return true;
                }
                return false;
              }
              case 'admin': {
                const response = await authFetch(`${API_URL}/admin/auth/me`);
                if (response.ok) {
                  const body = await response.json();
                  setCurrentUser({ ...(body || {}), role: 'admin' });
                  return true;
                }
                return false;
              }
              default:
                return false;
            }
          };

          // Fast role discovery to avoid 403 noise
          try {
            const whoResp = await authFetch(`${API_URL}/auth/whoami`);
            if (whoResp.ok) {
              const info = await whoResp.json();
              if (await loadSessionForRole(info?.role)) {
                return;
              }
            }
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('[PawsIQ] whoami check failed:', e);
            }
          }

          const inferredRole = decodeRoleFromToken(tokens?.access?.token);
          const rolePriority = inferredRole ? [inferredRole] : ['user', 'provider', 'admin'];

          for (const role of rolePriority) {
            try {
              if (await loadSessionForRole(role)) {
                return;
              }
            } catch (error) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn(`[PawsIQ] ${role} auth check failed:`, error);
              }
            }
          }
        }
        localStorage.removeItem('authTokens');
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAuthHeaders = useCallback(() => {
    if (!tokens?.access?.token) {
      return {};
    }
    return {
      'Authorization': `Bearer ${tokens.access.token}`,
    };
  }, [tokens]);

  const value = {
    currentUser,
    tokens,
    login,
    adminLogin,
    providerLogin,
    providerRegister,
    providerForgotPassword,
    logout,
    setCurrentUserData,
    setAuthTokens,
    setCurrentUser,
    isProvider,
    isUser,
    isAdmin,
    error,
    loading,
    authFetch,
    fetchUserDashboard,
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={value}>
      <NavigationHandler />
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};