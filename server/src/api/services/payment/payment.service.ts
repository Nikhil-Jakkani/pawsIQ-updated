import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import httpStatus from 'http-status';
import { commissionService } from '../commission/commission.service.js';
import { notificationService } from '../notification/notification.service.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * Create Razorpay order for booking payment
 */
const createPaymentOrder = async (
  bookingId: number,
  userId: bigint,
  amount: number,
  currency: string = 'INR'
) => {
  // Verify booking exists and belongs to user
  const booking = await prisma.pIQ_Bookings.findFirst({
    where: { booking_id: bookingId, user_id: userId },
    include: {
      PIQ_Service_Master: true,
      PIQ_User: true,
    },
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  // Check if payment already exists
  const existingPayment = await prisma.pIQ_Payments.findFirst({
    where: { booking_id: bookingId, payment_status: { in: ['success', 'pending'] } },
  });

  if (existingPayment) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment already exists for this booking');
  }

  // Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Amount in paise
    currency,
    receipt: `booking_${bookingId}_${Date.now()}`,
    notes: {
      booking_id: bookingId.toString(),
      user_id: userId.toString(),
    },
  });

  // Create payment record
  const payment = await prisma.pIQ_Payments.create({
    data: {
      booking_id: bookingId,
      user_id: userId,
      amount,
      currency,
      payment_status: 'pending',
      razorpay_order_id: razorpayOrder.id,
      payment_gateway: 'razorpay',
    },
  });

  return {
    payment_id: payment.payment_id,
    order_id: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    booking_id: bookingId,
  };
};

/**
 * Verify Razorpay payment signature
 */
const verifyPayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) => {
  const payment = await prisma.pIQ_Payments.findUnique({
    where: { razorpay_order_id: razorpayOrderId },
    include: { PIQ_Bookings: true },
  });

  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  // Check if payment already verified (prevent duplicate verification)
  if (payment.payment_status === 'success') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment already verified');
  }

  // Verify signature
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    // Update payment as failed
    await prisma.pIQ_Payments.update({
      where: { payment_id: payment.payment_id },
      data: {
        payment_status: 'failed',
        failure_reason: 'Invalid signature',
      },
    });
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid payment signature');
  }

  // Update payment as success
  const updatedPayment = await prisma.pIQ_Payments.update({
    where: { payment_id: payment.payment_id },
    data: {
      payment_status: 'success',
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      payment_method: 'online',
      transaction_date: new Date(),
    },
  });

  // Update booking status to Confirmed
  await prisma.pIQ_Bookings.update({
    where: { booking_id: payment.booking_id },
    data: {
      booking_status: 'Confirmed',
      last_updated_dtm: new Date(),
    },
  });

  // Auto-calculate commission (15% platform fee)
  try {
    await commissionService.calculateCommission(updatedPayment.payment_id, 15.0);
  } catch (error) {
    // Log error but don't fail the payment verification
    console.error('Failed to calculate commission:', error);
  }

  // Send payment success notification
  notificationService.sendPaymentSuccessEmail(updatedPayment.payment_id).catch(console.error);

  return {
    success: true,
    payment_id: updatedPayment.payment_id,
    booking_id: payment.booking_id,
    status: 'success',
  };
};

/**
 * Get payment details by booking ID
 */
const getPaymentByBooking = async (bookingId: number, userId: bigint) => {
  const payment = await prisma.pIQ_Payments.findFirst({
    where: {
      booking_id: bookingId,
      user_id: userId,
    },
    include: {
      PIQ_Bookings: {
        include: {
          PIQ_Service_Master: true,
        },
      },
    },
  });

  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  return payment;
};

/**
 * Get all payments for a user
 */
const getUserPayments = async (userId: bigint, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    prisma.pIQ_Payments.findMany({
      where: { user_id: userId },
      include: {
        PIQ_Bookings: {
          include: {
            PIQ_Service_Master: true,
            PIQ_Service_Provider: {
              select: {
                serv_provider_name: true,
                serv_provider_type: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.pIQ_Payments.count({ where: { user_id: userId } }),
  ]);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Admin: Get all payments with filters
 */
const getAllPayments = async (
  status?: string,
  providerId?: number,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) {
    where.payment_status = status;
  }
  if (providerId) {
    where.PIQ_Bookings = {
      service_provider_id: providerId,
    };
  }

  const [payments, total] = await Promise.all([
    prisma.pIQ_Payments.findMany({
      where,
      include: {
        PIQ_User: {
          select: {
            user_id: true,
            user_full_name: true,
            user_email_id: true,
          },
        },
        PIQ_Bookings: {
          include: {
            PIQ_Service_Master: true,
            PIQ_Service_Provider: {
              select: {
                service_provider_id: true,
                serv_provider_name: true,
                serv_provider_type: true,
              },
            },
            PIQ_Pets: {
              select: {
                pet_id: true,
                pet_name: true,
                pet_type: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.pIQ_Payments.count({ where }),
  ]);

  return {
    payments: payments.map((p) => ({
      payment_id: p.payment_id,
      booking_id: p.booking_id,
      amount: Number(p.amount),
      currency: p.currency,
      payment_status: p.payment_status,
      payment_method: p.payment_method,
      transaction_date: p.transaction_date,
      razorpay_order_id: p.razorpay_order_id,
      razorpay_payment_id: p.razorpay_payment_id,
      created_at: p.created_at,
      user: p.PIQ_User,
      booking: {
        booking_id: p.PIQ_Bookings.booking_id,
        booked_dtm: p.PIQ_Bookings.booked_dtm,
        booking_status: p.PIQ_Bookings.booking_status,
        service: p.PIQ_Bookings.PIQ_Service_Master,
        provider: p.PIQ_Bookings.PIQ_Service_Provider,
        pet: p.PIQ_Bookings.PIQ_Pets,
      },
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Admin: Get payment statistics
 */
const getPaymentStats = async () => {
  const [totalPayments, successfulPayments, failedPayments, pendingPayments, revenueResult] =
    await Promise.all([
      prisma.pIQ_Payments.count(),
      prisma.pIQ_Payments.count({ where: { payment_status: 'success' } }),
      prisma.pIQ_Payments.count({ where: { payment_status: 'failed' } }),
      prisma.pIQ_Payments.count({ where: { payment_status: 'pending' } }),
      prisma.pIQ_Payments.aggregate({
        where: { payment_status: 'success' },
        _sum: { amount: true },
      }),
    ]);

  const totalRevenue = revenueResult._sum.amount
    ? Number(revenueResult._sum.amount)
    : 0;

  return {
    total_payments: totalPayments,
    successful_payments: successfulPayments,
    failed_payments: failedPayments,
    pending_payments: pendingPayments,
    total_revenue: totalRevenue,
    currency: 'INR',
  };
};

export const paymentService = {
  createPaymentOrder,
  verifyPayment,
  getPaymentByBooking,
  getUserPayments,
  getAllPayments,
  getPaymentStats,
};
