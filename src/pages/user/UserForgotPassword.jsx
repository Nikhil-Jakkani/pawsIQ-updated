import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaPaw, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';

const logoImage = "/7.png";
const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const UserForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const verifyOtpWithServer = async (emailToVerify, otpCode) => {
    try {
      const res = await fetch(`${API_URL}/user/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify, otp: otpCode })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Invalid or expired OTP');
      }
      return true;
    } catch (err) {
      toast.error(err.message || 'Failed to verify OTP');
      return false;
    }
  };

  const resendOtp = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast.success('OTP resent to your email');
      } else {
        toast.info('If an account exists, an OTP has been resent');
      }
      setOtp(['', '', '', '', '', '']);
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) {
            clearInterval(interval);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (e) {
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!otpSent) {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/user/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        if (res.ok) {
          setOtpSent(true);
          toast.success('OTP sent to your email!');
        } else {
          setOtpSent(true);
          toast.success('If an account exists, an OTP has been sent to your email.');
        }
      } catch (error) {
        toast.error('Failed to send OTP. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      const otpCode = otp.join('');
      if (otpCode.length !== 6) {
        toast.error('Please enter a valid 6-digit OTP');
        return;
      }
      setIsLoading(true);
      const isValid = await verifyOtpWithServer(email, otpCode);
      setIsLoading(false);
      if (!isValid) return;
      navigate('/reset-password', { 
        state: { 
          email,
          otp: otpCode 
        } 
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-500 to-[#145ae2] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
        <div className="p-8">
          {otpSent && (
            <button 
              onClick={() => setOtpSent(false)}
              className="text-gray-600 hover:text-gray-800 mb-4 flex items-center text-sm"
            >
              <FaArrowLeft className="mr-1" /> Back
            </button>
          )}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <img src={logoImage} alt="PawsIQ Logo" className="w-12 h-12" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            {otpSent ? 'Verify OTP' : 'Forgot Password'}
          </h2>
          <p className="text-gray-600 text-center mb-8">
            {otpSent 
              ? `Enter the 6-digit code sent to ${email}`
              : 'Enter your email and we\'ll send you a verification code'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {otpSent ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit code
                </label>
                <div className="flex justify-between space-x-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      maxLength={1}
                      value={otp[i]}
                      onChange={(e) => handleOtpChange(e, i)}
                      onKeyDown={(e) => handleKeyDown(e, i)}
                      className="w-full h-12 text-center border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {isLoading 
                  ? 'Processing...' 
                  : otpSent 
                    ? 'Verify & Continue' 
                    : 'Send Verification Code'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {otpSent ? (
                <>
                  Didn't receive a code?{' '}
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={isLoading || resendCooldown > 0}
                    className={`font-medium ${isLoading || resendCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-500'}`}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </>
              ) : (
                <>
                  Remember your password?{' '}
                  <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign in
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-2">
          <Link to="/user/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Back to Sign In
          </Link>
          <span className="hidden sm:inline text-gray-400">|</span>
          <Link to="/user/signin" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            Create a Pet Owner Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserForgotPassword;