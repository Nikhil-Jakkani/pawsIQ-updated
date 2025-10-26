import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaCheckCircle } from 'react-icons/fa';

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

// Define the onboarding steps
const ONBOARDING_STEPS = {
  professional_info: {
    id: 'professional_info',
    label: 'Professional Info',
    component: ProfessionalInfo,
    order: 1
  },
  service_details: {
    id: 'service_details',
    label: 'Service Details',
    component: null, // Determined by provider type
    order: 2
  },
  document_upload: {
    id: 'document_upload',
    label: 'Documents',
    component: DocumentUpload,
    order: 3
  },
  terms_agreement: {
    id: 'terms_agreement',
    label: 'Terms & Conditions',
    component: TermsAgreement,
    order: 4
  },
  payment_info: {
    id: 'payment_info',
    label: 'Payment Details',
    component: PaymentInfo,
    order: 5
  },
  review_submission: {
    id: 'review_submission',
    label: 'Review & Submit',
    component: ReviewSubmission,
    order: 6
  }
};

// Get service-specific component based on provider type
const getServiceDetailsComponent = (providerType) => {
  switch (providerType) {
    case 'Veterinarian':
      return VeterinarianDetails;
    case 'Trainer':
      return TrainerDetails;
    case 'Groomer':
      return GroomerDetails;
    case 'Pet Sitter':
      return PetSitterDetails;
    default:
      return null;
  }
};

const ProviderOnboardingFlow = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [providerType, setProviderType] = useState(null);
  const [steps, setSteps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize steps based on provider type
  useEffect(() => {
    const registrationData = localStorage.getItem('provider_registration');
    
    if (!registrationData) {
      // Redirect to sign up if no registration data
      navigate('/provider/signup');
      return;
    }

    try {
      const parsedData = JSON.parse(registrationData);
      const type = parsedData.providerType;
      setProviderType(type);

      // Create steps array with all required steps
      const flowSteps = [
        { ...ONBOARDING_STEPS.professional_info },
        { 
          ...ONBOARDING_STEPS.service_details, 
          label: `${type} Details`,
          component: getServiceDetailsComponent(type)
        },
        { ...ONBOARDING_STEPS.document_upload },
        { ...ONBOARDING_STEPS.terms_agreement },
        { ...ONBOARDING_STEPS.payment_info },
        { ...ONBOARDING_STEPS.review_submission }
      ];

      setSteps(flowSteps);
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing onboarding:', error);
      navigate('/provider/signup');
    }
  }, [navigate]);

  if (isLoading || steps.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 bg-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading onboarding flow...</p>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep - 1];
  const CurrentStepComponent = currentStepData?.component;

  if (!CurrentStepComponent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Step Not Found</h2>
          <p className="text-gray-600 mb-6">The requested onboarding step is not available.</p>
          <button
            onClick={() => navigate('/provider/signup')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Sign Up
          </button>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleComplete = () => {
    // After review submission completes, redirect to dashboard
    navigate('/provider/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress Indicators */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                      index + 1 === currentStep
                        ? 'bg-blue-600 text-white'
                        : index + 1 < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {index + 1 < currentStep ? <FaCheckCircle /> : index + 1}
                  </motion.div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      style={{ minWidth: '40px' }}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            {/* Step Labels */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="text-center flex-1">
                  <p className="text-xs font-medium text-gray-700">{step.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Current Step Counter */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              {currentStepData.label}
            </h1>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          key={`step-${currentStep}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <CurrentStepComponent onNext={handleNext} onComplete={handleComplete} />
        </motion.div>
      </div>

      {/* Navigation Buttons */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FaArrowLeft className="mr-2" />
              Previous
            </button>

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/provider/signup')}
                className="px-6 py-3 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Exit
              </button>

              {currentStep === steps.length ? (
                <button
                  onClick={handleComplete}
                  className="flex items-center px-6 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  <FaCheckCircle className="mr-2" />
                  Complete Onboarding
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center px-6 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Next
                  <FaArrowRight className="ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderOnboardingFlow;