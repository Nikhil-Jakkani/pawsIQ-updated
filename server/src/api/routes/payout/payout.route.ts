import express from 'express';
import { payoutController } from '../../controllers/payout/payout.controller.js';
import { validate } from '../../middlewares/validate.js';
import { payoutValidation } from '../../validations/payout/payout.validation.js';
import { auth } from '../../../middlewares/auth.js';

const providerRouter = express.Router();
const adminRouter = express.Router();

/**
 * Provider routes (requires provider authentication)
 */
providerRouter.get('/', auth('provider'), payoutController.getMyPayouts);
providerRouter.get('/balance', auth('provider'), payoutController.getMyBalance);
providerRouter.post(
  '/request',
  auth('provider'),
  validate(payoutValidation.requestPayout),
  payoutController.requestPayout
);

/**
 * Admin routes (requires admin authentication)
 */
adminRouter.get(
  '/',
  auth('admin'),
  validate(payoutValidation.getPayouts),
  payoutController.getAllPayouts
);

adminRouter.post(
  '/:payoutId/approve',
  auth('admin'),
  validate(payoutValidation.approvePayout),
  payoutController.approvePayout
);

adminRouter.post(
  '/:payoutId/complete',
  auth('admin'),
  validate(payoutValidation.completePayout),
  payoutController.completePayout
);

adminRouter.post(
  '/:payoutId/reject',
  auth('admin'),
  validate(payoutValidation.rejectPayout),
  payoutController.rejectPayout
);

export { providerRouter, adminRouter };
