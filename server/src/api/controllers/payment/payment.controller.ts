import { Response } from 'express';
import { paymentService } from '../../services/payment/payment.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import httpStatus from 'http-status';

/**
 * Create payment order
 * POST /payments/create-order
 */
const createOrder = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const { booking_id, amount, currency } = req.body;

  const order = await paymentService.createPaymentOrder(
    Number(booking_id),
    userId,
    Number(amount),
    currency
  );

  res.status(httpStatus.CREATED).json({
    success: true,
    data: order,
  });
});

/**
 * Verify payment
 * POST /payments/verify
 */
const verifyPayment = catchAsync(async (req: any, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const result = await paymentService.verifyPayment(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  res.status(httpStatus.OK).json(result);
});

/**
 * Get payment by booking ID
 * GET /payments/booking/:bookingId
 */
const getPaymentByBooking = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const bookingId = Number(req.params.bookingId);

  const payment = await paymentService.getPaymentByBooking(bookingId, userId);

  res.status(httpStatus.OK).json({
    success: true,
    data: payment,
  });
});

/**
 * Get user's payment history
 * GET /payments
 */
const getUserPayments = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await paymentService.getUserPayments(userId, page, limit);

  res.status(httpStatus.OK).json({
    success: true,
    ...result,
  });
});

/**
 * Admin: Get all payments
 * GET /admin/payments
 */
const getAllPayments = catchAsync(async (req: any, res: Response) => {
  const { status, provider_id, page, limit } = req.query;

  const result = await paymentService.getAllPayments(
    status as string,
    provider_id ? Number(provider_id) : undefined,
    Number(page) || 1,
    Number(limit) || 20
  );

  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
});

/**
 * Admin: Get payment statistics
 * GET /admin/payments/stats
 */
const getPaymentStats = catchAsync(async (req: any, res: Response) => {
  const stats = await paymentService.getPaymentStats();

  res.status(httpStatus.OK).json({
    success: true,
    data: stats,
  });
});

export const paymentController = {
  createOrder,
  verifyPayment,
  getPaymentByBooking,
  getUserPayments,
  getAllPayments,
  getPaymentStats,
};
