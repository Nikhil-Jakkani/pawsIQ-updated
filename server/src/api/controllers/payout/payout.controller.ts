import { Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { payoutService } from '../../services/payout/payout.service.js';

/**
 * Provider: Request a payout
 * POST /provider/payouts/request
 */
const requestPayout = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;
  const { amount, currency, remarks } = req.body;

  const payout = await payoutService.requestPayout(
    providerId,
    Number(amount),
    currency,
    remarks
  );

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Payout request submitted successfully',
    data: payout,
  });
});

/**
 * Provider: Get payout history
 * GET /provider/payouts
 */
const getMyPayouts = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;

  const payouts = await payoutService.getProviderPayouts(providerId);

  res.status(httpStatus.OK).json({
    success: true,
    data: payouts,
  });
});

/**
 * Provider: Get available balance
 * GET /provider/payouts/balance
 */
const getMyBalance = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;

  const balance = await payoutService.getAvailableBalance(providerId);

  res.status(httpStatus.OK).json({
    success: true,
    data: balance,
  });
});

/**
 * Admin: Get all payout requests
 * GET /admin/payouts
 */
const getAllPayouts = catchAsync(async (req: any, res: Response) => {
  const { status, page, limit } = req.query;

  const data = await payoutService.getAllPayoutRequests(
    status as string,
    Number(page) || 1,
    Number(limit) || 20
  );

  res.status(httpStatus.OK).json({
    success: true,
    data,
  });
});

/**
 * Admin: Approve payout
 * POST /admin/payouts/:payoutId/approve
 */
const approvePayout = catchAsync(async (req: any, res: Response) => {
  const { payoutId } = req.params;
  const { reference_number, remarks } = req.body;

  const payout = await payoutService.approvePayout(
    Number(payoutId),
    reference_number,
    remarks
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Payout approved and marked as processing',
    data: payout,
  });
});

/**
 * Admin: Complete payout
 * POST /admin/payouts/:payoutId/complete
 */
const completePayout = catchAsync(async (req: any, res: Response) => {
  const { payoutId } = req.params;
  const { reference_number, remarks } = req.body;

  const payout = await payoutService.completePayout(
    Number(payoutId),
    reference_number,
    remarks
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Payout marked as completed',
    data: payout,
  });
});

/**
 * Admin: Reject payout
 * POST /admin/payouts/:payoutId/reject
 */
const rejectPayout = catchAsync(async (req: any, res: Response) => {
  const { payoutId } = req.params;
  const { remarks } = req.body;

  const payout = await payoutService.rejectPayout(Number(payoutId), remarks);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Payout request rejected',
    data: payout,
  });
});

export const payoutController = {
  requestPayout,
  getMyPayouts,
  getMyBalance,
  getAllPayouts,
  approvePayout,
  completePayout,
  rejectPayout,
};
