import Joi from 'joi';

export const reviewValidation = {
  createReview: {
    params: Joi.object().keys({
      providerId: Joi.number().integer().positive().required(),
    }),
    body: Joi.object().keys({
      booking_id: Joi.number().integer().positive().required(),
      rating: Joi.number().integer().min(1).max(5).required(),
      review_text: Joi.string().max(1000).allow('', null),
    }),
  },
  getProviderReviews: {
    params: Joi.object().keys({
      providerId: Joi.number().integer().positive().required(),
    }),
    query: Joi.object().keys({
      page: Joi.number().integer().min(1),
      limit: Joi.number().integer().min(1).max(50),
    }),
  },
  getUserReviews: {
    query: Joi.object().keys({
      page: Joi.number().integer().min(1),
      limit: Joi.number().integer().min(1).max(50),
    }),
  },
  deleteReview: {
    params: Joi.object().keys({
      reviewId: Joi.number().integer().positive().required(),
    }),
  },
};
