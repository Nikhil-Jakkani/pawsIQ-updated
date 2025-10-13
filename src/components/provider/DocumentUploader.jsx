import React, { useState, useRef } from 'react';
import { FaUpload, FaSpinner, FaFileAlt, FaTimes } from 'react-icons/fa';

const DocumentUploader = ({ onUpload, loading }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const fileInputRef = useRef(null);

  const documentTypes = [
    { value: 'license', label: 'Professional License' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'identification', label: 'ID Proof' },
    { value: 'other', label: 'Other' },
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (documents only)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid document (PDF, JPG, PNG, DOC, DOCX)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Document must be less than 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      alert('Please select a document and type');
      return;
    }

    try {
      await onUpload(selectedFile, documentType);
      setSelectedFile(null);
      setDocumentType('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      // Error handled by parent component
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setDocumentType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Document</h3>
      
      <div className="space-y-4">
        {/* Document Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">Select type...</option>
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* File Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose File
          </label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={loading}
            >
              <FaFileAlt />
              Choose File
            </button>
            {selectedFile && (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-gray-600 truncate">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-red-600 hover:text-red-700"
                  disabled={loading}
                >
                  <FaTimes />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
          </p>
        </div>

        {/* Upload Button */}
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || !documentType || loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <FaUpload />
              Upload Document
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DocumentUploader;
