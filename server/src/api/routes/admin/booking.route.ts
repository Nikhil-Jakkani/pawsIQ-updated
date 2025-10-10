import { Router } from 'express';
import { auth } from '../../../middlewares/auth.js';
import { bookingController } from '../../controllers/admin/booking.controller.js';

const router = Router();

/**
 * Admin Booking Management Routes
 * All routes require admin authentication
 */

// List all bookings with advanced filtering
router.get('/', auth('admin'), bookingController.listBookings);

// Get booking statistics
router.get('/stats', auth('admin'), bookingController.getBookingStats);

// Bulk operations
router.post('/bulk-update', auth('admin'), bookingController.bulkUpdateBookings);

// Get specific booking by ID
router.get('/:id', auth('admin'), bookingController.getBookingById);

// Update booking status
router.patch('/:id/status', auth('admin'), bookingController.updateBookingStatus);

// Reschedule booking
router.post('/:id/reschedule', auth('admin'), bookingController.rescheduleBooking);

// Cancel booking
router.post('/:id/cancel', auth('admin'), bookingController.cancelBooking);

// Delete booking (soft delete)
router.delete('/:id', auth('admin'), bookingController.deleteBooking);

export default router;
