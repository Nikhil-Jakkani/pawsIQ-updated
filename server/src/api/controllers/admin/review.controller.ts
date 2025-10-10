import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { reviewService } from '../../services/review/review.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

const parseNumber = (value: unknown) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseString = (value: unknown) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const str = String(value).trim();
  return str.length ? str : undefined;
};

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await reviewService.getAllReviewsForAdmin({
    page: parseNumber(req.query.page) || 1,
    limit: parseNumber(req.query.limit) || 20,
    rating: parseNumber(req.query.rating),
    status: parseString(req.query.status),
    providerId: parseNumber(req.query.providerId),
    search: parseString(req.query.search),
  });

  res.status(httpStatus.OK).json({
    success: true,
    data: result.items,
    pagination: result.pagination,
  });
});

export const adminReviewController = {
  getAllReviews,
};
