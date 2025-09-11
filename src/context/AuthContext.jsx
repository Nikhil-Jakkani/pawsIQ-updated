import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';
const ENABLE_MOCK_AUTH = import.meta?.env?.VITE_ENABLE_MOCK_AUTH === 'true' || true; // Enable by default for development

const AuthContext = createContext(null);

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
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      }
    } catch (err) {
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

  const refreshToken = useCallback(async () => {
    if (!tokens?.refresh?.token) {
      return null;
    }

    try {
      let response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refresh.token })
      });

      if (!response.ok) {
        response = await fetch(`${API_URL}/user/auth/refresh-tokens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refresh.token })
        });
      }

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      let nextTokens = tokens;
      if (data?.accessToken) {
        nextTokens = { ...tokens, access: { ...(tokens.access || {}), token: data.accessToken } };
      } else if (data?.access?.token) {
        nextTokens = data;
      }
      setTokens(nextTokens);
      localStorage.setItem('authTokens', JSON.stringify(nextTokens));
      return nextTokens.access?.token || null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return null;
    }
  }, [tokens]);

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

  const login = async (email, password) => {
    setError('');
    setLoading(true);

    try {
      let response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      let data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const uResp = await fetch(`${API_URL}/user/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const uData = await uResp.json().catch(() => ({}));
        if (uResp.ok) {
          data = uData;
          response = uResp;
        }
      }

      if (response.ok) {
        const { user, tokens } = data;
        const role = user?.role || 'user';
        setCurrentUser(user);
        setTokens(tokens);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authTokens', JSON.stringify(tokens));
        setLoading(false);
        return { success: true, userType: role };
      }
    } catch (apiError) {
      console.warn('API authentication failed');
    }

    if (ENABLE_MOCK_AUTH) {
      try {
        const user = USERS.find(u => u.email === email && u.password === password);
        if (user) {
          const userData = { ...user, token: 'mock-token-' + Date.now() };
          setCurrentUser(userData);
          setTokens({ access: { token: userData.token } });
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('authTokens', JSON.stringify({ access: { token: userData.token } }));
          setLoading(false);
          return { success: true, userType: user.role };
        }

        const provider = PROVIDERS.find(p => p.email === email && p.password === password);
        if (provider) {
          const userData = { ...provider, token: 'mock-token-' + Date.now() };
          setCurrentUser(userData);
          setTokens({ access: { token: userData.token } });
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('authTokens', JSON.stringify({ access: { token: userData.token } }));
          setLoading(false);
          return { success: true, userType: userData.role };
        }

        throw new Error('Invalid email or password');
      } catch (error) {
        setError(error.message || 'An error occurred during login');
        setLoading(false);
        return { success: false };
      }
    }

    setError('Login failed. Please check your credentials.');
    setLoading(false);
    return { success: false };
  };

  const logout = async () => {
    try {
      if (tokens?.refresh?.token) {
        await fetch(`${API_URL}/user/auth/logout`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(tokens?.access?.token ? { Authorization: `Bearer ${tokens.access.token}` } : {})
          },
          body: JSON.stringify({ refreshToken: tokens.refresh.token })
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setTokens(null);
      localStorage.removeItem('user');
      localStorage.removeItem('authTokens');
      navigate('/login');
    }
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
    } catch (_) {}
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
    setLoading(true);
    
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
        setLoading(false);
        return { success: true, userType: 'provider' };
      }
    } catch (apiError) {
      // API failed
      console.warn('Provider API authentication failed');
    }

    // Fallback to mock authentication
    if (ENABLE_MOCK_AUTH) {
      try {
        // Check in PROVIDERS array
        const provider = PROVIDERS.find(p => p.email === email && p.password === password);
        if (provider) {
          const userData = { ...provider, token: 'mock-token-' + Date.now() };
          setCurrentUser(userData);
          setTokens({ access: { token: userData.token } });
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('authTokens', JSON.stringify({ access: { token: userData.token } }));
          setLoading(false);
          return { success: true, userType: 'provider' };
        }

        // No provider found
        throw new Error('Invalid email or password');
      } catch (error) {
        setError(error.message || 'An error occurred during login');
        setLoading(false);
        return { success: false };
      }
    }

    // If mock auth is disabled, surface failure
    setError('Login failed. Please check your credentials.');
    setLoading(false);
    return { success: false };
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (tokens?.access?.token) {
          let userData = null;
          
          try {
            const provResp = await authFetch(`${API_URL}/provider/me`);
            if (provResp.ok) {
              const provData = await provResp.json();
              setCurrentUser({ ...(provData || {}), role: 'provider' });
              return;
            }
          } catch (error) {
            console.log('Provider auth check failed:', error);
          }
          
          try {
            let response = await authFetch(`${API_URL}/user/auth/me`);
            if (response.ok) {
              const userData = await response.json();
              setCurrentUser(userData);
              return;
            }
          } catch (error) {
            console.log('User auth check failed:', error);
          }

          try {
            const adminResp = await fetch(`${API_URL}/admin/auth/me`, {
              headers: { Authorization: `Bearer ${tokens.access.token}` },
            });
            if (adminResp.ok) {
              const adminData = await adminResp.json();
              setCurrentUser({ ...(adminData || {}), role: 'admin' });
              return;
            }
          } catch (error) {
            console.log('Admin auth check failed:', error);
          }

          console.log('All auth checks failed, logging out');
          logout();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [authFetch, tokens?.access?.token]);

  const value = {
    currentUser,
    tokens,
    login,
    providerLogin,
    logout,
    setCurrentUserData,
    setAuthTokens,
    isProvider,
    isUser,
    isAdmin,
    error,
    loading,
    authFetch,
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