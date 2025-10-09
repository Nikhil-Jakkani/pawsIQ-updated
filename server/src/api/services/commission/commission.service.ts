import httpStatus from 'http-status';
import prisma from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Calculate and create commission record for a payment
 */
const calculateCommission = async (
  paymentId: number,
  commissionPercent: number = 15.0
) => {
  // Get payment details with booking
  const payment = await prisma.pIQ_Payments.findUnique({
    where: { payment_id: paymentId },
    include: {
      PIQ_Bookings: {
        include: {
          PIQ_Service_Provider: true,
        },
      },
    },
  });

  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  if (payment.payment_status !== 'success') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Commission can only be calculated for successful payments'
    );
  }

  // Check if commission already exists
  const existingCommission = await prisma.pIQ_Commission.findUnique({
    where: { payment_id: paymentId },
  });

  if (existingCommission) {
    return existingCommission;
  }

  // Validate provider is assigned to booking
  if (!payment.PIQ_Bookings.service_provider_id) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot calculate commission: No provider assigned to booking'
    );
  }

  const bookingAmount = Number(payment.amount);
  const commissionAmount = (bookingAmount * commissionPercent) / 100;
  const providerAmount = bookingAmount - commissionAmount;

  // Create commission record
  const commission = await prisma.pIQ_Commission.create({
    data: {
      booking_id: payment.booking_id,
      payment_id: paymentId,
      service_provider_id: payment.PIQ_Bookings.service_provider_id,
      booking_amount: new Decimal(bookingAmount),
      commission_percent: new Decimal(commissionPercent),
      commission_amount: new Decimal(commissionAmount),
      provider_amount: new Decimal(providerAmount),
      status: 'calculated',
    },
  });

  return {
    commission_id: commission.commission_id,
    booking_id: commission.booking_id,
    payment_id: commission.payment_id,
    booking_amount: Number(commission.booking_amount),
    commission_percent: Number(commission.commission_percent),
    commission_amount: Number(commission.commission_amount),
    provider_amount: Number(commission.provider_amount),
    status: commission.status,
  };
};

/**
 * Get commission by payment ID
 */
const getCommissionByPayment = async (paymentId: number) => {
  const commission = await prisma.pIQ_Commission.findUnique({
    where: { payment_id: paymentId },
    include: {
      PIQ_Bookings: {
        include: {
          PIQ_Service_Master: true,
          PIQ_User: {
            select: {
              user_id: true,
              user_full_name: true,
              user_email_id: true,
            },
          },
        },
      },
      PIQ_Service_Provider: {
        select: {
          service_provider_id: true,
          serv_provider_name: true,
          serv_provider_email: true,
        },
      },
    },
  });

  if (!commission) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Commission record not found');
  }

  return commission;
};

/**
 * Admin: Get all commission records with filters
 */
const getAllCommissions = async (
  status?: string,
  providerId?: number,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (providerId) {
    where.service_provider_id = providerId;
  }

  const [commissions, total] = await Promise.all([
    prisma.pIQ_Commission.findMany({
      where,
      include: {
        PIQ_Bookings: {
          include: {
            PIQ_Service_Master: true,
            PIQ_User: {
              select: {
                user_id: true,
                user_full_name: true,
              },
            },
          },
        },
        PIQ_Service_Provider: {
          select: {
            service_provider_id: true,
            serv_provider_name: true,
            serv_provider_email: true,
          },
        },
        PIQ_Payments: {
          select: {
            payment_id: true,
            razorpay_payment_id: true,
            transaction_date: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.pIQ_Commission.count({ where }),
  ]);

  return {
    commissions: commissions.map((c) => ({
      commission_id: c.commission_id,
      booking_id: c.booking_id,
      payment_id: c.payment_id,
      booking_amount: Number(c.booking_amount),
      commission_percent: Number(c.commission_percent),
      commission_amount: Number(c.commission_amount),
      provider_amount: Number(c.provider_amount),
      status: c.status,
      created_at: c.created_at,
      settled_at: c.settled_at,
      provider: c.PIQ_Service_Provider,
      booking: {
        booking_id: c.PIQ_Bookings.booking_id,
        service: c.PIQ_Bookings.PIQ_Service_Master,
        user: c.PIQ_Bookings.PIQ_User,
      },
      payment: c.PIQ_Payments,
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
 * Admin: Get commission statistics
 */
const getCommissionStats = async () => {
  const [totalCommissions, calculatedCommissions, settledCommissions, revenueResult] =
    await Promise.all([
      prisma.pIQ_Commission.count(),
      prisma.pIQ_Commission.count({ where: { status: 'calculated' } }),
      prisma.pIQ_Commission.count({ where: { status: 'settled' } }),
      prisma.pIQ_Commission.aggregate({
        _sum: { commission_amount: true },
      }),
    ]);

  const totalRevenue = revenueResult._sum.commission_amount
    ? Number(revenueResult._sum.commission_amount)
    : 0;

  return {
    total_commissions: totalCommissions,
    calculated_commissions: calculatedCommissions,
    settled_commissions: settledCommissions,
    total_commission_revenue: totalRevenue,
    currency: 'INR',
  };
};

/**
 * Admin: Mark commission as settled
 */
const settleCommission = async (commissionId: number) => {
  const commission = await prisma.pIQ_Commission.findUnique({
    where: { commission_id: commissionId },
  });

  if (!commission) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Commission record not found');
  }

  if (commission.status === 'settled') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Commission already settled');
  }

  const updated = await prisma.pIQ_Commission.update({
    where: { commission_id: commissionId },
    data: {
      status: 'settled',
      settled_at: new Date(),
    },
  });

  return {
    commission_id: updated.commission_id,
    status: updated.status,
    settled_at: updated.settled_at,
  };
};

/**
 * Provider: Get commission breakdown for their earnings
 */
const getProviderCommissions = async (
  providerId: number,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const [commissions, total] = await Promise.all([
    prisma.pIQ_Commission.findMany({
      where: { service_provider_id: providerId },
      include: {
        PIQ_Bookings: {
          include: {
            PIQ_Service_Master: true,
          },
        },
        PIQ_Payments: {
          select: {
            transaction_date: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.pIQ_Commission.count({ where: { service_provider_id: providerId } }),
  ]);

  return {
    commissions: commissions.map((c) => ({
      commission_id: c.commission_id,
      booking_id: c.booking_id,
      booking_amount: Number(c.booking_amount),
      commission_percent: Number(c.commission_percent),
      commission_amount: Number(c.commission_amount),
      provider_amount: Number(c.provider_amount),
      status: c.status,
      created_at: c.created_at,
      transaction_date: c.PIQ_Payments.transaction_date,
      service: c.PIQ_Bookings.PIQ_Service_Master,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const commissionService = {
  calculateCommission,
  getCommissionByPayment,
  getAllCommissions,
  getCommissionStats,
  settleCommission,
  getProviderCommissions,
};
