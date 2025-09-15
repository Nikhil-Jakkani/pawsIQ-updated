import express from 'express';
import { auth } from '../../../middlewares/auth.js';
import { providerBookingController } from '../../controllers/provider/providerBooking.controller.js';

const router = express.Router();

// List relevant bookings for this provider (defaults to Pending)
router.get('/', auth('provider'), providerBookingController.listPending);

// Approve a booking -> sets booking Confirmed and creates provider appointment
router.post('/:id/approve', auth('provider'), providerBookingController.approve);

// Decline a booking -> sets booking Cancelled
router.post('/:id/decline', auth('provider'), providerBookingController.decline);

export default router;
