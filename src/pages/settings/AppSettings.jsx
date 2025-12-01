import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FaCog, FaSave, FaArrowLeft } from 'react-icons/fa';

const AppSettings = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    appName: '',
    appVersion: '',
    supportEmail: '',
    maxUploadSize: '',
    sessionTimeout: '',
    maintenanceMode: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <FaCog className="text-indigo-600 text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">App Settings</h1>
              <p className="text-gray-500">Configure general application settings</p>
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
          {/* General Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">General Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Name
                </label>
                <input
                  type="text"
                  name="appName"
                  value={formData.appName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter application name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Version
                </label>
                <input
                  type="text"
                  name="appVersion"
                  value={formData.appVersion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 1.0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  name="supportEmail"
                  value={formData.supportEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="support@example.com"
                />
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">System Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Upload Size (MB)
                </label>
                <input
                  type="number"
                  name="maxUploadSize"
                  value={formData.maxUploadSize}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  name="sessionTimeout"
                  value={formData.sessionTimeout}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 30"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  checked={formData.maintenanceMode}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm font-medium text-gray-700">
                  Maintenance Mode
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <FaSave size={16} /> Save Settings
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AppSettings;