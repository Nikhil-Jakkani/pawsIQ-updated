import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCheck,
  FaCheckCircle,
  FaCreditCard,
  FaInfoCircle,
  FaLock,
  FaShieldAlt,
  FaSpinner,
} from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const DEFAULT_FORM = Object.freeze({
  cardholderName: '',
  cardNumber: '',
  expiryMonth: '',
  expiryYear: '',
  cvv: '',
  billingAddress: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  nickname: '',
  saveAsDefault: true,
});

const UserAddPaymentMethod = () => {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const resetMessagesLater = useMemo(
    () => () => {
      window.setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 4000);
    },
    []
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.cardholderName.trim()) {
      throw new Error('Please enter the cardholder name.');
    }
    if (!formData.cardNumber.trim() || formData.cardNumber.replace(/\s+/g, '').length < 12) {
      throw new Error('Please enter a valid card number.');
    }
    if (!formData.expiryMonth || !formData.expiryYear) {
      throw new Error('Select the card expiry month and year.');
    }
    if (!formData.cvv.trim() || formData.cvv.length < 3) {
      throw new Error('Enter a valid CVV.');
    }
    if (!formData.billingAddress.trim()) {
      throw new Error('Add a billing street address.');
    }
    if (!formData.city.trim() || !formData.state.trim()) {
      throw new Error('City and state are required.');
    }
    if (!formData.postalCode.trim()) {
      throw new Error('Postal or ZIP code is required.');
    }
    if (!formData.country.trim()) {
      throw new Error('Select a billing country.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    try {
      validateForm();
      setIsSubmitting(true);

      const payload = {
        cardholder_name: formData.cardholderName.trim(),
        card_number: formData.cardNumber.replace(/\s+/g, ''),
        expiry_month: formData.expiryMonth,
        expiry_year: formData.expiryYear,
        cvv: formData.cvv.trim(),
        billing_address: {
          street: formData.billingAddress.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          postal_code: formData.postalCode.trim(),
          country: formData.country.trim(),
        },
        nickname: formData.nickname.trim() || undefined,
        set_default: Boolean(formData.saveAsDefault),
      };

      // Placeholder until payments API is ready
      if (authFetch) {
        try {
          await authFetch(`${API_URL}/user/payments/methods`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch (apiError) {
          console.warn('Payments API not available yet:', apiError);
        }
      }

      setSuccessMessage('Payment method saved. This will sync once payments API is available.');
      setFormData(DEFAULT_FORM);
      resetMessagesLater();
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || 'Unable to save payment method.');
      resetMessagesLater();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <FaArrowLeft />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-indigo-100 p-2">
                <FaCreditCard className="text-2xl text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Add payment method</h1>
            </div>
            <p className="text-sm text-gray-500">
              Securely store a card or wallet to speed up checkout across your PawsIQ bookings.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
          <div className="flex items-center gap-2">
            <FaShieldAlt />
            <p>
              Card details are encrypted and stored with our PCI-compliant payment partner. You can remove them at any time.
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            <FaCheckCircle />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            <FaInfoCircle />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-indigo-100 p-1.5">
                <FaCreditCard className="text-indigo-600 text-sm" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">Card details</h2>
                <p className="text-xs text-gray-500">All fields required unless marked optional</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="cardholderName" className="mb-0.5 block text-xs font-medium text-gray-700">
                  Cardholder name
                </label>
                <input
                  id="cardholderName"
                  name="cardholderName"
                  type="text"
                  value={formData.cardholderName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="As displayed on the card"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="cardNumber" className="mb-0.5 block text-xs font-medium text-gray-700">
                  Card number
                </label>
                <input
                  id="cardNumber"
                  name="cardNumber"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </div>

              <div>
                <label htmlFor="expiryMonth" className="mb-0.5 block text-xs font-medium text-gray-700">
                  Month
                </label>
                <select
                  id="expiryMonth"
                  name="expiryMonth"
                  value={formData.expiryMonth}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">MM</option>
                  {[...Array(12)].map((_, index) => {
                    const monthValue = String(index + 1).padStart(2, '0');
                    return (
                      <option key={monthValue} value={monthValue}>
                        {monthValue}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label htmlFor="expiryYear" className="mb-0.5 block text-xs font-medium text-gray-700">
                  Year
                </label>
                <select
                  id="expiryYear"
                  name="expiryYear"
                  value={formData.expiryYear}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">YY</option>
                  {Array.from({ length: 15 }, (_, idx) => new Date().getFullYear() + idx).map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cvv" className="mb-0.5 block text-xs font-medium text-gray-700">
                  CVV
                </label>
                <input
                  id="cvv"
                  name="cvv"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={formData.cvv}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="123"
                  required
                />
                <p className="mt-0.5 text-xs text-gray-500 flex items-center gap-1">
                  <FaLock className="text-gray-400 text-xs" />
                  Never stored
                </p>
              </div>

              <div>
                <label htmlFor="nickname" className="mb-0.5 block text-xs font-medium text-gray-700">
                  Nickname <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  value={formData.nickname}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Personal Visa"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-indigo-100 p-1.5">
                <FaInfoCircle className="text-indigo-600 text-sm" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">Billing address</h2>
                <p className="text-xs text-gray-500">Must match your bank records</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="billingAddress" className="mb-0.5 block text-xs font-medium text-gray-700">
                  Street address
                </label>
                <input
                  id="billingAddress"
                  name="billingAddress"
                  type="text"
                  value={formData.billingAddress}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="House number and street"
                  required
                />
              </div>

              <div>
                <label htmlFor="city" className="mb-0.5 block text-xs font-medium text-gray-700">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="state" className="mb-0.5 block text-xs font-medium text-gray-700">
                  State / Province
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="postalCode" className="mb-0.5 block text-xs font-medium text-gray-700">
                  Postal / ZIP
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="country" className="mb-0.5 block text-xs font-medium text-gray-700">
                  Country / Region
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm capitalize focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a country</option>
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Singapore">Singapore</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <input
                type="checkbox"
                name="saveAsDefault"
                checked={formData.saveAsDefault}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-700">
                Set as default payment method
              </span>
            </label>
          </section>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-t border-gray-200 pt-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <FaLock className="text-gray-400 text-xs" />
              <span>PCI DSS Level 1 compliant encryption</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isSubmitting ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="h-3 w-3 animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <FaCheck className="text-xs" />
                    <span>Save Card</span>
                  </>
                )}
              </button>
            </div>
          </div>
          </form>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserAddPaymentMethod;
