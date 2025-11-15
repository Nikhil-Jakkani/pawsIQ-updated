import React from 'react';
import { useEffect } from 'react';
import ProviderOnboardingFlow from './ProviderOnboardingFlow';
import { PROVIDER_TYPES } from '../../store/slices/providerOnboardingSlice';

/**
 * Trainer-specific onboarding flow
 * Ensures the provider type is set to Trainer for this onboarding path
 */
const ProviderOnboardingTrainer = () => {
  useEffect(() => {
    // Ensure registration data has the correct provider type
    const registrationData = localStorage.getItem('provider_registration');
    if (registrationData) {
      try {
        const data = JSON.parse(registrationData);
        if (data.providerType !== PROVIDER_TYPES.TRAINER) {
          // Update provider type if it doesn't match the route
          data.providerType = PROVIDER_TYPES.TRAINER;
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

export default ProviderOnboardingTrainer;