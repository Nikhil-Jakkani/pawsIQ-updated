import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FaMobileAlt } from 'react-icons/fa';
import { signInWithPhoneNumber } from 'firebase/auth';
import { auth, setupRecaptcha } from '../../firebaseClient';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const ProviderOTPVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPhone = location?.state?.phoneNumber || '';
  const successMsg = location?.state?.message || '';
  const registrationData = location?.state?.registrationData || null;
  const { providerLogin } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState({ loading: false, message: successMsg, error: '' });

  const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

  const handleResend = async () => {
    if (!phoneNumber) return;
    setStatus({ loading: true, message: '', error: '' });
    try {
      // Resend via Firebase
      setupRecaptcha('recaptcha-container');
      const verifier = window.recaptchaVerifier;
      const e164 = `+91${String(phoneNumber).replace(/\D/g, '')}`;
      const confirmation = await signInWithPhoneNumber(auth, e164, verifier);
      window.confirmationResult = confirmation;
      setStatus({ loading: false, message: 'OTP sent successfully.', error: '' });
    } catch (e) {
      setStatus({ loading: false, message: '', error: 'Failed to resend OTP. Try again.' });
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!phoneNumber || !code) {
      setStatus({ loading: false, message: '', error: 'Enter phone and OTP code.' });
      return;
    }
    setStatus({ loading: true, message: '', error: '' });
    try {
      // Verify via Firebase
      const confirmation = window.confirmationResult;
      if (!confirmation) throw new Error('No OTP session found. Please resend OTP.');
      await confirmation.confirm(code);

      // If registration data is present, create the provider account now
      if (registrationData) {
        const regResp = await fetch(`${API_URL}/provider/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registrationData)
        });
        const regData = await regResp.json().catch(() => ({}));
        if (!regResp.ok) {
          throw new Error(regData?.message || 'Account creation failed after OTP verification');
        }

        // Auto-login provider using the same credentials
        const email = registrationData.provider_email || registrationData.email;
        const password = registrationData.provider_password || registrationData.password;
        if (email && password) {
          const result = await providerLogin(email, password);
          if (result?.success) {
            toast.success('Account created! You are now logged in.');
            setStatus({ loading: false, message: '', error: '' });
            // Store providerType in local storage
            localStorage.setItem('selectedService', registrationData.provider_type);
            return navigate(`/provider/${registrationData.provider_type}/dashboard`);
          }
        }
      }

      // If no registration or auto-login failed, just show success
      toast.success('Phone verified successfully.');
      setStatus({ loading: false, message: '', error: '' });
    } catch (e) {
      setStatus({ loading: false, message: '', error: e.message || 'Verification failed' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img className="mx-auto h-16 w-auto" src="/7.png" alt="PawsIQ" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Verify your phone</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We sent an OTP to your phone number.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Recaptcha container for Firebase Phone Auth */}
          <div id="recaptcha-container" />
          {status.error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">{status.error}</div>
          )}
          {status.message && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 text-sm text-green-700">{status.message}</div>
          )}
          <form className="space-y-6" onSubmit={handleVerify}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="mt-1">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">OTP Code</label>
              <div className="mt-1">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm tracking-widest"
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleResend}
                className="text-sm text-indigo-600 hover:text-indigo-500"
                disabled={status.loading}
              >
                Resend OTP
              </button>

              <Link to="/provider/login" className="text-sm text-gray-500 hover:text-gray-700">Back to sign in</Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={status.loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {status.loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProviderOTPVerification;
