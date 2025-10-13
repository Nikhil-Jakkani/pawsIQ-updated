import httpStatus from 'http-status';
import prisma from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';

const serializeBigInt = <T>(data: T): T => {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
  ) as T;
};

/**
 * Create a review for a provider
 * @param userId - User creating the review
 * @param providerId - Service provider being reviewed
 * @param bookingId - Related booking ID (required)
 * @param rating - Rating (1-5)
 * @param reviewText - Optional review comment
 */
const createReview = async (
  userId: bigint,
  providerId: number,
  bookingId: number,
  rating: number,
  reviewText?: string | null
) => {
  // Validate rating range
  if (rating < 1 || rating > 5) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Rating must be between 1 and 5');
  }

  // Validate booking_id is provided
  if (!bookingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID is required to create a review');
  }

  // Check if provider exists
  const provider = await prisma.pIQ_Service_Provider.findUnique({
    where: { service_provider_id: providerId },
  });
  if (!provider) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provider not found');
  }

  // Verify booking exists and belongs to user
  const booking = await prisma.pIQ_Bookings.findFirst({
    where: {
      booking_id: bookingId,
      user_id: userId,
      service_provider_id: providerId,
    },
  });

  if (!booking) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Booking not found or does not belong to you'
    );
  }

  // Check if booking is reviewable
  // Allow reviews for any booking that belongs to the user and is not cancelled/rejected
  const disallowedStatuses = ['Cancelled', 'Rejected'];

  if (disallowedStatuses.includes(booking.booking_status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot review cancelled or rejected bookings'
    );
  }

  // Debug logging to help diagnose future issues (non-blocking)
  console.log('[Review Validation]', {
    bookingId,
    booked_dtm: booking.booked_dtm,
    booking_status: booking.booking_status,
  });

  // Check if review already exists for this booking
  const existingReview = await prisma.pIQ_Provider_Reviews.findFirst({
    where: { booking_id: bookingId },
  });

  if (existingReview) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'You have already reviewed this booking'
    );
  }

  // Create the review
  const review = await prisma.pIQ_Provider_Reviews.create({
    data: {
      service_provider_id: providerId,
      user_id: userId,
      booking_id: bookingId,
      rating,
      review_text: reviewText ?? null,
      reviewed_at: new Date(),
    },
  });

  // Update provider's average rating
  await updateProviderRating(providerId);

  return serializeBigInt(review);
};

/**
 * Get all reviews for a provider
 * @param providerId - Service provider ID
 * @param page - Page number (default 1)
 * @param limit - Items per page (default 10)
 */
const getProviderReviews = async (
  providerId: number,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.pIQ_Provider_Reviews.findMany({
      where: { service_provider_id: providerId },
      orderBy: { reviewed_at: 'desc' },
      skip,
      take: limit,
      include: {
        PIQ_User: {
          select: {
            user_id: true,
            user_full_name: true,
          },
        },
      },
    }),
    prisma.pIQ_Provider_Reviews.count({
      where: { service_provider_id: providerId },
    }),
  ]);

  const reviewsWithUser = reviews.map((review: any) => ({
    review_id: serializeBigInt(review.review_id),
    rating: review.rating,
    review_text: review.review_text,
    reviewed_at: review.reviewed_at,
    booking_id: serializeBigInt(review.booking_id),
    user: {
      user_id: serializeBigInt(review.PIQ_User?.user_id),
      user_full_name: review.PIQ_User?.user_full_name ?? 'Anonymous',
    },
  }));

  // Calculate average rating and rating breakdown
  const avgRating = await prisma.pIQ_Provider_Reviews.aggregate({
    where: { service_provider_id: providerId },
    _avg: { rating: true },
  });

  const ratingBreakdown = await prisma.pIQ_Provider_Reviews.groupBy({
    by: ['rating'],
    where: { service_provider_id: providerId },
    _count: { rating: true },
  });

  const breakdown = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };
  ratingBreakdown.forEach((item: any) => {
    breakdown[item.rating as keyof typeof breakdown] = item._count.rating;
  });

  return {
    reviews: reviewsWithUser,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    summary: {
      averageRating: avgRating._avg.rating ? Number(avgRating._avg.rating.toFixed(1)) : 0,
      totalReviews: total,
      ratingBreakdown: breakdown,
    },
  };
};

interface AdminReviewFilters {
  page?: number;
  limit?: number;
  rating?: number;
  status?: string;
  providerId?: number;
  search?: string;
}

const getAllReviewsForAdmin = async ({
  page = 1,
  limit = 20,
  rating,
  status,
  providerId,
  search,
}: AdminReviewFilters) => {
  const take = Math.min(limit, 100);
  const skip = (page - 1) * take;

  const where: any = {};

  if (rating) {
    where.rating = rating;
  }

  if (status) {
    where.status = status;
  }

  if (providerId) {
    where.service_provider_id = providerId;
  }

  if (search) {
    where.OR = [
      {
        review_text: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        PIQ_User: {
          user_full_name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
      {
        PIQ_Service_Provider: {
          serv_provider_name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  const [reviews, total] = await Promise.all([
    prisma.pIQ_Provider_Reviews.findMany({
      where,
      orderBy: { reviewed_at: 'desc' },
      skip,
      take,
      include: {
        PIQ_User: {
          select: {
            user_id: true,
            user_full_name: true,
            user_email_id: true,
          },
        },
        PIQ_Service_Provider: {
          select: {
            service_provider_id: true,
            serv_provider_name: true,
            serv_provider_email: true,
            serv_provider_type: true,
          },
        },
        PIQ_Bookings: {
          select: {
            booking_id: true,
            booking_status: true,
          },
        },
      },
    }),
    prisma.pIQ_Provider_Reviews.count({ where }),
  ]);

  const items = reviews.map((review: any) => ({
    review_id: Number(review.review_id),
    rating: review.rating,
    review_text: review.review_text,
    reviewed_at: review.reviewed_at,
    status: review.status,
    helpful: review.helpful_count ?? 0,
    unhelpful: review.unhelpful_count ?? 0,
    flagged: review.flagged ?? false,
    response: review.response_text,
    response_date: review.response_at,
    provider: review.PIQ_Service_Provider
      ? {
          id: review.PIQ_Service_Provider.service_provider_id,
          name: review.PIQ_Service_Provider.serv_provider_name,
          email: review.PIQ_Service_Provider.serv_provider_email,
          type: review.PIQ_Service_Provider.serv_provider_type,
        }
      : null,
    customer: review.PIQ_User
      ? {
          id: review.PIQ_User.user_id ? Number(review.PIQ_User.user_id) : undefined,
          name: review.PIQ_User.user_full_name,
          email: review.PIQ_User.user_email_id,
        }
      : null,
    booking: review.PIQ_Bookings
      ? {
          id: review.PIQ_Bookings.booking_id,
          status: review.PIQ_Bookings.booking_status,
          appointment_date: review.PIQ_Bookings.appointment_date,
        }
      : null,
  }));

  return {
    items,
    pagination: {
      page,
      limit: take,
      total,
      pages: Math.ceil(total / take),
    },
  };
};

/**
 * Update provider's average rating (internal helper)
 */
const updateProviderRating = async (providerId: number) => {
  const avgRating = await prisma.pIQ_Provider_Reviews.aggregate({
    where: { service_provider_id: providerId },
    _avg: { rating: true },
  });

  const averageRating = avgRating._avg.rating
    ? Number(avgRating._avg.rating.toFixed(1))
    : 0;
};

/**
 * Get user's reviews (reviews they have written)
 */
const getUserReviews = async (userId: bigint, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.pIQ_Provider_Reviews.findMany({
      where: { user_id: userId },
      orderBy: { reviewed_at: 'desc' },
      skip,
      take: limit,
      include: {
        PIQ_Service_Provider: {
          select: {
            service_provider_id: true,
            serv_provider_name: true,
            serv_provider_type: true,
          },
        },
      },
    }),
    prisma.pIQ_Provider_Reviews.count({ where: { user_id: userId } }),
  ]);

  return {
    reviews: reviews.map((review: any) => serializeBigInt(review)),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Delete a review (user can delete their own review)
 */
const deleteReview = async (userId: bigint, reviewId: number) => {
  const review = await prisma.pIQ_Provider_Reviews.findFirst({
    where: {
      review_id: reviewId,
      user_id: userId,
    },
  });

  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found or unauthorized');
  }

  await prisma.pIQ_Provider_Reviews.delete({
    where: { review_id: reviewId },
  });

  // Update provider rating after deletion
  await updateProviderRating(review.service_provider_id);

  return { success: true };
};

export const reviewService = {
  createReview,
  getProviderReviews,
  getUserReviews,
  deleteReview,
  getAllReviewsForAdmin,
};
