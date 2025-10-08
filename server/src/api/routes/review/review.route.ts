import express from 'express';
import { reviewController } from '../../controllers/review/review.controller.js';
import { validate } from '../../middlewares/validate.js';
import { reviewValidation } from '../../validations/review/review.validation.js';
import { auth } from '../../../middlewares/auth.js';

const router = express.Router();

// Provider reviews (public can view, authenticated users can create)
router
  .route('/providers/:providerId/reviews')
  .get(validate(reviewValidation.getProviderReviews), reviewController.getProviderReviews)
  .post(auth('user'), validate(reviewValidation.createReview), reviewController.createReview);

// User's own reviews (authenticated)
router
  .route('/user/reviews')
  .get(auth('user'), validate(reviewValidation.getUserReviews), reviewController.getUserReviews);

router
  .route('/user/reviews/:reviewId')
  .delete(auth('user'), validate(reviewValidation.deleteReview), reviewController.deleteReview);

export default router;
