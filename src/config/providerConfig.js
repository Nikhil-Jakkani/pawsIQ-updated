/**
 * Provider Configuration
 * Centralized configuration for all provider types and their specific settings
 */

export const PROVIDER_CONFIGS = {
  Veterinarian: {
    type: 'Veterinarian',
    label: 'Veterinarian',
    icon: 'FaStethoscope',
    color: 'blue',
    description: 'Professional veterinary services',
    requiredDocuments: [
      'Medical License',
      'Degree Certificate',
      'Identity Proof',
      'Clinic Registration',
      'Insurance Certificate',
    ],
    services: [
      'General Consultation',
      'Surgery',
      'Vaccination',
      'Diagnostic Tests',
      'Prescription Services',
    ],
    specializations: [
      'Small Animals',
      'Large Animals',
      'Exotic Pets',
      'Dermatology',
      'Surgery',
      'Dentistry',
      'Orthopedics',
    ],
    dashboardMetrics: [
      'consultations',
      'prescriptions',
      'surgeries',
      'diagnosticTests',
      'patientRecords',
    ],
    features: {
      prescriptions: true,
      labReports: true,
      appointmentTypes: ['Consultation', 'Surgery', 'Follow-up'],
      recurringAppointments: true,
    },
  },
  Trainer: {
    type: 'Trainer',
    label: 'Trainer',
    icon: 'FaDumbbell',
    color: 'indigo',
    description: 'Professional pet training services',
    requiredDocuments: [
      'Training Certification',
      'Identity Proof',
      'Insurance Certificate',
      'Liability Certificate',
    ],
    services: [
      'Obedience Training',
      'Behavior Modification',
      'Puppy Training',
      'Agility Training',
      'Advanced Training',
    ],
    specializations: [
      'Obedience',
      'Behavior Training',
      'Puppy Training',
      'Agility',
      'Protection Training',
      'Service Dog Training',
    ],
    dashboardMetrics: [
      'trainingSessions',
      'progressReports',
      'clientSatisfaction',
      'certificationsIssued',
      'upcomingClasses',
    ],
    features: {
      progressTracking: true,
      groupClasses: true,
      appointmentTypes: ['Individual Session', 'Group Class', 'Evaluation'],
      recurringAppointments: true,
    },
  },
  Groomer: {
    type: 'Groomer',
    label: 'Groomer',
    icon: 'FaCut',
    color: 'pink',
    description: 'Professional pet grooming services',
    requiredDocuments: [
      'Grooming Certification',
      'Identity Proof',
      'Insurance Certificate',
      'Health Certificate',
    ],
    services: [
      'Full Grooming',
      'Bath & Dry',
      'Nail Trimming',
      'Ear Cleaning',
      'Specialty Grooming',
    ],
    specializations: [
      'Dogs',
      'Cats',
      'Rabbits',
      'Show Grooming',
      'Breed-Specific Grooming',
      'Hypoallergenic Grooming',
    ],
    dashboardMetrics: [
      'groomingSessions',
      'completedSessions',
      'clientRetention',
      'productsSold',
      'averageServiceTime',
    ],
    features: {
      servicePackages: true,
      productRetail: true,
      appointmentTypes: ['Standard Grooming', 'Bath Only', 'Specialty'],
      recurringAppointments: true,
    },
  },
  'Pet Sitter': {
    type: 'Pet Sitter',
    label: 'Pet Sitter',
    icon: 'FaPaw',
    color: 'orange',
    description: 'Professional pet sitting and care services',
    requiredDocuments: [
      'Identity Proof',
      'Background Check',
      'Insurance Certificate',
      'Pet Care Certificate (Optional)',
    ],
    services: [
      'Dog Walking',
      'Pet Sitting',
      'Overnight Care',
      'Feeding & Watering',
      'Pet Playtime',
    ],
    specializations: [
      'Dog Walking',
      'Pet Sitting',
      'Overnight Care',
      'Exotic Pet Care',
      'Senior Pet Care',
      'Puppy Care',
    ],
    dashboardMetrics: [
      'activeBookings',
      'upcomingSits',
      'clientSatisfaction',
      'areasOfService',
      'totalHoursSit',
    ],
    features: {
      mapServices: true,
      dailyUpdates: true,
      appointmentTypes: ['Walk', 'Sitting', 'Overnight', 'Drop-in Visit'],
      recurringAppointments: true,
    },
  },
};

/**
 * Get provider configuration by type
 */
export const getProviderConfig = (providerType) => {
  return PROVIDER_CONFIGS[providerType] || null;
};

/**
 * Get all provider types
 */
export const getAllProviderTypes = () => {
  return Object.keys(PROVIDER_CONFIGS);
};

/**
 * Get provider services
 */
export const getProviderServices = (providerType) => {
  const config = getProviderConfig(providerType);
  return config?.services || [];
};

/**
 * Get provider specializations
 */
export const getProviderSpecializations = (providerType) => {
  const config = getProviderConfig(providerType);
  return config?.specializations || [];
};

/**
 * Get required documents for provider type
 */
export const getRequiredDocuments = (providerType) => {
  const config = getProviderConfig(providerType);
  return config?.requiredDocuments || [];
};

/**
 * Check if provider type has a specific feature
 */
export const hasProviderFeature = (providerType, feature) => {
  const config = getProviderConfig(providerType);
  return config?.features?.[feature] || false;
};

/**
 * Get provider color for UI
 */
export const getProviderColor = (providerType) => {
  const config = getProviderConfig(providerType);
  return config?.color || 'gray';
};

/**
 * Get provider icon
 */
export const getProviderIcon = (providerType) => {
  const config = getProviderConfig(providerType);
  return config?.icon || 'FaUser';
};

/**
 * Validation rules for provider onboarding
 */
export const VALIDATION_RULES = {
  Veterinarian: {
    professional_info: {
      name: { required: true, minLength: 3, maxLength: 100 },
      email: { required: true, format: 'email' },
      phone: { required: true, format: 'phone' },
      yearsOfExperience: { required: true, min: 0, max: 70 },
    },
    clinic_info: {
      clinicName: { required: true, minLength: 3, maxLength: 200 },
      clinicAddress: { required: true, minLength: 5 },
      clinicPhone: { required: true, format: 'phone' },
      clinicHours: { required: true },
    },
    specializations: {
      specializations: { required: true, minItems: 1, maxItems: 5 },
    },
  },
  Trainer: {
    professional_info: {
      name: { required: true, minLength: 3, maxLength: 100 },
      email: { required: true, format: 'email' },
      phone: { required: true, format: 'phone' },
      yearsOfExperience: { required: true, min: 0, max: 70 },
    },
    training_specialization: {
      specializations: { required: true, minItems: 1, maxItems: 5 },
      trainingMethods: { required: true },
    },
  },
  Groomer: {
    professional_info: {
      name: { required: true, minLength: 3, maxLength: 100 },
      email: { required: true, format: 'email' },
      phone: { required: true, format: 'phone' },
      yearsOfExperience: { required: true, min: 0, max: 70 },
    },
    grooming_specialization: {
      specializations: { required: true, minItems: 1, maxItems: 5 },
      petTypes: { required: true, minItems: 1 },
    },
  },
  'Pet Sitter': {
    professional_info: {
      name: { required: true, minLength: 3, maxLength: 100 },
      email: { required: true, format: 'email' },
      phone: { required: true, format: 'phone' },
    },
    pet_care_experience: {
      yearsOfExperience: { required: true, min: 0, max: 70 },
      petTypesExperienced: { required: true, minItems: 1 },
    },
  },
};

/**
 * Commission structure for different provider types
 */
export const COMMISSION_STRUCTURE = {
  Veterinarian: {
    percentage: 15,
    description: 'Service-based commission',
    payoutFrequency: 'Weekly',
  },
  Trainer: {
    percentage: 12,
    description: 'Session-based commission',
    payoutFrequency: 'Weekly',
  },
  Groomer: {
    percentage: 12,
    description: 'Booking-based commission',
    payoutFrequency: 'Weekly',
  },
  'Pet Sitter': {
    percentage: 10,
    description: 'Booking-based commission',
    payoutFrequency: 'Bi-weekly',
  },
};