import express from 'express';
import { analyticsController } from '../../controllers/admin/analytics.controller.js';
import { auth } from '../../../middlewares/auth.js'; // Correct auth middleware

const router = express.Router();

/**
 * Admin analytics routes (requires admin authentication)
 */

// User metrics
router.get(
  '/user-metrics',
  auth('admin'),
  analyticsController.getUserMetrics
);

router.get(
  '/user-demographics',
  auth('admin'),
  analyticsController.getUserDemographics
);

// Revenue metrics
router.get(
  '/revenue-metrics',
  auth('admin'),
  analyticsController.getRevenueMetrics
);

// Service metrics
router.get(
  '/service-metrics',
  auth('admin'),
  analyticsController.getServiceMetrics
);

export default router;
