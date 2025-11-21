import React, { useState } from 'react';
import { FaCreditCard, FaPaypal, FaPlus, FaEdit, FaTrash, FaHistory, FaCheckCircle, FaClock, FaTimes } from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';

const UserPayments = () => {
  const [activeTab, setActiveTab] = useState('methods');
  const [showAddCard, setShowAddCard] = useState(false);

  // Mock data for payment methods
  const paymentMethods = [
    {
      id: 1,
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true
    },
    {
      id: 2,
      type: 'card',
      last4: '5555',
      brand: 'Mastercard',
      expiryMonth: 8,
      expiryYear: 2026,
      isDefault: false
    }
  ];

  // Mock data for payment history
  const paymentHistory = [
    {
      id: 1,
      date: '2025-01-15',
      amount: 85.00,
      description: 'Veterinary Consultation - Dr. Smith',
      status: 'completed',
      method: 'Visa ****4242'
    },
    {
      id: 2,
      date: '2025-01-10',
      amount: 45.50,
      description: 'Pet Grooming Service',
      status: 'completed',
      method: 'Mastercard ****5555'
    },
    {
      id: 3,
      date: '2025-01-08',
      amount: 120.00,
      description: 'Pet Food & Supplies',
      status: 'pending',
      method: 'Visa ****4242'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'failed':
        return <FaTimes className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <div className="bg-indigo-100 p-1.5 rounded-lg">
                <FaCreditCard className="text-indigo-600 text-lg" />
              </div>
              Payments
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage cards and view transactions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('methods')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'methods'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              History
            </button>
          </nav>
        </div>

        {/* Payment Methods Tab */}
        {activeTab === 'methods' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-800">Your Cards</h2>
              <button
                onClick={() => setShowAddCard(true)}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
              >
                <FaPlus size={12} />
                Add Card
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-50 p-1.5 rounded-lg">
                        <FaCreditCard className="text-indigo-600 text-sm" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          {method.brand} ****{method.last4}
                        </p>
                        <p className="text-xs text-gray-500">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                      </div>
                    </div>
                    {method.isDefault && (
                      <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-gray-100 text-gray-700 px-2 py-1.5 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5">
                      <FaEdit size={12} />
                      Edit
                    </button>
                    <button className="flex-1 bg-red-50 text-red-700 px-2 py-1.5 rounded-md text-xs font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
                      <FaTrash size={12} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Card Modal */}
            {showAddCard && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-5 w-full max-w-md">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-semibold">Add Payment Method</h3>
                    <button
                      onClick={() => setShowAddCard(false)}
                      className="text-gray-400 hover:text-gray-600 text-lg"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <form className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Expiry
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Name on Card
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id="setDefault"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="setDefault" className="text-xs text-gray-700">
                        Set as default
                      </label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddCard(false)}
                        className="flex-1 bg-gray-100 text-gray-800 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Add Card
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Payment History</h2>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">
                        Description
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">
                        Amount
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">
                        Method
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-900">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-900">
                          {payment.description}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-semibold text-gray-900">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-600">
                          {payment.method}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(payment.status)}
                            <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default UserPayments;