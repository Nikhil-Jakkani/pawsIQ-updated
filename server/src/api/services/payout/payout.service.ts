import httpStatus from 'http-status';
import prisma from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Request a payout for provider
 */
const requestPayout = async (
  serviceProviderId: number,
  amount: number,
  currency: string = 'INR',
  remarks?: string
) => {
  // Validate provider exists
  const provider = await prisma.pIQ_Service_Provider.findUnique({
    where: { service_provider_id: serviceProviderId },
  });

  if (!provider) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provider not found');
  }

  // Check if provider has pending payout requests
  const pendingPayout = await prisma.pIQ_Provider_Payouts.findFirst({
    where: {
      service_provider_id: serviceProviderId,
      status: { in: ['Pending', 'Processing'] },
    },
  });

  if (pendingPayout) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'You already have a pending payout request'
    );
  }

  // Validate minimum payout amount (e.g., 100 INR)
  if (amount < 100) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Minimum payout amount is ₹100'
    );
  }

  // Calculate available earnings from commissions (provider_amount after platform fee)
  const providerCommissions = await prisma.pIQ_Commission.findMany({
    where: {
      service_provider_id: serviceProviderId,
      status: { in: ['calculated', 'settled'] },
    },
  });

  const totalEarnings = providerCommissions.reduce((sum, commission) => {
    return sum + Number(commission.provider_amount);
  }, 0);

  // Get total already paid out
  const previousPayouts = await prisma.pIQ_Provider_Payouts.findMany({
    where: {
      service_provider_id: serviceProviderId,
      status: { in: ['Completed', 'Processing'] },
    },
  });

  const totalPaidOut = previousPayouts.reduce(
    (sum, payout) => sum + Number(payout.amount),
    0
  );

  const availableBalance = totalEarnings - totalPaidOut;

  if (amount > availableBalance) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Insufficient balance. Available: ₹${availableBalance.toFixed(2)}`
    );
  }

  // Create payout request
  const payout = await prisma.pIQ_Provider_Payouts.create({
    data: {
      service_provider_id: serviceProviderId,
      amount: new Decimal(amount),
      currency,
      status: 'Pending',
      remarks: remarks || null,
    },
  });

  return {
    payout_id: payout.payout_id,
    amount: Number(payout.amount),
    currency: payout.currency,
    status: payout.status,
    initiated_at: payout.initiated_at,
    available_balance: availableBalance,
  };
};

/**
 * Get provider's payout history
 */
const getProviderPayouts = async (serviceProviderId: number) => {
  const payouts = await prisma.pIQ_Provider_Payouts.findMany({
    where: { service_provider_id: serviceProviderId },
    orderBy: { initiated_at: 'desc' },
  });

  return payouts.map((payout) => ({
    payout_id: payout.payout_id,
    amount: Number(payout.amount),
    currency: payout.currency,
    status: payout.status,
    initiated_at: payout.initiated_at,
    settled_at: payout.settled_at,
    reference_number: payout.reference_number,
    remarks: payout.remarks,
  }));
};

/**
 * Get provider's available balance
 */
const getAvailableBalance = async (serviceProviderId: number) => {
  // Calculate total earnings from completed bookings
  const completedBookings = await prisma.pIQ_Bookings.findMany({
    where: {
      service_provider_id: serviceProviderId,
      booking_status: 'Completed',
    },
    include: {
      PIQ_Payments: {
        where: { payment_status: 'success' },
      },
    },
  });

  const totalEarnings = completedBookings.reduce((sum, booking) => {
    const payment = booking.PIQ_Payments[0];
    return sum + (payment ? Number(payment.amount) : 0);
  }, 0);

  // Get total already paid out
  const previousPayouts = await prisma.pIQ_Provider_Payouts.findMany({
    where: {
      service_provider_id: serviceProviderId,
      status: { in: ['Completed', 'Processing'] },
    },
  });

  const totalPaidOut = previousPayouts.reduce(
    (sum, payout) => sum + Number(payout.amount),
    0
  );

  const pendingPayouts = await prisma.pIQ_Provider_Payouts.findMany({
    where: {
      service_provider_id: serviceProviderId,
      status: 'Pending',
    },
  });

  const totalPending = pendingPayouts.reduce(
    (sum, payout) => sum + Number(payout.amount),
    0
  );

  return {
    total_earnings: totalEarnings,
    total_paid_out: totalPaidOut,
    pending_payout: totalPending,
    available_balance: totalEarnings - totalPaidOut - totalPending,
    currency: 'INR',
  };
};

/**
 * Admin: Get all payout requests
 */
const getAllPayoutRequests = async (
  status?: string,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) {
    where.status = status;
  }

  const [payouts, total] = await Promise.all([
    prisma.pIQ_Provider_Payouts.findMany({
      where,
      orderBy: { initiated_at: 'desc' },
      skip,
      take: limit,
      include: {
        PIQ_Service_Provider: {
          select: {
            service_provider_id: true,
            serv_provider_name: true,
            serv_provider_email: true,
            serv_provider_contact_nbr: true,
          },
        },
      },
    }),
    prisma.pIQ_Provider_Payouts.count({ where }),
  ]);

  return {
    payouts: payouts.map((p) => ({
      payout_id: p.payout_id,
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status,
      initiated_at: p.initiated_at,
      settled_at: p.settled_at,
      reference_number: p.reference_number,
      remarks: p.remarks,
      provider: p.PIQ_Service_Provider,
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
 * Admin: Approve payout request
 */
const approvePayout = async (
  payoutId: number,
  referenceNumber?: string,
  remarks?: string
) => {
  const payout = await prisma.pIQ_Provider_Payouts.findUnique({
    where: { payout_id: payoutId },
  });

  if (!payout) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payout request not found');
  }

  if (payout.status !== 'Pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot approve payout with status: ${payout.status}`
    );
  }

  const updated = await prisma.pIQ_Provider_Payouts.update({
    where: { payout_id: payoutId },
    data: {
      status: 'Processing',
      reference_number: referenceNumber || null,
      remarks: remarks || payout.remarks,
    },
  });

  return {
    payout_id: updated.payout_id,
    status: updated.status,
    reference_number: updated.reference_number,
  };
};

/**
 * Admin: Mark payout as completed
 */
const completePayout = async (
  payoutId: number,
  referenceNumber?: string,
  remarks?: string
) => {
  const payout = await prisma.pIQ_Provider_Payouts.findUnique({
    where: { payout_id: payoutId },
  });

  if (!payout) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payout request not found');
  }

  if (!['Pending', 'Processing'].includes(payout.status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot complete payout with status: ${payout.status}`
    );
  }

  const updated = await prisma.pIQ_Provider_Payouts.update({
    where: { payout_id: payoutId },
    data: {
      status: 'Completed',
      settled_at: new Date(),
      reference_number: referenceNumber || payout.reference_number,
      remarks: remarks || payout.remarks,
    },
  });

  return {
    payout_id: updated.payout_id,
    status: updated.status,
    settled_at: updated.settled_at,
    reference_number: updated.reference_number,
  };
};

/**
 * Admin: Reject payout request
 */
const rejectPayout = async (payoutId: number, remarks: string) => {
  const payout = await prisma.pIQ_Provider_Payouts.findUnique({
    where: { payout_id: payoutId },
  });

  if (!payout) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payout request not found');
  }

  if (payout.status !== 'Pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot reject payout with status: ${payout.status}`
    );
  }

  const updated = await prisma.pIQ_Provider_Payouts.update({
    where: { payout_id: payoutId },
    data: {
      status: 'Rejected',
      remarks,
    },
  });

  return {
    payout_id: updated.payout_id,
    status: updated.status,
    remarks: updated.remarks,
  };
};

export const payoutService = {
  requestPayout,
  getProviderPayouts,
  getAvailableBalance,
  getAllPayoutRequests,
  approvePayout,
  completePayout,
  rejectPayout,
};
