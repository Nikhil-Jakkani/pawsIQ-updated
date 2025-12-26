import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

// Provider type constants
export const PROVIDER_TYPES = {
  VETERINARIAN: 'Veterinarian',
  TRAINER: 'Trainer',
  GROOMER: 'Groomer',
  PET_SITTER: 'Pet Sitter',
};

// Define onboarding steps for each provider type
const PROVIDER_ONBOARDING_STEPS = {
  [PROVIDER_TYPES.VETERINARIAN]: [
    { id: 'professional_info', label: 'Professional Info', order: 1, icon: 'FaUser' },
    { id: 'clinic_info', label: 'Clinic Details', order: 2, icon: 'FaHospital' },
    { id: 'specializations', label: 'Specializations', order: 3, icon: 'FaCertificate' },
    { id: 'document_upload', label: 'Documents & License', order: 4, icon: 'FaFile' },
    { id: 'service_details', label: 'Services & Pricing', order: 5, icon: 'FaTag' },
    { id: 'terms_agreement', label: 'Terms & Conditions', order: 6, icon: 'FaCheckCircle' },
    { id: 'payment_info', label: 'Payment Details', order: 7, icon: 'FaCreditCard' },
    { id: 'review_submission', label: 'Review & Submit', order: 8, icon: 'FaEye' },
  ],
  [PROVIDER_TYPES.TRAINER]: [
    { id: 'professional_info', label: 'Professional Info', order: 1, icon: 'FaUser' },
    { id: 'training_specialization', label: 'Training Specialization', order: 2, icon: 'FaDumbbell' },
    { id: 'experience_certification', label: 'Experience & Certification', order: 3, icon: 'FaCertificate' },
    { id: 'document_upload', label: 'Certifications & Documents', order: 4, icon: 'FaFile' },
    { id: 'service_details', label: 'Training Services & Pricing', order: 5, icon: 'FaTag' },
    { id: 'terms_agreement', label: 'Terms & Conditions', order: 6, icon: 'FaCheckCircle' },
    { id: 'payment_info', label: 'Payment Details', order: 7, icon: 'FaCreditCard' },
    { id: 'review_submission', label: 'Review & Submit', order: 8, icon: 'FaEye' },
  ],
  [PROVIDER_TYPES.GROOMER]: [
    { id: 'professional_info', label: 'Professional Info', order: 1, icon: 'FaUser' },
    { id: 'grooming_specialization', label: 'Grooming Specialization', order: 2, icon: 'FaCut' },
    { id: 'experience_certification', label: 'Experience & Certification', order: 3, icon: 'FaCertificate' },
    { id: 'document_upload', label: 'Certifications & Documents', order: 4, icon: 'FaFile' },
    { id: 'service_details', label: 'Grooming Services & Pricing', order: 5, icon: 'FaTag' },
    { id: 'terms_agreement', label: 'Terms & Conditions', order: 6, icon: 'FaCheckCircle' },
    { id: 'payment_info', label: 'Payment Details', order: 7, icon: 'FaCreditCard' },
    { id: 'review_submission', label: 'Review & Submit', order: 8, icon: 'FaEye' },
  ],
  [PROVIDER_TYPES.PET_SITTER]: [
    { id: 'professional_info', label: 'Personal Info', order: 1, icon: 'FaUser' },
    { id: 'pet_care_experience', label: 'Pet Care Experience', order: 2, icon: 'FaPaw' },
    { id: 'services_offered', label: 'Services Offered', order: 3, icon: 'FaHandsHelping' },
    { id: 'document_upload', label: 'Background & Documents', order: 4, icon: 'FaFile' },
    { id: 'service_details', label: 'Services & Pricing', order: 5, icon: 'FaTag' },
    { id: 'terms_agreement', label: 'Terms & Conditions', order: 6, icon: 'FaCheckCircle' },
    { id: 'payment_info', label: 'Payment Details', order: 7, icon: 'FaCreditCard' },
    { id: 'review_submission', label: 'Review & Submit', order: 8, icon: 'FaEye' },
  ],
};

// Async thunks
export const submitOnboardingStep = createAsyncThunk(
  'providerOnboarding/submitStep',
  async ({ stepId, data, authFetch, providerType }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/providers/onboarding/${stepId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, providerType }),
      });
      return { stepId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || `Failed to submit ${stepId}`);
    }
  }
);

export const completeOnboarding = createAsyncThunk(
  'providerOnboarding/complete',
  async ({ authFetch, providerType, formData }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/providers/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerType, formData }),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete onboarding');
    }
  }
);

export const fetchProviderOnboardingStatus = createAsyncThunk(
  'providerOnboarding/fetchStatus',
  async ({ authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/providers/onboarding/status`, {
        method: 'GET',
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch status');
    }
  }
);

const initialState = {
  currentStep: 1,
  totalSteps: 9,
  steps: [],
  completedSteps: [],
  formData: {},
  providerType: null,
  providerInfo: {
    id: null,
    name: null,
    email: null,
    phone: null,
    specializations: [],
    yearsOfExperience: 0,
    certifications: [],
    servicesOffered: [],
    availability: {},
    paymentDetails: {},
  },
  loading: false,
  error: null,
  success: false,
  isCompleted: false,
  onboardingStatus: null,
  validationErrors: {},
};

const providerOnboardingSlice = createSlice({
  name: 'providerOnboarding',
  initialState,
  reducers: {
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },
    setProviderType: (state, action) => {
      const providerType = action.payload;
      state.providerType = providerType;
      state.steps = PROVIDER_ONBOARDING_STEPS[providerType] || [];
      state.totalSteps = state.steps.length;
    },
    updateFormData: (state, action) => {
      state.formData = {
        ...state.formData,
        ...action.payload,
      };
    },
    updateProviderInfo: (state, action) => {
      state.providerInfo = {
        ...state.providerInfo,
        ...action.payload,
      };
    },
    markStepComplete: (state, action) => {
      const stepId = action.payload;
      if (!state.completedSteps.includes(stepId)) {
        state.completedSteps.push(stepId);
      }
    },
    setValidationErrors: (state, action) => {
      state.validationErrors = action.payload;
    },
    clearValidationErrors: (state) => {
      state.validationErrors = {};
    },
    goToNextStep: (state) => {
      if (state.currentStep < state.totalSteps) {
        state.currentStep += 1;
      }
    },
    goToPreviousStep: (state) => {
      if (state.currentStep > 1) {
        state.currentStep -= 1;
      }
    },
    goToStep: (state, action) => {
      const stepNumber = action.payload;
      if (stepNumber >= 1 && stepNumber <= state.totalSteps) {
        state.currentStep = stepNumber;
      }
    },
    resetOnboarding: (state) => {
      state.currentStep = 1;
      state.completedSteps = [];
      state.formData = {};
      state.providerType = null;
      state.error = null;
      state.success = false;
      state.isCompleted = false;
      state.validationErrors = {};
      state.providerInfo = {
        id: null,
        name: null,
        email: null,
        phone: null,
        specializations: [],
        yearsOfExperience: 0,
        certifications: [],
        servicesOffered: [],
        availability: {},
        paymentDetails: {},
      };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit step handlers
      .addCase(submitOnboardingStep.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitOnboardingStep.fulfilled, (state, action) => {
        state.loading = false;
        state.completedSteps.push(action.payload.stepId);
        state.formData[action.payload.stepId] = action.payload.data;
        state.success = true;
        state.validationErrors = {};
      })
      .addCase(submitOnboardingStep.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Complete onboarding handlers
      .addCase(completeOnboarding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeOnboarding.fulfilled, (state, action) => {
        state.loading = false;
        state.isCompleted = true;
        state.success = true;
        state.onboardingStatus = 'completed';
      })
      .addCase(completeOnboarding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch status handlers
      .addCase(fetchProviderOnboardingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviderOnboardingStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.onboardingStatus = action.payload.status;
        state.completedSteps = action.payload.completedSteps || [];
        state.currentStep = action.payload.currentStep || 1;
      })
      .addCase(fetchProviderOnboardingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setCurrentStep,
  setProviderType,
  updateFormData,
  updateProviderInfo,
  markStepComplete,
  setValidationErrors,
  clearValidationErrors,
  goToNextStep,
  goToPreviousStep,
  goToStep,
  resetOnboarding,
  clearError,
} = providerOnboardingSlice.actions;

export default providerOnboardingSlice.reducer;