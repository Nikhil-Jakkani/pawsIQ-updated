import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaDownload, FaTrash, FaPlusCircle, FaEye, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const PrescriptionSection = ({ petId, petName, records = [], onAddPrescription, onDeletePrescription }) => {
  const { authFetch } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (records && Array.isArray(records)) {
      const prescriptionRecords = records.filter(r => 
        (r.record_type ?? r.recordType ?? '').toLowerCase() === 'prescription'
      );
      setPrescriptions(prescriptionRecords);
    }
  }, [records]);

  const handleDownload = async (record) => {
    try {
      if (!record.file_path) {
        alert('No file attached to this prescription');
        return;
      }

      const qs = new URLSearchParams({
        path: record.file_path,
        bucket: 'health-records',
      });

      const response = await authFetch(`${API_URL}/media/signed-url?${qs}`);
      
      if (!response.ok) {
        throw new Error('Failed to get file URL');
      }

      const { url } = await response.json();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const parsePrescriptionDetails = (description) => {
    if (!description) return { text: '', prescriptionDetails: {} };
    
    try {
      const parsed = JSON.parse(description);
      if (parsed.prescriptionDetails) {
        return parsed;
      }
    } catch (e) {
      // Not JSON, treat as plain text
    }
    
    return { text: description, prescriptionDetails: {} };
  };

  if (prescriptions.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FaFileAlt className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Medical Prescriptions</h3>
              <p className="text-sm text-gray-600">No prescriptions uploaded yet</p>
            </div>
          </div>
          <button
            onClick={onAddPrescription}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <FaPlusCircle /> Add Prescription
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <FaFileAlt className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Medical Prescriptions</h3>
            <p className="text-sm text-gray-600">{prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={onAddPrescription}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <FaPlusCircle /> Add Prescription
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {prescriptions.map((prescription) => (
          <div key={prescription.health_record_id ?? prescription.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <FaFileAlt className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {prescription.title || 'Prescription'}
                  </h4>
                  {prescription.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {parsePrescriptionDetails(prescription.description).text}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Record Date:</span>
                <span className="font-medium text-gray-900">
                  {prescription.record_date || prescription.recordDate ? 
                    new Date(prescription.record_date ?? prescription.recordDate).toLocaleDateString() : 
                    '-'
                  }
                </span>
              </div>
              {(() => {
                const { prescriptionDetails } = parsePrescriptionDetails(prescription.description);
                const details = prescriptionDetails || {};
                return (
                  <>
                    {details.medicationName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Medication:</span>
                        <span className="font-medium text-gray-900">{details.medicationName}</span>
                      </div>
                    )}
                    {details.dosage && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dosage:</span>
                        <span className="font-medium text-gray-900">{details.dosage}</span>
                      </div>
                    )}
                    {details.frequency && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frequency:</span>
                        <span className="font-medium text-gray-900">{details.frequency}</span>
                      </div>
                    )}
                    {details.prescribedBy && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prescribed By:</span>
                        <span className="font-medium text-gray-900">{details.prescribedBy}</span>
                      </div>
                    )}
                  </>
                );
              })()}
              {prescription.file_name && (
                <div className="flex justify-between">
                  <span className="text-gray-600">File:</span>
                  <span className="font-medium text-gray-900 truncate">
                    {prescription.file_name}
                  </span>
                </div>
              )}
              {prescription.file_size && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium text-gray-900">
                    {formatFileSize(prescription.file_size)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelectedPrescription(prescription);
                  setShowModal(true);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm"
              >
                <FaEye /> View
              </button>
              {prescription.file_path && (
                <button
                  onClick={() => handleDownload(prescription)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium text-sm"
                >
                  <FaDownload /> Download
                </button>
              )}
              <button
                onClick={() => onDeletePrescription(prescription.health_record_id ?? prescription.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
              >
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Prescription Details</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedPrescription(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Title</p>
                <p className="text-lg font-semibold text-gray-900">{selectedPrescription.title || 'Prescription'}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Record Date</p>
                <p className="text-gray-900 font-medium">
                  {selectedPrescription.record_date || selectedPrescription.recordDate ? 
                    new Date(selectedPrescription.record_date ?? selectedPrescription.recordDate).toLocaleDateString() : 
                    '-'
                  }
                </p>
              </div>

              {selectedPrescription.next_due_date && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Next Due Date</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(selectedPrescription.next_due_date).toLocaleDateString()}
                  </p>
                </div>
              )}

              {(() => {
                const { prescriptionDetails, text } = parsePrescriptionDetails(selectedPrescription.description);
                const details = prescriptionDetails || {};
                return (
                  <>
                    {(details.medicationName || details.dosage || details.frequency || details.prescribedBy) && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Medicine Information</p>
                        <div className="bg-blue-50 rounded-lg p-4 space-y-3 border border-blue-100">
                          {details.medicationName && (
                            <div>
                              <p className="text-xs text-blue-600 uppercase tracking-wider font-bold">Medicine Name</p>
                              <p className="text-lg font-bold text-gray-900 mt-1">{details.medicationName}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            {details.dosage && (
                              <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wider font-medium">Dosage</p>
                                <p className="text-sm font-semibold text-gray-800 mt-1">{details.dosage}</p>
                              </div>
                            )}
                            {details.frequency && (
                              <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wider font-medium">Frequency</p>
                                <p className="text-sm font-semibold text-gray-800 mt-1">{details.frequency}</p>
                              </div>
                            )}
                          </div>
                          {details.prescribedBy && (
                            <div className="border-t border-blue-200 pt-3">
                              <p className="text-xs text-gray-600 uppercase tracking-wider font-medium">Prescribed By</p>
                              <p className="text-sm font-semibold text-gray-800 mt-1">{details.prescribedBy}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {text && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Additional Notes</p>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{text}</p>
                      </div>
                    )}
                  </>
                );
              })()}

              {selectedPrescription.file_name && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">File Information</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700"><span className="font-medium">Name:</span> {selectedPrescription.file_name}</p>
                    {selectedPrescription.file_type && (
                      <p className="text-gray-700"><span className="font-medium">Type:</span> {selectedPrescription.file_type}</p>
                    )}
                    {selectedPrescription.file_size && (
                      <p className="text-gray-700"><span className="font-medium">Size:</span> {formatFileSize(selectedPrescription.file_size)}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-2 border-t border-gray-100">
                {selectedPrescription.file_path && (
                  <button
                    onClick={() => {
                      handleDownload(selectedPrescription);
                      setShowModal(false);
                      setSelectedPrescription(null);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    <FaDownload /> Download
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedPrescription(null);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionSection;
