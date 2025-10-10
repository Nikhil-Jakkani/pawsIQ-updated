import { Router } from 'express';
import { auth } from '../../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { adminReviewController } from '../../controllers/admin/review.controller.js';
import { adminReviewValidation } from '../../validations/admin/review.validation.js';

const router = Router();

router
  .route('/')
  .get(
    auth('admin'),
    validate(adminReviewValidation.getAdminReviews),
    adminReviewController.getAllReviews
  );

export default router;
