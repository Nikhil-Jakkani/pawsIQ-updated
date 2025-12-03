import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaAddressCard,
  FaBell,
  FaCamera,
  FaCheck,
  FaCog,
  FaCreditCard,
  FaExclamationTriangle,
  FaLock,
  FaShieldAlt,
  FaSignOutAlt,
  FaSpinner,
  FaUser,
} from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';
import { uploadProfilePhoto } from '../../services/userPhotoService';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const DEFAULT_NOTIFICATION_PREFS = Object.freeze({
  email: {
    orderUpdates: true,
    promotions: false,
    petReminders: true,
    newsletter: false,
  },
  push: {
    orderUpdates: true,
    promotions: true,
    petReminders: true,
    newsletter: false,
  },
});

const DEFAULT_ADDRESS = Object.freeze({
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
});

const mergeNotificationPrefs = (incoming) => ({
  email: { ...DEFAULT_NOTIFICATION_PREFS.email, ...(incoming?.email || {}) },
  push: { ...DEFAULT_NOTIFICATION_PREFS.push, ...(incoming?.push || {}) },
});

const UserSettings = () => {
  const navigate = useNavigate();
  const { logout, authFetch, setCurrentUserData } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [notificationSubmitting, setNotificationSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    profileImage: null,
    address: { ...DEFAULT_ADDRESS },
  });
  const [notificationPrefs, setNotificationPrefs] = useState(DEFAULT_NOTIFICATION_PREFS);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef(null);

  const resetMessagesLater = () => {
    window.setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 3000);
  };

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await authFetch(`${API_URL}/user/profile`);
        const data = await res.json().catch(() => null);
        if (!isMounted) return;

        if (res.ok && data) {
          setUserData((prev) => ({
            ...prev,
            name: data.user_full_name || '',
            email: data.user_email_id || '',
            phone: data.user_phone_number || '',
            profileImage: data.profile_picture_url || null,
            address: {
              ...DEFAULT_ADDRESS,
              ...(data.user_address || {}),
            },
          }));
          setNotificationPrefs(mergeNotificationPrefs(data.notification_preferences));
          setOriginalEmail(String(data.user_email_id || ''));
        }
      } catch (error) {
        console.error('Failed to load user profile', error);
        setErrorMessage('Unable to load profile. Please try again.');
        resetMessagesLater();
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [authFetch]);

  const tabs = useMemo(
    () => [
      { id: 'profile', label: 'Profile', icon: <FaUser /> },
      { id: 'security', label: 'Security', icon: <FaLock /> },
      { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
      { id: 'payment', label: 'Payment Methods', icon: <FaCreditCard /> },
      { id: 'address', label: 'Addresses', icon: <FaAddressCard /> },
      { id: 'privacy', label: 'Privacy', icon: <FaShieldAlt /> },
    ],
    []
  );

  const handleProfileInputChange = (event) => {
    const { name, value } = event.target;
    if (name.startsWith('address.')) {
      const key = name.replace('address.', '');
      setUserData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [key]: value,
        },
      }));
      return;
    }

    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setProfileSubmitting(true);

    try {
      const payload = {};
      if (userData.name) payload.user_full_name = userData.name.trim();
      if (userData.phone) payload.user_phone_number = userData.phone.trim();
      if (userData.email && userData.email !== originalEmail) {
        payload.user_email_id = userData.email.trim();
      }
      if (userData.address) {
        payload.user_address = {
          ...DEFAULT_ADDRESS,
          ...Object.fromEntries(
            Object.entries(userData.address || {}).map(([key, value]) => [key, value?.trim?.() || value || ''])
          ),
        };
      }

      if (Object.keys(payload).length === 0) {
        setSuccessMessage('No profile changes to save.');
        resetMessagesLater();
        return;
      }

      const res = await authFetch(`${API_URL}/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || json?.error || 'Failed to update profile');
      }

      if (payload.user_email_id) setOriginalEmail(payload.user_email_id);
      if (payload.user_address) {
        setUserData((prev) => ({
          ...prev,
          address: {
            ...DEFAULT_ADDRESS,
            ...payload.user_address,
          },
        }));
        setSuccessMessage('Address saved successfully.');
      } else {
        setSuccessMessage('Profile updated successfully.');
      }
      resetMessagesLater();
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || 'Unable to update profile.');
      resetMessagesLater();
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      resetMessagesLater();
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      resetMessagesLater();
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await authFetch(`${API_URL}/user/profile/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || json?.error || 'Failed to change password');
      }

      setSuccessMessage('Password updated successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      resetMessagesLater();
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || 'Unable to change password.');
      resetMessagesLater();
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleNotificationToggle = (channel, key) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [key]: !prev[channel][key],
      },
    }));
  };

  const handleNotificationSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setNotificationSubmitting(true);

    try {
      // Placeholder until backend endpoint exists
      setSuccessMessage('Notification preferences saved locally.');
      resetMessagesLater();
    } catch (error) {
      console.error(error);
      setErrorMessage('Unable to save notification preferences.');
      resetMessagesLater();
    } finally {
      setNotificationSubmitting(false);
    }
  };

  const handleUploadChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSuccessMessage('');
    setErrorMessage('');
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');

    try {
      const result = await uploadProfilePhoto(file, authFetch, (progress, status) => {
        setUploadProgress(progress);
        setUploadStatus(status);
      });
      setUserData((prev) => ({ ...prev, profileImage: result.profilePhotoUrl || null }));
      if (result?.user) {
        setCurrentUserData(result.user);
      }
      setSuccessMessage('Profile photo updated successfully.');
      resetMessagesLater();
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || 'Unable to upload profile photo.');
      resetMessagesLater();
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/user/login');
  };

  const profileTab = (
    <form onSubmit={handleProfileSubmit} className="space-y-6">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100">
            {userData.profileImage ? (
              <img src={userData.profileImage} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-indigo-100">
                <FaUser className="text-3xl text-indigo-600" />
              </div>
            )}
          </div>
          <label
            htmlFor="profile-image"
            className={`absolute bottom-0 right-0 rounded-full p-2 text-white shadow transition-colors ${isUploading ? 'bg-indigo-300 opacity-80' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
          >
            {isUploading ? <FaSpinner className="animate-spin" size={14} /> : <FaCamera size={14} />}
            <input
              ref={fileInputRef}
              type="file"
              id="profile-image"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleUploadChange}
              disabled={isUploading}
            />
          </label>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {isUploading && uploadStatus
            ? `${uploadStatus}${uploadProgress ? ` (${uploadProgress}%)` : ''}`
            : 'Click the camera icon to change your profile picture'}
        </p>
        <p className="text-xs text-gray-400">Max size 5MB. Formats: JPG, PNG, WebP, GIF.</p>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Personal Information</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={userData.name}
              onChange={handleProfileInputChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={userData.email}
              onChange={handleProfileInputChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">Changing email requires verification if your account enforces it.</p>
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={userData.phone}
              onChange={handleProfileInputChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={profileSubmitting}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${profileSubmitting ? 'cursor-not-allowed bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
        >
          {profileSubmitting ? (
            <>
              <FaSpinner className="h-5 w-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FaCheck />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );

  const securityTab = (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              minLength={8}
              required
            />
            <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters.</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordSubmitting}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${passwordSubmitting ? 'cursor-not-allowed bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
            >
              {passwordSubmitting ? (
                <>
                  <FaSpinner className="h-5 w-5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <FaLock />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Two-Factor Authentication</h3>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="rounded-full bg-indigo-100 p-2">
              <FaShieldAlt className="text-indigo-600" />
            </div>
            <div className="flex flex-1 items-center justify-between">
              <h4 className="text-left text-gray-800">Add an extra layer of security</h4>
              <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Active Sessions</h3>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <FaUser className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Current Session</h4>
                  <p className="text-sm text-gray-600">Chrome on Windows • IP: 192.168.1.1</p>
                </div>
              </div>
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">Active now</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gray-100 p-2">
                  <FaUser className="text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Safari on iPhone</h4>
                  <p className="text-sm text-gray-600">Last active: 2 days ago • IP: 192.168.1.2</p>
                </div>
              </div>
              <button className="text-sm font-semibold text-red-600 hover:text-red-700">Sign out</button>
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={handleLogout} className="flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700">
            <FaSignOutAlt />
            <span>Sign out of all sessions</span>
          </button>
        </div>
      </div>
    </div>
  );

  const notificationsTab = (
    <form onSubmit={handleNotificationSubmit} className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Notification Preferences</h3>
        <p className="-mt-2 mb-4 text-sm text-gray-500">Choose how you would like us to reach out to you.</p>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="mb-3 font-medium text-gray-800">Email Notifications</h4>
          <div className="space-y-3">
            {[
              ['orderUpdates', 'Order updates', 'Recommended', 'Receive important updates about your bookings'],
              ['promotions', 'Promotions & deals', '', 'Occasional offers, discounts and news'],
              ['petReminders', 'Pet reminders', 'Recommended', 'Reminders for vaccinations, veterinary visits, etc.'],
              ['newsletter', 'Newsletter', '', 'Monthly round-up of new services and tips'],
            ].map(([key, label, tag, description]) => (
              <div key={`email-${key}`} className="flex items-center justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <p className="whitespace-nowrap font-medium text-gray-700">{label}</p>
                  {tag && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{tag}</span>}
                  <span className="truncate text-sm text-gray-500">• {description}</span>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={notificationPrefs.email[key]}
                    onChange={() => handleNotificationToggle('email', key)}
                  />
                  <span className="h-6 w-11 rounded-full bg-gray-200 transition-all peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:bg-indigo-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="mb-3 font-medium text-gray-800">Push Notifications</h4>
        <div className="space-y-3">
          {[
            ['orderUpdates', 'Order updates', 'Recommended', 'Stay updated on booking changes in real-time'],
            ['promotions', 'Promotions & deals', '', 'Be first to know about special offers'],
            ['petReminders', 'Pet reminders', 'Recommended', "Remind me when my pet's care is due"],
            ['newsletter', 'Newsletter', '', 'Occasional app updates and product announcements'],
          ].map(([key, label, tag, description]) => (
            <div key={`push-${key}`} className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <p className="whitespace-nowrap font-medium text-gray-700">{label}</p>
                {tag && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{tag}</span>}
                <span className="truncate text-sm text-gray-500">• {description}</span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={notificationPrefs.push[key]}
                  onChange={() => handleNotificationToggle('push', key)}
                />
                <span className="h-6 w-11 rounded-full bg-gray-200 transition-all peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:bg-indigo-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={notificationSubmitting}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${notificationSubmitting ? 'cursor-not-allowed bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
        >
          {notificationSubmitting ? (
            <>
              <FaSpinner className="h-5 w-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FaCheck />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>
    </form>
  );

  const addressTab = (
    <form onSubmit={handleProfileSubmit} className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Address Information</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ['street', 'Street address'],
            ['city', 'City'],
            ['state', 'State / Province'],
            ['zipCode', 'ZIP / Postal code'],
            ['country', 'Country'],
          ].map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`address.${key}`} className="mb-1 block text-sm font-medium text-gray-700">
                {label}
              </label>
              <input
                type="text"
                id={`address.${key}`}
                name={`address.${key}`}
                value={userData.address[key] || ''}
                onChange={handleProfileInputChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        Address updates will sync once backend support is available. For now, this information is stored locally in your session.
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={profileSubmitting}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${profileSubmitting ? 'cursor-not-allowed bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
        >
          {profileSubmitting ? (
            <>
              <FaSpinner className="h-5 w-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FaCheck />
              <span>Save Address</span>
            </>
          )}
        </button>
      </div>
    </form>
  );

  const paymentTab = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Payment Methods</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your cards and payment options securely</p>
        </div>
        <button
          onClick={() => navigate('/user/settings/payment/add')}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
        >
          <FaCreditCard />
          <span>Add payment method</span>
        </button>
      </div>

      {/* Security Notice */}
      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-indigo-800 font-medium">Secure Payment Storage</p>
            <p className="text-xs text-indigo-700 mt-1">
              All payment information is encrypted and stored securely with our PCI-compliant payment partner. Your CVV is never stored.
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
          <FaCreditCard className="text-2xl text-indigo-600" />
        </div>
        <h4 className="text-lg font-semibold text-gray-800 mb-2">No payment methods added</h4>
        <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
          Add a credit or debit card to speed up checkout and secure your transactions across PawsIQ.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={() => navigate('/user/settings/payment/add')}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <FaCreditCard />
            <span>Add Your First Card</span>
          </button>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Takes less than a minute
          </p>
        </div>
      </div>

      {/* Features List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 text-sm">Fast Checkout</h5>
              <p className="text-xs text-gray-500 mt-1">Complete bookings instantly with saved cards</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 text-sm">Fully Encrypted</h5>
              <p className="text-xs text-gray-500 mt-1">Bank-level security for all transactions</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <svg className="h-5 w-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 text-sm">Set Default</h5>
              <p className="text-xs text-gray-500 mt-1">Choose your preferred payment method</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const privacyTab = (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Privacy Settings</h3>
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
          {[
            ['Data collection', 'Help us improve by sharing anonymised usage data', true],
            ['Personalised ads', 'Use your activity to tailor relevant offers', false],
            ['Profile visibility', 'Allow other users to view your profile details', true],
          ].map(([title, description, checked]) => (
            <div key={title} className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="font-medium text-gray-700">{title}</p>
                <span className="text-sm text-gray-500">{description}</span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked={checked} />
                <span className="h-6 w-11 rounded-full bg-gray-200 transition-all peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:bg-indigo-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
          <div>
            <h4 className="font-medium text-gray-800">Download your data</h4>
            <p className="text-sm text-gray-500">Request a copy of everything we store about you and your pets.</p>
          </div>
          <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Request export
          </button>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <FaExclamationTriangle className="text-red-600" />
              </div>
              <div>
                <h4 className="mb-1 font-semibold text-red-800">Delete account</h4>
                <p className="text-sm text-red-700">
                  Permanently remove your account and related data. This cannot be undone.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  alert('Account deletion workflow coming soon.');
                }
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete account
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return profileTab;
      case 'security':
        return securityTab;
      case 'notifications':
        return notificationsTab;
      case 'address':
        return addressTab;
      case 'payment':
        return paymentTab;
      case 'privacy':
        return privacyTab;
      default:
        return null;
    }
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2">
            <FaCog className="text-2xl text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Account settings</h1>
            <p className="text-gray-500">Manage your profile, security and communication preferences.</p>
          </div>
        </div>

        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            <FaCheck className="text-green-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            <FaExclamationTriangle className="text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors focus:outline-none ${activeTab === tab.id
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="p-6">{renderTabContent()}</div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserSettings;
