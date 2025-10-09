import { Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { commissionService } from '../../services/commission/commission.service.js';

/**
 * Admin: Get all commission records
 * GET /admin/commissions
 */
const getAllCommissions = catchAsync(async (req: any, res: Response) => {
  const { status, provider_id, page, limit } = req.query;

  const result = await commissionService.getAllCommissions(
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
 * Admin: Get commission statistics
 * GET /admin/commissions/stats
 */
const getCommissionStats = catchAsync(async (req: any, res: Response) => {
  const stats = await commissionService.getCommissionStats();

  res.status(httpStatus.OK).json({
    success: true,
    data: stats,
  });
});

/**
 * Admin: Settle commission
 * POST /admin/commissions/:commissionId/settle
 */
const settleCommission = catchAsync(async (req: any, res: Response) => {
  const { commissionId } = req.params;

  const result = await commissionService.settleCommission(Number(commissionId));

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Commission marked as settled',
    data: result,
  });
});

/**
 * Provider: Get own commission records
 * GET /provider/commissions
 */
const getMyCommissions = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;
  const { page, limit } = req.query;

  const result = await commissionService.getProviderCommissions(
    providerId,
    Number(page) || 1,
    Number(limit) || 20
  );

  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
});

export const commissionController = {
  getAllCommissions,
  getCommissionStats,
  settleCommission,
  getMyCommissions,
};
