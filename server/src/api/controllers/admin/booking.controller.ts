import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { adminBookingService } from '../../services/admin/booking.service.js';

/**
 * Admin Booking Management Controller
 * Handles all admin operations for booking oversight and management
 */

// List all bookings with pagination and filtering
export const listBookings = catchAsync(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
  const status = String(req.query.status || '').trim();
  const search = String(req.query.search || '').trim();
  const serviceType = String(req.query.serviceType || '').trim();
  const startDate = String(req.query.startDate || '').trim();
  const endDate = String(req.query.endDate || '').trim();

  const result = await adminBookingService.list({
    page,
    limit,
    status,
    search,
    serviceType,
    startDate,
    endDate,
  });

  res.status(httpStatus.OK).send(result);
});

// Get booking by ID with full details
export const getBookingById = catchAsync(async (req, res) => {
  const bookingId = Number(req.params.id);
  
  if (!bookingId || isNaN(bookingId)) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'Invalid booking ID',
    });
  }

  const booking = await adminBookingService.getById(bookingId);
  
  if (!booking) {
    return res.status(httpStatus.NOT_FOUND).send({
      message: 'Booking not found',
    });
  }

  res.status(httpStatus.OK).send(booking);
});

// Update booking status
export const updateBookingStatus = catchAsync(async (req, res) => {
  const bookingId = Number(req.params.id);
  const { status, reason } = req.body;

  if (!bookingId || isNaN(bookingId)) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'Invalid booking ID',
    });
  }

  if (!status) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'Status is required',
    });
  }

  const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'disputed'];
  if (!validStatuses.includes(status.toLowerCase())) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  const booking = await adminBookingService.updateStatus(bookingId, status, reason);
  
  res.status(httpStatus.OK).send({
    message: 'Booking status updated successfully',
    booking,
  });
});

// Reschedule booking
export const rescheduleBooking = catchAsync(async (req, res) => {
  const bookingId = Number(req.params.id);
  const { newDate, reason } = req.body;

  if (!bookingId || isNaN(bookingId)) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'Invalid booking ID',
    });
  }

  if (!newDate) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'New date is required',
    });
  }

  // Validate date format
  const dateObj = new Date(newDate);
  if (isNaN(dateObj.getTime())) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'Invalid date format',
    });
  }

  const booking = await adminBookingService.reschedule(bookingId, dateObj, reason);
  
  res.status(httpStatus.OK).send({
    message: 'Booking rescheduled successfully',
    booking,
  });
});

// Cancel booking
export const cancelBooking = catchAsync(async (req, res) => {
  const bookingId = Number(req.params.id);
  const { reason } = req.body;

  if (!bookingId || isNaN(bookingId)) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'Invalid booking ID',
    });
  }

  const booking = await adminBookingService.cancel(bookingId, reason || 'Cancelled by admin');
  
  res.status(httpStatus.OK).send({
    message: 'Booking cancelled successfully',
    booking,
  });
});

// Get booking statistics
export const getBookingStats = catchAsync(async (req, res) => {
  const stats = await adminBookingService.getStats();
  res.status(httpStatus.OK).send(stats);
});

// Bulk update bookings
export const bulkUpdateBookings = catchAsync(async (req, res) => {
  const { bookingIds, status, reason } = req.body;

  if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'bookingIds array is required',
    });
  }

  if (!status) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'Status is required',
    });
  }

  const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'disputed'];
  if (!validStatuses.includes(status.toLowerCase())) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  const result = await adminBookingService.bulkUpdate(bookingIds, status, reason);
  
  res.status(httpStatus.OK).send({
    message: `${result.count} bookings updated successfully`,
    ...result,
  });
});

// Delete booking (soft delete)
export const deleteBooking = catchAsync(async (req, res) => {
  const bookingId = Number(req.params.id);

  if (!bookingId || isNaN(bookingId)) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'Invalid booking ID',
    });
  }

  await adminBookingService.deleteBooking(bookingId);
  
  res.status(httpStatus.OK).send({
    message: 'Booking deleted successfully',
  });
});

export const bookingController = {
  listBookings,
  getBookingById,
  updateBookingStatus,
  rescheduleBooking,
  cancelBooking,
  getBookingStats,
  bulkUpdateBookings,
  deleteBooking,
};
