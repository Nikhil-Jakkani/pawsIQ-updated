import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaShoppingCart,
  FaTrash,
  FaMinus,
  FaPlus,
  FaCreditCard,
  FaMobileAlt,
  FaUniversity,
  FaWallet,
  FaPhone,
  FaGooglePay,
  FaTruck,
  FaTag,
  FaBox,
  FaArrowLeft,
  FaCheckCircle,
  FaLock,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import UserLayout from '../../components/layout/UserLayout';
import { useToast } from '../../components/common/Toast';

const UserCart = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Cart States
  const [cartItems, setCartItems] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit-card');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // GST Rate (18% for most items in India)
  const GST_RATE = 0.18;

  // Coupon codes and discounts
  const validCoupons = {
    'SAVE10': { discount: 0.10, description: '10% off' },
    'SAVE20': { discount: 0.20, description: '20% off' },
    'FIRST100': { discount: 100, description: '₹100 off on first order' },
    'WELCOME': { discount: 50, description: '₹50 off' }
  };

  // Payment methods with Indian specificity
  const paymentMethods = [
    {
      id: 'credit-card',
      name: 'Credit/Debit Card',
      icon: FaCreditCard,
      description: 'Visa, MasterCard, RuPay',
      isAvailable: true
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: FaMobileAlt,
      description: 'Google Pay, PhonePe, BHIM',
      isAvailable: true
    },
    {
      id: 'net-banking',
      name: 'Net Banking',
      icon: FaUniversity,
      description: 'All major banks',
      isAvailable: true
    },
    {
      id: 'digital-wallet',
      name: 'Digital Wallet',
      icon: FaWallet,
      description: 'Paytm, Amazon Pay, Mobikwik',
      isAvailable: true
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: FaTruck,
      description: 'Pay when you receive',
      isAvailable: true,
      additionalFee: 50
    }
  ];

  // Load cart from localStorage on mount
  useEffect(() => {
    loadCartFromLocalStorage();
  }, []);

  const loadCartFromLocalStorage = () => {
    try {
      const savedCart = localStorage.getItem('petStoreCart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      toast.error('Failed to load cart');
    }
  };

  const saveCartToLocalStorage = (items) => {
    try {
      localStorage.setItem('petStoreCart', JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  };

  // Calculate subtotal
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Calculate GST
  const calculateGST = () => {
    const subtotal = calculateSubtotal();
    return Math.round(subtotal * GST_RATE * 100) / 100;
  };

  // Get payment method fee
  const getPaymentFee = () => {
    const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
    return method?.additionalFee || 0;
  };

  // Calculate total with all taxes and fees
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const gst = calculateGST();
    const paymentFee = getPaymentFee();
    const shipping = cartItems.some(item => !item.freeShipping) ? 99 : 0;
    let total = subtotal + gst + paymentFee + shipping - discountApplied;
    return Math.round(total * 100) / 100;
  };

  // Apply coupon
  const applyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    const coupon = validCoupons[couponCode.toUpperCase()];
    if (!coupon) {
      toast.error('Invalid coupon code');
      return;
    }

    const subtotal = calculateSubtotal();
    let discount = 0;

    if (coupon.discount >= 1) {
      discount = coupon.discount; // Fixed discount like ₹100
    } else {
      discount = subtotal * coupon.discount; // Percentage discount
    }

    setDiscountApplied(Math.round(discount * 100) / 100);
    toast.success(`Coupon applied! ${coupon.description}`);
  };

  // Remove coupon
  const removeCoupon = () => {
    setCouponCode('');
    setDiscountApplied(0);
    toast.info('Coupon removed');
  };

  // Update quantity
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    const updatedItems = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );

    setCartItems(updatedItems);
    saveCartToLocalStorage(updatedItems);
  };

  // Remove from cart
  const removeFromCart = (itemId) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
    saveCartToLocalStorage(updatedItems);
    toast.success('Item removed from cart');
  };

  // Validate order
  const validateOrder = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return false;
    }

    if (!deliveryAddress.trim()) {
      toast.error('Please enter delivery address');
      return false;
    }

    if (!mobileNumber.trim()) {
      toast.error('Please enter mobile number');
      return false;
    }

    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return false;
    }

    return true;
  };

  // Process order
  const processOrder = async () => {
    if (!validateOrder()) return;

    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create order object
      const order = {
        orderId: `ORD-${Date.now()}`,
        items: cartItems,
        subtotal: calculateSubtotal(),
        gst: calculateGST(),
        shippingCost: cartItems.some(item => !item.freeShipping) ? 99 : 0,
        paymentFee: getPaymentFee(),
        discount: discountApplied,
        total: calculateTotal(),
        paymentMethod: selectedPaymentMethod,
        deliveryAddress: deliveryAddress,
        mobileNumber: mobileNumber,
        orderDate: new Date().toISOString(),
        status: 'pending'
      };

      // Save order to localStorage
      const existingOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
      existingOrders.push(order);
      localStorage.setItem('userOrders', JSON.stringify(existingOrders));

      // Clear cart
      setCartItems([]);
      saveCartToLocalStorage([]);

      // Show success message
      toast.success('Order placed successfully!');

      // Redirect to orders page after a short delay
      setTimeout(() => {
        navigate('/user/orders');
      }, 2000);
    } catch (error) {
      console.error('Order processing failed:', error);
      toast.error('Failed to process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format currency to INR
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Empty cart view
  if (cartItems.length === 0) {
    return (
      <UserLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-6xl text-gray-300">
              <FaShoppingCart />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-8">Add some products to get started!</p>
            <button
              onClick={() => navigate('/user/marketplace')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <FaArrowLeft /> Continue Shopping
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FaShoppingCart className="text-blue-600 text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Shopping Cart</h1>
          </div>
          <button
            onClick={() => navigate('/user/marketplace')}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg transition-colors"
          >
            <FaArrowLeft /> Continue Shopping
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Cart Items List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FaBox className="text-blue-600" />
                Items ({cartItems.length})
              </h2>

              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0 last:pb-0"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.seller}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.freeShipping ? (
                        <span className="text-green-600 font-medium">✓ Free Shipping</span>
                      ) : (
                        <span className="text-gray-600">Shipping: ₹99</span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(item.price)}
                    </p>

                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-100 transition-colors"
                        title="Decrease quantity"
                      >
                        <FaMinus className="text-xs text-gray-600" />
                      </button>
                      <span className="px-3 py-1 min-w-10 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-100 transition-colors"
                        title="Increase quantity"
                      >
                        <FaPlus className="text-xs text-gray-600" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 text-sm"
                    >
                      <FaTrash /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <FaTag className="text-blue-600" />
                Coupon Code
              </h2>

              {discountApplied > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-green-700">Coupon Applied!</p>
                    <p className="text-sm text-green-600">{couponCode}</p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="px-4 py-2 bg-white border border-green-300 text-green-700 rounded hover:bg-green-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code (e.g., SAVE10, WELCOME)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={applyCoupon}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-3">
                Try: SAVE10, SAVE20, FIRST100, or WELCOME
              </p>
            </div>
          </div>

          {/* Order Summary & Checkout */}
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-20 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>

              <div className="space-y-2 text-sm border-b border-gray-200 pb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium">{formatCurrency(calculateGST())}</span>
                </div>

                {cartItems.some(item => !item.freeShipping) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">₹99</span>
                  </div>
                )}

                {getPaymentFee() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {selectedPaymentMethod === 'cod' ? 'COD Fee' : 'Payment Fee'}
                    </span>
                    <span className="font-medium">₹{getPaymentFee()}</span>
                  </div>
                )}

                {discountApplied > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountApplied)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-blue-600">{formatCurrency(calculateTotal())}</span>
              </div>

              <button
                onClick={() => setShowPaymentOptions(!showPaymentOptions)}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
              >
                <span className="flex items-center gap-2">
                  <FaLock /> Select Payment Method
                </span>
                {showPaymentOptions ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {showPaymentOptions && (
                <div className="space-y-2 border-t border-gray-200 pt-4">
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <label
                        key={method.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={selectedPaymentMethod === method.id}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="w-4 h-4"
                        />
                        <IconComponent className="ml-3 text-blue-600" />
                        <div className="ml-3 flex-1">
                          <p className="font-medium text-gray-800">{method.name}</p>
                          <p className="text-xs text-gray-500">{method.description}</p>
                        </div>
                        {method.additionalFee && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            ₹{method.additionalFee}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Delivery Address */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your complete delivery address..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  rows="3"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit number"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength="10"
                  />
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={processOrder}
                disabled={isProcessing}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin">⏳</div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCheckCircle /> Place Order
                  </>
                )}
              </button>

              <div className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                <FaLock /> Secure checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserCart;