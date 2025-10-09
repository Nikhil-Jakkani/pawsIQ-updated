import express from 'express';
import { commissionController } from '../../controllers/commission/commission.controller.js';
import { validate } from '../../middlewares/validate.js';
import { commissionValidation } from '../../validations/commission/commission.validation.js';
import { auth } from '../../../middlewares/auth.js';

const adminRouter = express.Router();
const providerRouter = express.Router();

/**
 * Admin routes (requires admin authentication)
 */
adminRouter.get(
  '/',
  auth('admin'),
  validate(commissionValidation.getCommissions),
  commissionController.getAllCommissions
);

adminRouter.get(
  '/stats',
  auth('admin'),
  commissionController.getCommissionStats
);

adminRouter.post(
  '/:commissionId/settle',
  auth('admin'),
  validate(commissionValidation.settleCommission),
  commissionController.settleCommission
);

/**
 * Provider routes (requires provider authentication)
 */
providerRouter.get(
  '/',
  auth('provider'),
  validate(commissionValidation.getProviderCommissions),
  commissionController.getMyCommissions
);

export { adminRouter, providerRouter };
