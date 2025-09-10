import React, { useState, useEffect } from 'react';
import { FaFilePdf, FaFileImage, FaFileWord, FaFileAlt, FaDownload, FaTrash } from 'react-icons/fa';
import { healthRecordService } from '../../services/healthRecordService';
import { useAuth } from '../../context/AuthContext';

const MedicalRecordsList = ({ petId }) => {
  const { currentUser, tokens } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const accessToken = tokens?.access?.token;
      if (!accessToken) throw new Error('Not authenticated');
      
      const recordsData = await healthRecordService.getPetHealthRecords(petId, accessToken);
      setRecords(recordsData);
    } catch (err) {
      console.error('Error fetching records:', err);
      setError('Failed to load medical records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (petId) {
      fetchRecords();
    }
  }, [petId]);

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FaFilePdf className="text-red-500 text-xl" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FaFileImage className="text-green-500 text-xl" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-500 text-xl" />;
      default:
        return <FaFileAlt className="text-gray-500 text-xl" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleDownload = async (record) => {
    try {
      // If we have a direct URL, use that
      if (record.fileUrl) {
        window.open(record.fileUrl, '_blank');
        return;
      }
      
      // Otherwise, try to get a signed URL
      const accessToken = tokens?.access?.token;
      if (!accessToken) throw new Error('Not authenticated');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api/v1'}/media/signed-url?bucket=health-records&path=${encodeURIComponent(record.filePath)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }
      
      const { url } = await response.json();
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file. Please try again.');
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }
    
    try {
      const accessToken = tokens?.access?.token;
      if (!accessToken) throw new Error('Not authenticated');
      
      await healthRecordService.deleteHealthRecord(recordId, accessToken);
      // Refresh the list
      fetchRecords();
    } catch (err) {
      console.error('Error deleting record:', err);
      setError('Failed to delete record. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No medical records</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding a new medical record.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {records.map((record) => (
          <li key={record.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getFileIcon(record.fileName)}
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-blue-600 truncate">
                    {record.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {record.recordType} • {formatDate(record.recordDate)}
                  </div>
                  {record.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {record.description}
                    </p>
                  )}
                  {record.conditions && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {record.conditions.split(',').map((condition, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {condition.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex space-x-2">
                <button
                  onClick={() => handleDownload(record)}
                  className="p-2 rounded-full text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="Download"
                >
                  <FaDownload className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteRecord(record.id)}
                  className="p-2 rounded-full text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  title="Delete"
                >
                  <FaTrash className="h-5 w-5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MedicalRecordsList;
