import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaDog, FaCut, FaGraduationCap, FaStethoscope, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

const serviceTypes = [
  {
    id: 'veterinarian',
    title: 'Veterinarian',
    icon: <FaStethoscope className="text-3xl mb-2 text-blue-500" />,
    description: 'Provide medical care, consultations, and treatments for pets',
    requirements: [
      'Veterinary degree (B.V.Sc & AH or equivalent)',
      'State Veterinary Council registration',
      'Minimum 2 years of experience',
      'Valid ID proof and address proof'
    ]
  },
  {
    id: 'groomer',
    title: 'Pet Groomer',
    icon: <FaCut className="text-3xl mb-2 text-pink-500" />,
    description: 'Offer grooming services to keep pets clean and healthy',
    requirements: [
      'Professional grooming certification',
      'Experience with different breeds',
      'Knowledge of pet first aid',
      'Business registration (if applicable)'
    ]
  },
  {
    id: 'trainer',
    title: 'Pet Trainer',
    icon: <FaGraduationCap className="text-3xl mb-2 text-yellow-500" />,
    description: 'Help pets learn obedience and good behavior',
    requirements: [
      'Certification in pet training',
      'Experience with positive reinforcement',
      'Knowledge of animal behavior',
      'First aid certification (preferred)'
    ]
  },
  {
    id: 'petsitter',
    title: 'Pet Sitter',
    icon: <FaDog className="text-3xl mb-2 text-green-500" />,
    description: 'Provide care for pets when owners are away',
    requirements: [
      'Experience in pet care',
      'Basic pet first aid knowledge',
      'Police verification certificate',
      'References from previous clients'
    ]
  }
];

const ProviderServiceSelection = () => {
  const [selectedService, setSelectedService] = useState('');
  const navigate = useNavigate();

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId);
    localStorage.setItem('selectedService', serviceId);
  };

  const handleContinue = () => {
    if (selectedService) {
      navigate(`/provider/onboarding/${selectedService}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Become a Pet Care Provider</h1>
          <p className="text-lg text-gray-600">Select your service type to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {serviceTypes.map((service) => (
            <motion.div
              key={service.id}
              className={`bg-white rounded-xl p-6 shadow-md border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                selectedService === service.id ? 'border-blue-500' : 'border-transparent hover:border-gray-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleServiceSelect(service.id)}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {service.icon}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{service.description}</p>
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Requirements:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {service.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center">
          <motion.button
            onClick={handleContinue}
            disabled={!selectedService}
            className={`flex items-center px-6 py-3 rounded-lg font-medium text-white ${
              selectedService ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
            } transition-colors duration-200`}
            whileHover={selectedService ? { scale: 1.03 } : {}}
            whileTap={selectedService ? { scale: 0.98 } : {}}
          >
            Continue to Onboarding
            <FaArrowRight className="ml-2" />
          </motion.button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Already have an account?{' '}
            <button 
              onClick={() => navigate('/provider/login')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProviderServiceSelection;
