import express from 'express';
import { aiController } from '../../controllers/user/index.js';
import { auth } from '../../../middlewares/auth.js';

const router = express.Router();

router.post('/suggestions', auth(), aiController.generatePetCareSuggestions);
router.post('/nutrition-from-image', auth(), aiController.analyzeFoodFromImage);
router.post('/analyze-symptoms', auth(), aiController.analyzePetSymptoms);

export default router;
