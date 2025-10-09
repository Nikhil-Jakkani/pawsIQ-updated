import { Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { reviewService } from '../../services/review/review.service.js';

/**
 * Create a review for a provider
 * POST /providers/:providerId/reviews
 */
const createReview = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const providerId = Number(req.params.providerId);
  const { booking_id, rating, review_text } = req.body;

  const review = await reviewService.createReview(
    userId,
    providerId,
    Number(booking_id),
    Number(rating),
    review_text
  );

  res.status(httpStatus.CREATED).json({
    success: true,
    data: review,
  });
});

/**
 * Get all reviews for a provider
 * GET /providers/:providerId/reviews
 */
const getProviderReviews = catchAsync(async (req: any, res: Response) => {
  const providerId = Number(req.params.providerId);
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const data = await reviewService.getProviderReviews(providerId, page, limit);

  res.status(httpStatus.OK).json({
    success: true,
    data,
  });
});

/**
 * Get user's own reviews
 * GET /user/reviews
 */
const getUserReviews = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const data = await reviewService.getUserReviews(userId, page, limit);

  res.status(httpStatus.OK).json({
    success: true,
    data,
  });
});

/**
 * Delete user's review
 * DELETE /user/reviews/:reviewId
 */
const deleteReview = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const reviewId = Number(req.params.reviewId);

  await reviewService.deleteReview(userId, reviewId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Review deleted successfully',
  });
});

export const reviewController = {
  createReview,
  getProviderReviews,
  getUserReviews,
  deleteReview,
};
