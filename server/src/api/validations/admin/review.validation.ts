import Joi from 'joi';

const getAdminReviews = {
  query: Joi.object()
    .keys({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      rating: Joi.number().integer().min(1).max(5).optional(),
      status: Joi.string().valid('pending', 'published', 'rejected', 'under review').optional(),
      providerId: Joi.number().integer().optional(),
      search: Joi.string().trim().optional(),
    })
    .unknown(false),
};

export const adminReviewValidation = {
  getAdminReviews,
};
