import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { FaArrowRight } from 'react-icons/fa';

const Transactions = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to marketplace page
    const timer = setTimeout(() => {
      navigate('/marketplace', { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Page Moved</h1>
        <p className="text-gray-600">Orders management has been moved to the Marketplace page.</p>
        <button
          onClick={() => navigate('/marketplace', { replace: true })}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          Go to Marketplace <FaArrowRight />
        </button>
        <p className="text-sm text-gray-500">Redirecting automatically...</p>
      </div>
    </DashboardLayout>
  );
};

export default Transactions;