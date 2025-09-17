import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaFlag, FaPaw } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { signInWithPhoneNumber } from 'firebase/auth';
import { auth, setupRecaptcha } from '../../firebaseClient';
import { useAuth } from '../../context/AuthContext';

const logoImage = "/7.png";
const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const COUNTRY_CODES = [
  { label: "India (+91)", value: "+91" },
  { label: "United States (+1)", value: "+1" },
  { label: "United Kingdom (+44)", value: "+44" },
  { label: "Australia (+61)", value: "+61" },
];

const UserSignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fullPhone = `${countryCode}${phone.replace(/\s+/g, '')}`;

  const sendOtp = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error('Please fill in all fields before requesting OTP.');
      return;
    }
    setIsLoading(true);
    try {
      // Firebase client flow
      setupRecaptcha('recaptcha-container');
      const verifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, verifier);
      window.confirmationResult = confirmation;
      toast.success('OTP sent to your mobile');
      setOtpSent(true);
    } catch (err) {
      toast.error(err.message || 'Error sending OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const verifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Enter the 6‑digit OTP');
      return false;
    }
    try {
      // Confirm OTP via Firebase
      const confirmation = window.confirmationResult;
      if (!confirmation) throw new Error('No OTP session found. Please resend OTP.');
      await confirmation.confirm(otpCode);
      return true;
    } catch (err) {
      console.error('OTP verification error:', err);
      toast.error(err.message || 'OTP verification failed. Please try again.');
      return false;
    }
  };

  const registerAccount = async () => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_full_name: name,
          user_email_id: email,
          user_password: password,
          user_phone_number: fullPhone
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Registration failed');
      }
      toast.success('Account created! Logging you in...');
      // Auto-login with the same credentials
      const result = await login(email, password);
      if (result?.success) {
        navigate('/user/dashboard');
      } else {
        // Fallback: go to login page
        navigate('/user/login');
      }
    } catch (err) {
      toast.error(err.message || 'Error during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      await sendOtp();
    } else {
      const ok = await verifyOtp();
      if (ok) {
        await registerAccount();
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-500 to-[#145ae6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
        <div className="p-8">
          {/* Recaptcha container for Firebase Phone Auth */}
          <div id="recaptcha-container" />

          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <img src={logoImage} alt="PawsIQ Logo" className="w-12 h-12" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Create your account</h1>
          <p className="text-center text-gray-600 mb-6">Enter your details to continue</p>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Phone + Country */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  id="country"
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-3"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 9876543210"
                    required
                  />
                </div>
              </div>
            </div>

            {/* OTP inputs – shown after OTP is sent */}
            {otpSent && (
              <div className="flex justify-center space-x-2 mb-4">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(e, idx)}
                    onKeyDown={e => handleOtpKeyDown(e, idx)}
                    className="w-10 h-12 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </div>
            )}

            {/* Password fields – shown after OTP verification */}
            {otpSent && (
              <>
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-[#145ae6] text-white font-medium rounded-xl shadow-sm hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{otpSent ? 'Registering...' : 'Sending OTP...'}</span>
                </>
              ) : (
                <>
                  <FaPaw />
                  <span>{otpSent ? 'Create Account' : 'Send OTP'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-sm text-gray-600">Already have an account?</p>
          <Link to="/user/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserSignIn;