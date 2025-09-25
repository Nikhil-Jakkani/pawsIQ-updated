import express from 'express';
import { auth } from '../../../middlewares/auth.js';
import { availabilityController } from '../../controllers/booking/availability.controller.js';

const router = express.Router();

router.get('/availability/day', auth('user'), availabilityController.getDay);
router.get('/availability/range', auth('user'), availabilityController.getRange);

export default router;
