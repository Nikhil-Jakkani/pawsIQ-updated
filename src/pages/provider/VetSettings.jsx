import React, { useState, useEffect } from 'react';
import { FaSave, FaUser, FaLock, FaMoneyBillWave, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import VetLayout from './VetLayout';
import ImageUploader from '../../components/provider/ImageUploader';
import { useAuth } from '../../context/AuthContext';
import { useProviderSettings } from '../../hooks/useProviderSettings';

export default function VetSettings() {
  const { currentUser } = useAuth();
  const { loading, error, uploadPhoto, updateProfile, updatePassword } = useProviderSettings();
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState(null);
  const [profileData, setProfileData] = useState({
    serv_provider_name: '',
    serv_provider_contact_nbr: '',
    serv_provider_desc: '',
    serv_provider_exp_years: '',
    serv_provider_location: '',
    clinic_name: '',
    clinic_phone: '',
    clinic_website: '',
    specializations: '',
    languages_spoken: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [billingData, setBillingData] = useState({
    payout_method: '',
    account_holder_name: '',
    account_number: '',
    bank_name: '',
    ifsc_code: '',
    upi_id: '',
    pan_number: '',
    gst_number: '',
  });

  // Initialize form data from currentUser
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        serv_provider_name: currentUser.serv_provider_name || '',
        serv_provider_contact_nbr: currentUser.serv_provider_contact_nbr || '',
        serv_provider_desc: currentUser.serv_provider_desc || '',
        serv_provider_exp_years: currentUser.serv_provider_exp_years || '',
        serv_provider_location: currentUser.serv_provider_location || '',
        clinic_name: currentUser.clinic_name || '',
        clinic_phone: currentUser.clinic_phone || '',
        clinic_website: currentUser.clinic_website || '',
        specializations: currentUser.specializations || '',
        languages_spoken: currentUser.languages_spoken || '',
      });

      // Initialize billing data if exists
      if (currentUser.PIQ_Provider_Billing) {
        const billing = currentUser.PIQ_Provider_Billing;
        setBillingData({
          payout_method: billing.payout_method || '',
          account_holder_name: billing.account_holder_name || '',
          account_number: billing.account_number || '',
          bank_name: billing.bank_name || '',
          ifsc_code: billing.ifsc_code || '',
          upi_id: billing.upi_id || '',
          pan_number: billing.pan_number || '',
          gst_number: billing.gst_number || '',
        });
      }
    }
  }, [currentUser]);

  const handlePhotoUpload = async (file, variant) => {
    try {
      const result = await uploadPhoto(file, variant);
      const fieldName = variant === 'profile' ? 'profile_photo_url' : 'cover_photo_url';
      await updateProfile({ [fieldName]: result.path });
      setMessage({ type: 'success', text: 'Photo updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    try {
      await updatePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleBillingSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ billing: billingData });
      setMessage({ type: 'success', text: 'Billing information updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile & Clinic', icon: FaUser },
    { id: 'password', label: 'Password', icon: FaLock },
    { id: 'billing', label: 'Billing & Payouts', icon: FaMoneyBillWave },
  ];

  return (
    <VetLayout title="Settings">
      <div className="bg-white rounded-lg shadow">
        {/* Message Banner */}
        {message && (
          <div className={`p-4 border-b flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tabs */}
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
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Photos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                    <ImageUploader
                      currentUrl={currentUser?.profile_photo_url}
                      onUpload={handlePhotoUpload}
                      variant="profile"
                      label="Upload Profile"
                      aspectRatio="1/1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo</label>
                    <ImageUploader
                      currentUrl={currentUser?.cover_photo_url}
                      onUpload={handlePhotoUpload}
                      variant="cover"
                      label="Upload Cover"
                      aspectRatio="16/9"
                    />
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileData.serv_provider_name}
                      onChange={(e) => setProfileData({ ...profileData, serv_provider_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="tel"
                      value={profileData.serv_provider_contact_nbr}
                      onChange={(e) => setProfileData({ ...profileData, serv_provider_contact_nbr: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Description</label>
                    <textarea
                      value={profileData.serv_provider_desc}
                      onChange={(e) => setProfileData({ ...profileData, serv_provider_desc: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                    <input
                      type="number"
                      value={profileData.serv_provider_exp_years}
                      onChange={(e) => setProfileData({ ...profileData, serv_provider_exp_years: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={profileData.serv_provider_location}
                      onChange={(e) => setProfileData({ ...profileData, serv_provider_location: e.target.value })}
                      placeholder="City, State"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Clinic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                    <input
                      type="text"
                      value={profileData.clinic_name}
                      onChange={(e) => setProfileData({ ...profileData, clinic_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Phone</label>
                    <input
                      type="tel"
                      value={profileData.clinic_phone}
                      onChange={(e) => setProfileData({ ...profileData, clinic_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={profileData.clinic_website}
                      onChange={(e) => setProfileData({ ...profileData, clinic_website: e.target.value })}
                      placeholder="https://"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specializations</label>
                    <input
                      type="text"
                      value={profileData.specializations}
                      onChange={(e) => setProfileData({ ...profileData, specializations: e.target.value })}
                      placeholder="Surgery, Dental, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Languages Spoken</label>
                    <input
                      type="text"
                      value={profileData.languages_spoken}
                      onChange={(e) => setProfileData({ ...profileData, languages_spoken: e.target.value })}
                      placeholder="English, Hindi, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSave />
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSave />
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <form onSubmit={handleBillingSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payout Method</label>
                    <select
                      value={billingData.payout_method}
                      onChange={(e) => setBillingData({ ...billingData, payout_method: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select method</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={billingData.account_holder_name}
                      onChange={(e) => setBillingData({ ...billingData, account_holder_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {billingData.payout_method === 'bank_transfer' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={billingData.bank_name}
                        onChange={(e) => setBillingData({ ...billingData, bank_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={billingData.account_number}
                        onChange={(e) => setBillingData({ ...billingData, account_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={billingData.ifsc_code}
                        onChange={(e) => setBillingData({ ...billingData, ifsc_code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {billingData.payout_method === 'upi' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">UPI Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                    <input
                      type="text"
                      value={billingData.upi_id}
                      onChange={(e) => setBillingData({ ...billingData, upi_id: e.target.value })}
                      placeholder="yourname@upi"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                    <input
                      type="text"
                      value={billingData.pan_number}
                      onChange={(e) => setBillingData({ ...billingData, pan_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                    <input
                      type="text"
                      value={billingData.gst_number}
                      onChange={(e) => setBillingData({ ...billingData, gst_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSave />
                  {loading ? 'Saving...' : 'Save Billing Info'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </VetLayout>
  );
}