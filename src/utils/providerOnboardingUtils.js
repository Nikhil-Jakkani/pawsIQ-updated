/**
 * Provider Onboarding Utilities
 * Handles routing and configuration for provider-type-specific onboarding
 */

import { PROVIDER_TYPES } from '../store/slices/providerOnboardingSlice';

/**
 * Get the onboarding path for a specific provider type
 * @param {string} providerType - The provider type (e.g., 'Veterinarian', 'Trainer', 'Groomer', 'Pet Sitter')
 * @returns {string} The onboarding route path
 */
export const getOnboardingPath = (providerType) => {
  if (!providerType) return '/provider/onboarding';
  
  // Normalize the provider type by checking against known types
  const normalizedType = Object.values(PROVIDER_TYPES).find(type => 
    type.toLowerCase() === providerType.toLowerCase()
  );

  // Map provider types to URL-friendly paths
  const pathMap = {
    [PROVIDER_TYPES.VETERINARIAN]: '/provider/onboarding/veterinarian',
    [PROVIDER_TYPES.TRAINER]: '/provider/onboarding/trainer',
    [PROVIDER_TYPES.GROOMER]: '/provider/onboarding/groomer',
    [PROVIDER_TYPES.PET_SITTER]: '/provider/onboarding/pet-sitter',
  };

  return pathMap[normalizedType] || '/provider/onboarding';
};

/**
 * Get the provider type from the onboarding path
 * @param {string} path - The onboarding path
 * @returns {string|null} The provider type or null if not found
 */
export const getProviderTypeFromPath = (path) => {
  const reverseMap = {
    'veterinarian': PROVIDER_TYPES.VETERINARIAN,
    'trainer': PROVIDER_TYPES.TRAINER,
    'groomer': PROVIDER_TYPES.GROOMER,
    'pet-sitter': PROVIDER_TYPES.PET_SITTER,
  };

  // Extract the last segment of the path
  const segments = path.split('/').filter(Boolean);
  const typeSegment = segments[segments.length - 1];
  
  return reverseMap[typeSegment] || null;
};

/**
 * Get onboarding details for a provider type
 * @param {string} providerType - The provider type
 * @returns {object} Onboarding details including path, title, and description
 */
export const getOnboardingDetails = (providerType) => {
  const details = {
    [PROVIDER_TYPES.VETERINARIAN]: {
      path: '/provider/onboarding/veterinarian',
      title: 'Veterinarian Onboarding',
      description: 'Complete your veterinary clinic profile and documentation',
      icon: 'FaStethoscope',
      steps: 9,
    },
    [PROVIDER_TYPES.TRAINER]: {
      path: '/provider/onboarding/trainer',
      title: 'Trainer Onboarding',
      description: 'Set up your training specialization and services',
      icon: 'FaDumbbell',
      steps: 9,
    },
    [PROVIDER_TYPES.GROOMER]: {
      path: '/provider/onboarding/groomer',
      title: 'Groomer Onboarding',
      description: 'Configure your grooming services and specializations',
      icon: 'FaCut',
      steps: 9,
    },
    [PROVIDER_TYPES.PET_SITTER]: {
      path: '/provider/onboarding/pet-sitter',
      title: 'Pet Sitter Onboarding',
      description: 'Complete your pet sitting profile and availability',
      icon: 'FaPaw',
      steps: 9,
    },
  };

  return details[providerType] || null;
};

/**
 * All available provider types
 */
export const ALL_PROVIDER_TYPES = Object.values(PROVIDER_TYPES);

/**
 * Check if provider type is valid
 * @param {string} providerType - The provider type to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidProviderType = (providerType) => {
  return ALL_PROVIDER_TYPES.includes(providerType);
};

/**
 * Get display name for provider type
 * @param {string} providerType - The provider type
 * @returns {string} Display name
 */
export const getProviderTypeDisplayName = (providerType) => {
  const displayNames = {
    [PROVIDER_TYPES.VETERINARIAN]: 'Veterinarian',
    [PROVIDER_TYPES.TRAINER]: 'Trainer',
    [PROVIDER_TYPES.GROOMER]: 'Groomer',
    [PROVIDER_TYPES.PET_SITTER]: 'Pet Sitter',
  };

  return displayNames[providerType] || providerType;
};