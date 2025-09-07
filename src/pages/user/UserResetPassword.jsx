import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { FaLock, FaPaw } from 'react-icons/fa';
import { toast } from 'react-toastify';

const logoImage = "/7.png";
const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const UserResetPassword = () => {
  const location = useLocation();
  const { state } = location;
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!state?.email || !state?.otp) {
      setError('Invalid password reset request. Please try again.');
      setTimeout(() => navigate('/forgot-password'), 3000);
      return;
    }
    setEmail(state.email);
    setOtp(state.otp);
  }, [state, navigate]);

  const verifyOTP = async () => {
    try {
      console.log('Sending OTP verification request:', { email, otp });
      const res = await fetch(`${API_URL}/user/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      
      // Safely parse JSON (backend returns JSON on errors, 200 with JSON on success)
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      console.log('OTP verification response:', { status: res.status, data });
      
      if (!res.ok || !data.success) {
        const msg = data?.message || 'Invalid or expired OTP';
        throw new Error(msg);
      }
      
      return true;
    } catch (error) {
      console.error('OTP verification error:', error);
      // Show a clear message for wrong OTP
      const msg = (error?.message || '').toLowerCase().includes('invalid')
        ? 'Invalid OTP. Please check and try again.'
        : (error.message || 'Failed to verify OTP. Please try again.');
      setError(msg);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !otp) {
      setError('Invalid password reset request. Please try again.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // First verify the OTP
    const isOtpValid = await verifyOTP();
    if (!isOtpValid) {
      return; // Error is already set by verifyOTP
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          otp,
          newPassword: password 
        }),
      });

      // Some backends return 204 No Content; handle gracefully
      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : null;
      
      if (res.ok || res.status === 204) {
        setSuccess(true);
        toast.success('Password reset successful!');
        setTimeout(() => navigate('/user/login'), 1200);
      } else {
        setError((data && data.message) || 'Failed to reset password. Please try again.');
      }
    } catch (e) {
      console.error('Reset password error:', e);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-500 to-[#145ae6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <img src={logoImage} alt="PawsIQ Logo" className="w-12 h-12" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Reset your password</h1>
          <p className="text-center text-gray-600 mb-6">Choose a strong password for your account.</p>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">Password has been reset. Redirecting...</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                  required
                />
              </div>
            </div>
            <div className="mb-6">
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !otp}
              className={`w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-[#145ae6] text-white font-medium rounded-xl shadow-sm hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a 8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <FaPaw />
                  <span>Reset Password</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-2">
          <Link to="/user/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserResetPassword;