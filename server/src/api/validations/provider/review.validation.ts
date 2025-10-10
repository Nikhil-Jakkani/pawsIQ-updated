import Joi from 'joi';

const getMyReviews = {
  query: Joi.object()
    .keys({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    })
    .unknown(false),
};

export const providerReviewValidation = {
  getMyReviews,
};
