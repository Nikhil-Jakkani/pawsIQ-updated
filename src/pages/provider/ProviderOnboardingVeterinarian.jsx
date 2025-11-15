import React from 'react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ProviderOnboardingFlow from './ProviderOnboardingFlow';
import { PROVIDER_TYPES } from '../../store/slices/providerOnboardingSlice';

/**
 * Veterinarian-specific onboarding flow
 * Ensures the provider type is set to Veterinarian for this onboarding path
 */
const ProviderOnboardingVeterinarian = () => {
  const location = useLocation();

  useEffect(() => {
    // Ensure registration data has the correct provider type
    const registrationData = localStorage.getItem('provider_registration');
    if (registrationData) {
      try {
        const data = JSON.parse(registrationData);
        if (data.providerType !== PROVIDER_TYPES.VETERINARIAN) {
          // Update provider type if it doesn't match the route
          data.providerType = PROVIDER_TYPES.VETERINARIAN;
          localStorage.setItem('provider_registration', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Error updating provider type:', err);
      }
    }
  }, []);

  return (
    <div>
      <ProviderOnboardingFlow />
    </div>
  );
};

export default ProviderOnboardingVeterinarian;