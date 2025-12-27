import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
} from 'react-icons/fa';

// Redux actions
import {
  setCurrentStep,
  setProviderType,
  updateFormData,
  updateProviderInfo,
  markStepComplete,
  goToNextStep,
  goToPreviousStep,
  goToStep,
  resetOnboarding,
  PROVIDER_TYPES,
} from '../../store/slices/providerOnboardingSlice';

// Import all onboarding step components
import ProfessionalInfo from './ProfessionalInfo';
import VeterinarianDetails from './VeterinarianDetails';
import TrainerDetails from './TrainerDetails';
import GroomerDetails from './GroomerDetails';
import PetSitterDetails from './PetSitterDetails';
import DocumentUpload from './DocumentUpload';
import TermsAgreement from './TermsAgreement';
import PaymentInfo from './PaymentInfo';
import ReviewSubmission from './ReviewSubmission';

// Service details component mapping
const SERVICE_DETAILS_COMPONENTS = {
  [PROVIDER_TYPES.VETERINARIAN]: VeterinarianDetails,
  [PROVIDER_TYPES.TRAINER]: TrainerDetails,
  [PROVIDER_TYPES.GROOMER]: GroomerDetails,
  [PROVIDER_TYPES.PET_SITTER]: PetSitterDetails,
};

/**
 * Provider Onboarding Flow Component
 * Multi-step onboarding with Redux state management and provider-specific steps
 */
const ProviderOnboardingFlow = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    currentStep,
    totalSteps,
    steps,
    completedSteps,
    formData,
    providerType,
    loading,
    error,
    isCompleted,
    validationErrors,
  } = useSelector((state) => state.providerOnboarding);

  const [isLocalLoading, setIsLocalLoading] = useState(true);
  const [showConfirmExit, setShowConfirmExit] = useState(false);

  // Initialize onboarding
  useEffect(() => {
    const registrationData = localStorage.getItem('provider_registration');

    if (!registrationData) {
      navigate('/provider/signup');
      return;
    }

    try {
      const parsedData = JSON.parse(registrationData);
      const type = parsedData.providerType;

      // Validate provider type
      if (!Object.values(PROVIDER_TYPES).includes(type)) {
        console.error('Invalid provider type:', type);
        navigate('/provider/signup');
        return;
      }

      dispatch(setProviderType(type));
      dispatch(updateProviderInfo({
        name: parsedData.name,
        email: parsedData.email,
        phone: parsedData.phone,
      }));
      setIsLocalLoading(false);
    } catch (error) {
      console.error('Error initializing onboarding:', error);
      navigate('/provider/signup');
    }
  }, [dispatch, navigate]);

  // Handle completion
  useEffect(() => {
    if (isCompleted) {
      setTimeout(() => {
        navigate('/provider/dashboard');
      }, 1500);
    }
  }, [isCompleted, navigate]);

  const handleNext = () => {
    // Validate current step before proceeding
    if (Object.keys(validationErrors).length === 0) {
      dispatch(markStepComplete(steps[currentStep - 1]?.id));
      dispatch(goToNextStep());
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    dispatch(goToPreviousStep());
    window.scrollTo(0, 0);
  };

  const handleStepSubmit = (stepData) => {
    // Save step data to Redux
    dispatch(updateFormData({ [steps[currentStep - 1]?.id]: stepData }));

    if (currentStep === totalSteps) {
      // Complete onboarding on final step
      handleComplete();
    } else {
      handleNext();
    }
  };

  const handleComplete = () => {
    // Navigate to dashboard
    navigate('/provider/dashboard');
  };

  const handleExit = () => {
    setShowConfirmExit(true);
  };

  const confirmExit = () => {
    dispatch(resetOnboarding());
    localStorage.removeItem('provider_registration');
    navigate('/provider/signup');
  };

  const handleStepClick = (stepNumber) => {
    if (stepNumber < currentStep || completedSteps.includes(steps[stepNumber - 1]?.id)) {
      dispatch(goToStep(stepNumber));
      window.scrollTo(0, 0);
    }
  };

  if (isLocalLoading || !providerType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-spin shadow-lg"></div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Initializing onboarding flow...</p>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep - 1];
  const ServiceDetailsComponent = SERVICE_DETAILS_COMPONENTS[providerType];
  const progressPercentage = (currentStep / totalSteps) * 100;

  // Determine which component to render
  let CurrentStepComponent = null;
  if (currentStepData?.id === 'professional_info') {
    CurrentStepComponent = ProfessionalInfo;
  } else if (
    currentStepData?.id === 'service_details' ||
    currentStepData?.id === 'clinic_info' ||
    currentStepData?.id === 'specializations' ||
    currentStepData?.id === 'training_specialization' ||
    currentStepData?.id === 'grooming_specialization' ||
    currentStepData?.id === 'pet_care_experience' ||
    currentStepData?.id === 'services_offered'
  ) {
    CurrentStepComponent = ServiceDetailsComponent;
  } else if (currentStepData?.id === 'document_upload') {
    CurrentStepComponent = DocumentUpload;
  } else if (currentStepData?.id === 'terms_agreement') {
    CurrentStepComponent = TermsAgreement;
  } else if (currentStepData?.id === 'payment_info') {
    CurrentStepComponent = PaymentInfo;
  } else if (currentStepData?.id === 'review_submission') {
    CurrentStepComponent = ReviewSubmission;
  } else if (
    currentStepData?.id === 'experience_certification' ||
    currentStepData?.id === 'availability'
  ) {
    // Placeholder for future components
    CurrentStepComponent = () => (
      <div className="p-8 text-center">
        <p className="text-gray-600 font-medium mb-4">{currentStepData?.label}</p>
        <p className="text-gray-500 text-sm">This step will be implemented shortly</p>
      </div>
    );
  }

  if (!CurrentStepComponent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Step Not Found</h2>
          <p className="text-gray-600 mb-6">The requested onboarding step is not available.</p>
          <button
            onClick={() => navigate('/provider/signup')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Exit Confirmation Modal */}
      {showConfirmExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-2xl max-w-md p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3">Exit Onboarding?</h3>
            <p className="text-gray-600 mb-6">
              Your progress has been saved. You can resume from where you left off.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmExit(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Continue
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Exit
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Progress Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-3 mb-2">
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <p className="text-sm font-medium text-blue-600">{currentStep} of {totalSteps}</p>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="mb-4">
            <div className="flex items-center justify-center mb-4 overflow-x-auto pb-2">

              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  className="flex items-center flex-shrink-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <button
                    onClick={() => handleStepClick(index + 1)}
                    disabled={index + 1 > currentStep && !completedSteps.includes(step.id)}
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all ${index + 1 === currentStep
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200 cursor-pointer'
                      : index + 1 < currentStep || completedSteps.includes(step.id)
                        ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      }`}
                    title={step.label}
                  >
                    {index + 1 < currentStep || completedSteps.includes(step.id) ? (
                      <FaCheckCircle />
                    ) : (
                      index + 1
                    )}
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 sm:w-12 h-1 mx-1 transition-colors ${index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      style={{ minWidth: '20px' }}
                    ></div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Step Labels */}
            <div className="grid gap-1 text-center">

              <p className="text-sm font-medium text-gray-700 truncate">
                {currentStepData?.label}
              </p>
              <p className="text-xs text-gray-500">
                Provider Type: <span className="font-semibold text-gray-700">{providerType}</span>
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
            >
              <FaExclamationCircle className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 text-sm font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Validation Errors */}
          {Object.keys(validationErrors).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <p className="text-yellow-700 text-sm font-medium mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(validationErrors).map(([field, message]) => (
                  <li key={field} className="text-yellow-600 text-sm">
                    {message}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

          <motion.div
            key={`step-${currentStep}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6 sm:p-8"
          >
            {isCompleted ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-12"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                  <FaCheckCircle className="text-4xl text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Onboarding Complete!
                </h2>
                <p className="text-gray-600 mb-8">
                  Your profile has been submitted successfully. You'll be redirected to your dashboard shortly.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin text-blue-600" />
                  <p className="text-gray-600">Redirecting...</p>
                </div>
              </motion.div>
            ) : (
              <CurrentStepComponent
                onNext={handleStepSubmit}
                onComplete={handleComplete}
                formData={formData[steps[currentStep - 1]?.id] || {}}
                embedded={true}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProviderOnboardingFlow;