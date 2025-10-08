import express from 'express';
import { portfolioController } from '../../controllers/portfolio/portfolio.controller.js';
import { validate } from '../../middlewares/validate.js';
import { portfolioValidation } from '../../validations/portfolio/portfolio.validation.js';
import { auth } from '../../middlewares/auth.js';

const router = express.Router();

/**
 * Public routes
 */
router.get(
  '/providers/:providerId/portfolio',
  validate(portfolioValidation.getPublicPortfolio),
  portfolioController.getPublicPortfolio
);

/**
 * Provider routes (requires provider auth)
 */
router.use(auth(['provider']));

router.post(
  '/portfolio/upload-url',
  validate(portfolioValidation.generateUploadUrl),
  portfolioController.generateUploadUrl
);

router
  .route('/portfolio')
  .get(portfolioController.getMyPortfolio)
  .post(validate(portfolioValidation.create), portfolioController.create);

router
  .route('/portfolio/:id')
  .get(validate(portfolioValidation.getItem), portfolioController.getItem)
  .patch(validate(portfolioValidation.update), portfolioController.update)
  .delete(validate(portfolioValidation.remove), portfolioController.remove);

export default router;
