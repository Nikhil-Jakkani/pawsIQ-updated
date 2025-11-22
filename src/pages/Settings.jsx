import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { FaCog, FaToggleOn, FaFileAlt, FaArrowRight } from 'react-icons/fa';

const Settings = () => {
  const settingsOptions = [
    {
      icon: FaCog,
      title: 'App Settings',
      description: 'Configure general application settings',
      path: '/settings/app',
      color: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      icon: FaToggleOn,
      title: 'Feature Controls',
      description: 'Enable or disable platform features',
      path: '/settings/features',
      color: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      icon: FaFileAlt,
      title: 'Legal Documents',
      description: 'Manage terms, policies, and agreements',
      path: '/settings/legal',
      color: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <FaCog className="text-indigo-600 text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            <p className="text-gray-500">Configure platform settings and preferences</p>
          </div>
        </div>

        {/* Settings Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {settingsOptions.map((option, index) => {
            const IconComponent = option.icon;
            return (
              <Link
                key={index}
                to={option.path}
                className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100 hover:shadow-md transition-all duration-200 group"
              >
                <div className={`${option.color} p-3 rounded-lg w-fit mb-4`}>
                  <IconComponent className={`${option.iconColor} text-2xl`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">
                  {option.title}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {option.description}
                </p>
                <div className="flex items-center text-indigo-600 group-hover:text-indigo-700 transition-colors">
                  <span className="text-sm font-medium">Go to Settings</span>
                  <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={12} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;