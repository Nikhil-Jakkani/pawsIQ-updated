import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const ProviderForgotPassword = () => {
  const { providerForgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, message: '', error: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, message: '', error: '' });
    try {
      const ok = await providerForgotPassword(email);
      if (ok) {
        setStatus({ loading: false, message: 'If an account exists, a reset link will be sent to your email.', error: '' });
      } else {
        setStatus({ loading: false, message: '', error: 'Something went wrong. Please try again later.' });
      }
    } catch (_) {
      setStatus({ loading: false, message: '', error: 'Something went wrong. Please try again later.' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img className="mx-auto h-16 w-auto" src="/7.png" alt="PawsIQ" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Provider Password Reset</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Remembered your password?{' '}
          <Link to="/provider/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {status.error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">{status.error}</div>
          )}
          {status.message && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 text-sm text-green-700">{status.message}</div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={status.loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {status.loading ? 'Sending...' : 'Send reset link'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProviderForgotPassword;
