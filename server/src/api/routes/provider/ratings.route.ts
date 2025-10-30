import express from 'express';
import { ratingsController } from '../../controllers/provider/ratings.controller.js';

const router = express.Router();

/**
 * Provider ratings and services routes (public access for viewing)
 */

// Get provider ratings
router.get(
  '/:providerId/ratings',
  ratingsController.getProviderRatings
);

// Get provider services
router.get(
  '/services',
  ratingsController.getProviderServices
);

export default router;
