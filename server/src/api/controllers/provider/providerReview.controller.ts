import { Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { reviewService } from '../../services/review/review.service.js';
import { ApiError } from '../../utils/ApiError.js';

const getMyReviews = catchAsync(async (req: any, res: Response) => {
  const providerId = Number(req.user?.service_provider_id);

  if (!providerId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Provider account not found');
  }

  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const data = await reviewService.getProviderReviews(providerId, page, limit);

  res.status(httpStatus.OK).json({
    success: true,
    data,
  });
});

export const providerReviewController = {
  getMyReviews,
};
