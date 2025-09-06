import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaPaw } from 'react-icons/fa';

const logoImage = "/7.png";
const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const UserForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${API_URL}/user/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage('If an account exists for this email, a password reset link has been sent.');
        setEmail('');
      } else {
        // Even if server returns error, keep response generic to avoid user enumeration
        setMessage('If an account exists for this email, a password reset link has been sent.');
      }
    } catch (e) {
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

          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Forgot your password?</h1>
          <p className="text-center text-gray-600 mb-6">Enter your email to receive a password reset link.</p>

          {message && (
            <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">{message}</div>
          )}
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

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
                  <span>Sending reset link...</span>
                </>
              ) : (
                <>
                  <FaPaw />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>
          </form>
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