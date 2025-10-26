import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { resetOnboarding } from '../store/slices/providerOnboardingSlice';

/**
 * Custom hook for managing provider navigation
 * Provides convenient methods for navigating between provider pages
 */
export const useProviderNavigation = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const goToDashboard = useCallback(() => {
    navigate('/provider/dashboard');
  }, [navigate]);

  const goToAppointments = useCallback(() => {
    navigate('/provider/appointments');
  }, [navigate]);

  const goToClients = useCallback(() => {
    navigate('/provider/clients');
  }, [navigate]);

  const goToServices = useCallback(() => {
    navigate('/provider/services');
  }, [navigate]);

  const goToAnalytics = useCallback(() => {
    navigate('/provider/analytics');
  }, [navigate]);

  const goToPrescriptions = useCallback(() => {
    navigate('/provider/prescriptions');
  }, [navigate]);

  const goToLabReports = useCallback(() => {
    navigate('/provider/lab-reports');
  }, [navigate]);

  const goToNotifications = useCallback(() => {
    navigate('/provider/notifications');
  }, [navigate]);

  const goToSettings = useCallback(() => {
    navigate('/provider/settings');
  }, [navigate]);

  const startOnboarding = useCallback((providerType) => {
    // Store provider type in localStorage for onboarding
    localStorage.setItem('provider_registration', JSON.stringify({ providerType }));
    navigate('/provider/onboarding');
  }, [navigate]);

  const goToSignUp = useCallback(() => {
    dispatch(resetOnboarding());
    navigate('/provider/signup');
  }, [navigate, dispatch]);

  const goToLogin = useCallback(() => {
    navigate('/provider/login');
  }, [navigate]);

  const goToForgotPassword = useCallback(() => {
    navigate('/provider/forgot-password');
  }, [navigate]);

  return {
    // Dashboard navigation
    goToDashboard,
    goToAppointments,
    goToClients,
    goToServices,
    goToAnalytics,
    goToPrescriptions,
    goToLabReports,
    goToNotifications,
    goToSettings,
    // Auth navigation
    startOnboarding,
    goToSignUp,
    goToLogin,
    goToForgotPassword,
  };
};

export default useProviderNavigation;