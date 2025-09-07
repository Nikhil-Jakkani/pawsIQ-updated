import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle, FaFacebook, FaApple, FaPaw, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

// Social login imports
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';

const Login = () => {
  const navigate = useNavigate();
  const { login: adminLogin, currentUser, error: authError, setCurrentUserData } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    email: 'user@pawsiq.com',
    password: 'user123',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Environment variables for social login
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'user') {
        navigate('/user/dashboard');
      } else if (currentUser.role === 'provider') {
        navigate('/provider/dashboard');
      } else if (currentUser.role === 'admin') {
        navigate('/dashboard');
      }
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await adminLogin(formData.email, formData.password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setErrors(prev => ({
          ...prev,
          form: 'Invalid email or password. Please try again.'
        }));
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors(prev => ({
        ...prev,
        form: 'An error occurred during login. Please try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login Success Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/auth/google/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          credential: credentialResponse.credential 
        })
      });
      
      if (!response.ok) {
        throw new Error('Google authentication failed');
      }
      
      const data = await response.json();
      
      // Persist user in AuthContext + localStorage for route guards
      const userData = {
        ...data.user,
        role: data.user?.role || 'user',
        tokens: {
          access: { token: data.accessToken },
          refresh: { token: data.refreshToken },
        },
      };
      setCurrentUserData(userData);
      // Optional: also keep raw tokens for other consumers
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Redirect based on user role
      const role = userData.role;
      navigate(role === 'admin' ? '/dashboard' : `/${role}/dashboard`);
      
    } catch (error) {
      console.error('Google login error:', error);
      setErrors(prev => ({
        ...prev,
        form: 'Could not sign in with Google. Please try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login Error Handler
  const handleGoogleError = () => {
    setErrors(prev => ({
      ...prev,
      form: 'Google login was cancelled or failed. Please try again.'
    }));
  };

  // Facebook Login Handler
  const handleFacebookResponse = async (response) => {
    if (response.status === 'unknown') {
      setErrors(prev => ({
        ...prev,
        form: 'Facebook login was cancelled.'
      }));
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      const apiResponse = await fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/auth/facebook/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: response.accessToken,
          userID: response.userID,
          name: response.name,
          email: response.email
        })
      });
      
      if (!apiResponse.ok) {
        throw new Error('Facebook authentication failed');
      }
      
      const data = await apiResponse.json();
      
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Redirect based on user role
      const role = data.user?.role || 'user';
      navigate(role === 'admin' ? '/dashboard' : `/${role}/dashboard`);
      
    } catch (error) {
      console.error('Facebook login error:', error);
      setErrors(prev => ({
        ...prev,
        form: 'Could not sign in with Facebook. Please try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            className="mx-auto h-20 w-auto object-contain"
            src="/7.png"
            alt="PawsIQ"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to PawsIQ
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              create a new account
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {/* Form error message */}
            {errors.form && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {errors.form}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Regular login form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`pl-10 block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md ${
                      errors.email ? 'border-red-300' : ''
                    }`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`pl-10 pr-10 block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md ${
                      errors.password ? 'border-red-300' : ''
                    }`}
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      tabIndex="-1"
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-5 w-5" />
                      ) : (
                        <FaEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            {/* Social Login Section */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Google Login */}
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  render={(renderProps) => (
                    <button
                      onClick={renderProps.onClick}
                      disabled={isLoading || renderProps.disabled}
                      className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaGoogle className="h-5 w-5 text-red-500 mr-2" />
                      <span>Google</span>
                    </button>
                  )}
                />

                {/* Facebook Login */}
                <FacebookLogin
                  appId={FACEBOOK_APP_ID}
                  autoLoad={false}
                  fields="name,email,picture"
                  scope="public_profile,email"
                  callback={handleFacebookResponse}
                  render={(renderProps) => (
                    <button
                      onClick={renderProps.onClick}
                      disabled={isLoading}
                      className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#1877F2] hover:bg-[#166FE5] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaFacebook className="h-5 w-5 text-white mr-2" />
                      <span>Facebook</span>
                    </button>
                  )}
                />
              </div>
            </div>
            </div>
            
            {/* Provider Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center">
                <FaPaw className="h-6 w-6 text-indigo-500 mr-2" />
                <h3 className="text-base font-medium text-gray-900">Are you a pet care professional?</h3>
              </div>
              <div className="mt-4 flex flex-col space-y-3">
                <Link
                  to="/provider/signup"
                  className="w-full flex justify-center py-2 px-4 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Join as a Provider
                </Link>
                <Link
                  to="/provider/login"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Provider Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
