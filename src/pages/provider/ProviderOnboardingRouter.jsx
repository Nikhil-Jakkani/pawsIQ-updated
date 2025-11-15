import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOnboardingPath, isValidProviderType } from '../../utils/providerOnboardingUtils';

/**
 * Provider Onboarding Router Component
 * Automatically routes to the correct provider-type-specific onboarding page
 * based on the provider type stored in localStorage
 */
const ProviderOnboardingRouter = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const registrationData = localStorage.getItem('provider_registration');

    if (!registrationData) {
      // No registration data found, redirect to signup
      navigate('/provider/signup');
      return;
    }

    try {
      const data = JSON.parse(registrationData);
      const providerType = data.providerType;

      if (!isValidProviderType(providerType)) {
        console.error('Invalid provider type:', providerType);
        navigate('/provider/signup');
        return;
      }

      // Redirect to provider-type-specific onboarding
      const onboardingPath = getOnboardingPath(providerType);
      navigate(onboardingPath, { replace: true });
    } catch (err) {
      console.error('Error parsing registration data:', err);
      navigate('/provider/signup');
    }
  }, [navigate]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-block mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-spin shadow-lg"></div>
        </div>
        <p className="text-gray-700 font-medium text-lg">Preparing your onboarding flow...</p>
      </div>
    </div>
  );
};

export default ProviderOnboardingRouter;