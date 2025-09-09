import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';
const ENABLE_MOCK_AUTH = import.meta?.env?.VITE_ENABLE_MOCK_AUTH === 'true';

const AuthContext = createContext(null);

const getStoredAuth = () => {
  const storedTokens = localStorage.getItem('authTokens');
  const storedUser = localStorage.getItem('user');
  
  return {
    tokens: storedTokens ? JSON.parse(storedTokens) : null,
    user: storedUser ? JSON.parse(storedUser) : null
  };
};

// Mock user data for demonstration
const USERS = [
  {
    email: 'admin@pawsiq.com',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User',
    avatar: '/avatar-admin.png'
  },
  {
    email: 'user@pawsiq.com',
    password: 'user123',
    role: 'user',
    name: 'Sarah Johnson',
    avatar: '/avatar-user.png',
    pets: [
      {
        id: 1,
        name: 'Max',
        type: 'dog',
        breed: 'Golden Retriever'
      },
      {
        id: 2,
        name: 'Luna',
        type: 'cat',
        breed: 'Siamese'
      }
    ]
  },
  {
    email: 'user@pawsiq.in',
    password: 'user1234',
    role: 'user',
    name: 'PawsIQ User',
    avatar: '/avatar-user.png',
    pets: [
      {
        id: 3,
        name: 'Buddy',
        type: 'dog',
        breed: 'Labrador'
      }
    ]
  }
];

// Mock provider data for demonstration
const PROVIDERS = [
  {
    email: 'vet@pawsiq.com',
    password: 'provider123',
    role: 'provider',
    providerType: 'Veterinarian',
    name: 'Dr. James Wilson',
    avatar: '/avatar-vet.png',
    verified: true,
    applicationStatus: 'approved'
  },
  {
    email: 'trainer@pawsiq.com',
    password: 'provider123',
    role: 'provider',
    providerType: 'Trainer',
    name: 'Emma Roberts',
    avatar: '/avatar-trainer.png',
    verified: true,
    applicationStatus: 'approved'
  },
  {
    email: 'groomer@pawsiq.com',
    password: 'provider123',
    role: 'provider',
    providerType: 'Groomer',
    name: 'Michael Chen',
    avatar: '/avatar-groomer.png',
    verified: true,
    applicationStatus: 'approved'
  }
];

export const AuthProvider = ({ children }) => {
  const stored = getStoredAuth();
  // Do not trust stored user before validation; start as null and validate via /user/auth/me
  const [currentUser, setCurrentUser] = useState(null);
  const [tokens, setTokens] = useState(() => stored.tokens);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigateRef = useRef();
  const refreshPromiseRef = useRef(null);
  
  // Store the navigate function in a ref to avoid dependency issues
  const navigate = useCallback((...args) => {
    if (navigateRef.current) {
      navigateRef.current(...args);
    }
  }, []);
  
  // Navigation component to get the navigate function
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

  // Initialize auth state
  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    try {
      const storedUser = localStorage.getItem('pawsiq_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      }
    } catch (err) {
      localStorage.removeItem('pawsiq_user');
    } finally {
      // Hide loading screen after auth check is complete
      setTimeout(() => {
        const loadingElement = document.getElementById('loading');
        if (loadingElement && loadingElement.style.display !== 'none') {
          console.log('AuthContext: Hiding loading screen after auth check');
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

  // Function to refresh access token
  const refreshToken = useCallback(async () => {
    if (!tokens?.refresh?.token) {
      return null;
    }

    try {
      // Try unified refresh endpoint first
      let response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refresh.token })
      });

      if (!response.ok) {
        // Fallback to legacy user endpoint
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
      // Support { accessToken } shape and { access: { token } } shape
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

  // API request interceptor to handle token refresh
  const authFetch = useCallback(async (url, options = {}, requiresAuth = true) => {
    if (requiresAuth && !tokens?.access?.token) {
      // Avoid hitting server before login; let caller handle not-authenticated state
      throw new Error('Not authenticated');
    }
    // Build headers without sending an empty Authorization header
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

    // If token is expired/unauthorized, try a single-flight refresh
    if (response.status === 401) {
      // Create or await a single refresh promise
      if (!refreshPromiseRef.current) {
        refreshPromiseRef.current = (async () => {
          try {
            const newTok = await refreshToken();
            return newTok;
          } finally {
            // Ensure ref is cleared after completion
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
      // Use unified credentials login (tries admin, then user)
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies/sessions
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

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
      // API failed
      console.warn('API authentication failed');
    }

    // Optional fallback to mock authentication (disabled by default)
    if (ENABLE_MOCK_AUTH) {
      try {
        // Check in USERS array
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

        // Check in PROVIDERS array
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

        // No user found
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

  const logout = async () => {
    try {
      // Call logout API if we have a refresh token
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
      // Clear state and storage
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

  // Check if user is a provider
  const isProvider = () => {
    return currentUser && currentUser.role === 'provider';
  };

  // Check if user is a regular user
  const isUser = () => {
    return currentUser && currentUser.role === 'user';
  };

  // Check if user is an admin
  const isAdmin = () => {
    return currentUser && currentUser.role === 'admin';
  };

  // Convenience login specifically for providers
  const providerLogin = async (email, password) => {
    const result = await login(email, password);
    if (result.success && (currentUser?.role === 'provider')) {
      return { success: true, userType: 'provider', providerType: currentUser?.providerType };
    }
    // If API returned a user but not a provider, treat as failure for provider portal
    return { success: false };
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (tokens?.access?.token) {
          // Verify the token is still valid against the correct endpoint
          let response = await authFetch(`${API_URL}/user/auth/me`);
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
          } else {
            // Try admin session validation as fallback
            const adminResp = await fetch(`${API_URL}/admin/auth/me`, {
              headers: { Authorization: `Bearer ${tokens.access.token}` }
            });
            if (adminResp.ok) {
              const adminData = await adminResp.json();
              setCurrentUser({ ...(adminData || {}), role: 'admin' });
            } else {
              throw new Error('Session expired');
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [authFetch]);

  const value = {
    currentUser,
    tokens,
    login,
    providerLogin,
    logout,
    setCurrentUserData,
    isProvider,
    isUser,
    isAdmin,
    error,
    loading,
    authFetch
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