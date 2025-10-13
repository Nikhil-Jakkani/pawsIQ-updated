import React from 'react';

/**
 * Reusable KPI Card Component for Provider Dashboards
 * @param {React.ReactNode} icon - Icon component
 * @param {string} label - KPI label
 * @param {string|number} value - KPI value
 * @param {string} bgColor - Background color class (e.g., 'bg-indigo-100')
 * @param {string} textColor - Text color class (e.g., 'text-indigo-600')
 */
const DashboardKPICard = ({ icon, label, value, bgColor = 'bg-indigo-100', textColor = 'text-indigo-600' }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center">
      <div className={`p-3 rounded-md ${bgColor} ${textColor}`}>
        {icon}
      </div>
      <div className="ml-4">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
  );
};

export default DashboardKPICard;