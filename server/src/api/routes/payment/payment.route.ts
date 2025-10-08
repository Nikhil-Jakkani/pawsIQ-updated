import express from 'express';
import { paymentController } from '../../controllers/payment/payment.controller.js';
import { validate } from '../../middlewares/validate.js';
import { paymentValidation } from '../../validations/payment/payment.validation.js';
import { auth } from '../../middlewares/auth.js';

const router = express.Router();

// All routes require user authentication
router.use(auth('user'));

/**
 * @route   POST /payments/create-order
 * @desc    Create Razorpay order for booking
 * @access  Private (User)
 */
router.post(
  '/create-order',
  validate(paymentValidation.createOrder),
  paymentController.createOrder
);

/**
 * @route   POST /payments/verify
 * @desc    Verify Razorpay payment signature
 * @access  Private (User)
 */
router.post(
  '/verify',
  validate(paymentValidation.verifyPayment),
  paymentController.verifyPayment
);

/**
 * @route   GET /payments/booking/:bookingId
 * @desc    Get payment details for a booking
 * @access  Private (User)
 */
router.get(
  '/booking/:bookingId',
  validate(paymentValidation.getPaymentByBooking),
  paymentController.getPaymentByBooking
);

/**
 * @route   GET /payments
 * @desc    Get user's payment history
 * @access  Private (User)
 */
router.get(
  '/',
  validate(paymentValidation.getUserPayments),
  paymentController.getUserPayments
);

/**
 * @route   GET /admin/payments
 * @desc    Get all payments (admin)
 * @access  Private (Admin)
 */
router.get(
  '/admin',
  auth('admin'),
  paymentController.getAllPayments
);

/**
 * @route   GET /admin/payments/stats
 * @desc    Get payment statistics (admin)
 * @access  Private (Admin)
 */
router.get(
  '/admin/stats',
  auth('admin'),
  paymentController.getPaymentStats
);

export default router;
