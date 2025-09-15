import express from 'express';
import { auth } from '../../../middlewares/auth.js';
import { providerBookingController } from '../../controllers/provider/providerBooking.controller.js';

const router = express.Router();

router.get('/', auth('provider'), providerBookingController.listPending);

router.post('/:id/approve', auth('provider'), providerBookingController.approve);

router.post('/:id/decline', auth('provider'), providerBookingController.decline);

export default router;
