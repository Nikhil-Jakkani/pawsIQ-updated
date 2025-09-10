import { Router } from 'express';
import { auth } from '../../../middlewares/auth.js';
import { validate } from '../../../middlewares/validate.js';
import { providerController } from '../../controllers/provider/index.js';
import { providerProfileValidation } from '../../validations/provider/index.js';

const router = Router();

router.get('/me', auth('provider'), providerController.getMyProfile);
router.patch('/me', auth('provider'), validate(providerProfileValidation.update), providerController.updateMyProfile);

export default router;
