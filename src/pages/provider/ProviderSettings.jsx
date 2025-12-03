import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProviderDashboardLayout from './ProviderDashboardLayout';
import { FaCog, FaSave, FaKey, FaBell, FaLock, FaClipboardList, FaCamera, FaCheckCircle } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import { getOnboardingPath } from '../../utils/providerOnboardingUtils';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const SettingSection = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-lg shadow p-6 mb-6">
    <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-6">
      <Icon className="mr-3 text-blue-600" />
      {title}
    </h2>
    {children}
  </div>
);

const ProviderSettings = () => {
  const navigate = useNavigate();
  const { currentUser, authFetch, setCurrentUserData } = useAuth();
  const [settings, setSettings] = useState({
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    businessName: currentUser?.businessName || '',
    availabilityStatus: 'available',
    enableNotifications: true,
    enableEmailAlerts: true,
    enableSMSAlerts: false,
    autoAcceptAppointments: false,
    cancellationPolicy: 'flexible',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saved, setSaved] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileError, setProfileError] = useState('');

  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file || !currentUser) return;

    setProfileError('');

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      setProfileError('Please upload a JPG, PNG, or WEBP image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('File size must be less than 5MB');
      return;
    }

    try {
      setProfileUploading(true);

      const uploadMetaRes = await authFetch(`${API_URL}/provider/settings/photos/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name || `profile.${ext}`,
          variant: 'profile',
        }),
      });

      const uploadMeta = await uploadMetaRes.json().catch(() => ({}));
      if (!uploadMetaRes.ok || !uploadMeta?.path || !uploadMeta?.token) {
        throw new Error(uploadMeta?.message || 'Failed to prepare upload');
      }

      const { path, token } = uploadMeta;
      const { error: upErr } = await supabase.storage
        .from('provider-photos')
        .uploadToSignedUrl(path, token, file);
      if (upErr) {
        throw upErr;
      }

      const profileRes = await authFetch(`${API_URL}/provider/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePhotoUrl: path }),
      });
      const profileJson = await profileRes.json().catch(() => ({}));
      if (!profileRes.ok) {
        throw new Error(profileJson?.message || 'Failed to update profile photo');
      }

      const newPhotoUrl = profileJson?.profile_photo_url || profileJson?.profilePhotoUrl || currentUser.profilePhoto;
      setCurrentUserData({
        ...currentUser,
        profilePhoto: newPhotoUrl,
      });
    } catch (err) {
      console.error('Provider profile photo update failed:', err);
      setProfileError(err?.message || 'Failed to update profile photo');
    } finally {
      setProfileUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaved(false);
  };

  const handlePasswordChange = (key, value) => {
    setPasswords((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      // Auto-save to backend if needed
      const res = await authFetch(`${API_URL}/provider/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (!res.ok) {
        throw new Error('Failed to save settings');
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  // Auto-save settings when they change
  React.useEffect(() => {
    const timeout = setTimeout(handleSaveSettings, 2000);
    return () => clearTimeout(timeout);
  }, [settings]);

  const handleChangePassword = () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Changing password');
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleContinueOnboarding = () => {
    // Get provider type from current user or localStorage
    const registrationData = localStorage.getItem('provider_registration');
    let providerType = null;

    if (registrationData) {
      try {
        const data = JSON.parse(registrationData);
        providerType = data.providerType || data.serv_provider_type;
      } catch (err) {
        console.error('Error parsing registration data:', err);
      }
    }

    // Fallback to currentUser if available
    if (!providerType) {
      providerType = currentUser?.providerType || currentUser?.serv_provider_type;
    }

    if (providerType) {
      const onboardingPath = getOnboardingPath(providerType);
      console.log('Navigating to onboarding path:', onboardingPath);
      navigate(onboardingPath);
    } else {
      console.error('Provider type not found. CurrentUser:', currentUser);
      alert('Could not determine your provider type. Please contact support.');
    }
  };

  return (
    <ProviderDashboardLayout>
      <div className="min-h-full p-4 sm:p-6 lg:p-8 bg-gray-50">
        <div className="max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account settings and preferences.</p>
          </div>

          {/* Auto-save Success Message */}
          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 sticky top-0 z-10 flex items-center gap-2">
              <FaCheckCircle className="text-green-600" />
              <p className="text-green-800 font-medium">Settings saved automatically</p>
            </div>
          )}

          {/* Profile Settings */}
          <SettingSection title="Profile Information" icon={FaCog}>
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="relative">
                  <img
                    src={currentUser?.profilePhoto || '/7.png'}
                    alt={currentUser?.firstName || 'Provider'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 bg-gray-100"
                  />
                  {profileUploading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-full text-xs text-blue-700">
                      Uploading...
                    </div>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="provider-profile-upload"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-lg shadow-sm bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <FaCamera className="mr-2 text-blue-600" />
                    Change Photo
                  </label>
                  <input
                    id="provider-profile-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePhotoChange}
                    disabled={profileUploading}
                  />
                  {profileError && (
                    <p className="mt-1 text-xs text-red-600">{profileError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">JPG, PNG, or WEBP up to 5MB.</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleSettingChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => handleSettingChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => handleSettingChange('businessName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability Status</label>
                <select
                  value={settings.availabilityStatus}
                  onChange={(e) => handleSettingChange('availabilityStatus', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
          </SettingSection>

          {/* Notification Settings */}
          <SettingSection title="Notifications" icon={FaBell}>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                  className="rounded"
                />
                <span className="ml-3 text-gray-700">Enable all notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableEmailAlerts}
                  onChange={(e) => handleSettingChange('enableEmailAlerts', e.target.checked)}
                  className="rounded"
                />
                <span className="ml-3 text-gray-700">Email alerts</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableSMSAlerts}
                  onChange={(e) => handleSettingChange('enableSMSAlerts', e.target.checked)}
                  className="rounded"
                />
                <span className="ml-3 text-gray-700">SMS alerts</span>
              </label>
            </div>
          </SettingSection>

          {/* Business Settings */}
          <SettingSection title="Business Settings" icon={FaCog}>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoAcceptAppointments}
                  onChange={(e) => handleSettingChange('autoAcceptAppointments', e.target.checked)}
                  className="rounded"
                />
                <span className="ml-3 text-gray-700">Auto-accept appointments</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cancellation Policy
                </label>
                <select
                  value={settings.cancellationPolicy}
                  onChange={(e) => handleSettingChange('cancellationPolicy', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="flexible">Flexible</option>
                  <option value="moderate">Moderate</option>
                  <option value="strict">Strict</option>
                </select>
              </div>
            </div>
          </SettingSection>



          {/* Onboarding Section */}
          <SettingSection title="Complete Your Onboarding" icon={FaClipboardList}>
            <div className="space-y-4">
              <p className="text-gray-700 mb-4">
                Complete your provider profile to start accepting appointments and serving customers.
              </p>
              <button
                onClick={handleContinueOnboarding}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg transition-all flex items-center font-medium shadow-md hover:shadow-lg"
              >
                <FaClipboardList className="mr-2" />
                Continue Onboarding
              </button>
              <p className="text-sm text-gray-500 mt-3">
                You can complete this at any time. Your progress will be saved automatically.
              </p>
            </div>
          </SettingSection>

          {/* Security Settings */}
          <SettingSection title="Change Password" icon={FaLock}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <button
                onClick={handleChangePassword}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
              >
                <FaKey className="mr-2" />
                Change Password
              </button>
            </div>
          </SettingSection>
        </div>
      </div>
    </ProviderDashboardLayout>
  );
};

export default ProviderSettings;