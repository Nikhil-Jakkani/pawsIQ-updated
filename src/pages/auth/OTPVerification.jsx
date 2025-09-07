import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPasswordWithOTP } = useAuth();
  
  const email = location.state?.email || '';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false
  });

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

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

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordRequirements(requirements);
    return Object.values(requirements).every(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    
    if (!validatePassword(newPassword)) {
      toast.error('Please ensure your password meets all requirements');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await resetPasswordWithOTP(email, otpCode, newPassword);
      if (response.success) {
        toast.success('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-800 mb-4 flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 6-digit verification code to {email}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="flex justify-between mb-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-1/6 px-1">
                  <input
                    id={`otp-${i}`}
                    name={`otp-${i}`}
                    type="text"
                    maxLength={1}
                    value={otp[i]}
                    onChange={(e) => handleOtpChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 text-center focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    autoFocus={i === 0}
                  />
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Create a new password"
              />
              
              <div className="mt-2 text-xs text-gray-600">
                <p className="font-medium mb-1">Password Requirements:</p>
                <ul className="space-y-1">
                  <li className={passwordRequirements.length ? 'text-green-600' : 'text-gray-500'}>
                    {passwordRequirements.length ? <FaCheckCircle className="inline mr-1" /> : <FaTimesCircle className="inline mr-1" />}
                    At least 8 characters
                  </li>
                  <li className={passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-500'}>
                    {passwordRequirements.uppercase ? <FaCheckCircle className="inline mr-1" /> : <FaTimesCircle className="inline mr-1" />}
                    At least one uppercase letter
                  </li>
                  <li className={passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-500'}>
                    {passwordRequirements.lowercase ? <FaCheckCircle className="inline mr-1" /> : <FaTimesCircle className="inline mr-1" />}
                    At least one lowercase letter
                  </li>
                  <li className={passwordRequirements.number ? 'text-green-600' : 'text-gray-500'}>
                    {passwordRequirements.number ? <FaCheckCircle className="inline mr-1" /> : <FaTimesCircle className="inline mr-1" />}
                    At least one number
                  </li>
                  <li className={passwordRequirements.specialChar ? 'text-green-600' : 'text-gray-500'}>
                    {passwordRequirements.specialChar ? <FaCheckCircle className="inline mr-1" /> : <FaTimesCircle className="inline mr-1" />}
                    At least one special character
                  </li>
                </ul>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm your new password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm mt-4">
          <p className="text-gray-600">
            Didn't receive a code?{' '}
            <button 
              onClick={() => navigate('/forgot-password', { state: { email } })}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Resend OTP
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
