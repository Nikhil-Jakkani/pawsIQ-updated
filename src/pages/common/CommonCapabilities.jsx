import React from 'react';
import { FaListAlt } from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { commonCapabilities } from '../../config/commonCapabilities.js';

const CommonCapabilities = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <FaListAlt className="text-indigo-600 text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Common Experience Capabilities</h1>
            <p className="text-gray-500">
              Overview of shared user-facing features spanning communication, support, and engagement.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-indigo-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feature
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commonCapabilities.map((item) => (
                  <tr key={`${item.category}-${item.feature}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.feature}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CommonCapabilities;
