import React, { useState } from 'react';
import ProviderDashboardLayout from './ProviderDashboardLayout';
import {
  FaFileAlt,
  FaPlus,
  FaSearch,
  FaDownload,
  FaEye,
  FaPrint,
} from 'react-icons/fa';

const PrescriptionCard = ({ prescription, onView, onDownload, onPrint }) => (
  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{prescription.clientName}</h3>
        <p className="text-sm text-gray-600">{prescription.petName}</p>
        <p className="text-xs text-gray-500 mt-2">{prescription.date}</p>
      </div>
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
        {prescription.status}
      </span>
    </div>

    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-700">
        <strong>Diagnosis:</strong> {prescription.diagnosis}
      </p>
    </div>

    <div className="flex space-x-3">
      <button
        onClick={() => onView(prescription.id)}
        className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
      >
        <FaEye className="mr-2" />
        View
      </button>
      <button
        onClick={() => onPrint(prescription.id)}
        className="flex-1 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
      >
        <FaPrint className="mr-2" />
        Print
      </button>
      <button
        onClick={() => onDownload(prescription.id)}
        className="flex-1 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
      >
        <FaDownload className="mr-2" />
        Download
      </button>
    </div>
  </div>
);

const ProviderPrescriptions = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const prescriptions = [
    {
      id: 1,
      clientName: 'John Doe',
      petName: 'Max',
      date: '2024-12-15',
      status: 'Active',
      diagnosis: 'Skin Infection',
    },
    {
      id: 2,
      clientName: 'Jane Smith',
      petName: 'Bella',
      date: '2024-12-14',
      status: 'Active',
      diagnosis: 'Ear Infection',
    },
    {
      id: 3,
      clientName: 'Bob Wilson',
      petName: 'Charlie',
      date: '2024-12-13',
      status: 'Completed',
      diagnosis: 'Arthritis',
    },
  ];

  const handleView = (id) => console.log('View prescription:', id);
  const handleDownload = (id) => console.log('Download prescription:', id);
  const handlePrint = (id) => console.log('Print prescription:', id);

  const filteredPrescriptions = prescriptions.filter((p) =>
    p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.petName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProviderDashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
            <p className="text-gray-600 mt-2">Manage and issue prescriptions to your clients.</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center">
            <FaPlus className="mr-2" />
            New Prescription
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client or pet name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Prescriptions Grid */}
        {filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaFileAlt className="mx-auto text-5xl text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">No prescriptions found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrescriptions.map((prescription) => (
              <PrescriptionCard
                key={prescription.id}
                prescription={prescription}
                onView={handleView}
                onDownload={handleDownload}
                onPrint={handlePrint}
              />
            ))}
          </div>
        )}
      </div>
    </ProviderDashboardLayout>
  );
};

export default ProviderPrescriptions;