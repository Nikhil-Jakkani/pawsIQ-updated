import React, { useState } from 'react';
import ProviderDashboardLayout from './ProviderDashboardLayout';
import {
  FaFileAlt,
  FaUpload,
  FaSearch,
  FaDownload,
  FaEye,
  FaTrash,
} from 'react-icons/fa';

const LabReportCard = ({ report, onView, onDownload, onDelete }) => (
  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{report.testName}</h3>
        <p className="text-sm text-gray-600">{report.clientName} - {report.petName}</p>
        <p className="text-xs text-gray-500 mt-2">Issued: {report.date}</p>
      </div>
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          report.status === 'completed'
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}
      >
        {report.status}
      </span>
    </div>

    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-700">
        <strong>Lab:</strong> {report.laboratory}
      </p>
      <p className="text-sm text-gray-700 mt-1">
        <strong>Result:</strong> {report.result}
      </p>
    </div>

    <div className="flex space-x-3">
      <button
        onClick={() => onView(report.id)}
        className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
      >
        <FaEye className="mr-2" />
        View
      </button>
      <button
        onClick={() => onDownload(report.id)}
        className="flex-1 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
      >
        <FaDownload className="mr-2" />
        Download
      </button>
      <button
        onClick={() => onDelete(report.id)}
        className="flex-1 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
      >
        <FaTrash className="mr-2" />
        Delete
      </button>
    </div>
  </div>
);

const ProviderLabReports = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const reports = [
    {
      id: 1,
      testName: 'Blood Test',
      clientName: 'John Doe',
      petName: 'Max',
      date: '2024-12-15',
      status: 'completed',
      laboratory: 'Lab A',
      result: 'Normal',
    },
    {
      id: 2,
      testName: 'Urinalysis',
      clientName: 'Jane Smith',
      petName: 'Bella',
      date: '2024-12-14',
      status: 'pending',
      laboratory: 'Lab B',
      result: 'Pending',
    },
    {
      id: 3,
      testName: 'X-Ray',
      clientName: 'Bob Wilson',
      petName: 'Charlie',
      date: '2024-12-13',
      status: 'completed',
      laboratory: 'Lab A',
      result: 'No abnormalities',
    },
  ];

  const handleView = (id) => console.log('View report:', id);
  const handleDownload = (id) => console.log('Download report:', id);
  const handleDelete = (id) => console.log('Delete report:', id);

  const filteredReports = reports.filter((r) =>
    r.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.petName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProviderDashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lab Reports</h1>
            <p className="text-gray-600 mt-2">Manage laboratory test reports for your patients.</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center">
            <FaUpload className="mr-2" />
            Upload Report
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Reports Grid */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaFileAlt className="mx-auto text-5xl text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">No lab reports found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <LabReportCard
                key={report.id}
                report={report}
                onView={handleView}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </ProviderDashboardLayout>
  );
};

export default ProviderLabReports;