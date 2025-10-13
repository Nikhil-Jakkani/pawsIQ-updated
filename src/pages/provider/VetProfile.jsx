import React, { useState } from 'react';
import { FaFileAlt, FaCertificate, FaAward, FaBriefcase, FaCheckCircle, FaExclamationCircle, FaEdit } from 'react-icons/fa';
import VetLayout from './VetLayout';
import DocumentUploader from '../../components/provider/DocumentUploader';
import DocumentList from '../../components/provider/DocumentList';
import ProfileEditForm from '../../components/provider/ProfileEditForm';
import { useAuth } from '../../context/AuthContext';
import { useProviderDocuments } from '../../hooks/useProviderDocuments';
import { useProviderProfile } from '../../hooks/useProviderProfile';

export default function VetProfile() {
  const { currentUser } = useAuth();
  const { documents, loading, uploadDocument, deleteDocument } = useProviderDocuments();
  const { updateProfile, uploadPhoto, loading: profileLoading } = useProviderProfile();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null);

  const handleDocumentUpload = async (file, documentType) => {
    try {
      await uploadDocument(file, documentType);
      setMessage({ type: 'success', text: 'Document uploaded successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDocumentDelete = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await deleteDocument(documentId);
      setMessage({ type: 'success', text: 'Document deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleProfileSave = async (profileData) => {
    try {
      await updateProfile(profileData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaBriefcase },
    { id: 'edit', label: 'Edit Profile', icon: FaEdit },
    { id: 'credentials', label: 'Credentials & Documents', icon: FaCertificate },
    { id: 'experience', label: 'Experience', icon: FaAward },
  ];

  return (
    <VetLayout title="Profile">
      <div className="space-y-6">
        {/* Message Banner */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600">
            {currentUser?.cover_photo_url && (
              <img 
                src={currentUser.cover_photo_url} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-12">
              {/* Profile Photo */}
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                {currentUser?.profile_photo_url ? (
                  <img 
                    src={currentUser.profile_photo_url} 
                    alt={currentUser?.serv_provider_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl text-gray-400">
                    {currentUser?.serv_provider_name?.charAt(0) || 'P'}
                  </div>
                )}
              </div>

              {/* Name and Details */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentUser?.serv_provider_name || 'Provider Name'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {currentUser?.serv_provider_type || 'Service Provider'}
                </p>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                  {currentUser?.serv_provider_location && (
                    <span>📍 {currentUser.serv_provider_location}</span>
                  )}
                  {currentUser?.serv_provider_exp_years && (
                    <span>💼 {currentUser.serv_provider_exp_years} years experience</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {currentUser?.serv_provider_desc && (
              <div className="mt-4 text-gray-700">
                <p>{currentUser.serv_provider_desc}</p>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {documents.filter(d => d.status === 'approved').length}
                </div>
                <div className="text-xs text-gray-600 mt-1">Verified Documents</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {currentUser?.serv_provider_exp_years || 0}+
                </div>
                <div className="text-xs text-gray-600 mt-1">Years Experience</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {currentUser?.specializations?.split(',').length || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">Specializations</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {currentUser?.languages_spoken?.split(',').length || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">Languages</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Profile Overview</h3>
                  <button
                    onClick={() => setActiveTab('edit')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <FaEdit />
                    Edit Profile
                  </button>
                </div>

                {/* Clinic Information */}
                {currentUser?.clinic_name && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Clinic Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div>
                        <span className="font-medium text-gray-700">Clinic Name: </span>
                        <span className="text-gray-600">{currentUser.clinic_name}</span>
                      </div>
                      {currentUser.clinic_phone && (
                        <div>
                          <span className="font-medium text-gray-700">Phone: </span>
                          <span className="text-gray-600">{currentUser.clinic_phone}</span>
                        </div>
                      )}
                      {currentUser.clinic_website && (
                        <div>
                          <span className="font-medium text-gray-700">Website: </span>
                          <a href={currentUser.clinic_website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                            {currentUser.clinic_website}
                          </a>
                        </div>
                      )}
                      {(currentUser.clinic_address_line1 || currentUser.clinic_city) && (
                        <div>
                          <span className="font-medium text-gray-700">Address: </span>
                          <span className="text-gray-600">
                            {[
                              currentUser.clinic_address_line1,
                              currentUser.clinic_address_line2,
                              currentUser.clinic_city,
                              currentUser.clinic_state,
                              currentUser.clinic_postal_code,
                              currentUser.clinic_country
                            ].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Specializations */}
                {currentUser?.specializations && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.specializations.split(',').map((spec, idx) => (
                        <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                          {spec.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {currentUser?.languages_spoken && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Languages Spoken</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.languages_spoken.split(',').map((lang, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {lang.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Edit Profile Tab */}
            {activeTab === 'edit' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit Profile</h3>
                <ProfileEditForm
                  profile={currentUser}
                  onSave={handleProfileSave}
                  onCancel={() => setActiveTab('overview')}
                  uploadPhoto={uploadPhoto}
                  loading={profileLoading}
                />
              </div>
            )}

            {/* Credentials Tab */}
            {activeTab === 'credentials' && (
              <div className="space-y-6">
                <DocumentUploader 
                  onUpload={handleDocumentUpload}
                  loading={loading}
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">My Documents</h3>
                  <DocumentList
                    documents={documents}
                    onDelete={handleDocumentDelete}
                    loading={loading}
                  />
                </div>
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                {currentUser?.serv_provider_certificates && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Certifications</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{currentUser.serv_provider_certificates}</p>
                    </div>
                  </div>
                )}

                {currentUser?.serv_provider_exp_years && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Experience</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">
                        <span className="font-semibold">{currentUser.serv_provider_exp_years} years</span> of professional experience in {currentUser.serv_provider_type || 'veterinary services'}
                      </p>
                    </div>
                  </div>
                )}

                {!currentUser?.serv_provider_certificates && !currentUser?.serv_provider_exp_years && (
                  <div className="text-center py-12">
                    <FaAward className="mx-auto text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-600">No experience information added yet</p>
                    <p className="text-sm text-gray-500 mt-1">Update your profile in Settings to add experience details</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </VetLayout>
  );
}
