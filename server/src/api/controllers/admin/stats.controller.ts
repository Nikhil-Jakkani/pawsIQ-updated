import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { statsService } from '../../services/admin/stats.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

/**
 * Get dashboard statistics
 */
const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await statsService.getDashboardStats();
  res.status(httpStatus.OK).json(stats);
});

/**
 * Get provider counts by service type
 */
const getProviderCountsByType = catchAsync(async (req: Request, res: Response) => {
  const serviceTypes = await statsService.getProviderCountsByType();
  res.status(httpStatus.OK).json({ items: serviceTypes });
});

/**
 * Get bulk user stats for user list
 */
const getBulkUserStats = catchAsync(async (req: Request, res: Response) => {
  const userIds = req.body.userIds || [];
  const stats = await statsService.getBulkUserStats(userIds);
  res.status(httpStatus.OK).json(stats);
});

export const statsController = {
  getDashboardStats,
  getProviderCountsByType,
  getBulkUserStats,
};
