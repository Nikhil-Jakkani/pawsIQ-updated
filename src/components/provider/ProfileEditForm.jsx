import React, { useState } from 'react';
import { FaSave, FaTimes, FaCamera, FaImage } from 'react-icons/fa';

export default function ProfileEditForm({ profile, onSave, onCancel, uploadPhoto, loading }) {
  const [formData, setFormData] = useState({
    serv_provider_name: profile?.serv_provider_name || '',
    serv_provider_contact_nbr: profile?.serv_provider_contact_nbr || '',
    serv_provider_desc: profile?.serv_provider_desc || '',
    serv_provider_exp_years: profile?.serv_provider_exp_years || '',
    serv_provider_location: profile?.serv_provider_location || '',
    serv_provider_certificates: profile?.serv_provider_certificates || '',
    specializations: profile?.specializations || '',
    languages_spoken: profile?.languages_spoken || '',
    clinic_name: profile?.clinic_name || '',
    clinic_phone: profile?.clinic_phone || '',
    clinic_website: profile?.clinic_website || '',
    clinic_address_line1: profile?.clinic_address_line1 || '',
    clinic_address_line2: profile?.clinic_address_line2 || '',
    clinic_city: profile?.clinic_city || '',
    clinic_state: profile?.clinic_state || '',
    clinic_postal_code: profile?.clinic_postal_code || '',
    clinic_country: profile?.clinic_country || 'India',
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoType, setPhotoType] = useState(null);
  const [photoPreview, setPhotoPreview] = useState({
    profile: profile?.profile_photo_url || null,
    cover: profile?.cover_photo_url || null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (e, variant) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      setPhotoType(variant);
      
      const result = await uploadPhoto(file, variant);
      
      // Update form data with storage path (for saving to DB)
      // Update preview with public URL (for immediate display)
      if (variant === 'profile') {
        setFormData(prev => ({ ...prev, profile_photo_url: result.path }));
        setPhotoPreview(prev => ({ ...prev, profile: result.publicUrl }));
      } else if (variant === 'cover') {
        setFormData(prev => ({ ...prev, cover_photo_url: result.path }));
        setPhotoPreview(prev => ({ ...prev, cover: result.publicUrl }));
      }
    } catch (error) {
      alert('Failed to upload photo: ' + error.message);
    } finally {
      setUploadingPhoto(false);
      setPhotoType(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {photoPreview.profile ? (
                  <img 
                    src={photoPreview.profile} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaCamera className="text-gray-400 text-2xl" />
                )}
              </div>
              <label className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <FaCamera />
                {uploadingPhoto && photoType === 'profile' ? 'Uploading...' : 'Change Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'profile')}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
          </div>

          {/* Cover Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Photo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                {photoPreview.cover ? (
                  <img 
                    src={photoPreview.cover} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaImage className="text-gray-400 text-2xl" />
                )}
              </div>
              <label className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <FaImage />
                {uploadingPhoto && photoType === 'cover' ? 'Uploading...' : 'Change Cover'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'cover')}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="serv_provider_name"
              value={formData.serv_provider_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number *
            </label>
            <input
              type="tel"
              name="serv_provider_contact_nbr"
              value={formData.serv_provider_contact_nbr}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experience (years)
            </label>
            <input
              type="number"
              name="serv_provider_exp_years"
              value={formData.serv_provider_exp_years}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="serv_provider_location"
              value={formData.serv_provider_location}
              onChange={handleChange}
              placeholder="City, State"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="serv_provider_desc"
              value={formData.serv_provider_desc}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Tell clients about yourself..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specializations
            </label>
            <input
              type="text"
              name="specializations"
              value={formData.specializations}
              onChange={handleChange}
              placeholder="Comma separated (e.g., Surgery, Dental)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Languages Spoken
            </label>
            <input
              type="text"
              name="languages_spoken"
              value={formData.languages_spoken}
              onChange={handleChange}
              placeholder="Comma separated (e.g., English, Hindi)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Clinic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clinic Name
            </label>
            <input
              type="text"
              name="clinic_name"
              value={formData.clinic_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clinic Phone
            </label>
            <input
              type="tel"
              name="clinic_phone"
              value={formData.clinic_phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clinic Website
            </label>
            <input
              type="url"
              name="clinic_website"
              value={formData.clinic_website}
              onChange={handleChange}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 1
            </label>
            <input
              type="text"
              name="clinic_address_line1"
              value={formData.clinic_address_line1}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              name="clinic_address_line2"
              value={formData.clinic_address_line2}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              name="clinic_city"
              value={formData.clinic_city}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              name="clinic_state"
              value={formData.clinic_state}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code
            </label>
            <input
              type="text"
              name="clinic_postal_code"
              value={formData.clinic_postal_code}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              name="clinic_country"
              value={formData.clinic_country}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Certificates */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
        <textarea
          name="serv_provider_certificates"
          value={formData.serv_provider_certificates}
          onChange={handleChange}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="List your certifications, licenses, and qualifications..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading || uploadingPhoto}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <FaTimes />
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploadingPhoto}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <FaSave />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
