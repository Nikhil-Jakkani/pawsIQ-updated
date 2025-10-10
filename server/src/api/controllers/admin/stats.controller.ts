import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { statsService } from '../../services/admin/stats.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

const getCached = (key: string) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

const parseDate = (value?: string | string[]) => {
  if (!value) {
    return undefined;
  }

  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return undefined;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${raw}`);
  }

  return date;
};

const buildRangeFromQuery = (req: Request) => {
  const startDate = parseDate(req.query.startDate as string | undefined);
  const endDate = parseDate(req.query.endDate as string | undefined);

  if (startDate && endDate && startDate > endDate) {
    throw new Error('startDate cannot be greater than endDate');
  }

  return { startDate, endDate };
};

/**
 * Get dashboard statistics
 */
const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = 'dashboard_stats';
  const cached = getCached(cacheKey);
  
  if (cached) {
    return res.status(httpStatus.OK).json(cached);
  }
  
  const stats = await statsService.getDashboardStats();
  setCache(cacheKey, stats);
  res.status(httpStatus.OK).json(stats);
});

/**
 * Get provider counts by service type
 */
const getProviderCountsByType = catchAsync(async (req: Request, res: Response) => {
  const cacheKey = 'provider_counts_by_type';
  const cached = getCached(cacheKey);
  
  if (cached) {
    return res.status(httpStatus.OK).json(cached);
  }
  
  const serviceTypes = await statsService.getProviderCountsByType();
  const result = { items: serviceTypes };
  setCache(cacheKey, result);
  res.status(httpStatus.OK).json(result);
});

/**
 * Get bulk user stats for user list
 */
const getBulkUserStats = catchAsync(async (req: Request, res: Response) => {
  const userIds = req.body.userIds || [];
  const stats = await statsService.getBulkUserStats(userIds);
  res.status(httpStatus.OK).json(stats);
});

const getRevenueSummary = catchAsync(async (req: Request, res: Response) => {
  try {
    const range = buildRangeFromQuery(req);
    const cacheKey = `revenue_summary_${range.startDate}_${range.endDate}`;
    const cached = getCached(cacheKey);
    
    if (cached) {
      return res.status(httpStatus.OK).json(cached);
    }
    
    const summary = await statsService.getRevenueSummary(range);
    const result = {
      data: summary,
      meta: {
        range,
      },
    };
    setCache(cacheKey, result);
    res.status(httpStatus.OK).json(result);
  } catch (error: any) {
    res.status(httpStatus.BAD_REQUEST).json({
      message: error?.message || 'Invalid request parameters',
    });
  }
});

const getRevenueSeries = catchAsync(async (req: Request, res: Response) => {
  try {
    const interval = String(req.query.interval || 'daily').toLowerCase();
    if (!['daily', 'weekly', 'monthly'].includes(interval)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: 'interval must be one of daily, weekly, monthly',
      });
    }

    const pointsRaw = Number(req.query.points) || 30;
    const points = Math.max(1, Math.min(pointsRaw, 180));

    const series = await statsService.getRevenueSeries(interval as any, points);
    res.status(httpStatus.OK).json({
      data: series,
      meta: {
        interval,
        points,
      },
    });
  } catch (error: any) {
    res.status(httpStatus.BAD_REQUEST).json({
      message: error?.message || 'Invalid request parameters',
    });
  }
});

const getBookingBreakdown = catchAsync(async (req: Request, res: Response) => {
  try {
    const range = buildRangeFromQuery(req);
    const cacheKey = `booking_breakdown_${range.startDate}_${range.endDate}`;
    const cached = getCached(cacheKey);
    
    if (cached) {
      return res.status(httpStatus.OK).json(cached);
    }
    
    const breakdown = await statsService.getBookingBreakdownByType(range);
    const result = {
      data: breakdown,
      meta: {
        range,
      },
    };
    setCache(cacheKey, result);
    res.status(httpStatus.OK).json(result);
  } catch (error: any) {
    res.status(httpStatus.BAD_REQUEST).json({
      message: error?.message || 'Invalid request parameters',
    });
  }
});

const getEngagementOverview = catchAsync(async (_req: Request, res: Response) => {
  const cacheKey = 'engagement_overview';
  const cached = getCached(cacheKey);
  
  if (cached) {
    return res.status(httpStatus.OK).json(cached);
  }
  
  const overview = await statsService.getEngagementOverview();
  const result = {
    data: overview,
    meta: {
      generatedAt: new Date().toISOString(),
    },
  };
  setCache(cacheKey, result);
  res.status(httpStatus.OK).json(result);
});

export const statsController = {
  getDashboardStats,
  getProviderCountsByType,
  getBulkUserStats,
  getRevenueSummary,
  getRevenueSeries,
  getBookingBreakdown,
  getEngagementOverview,
};
