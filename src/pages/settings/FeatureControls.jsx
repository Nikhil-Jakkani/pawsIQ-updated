import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FaToggleOn, FaSave, FaArrowLeft } from 'react-icons/fa';

const FeatureControls = () => {
  const navigate = useNavigate();
  const [features, setFeatures] = useState({
    userRegistration: false,
    providerOnboarding: false,
    appointmentBooking: false,
    paymentProcessing: false,
    notificationSystem: false,
    analyticsTracking: false,
    socialSharing: false,
    mobileApp: false,
    aiPetCare: false,
    communityFeatures: false,
    marketplace: false,
    healthRecords: false
  });

  const handleToggle = (featureName) => {
    setFeatures(prev => ({
      ...prev,
      [featureName]: !prev[featureName]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Features updated:', features);
  };

  const featureGroups = {
    'User Features': [
      { key: 'userRegistration', label: 'User Registration' },
      { key: 'notificationSystem', label: 'Notification System' },
      { key: 'socialSharing', label: 'Social Sharing' },
      { key: 'communityFeatures', label: 'Community Features' }
    ],
    'Provider Features': [
      { key: 'providerOnboarding', label: 'Provider Onboarding' },
      { key: 'appointmentBooking', label: 'Appointment Booking' },
      { key: 'analyticsTracking', label: 'Analytics Tracking' }
    ],
    'Advanced Features': [
      { key: 'paymentProcessing', label: 'Payment Processing' },
      { key: 'mobileApp', label: 'Mobile App' },
      { key: 'aiPetCare', label: 'AI Pet Care' },
      { key: 'marketplace', label: 'Marketplace' },
      { key: 'healthRecords', label: 'Health Records' }
    ]
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <FaToggleOn className="text-indigo-600 text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Feature Controls</h1>
              <p className="text-gray-500">Enable or disable platform features</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <FaArrowLeft size={16} />
            <span className="text-sm font-medium">Back to Settings</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {Object.entries(featureGroups).map(([groupName, items]) => (
            <div key={groupName} className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{groupName}</h2>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                    <label className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                      {item.label}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleToggle(item.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        features[item.key] ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          features[item.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <FaSave size={16} /> Save Features
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default FeatureControls;