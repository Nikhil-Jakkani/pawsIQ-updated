import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaRupeeSign, FaClock, FaShieldAlt, FaUserTie, FaCertificate } from 'react-icons/fa';
import { motion } from 'framer-motion';

const serviceDetails = {
  veterinarian: {
    title: 'Veterinarian Onboarding',
    icon: '🩺',
    features: [
      {
        icon: <FaCheck className="text-green-500" />,
        title: 'Verified Profile',
        description: 'Get a verified badge after document verification'
      },
      {
        icon: <FaRupeeSign className="text-blue-500" />,
        title: 'Earn More',
        description: 'Set your own consultation fees and earn competitive rates'
      },
      {
        icon: <FaClock className="text-purple-500" />,
        title: 'Flexible Hours',
        description: 'Set your own availability and work on your schedule'
      },
      {
        icon: <FaShieldAlt className="text-yellow-500" />,
        title: 'Insurance',
        description: 'Malpractice insurance coverage included'
      }
    ],
    steps: [
      'Complete your profile with professional details',
      'Upload your degree and license documents',
      'Set up your availability and services',
      'Get verified and start accepting appointments'
    ],
    requirements: [
      'Veterinary degree certificate',
      'State Veterinary Council registration',
      'ID proof (Aadhaar/Passport/Driving License)',
      'Address proof (not older than 3 months)'
    ]
  },
  groomer: {
    title: 'Pet Groomer Onboarding',
    icon: '✂️',
    features: [
      {
        icon: <FaUserTie className="text-blue-500" />,
        title: 'Professional Profile',
        description: 'Showcase your grooming expertise and portfolio'
      },
      {
        icon: <FaRupeeSign className="text-green-500" />,
        title: 'Earn Well',
        description: 'Set your own service prices and packages'
      },
      {
        icon: <FaClock className="text-purple-500" />,
        title: 'Flexible Bookings',
        description: 'Manage your own schedule and availability'
      },
      {
        icon: <FaShieldAlt className="text-yellow-500" />,
        title: 'Verified Badge',
        description: 'Get a verified badge after document verification'
      }
    ],
    steps: [
      'Complete your grooming service profile',
      'Upload your certification and work samples',
      'Set your service menu and pricing',
      'Start accepting grooming appointments'
    ],
    requirements: [
      'Grooming certification (if any)',
      'ID proof (Aadhaar/Passport/Driving License)',
      'Business registration (if applicable)',
      'Portfolio of previous work'
    ]
  },
  trainer: {
    title: 'Pet Trainer Onboarding',
    icon: '🐕',
    features: [
      {
        icon: <FaCertificate className="text-yellow-500" />,
        title: 'Certification Badge',
        description: 'Show your certification to build trust'
      },
      {
        icon: <FaRupeeSign className="text-green-500" />,
        title: 'Competitive Rates',
        description: 'Set your training program fees'
      },
      {
        icon: <FaClock className="text-purple-500" />,
        title: 'Flexible Scheduling',
        description: 'Choose your training hours'
      },
      {
        icon: <FaShieldAlt className="text-blue-500" />,
        title: 'Verified Profile',
        description: 'Get verified to attract more clients'
      }
    ],
    steps: [
      'Set up your training profile',
      'Add your training programs and methods',
      'Upload certifications and success stories',
      'Start receiving training requests'
    ],
    requirements: [
      'Training certification (if any)',
      'ID proof (Aadhaar/Passport/Driving License)',
      'Training methodology details',
      'Client testimonials (if available)'
    ]
  },
  petsitter: {
    title: 'Pet Sitter Onboarding',
    icon: '🏠',
    features: [
      {
        icon: <FaShieldAlt className="text-blue-500" />,
        title: 'Background Check',
        description: 'Verified sitters get more bookings'
      },
      {
        icon: <FaRupeeSign className="text-green-500" />,
        title: 'Earn Extra',
        description: 'Set your own rates for pet sitting'
      },
      {
        icon: <FaClock className="text-purple-500" />,
        title: 'Choose Your Hours',
        description: 'Work when it suits you'
      },
      {
        icon: <FaUserTie className="text-yellow-500" />,
        title: 'Build Your Profile',
        description: 'Show your love for pets and experience'
      }
    ],
    steps: [
      'Complete your pet sitter profile',
      'Set your availability and service area',
      'Add your experience with different pets',
      'Start receiving pet sitting requests'
    ],
    requirements: [
      'ID proof (Aadhaar/Passport/Driving License)',
      'Address proof',
      'Police verification certificate',
      'References (if available)'
    ]
  }
};

const ServiceOnboarding = () => {
  const { serviceType } = useParams();
  const navigate = useNavigate();
  
  const service = serviceDetails[serviceType] || serviceDetails.veterinarian;
  
  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Service Not Found</h2>
          <p className="text-gray-600 mb-6">The requested service type is not available.</p>
          <button
            onClick={() => navigate('/provider/signup')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  const handleGetStarted = () => {
    // Navigate to the signup form with the selected service type
    navigate(`/provider/signup?service=${serviceType}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-8"
        >
          <FaArrowLeft className="mr-2" /> Back to Services
        </button>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-10">
              <span className="text-5xl mb-4 inline-block">{service.icon}</span>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{service.title}</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Join our network of trusted pet care professionals and start growing your business
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Features */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Why Join Us?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {service.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      className="bg-gray-50 p-6 rounded-lg"
                      whileHover={{ y: -5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="text-2xl mb-3">{feature.icon}</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-10">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
                  <div className="space-y-4">
                    {service.steps.map((step, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-4">
                          {index + 1}
                        </div>
                        <p className="text-gray-700">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="lg:col-span-1">
                <div className="bg-blue-50 p-6 rounded-lg sticky top-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                  <ul className="space-y-3 mb-8">
                    {service.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start">
                        <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleGetStarted}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    Get Started
                    <FaArrowRight className="ml-2" />
                  </button>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceOnboarding;
