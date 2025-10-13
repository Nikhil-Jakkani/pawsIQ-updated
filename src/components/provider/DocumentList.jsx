import React from 'react';
import { FaFileAlt, FaFilePdf, FaFileImage, FaFileWord, FaTrash, FaEye, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';

const DocumentList = ({ documents, onDelete, loading }) => {
  const getFileIcon = (documentType, fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FaFilePdf className="text-red-500" />;
    if (['jpg', 'jpeg', 'png'].includes(ext)) return <FaFileImage className="text-blue-500" />;
    if (['doc', 'docx'].includes(ext)) return <FaFileWord className="text-blue-600" />;
    return <FaFileAlt className="text-gray-500" />;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: FaClock, text: 'Pending Review', className: 'bg-yellow-100 text-yellow-800' },
      approved: { icon: FaCheckCircle, text: 'Approved', className: 'bg-green-100 text-green-800' },
      rejected: { icon: FaTimesCircle, text: 'Rejected', className: 'bg-red-100 text-red-800' },
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        <Icon className="text-xs" />
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleView = (doc) => {
    if (doc.signedUrl) {
      window.open(doc.signedUrl, '_blank');
    }
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <FaFileAlt className="mx-auto text-4xl text-gray-300 mb-3" />
        <p className="text-gray-600">No documents uploaded yet</p>
        <p className="text-sm text-gray-500 mt-1">Upload your professional documents to get verified</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
      {documents.map((doc) => (
        <div key={doc.document_id} className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-start gap-3">
            {/* File Icon */}
            <div className="text-2xl mt-1">
              {getFileIcon(doc.document_type, doc.document_url)}
            </div>

            {/* Document Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 capitalize">
                    {doc.document_type?.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploaded {formatDate(doc.uploaded_at)}
                  </p>
                  {doc.remarks && (
                    <p className="text-xs text-gray-600 mt-1 italic">
                      Note: {doc.remarks}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(doc.status)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {doc.signedUrl && (
                <button
                  onClick={() => handleView(doc)}
                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  title="View Document"
                >
                  <FaEye />
                </button>
              )}
              <button
                onClick={() => onDelete(doc.document_id)}
                disabled={loading}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                title="Delete Document"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentList;
