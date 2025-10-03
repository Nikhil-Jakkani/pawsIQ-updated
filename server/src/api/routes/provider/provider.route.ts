import { Router } from 'express';
import { auth } from '../../../middlewares/auth.js';
import { validate } from '../../../middlewares/validate.js';
import { providerController, providerServiceOfferingController } from '../../controllers/provider/index.js';
import { providerProfileValidation, providerServiceOfferingValidation } from '../../validations/provider/index.js';

const router = Router();

// Profile routes
router.get('/me', auth('provider'), providerController.getMyProfile);
router.patch('/me', auth('provider'), validate(providerProfileValidation.update), providerController.updateMyProfile);

// Service Offering routes
router.get('/services/available', auth('provider'), providerServiceOfferingController.listAvailableServices);
router.get('/services', auth('provider'), providerServiceOfferingController.listMyServiceOfferings);
router.get('/services/:offering_id', auth('provider'), validate(providerServiceOfferingValidation.getById), providerServiceOfferingController.getMyServiceOffering);
router.post('/services', auth('provider'), validate(providerServiceOfferingValidation.create), providerServiceOfferingController.createMyServiceOffering);
router.patch('/services/:offering_id', auth('provider'), validate(providerServiceOfferingValidation.update), providerServiceOfferingController.updateMyServiceOffering);
router.delete('/services/:offering_id', auth('provider'), validate(providerServiceOfferingValidation.deleteById), providerServiceOfferingController.deleteMyServiceOffering);

export default router;
