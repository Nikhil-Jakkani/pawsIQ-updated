import React from 'react';
import { FaUserMd, FaUserTie, FaCut, FaHome } from 'react-icons/fa';

/**
 * Reusable Profile Card Component for Provider Dashboards
 * @param {string} providerType - Type of provider (vet, trainer, groomer, petsitter)
 * @param {Object} profile - Provider profile data
 * @param {string} userName - User name from auth context
 * @param {Object} kpis - Key performance indicators
 * @param {function} inr - Currency formatter function
 */
const DashboardProfileCard = ({ 
  providerType = 'vet', 
  profile, 
  userName, 
  kpis = {}, 
  inr 
}) => {
  // Icon mapping for different provider types
  const iconMap = {
    vet: FaUserMd,
    trainer: FaUserTie,
    groomer: FaCut,
    petsitter: FaHome
  };

  const IconComponent = iconMap[providerType] || FaUserMd;

  // Provider type display names
  const providerTypeNames = {
    vet: 'Veterinarian',
    trainer: 'Trainer',
    groomer: 'Groomer',
    petsitter: 'Pet Sitter'
  };

  const displayName = providerTypeNames[providerType] || 'Provider';

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <IconComponent />
          </div>
          <div className="ml-4">
            <div className="text-sm text-gray-500">Welcome</div>
            <div className="text-lg font-semibold text-gray-900">
              {profile?.serv_provider_name || userName || displayName}
            </div>
            <div className="text-xs text-gray-500">
              {profile?.serv_provider_location || 'Location not set'}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-xs text-gray-500">Today's Revenue</div>
            <div className="text-lg font-bold text-emerald-600">
              {inr ? inr(kpis.todayRevenue || 0) : `₹${kpis.todayRevenue || 0}`}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Appointments</div>
            <div className="text-lg font-bold text-indigo-600">
              {kpis.totalAppointments || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardProfileCard;