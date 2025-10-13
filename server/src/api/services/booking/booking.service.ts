import httpStatus from 'http-status';
import prisma from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { notificationService } from '../notification/notification.service.js';
import { serializeBigInt } from '../../utils/bigIntSerializer.js';

export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';

const assertStatus = (status: string): BookingStatus => {
  const allowed: BookingStatus[] = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
  if (!allowed.includes(status as BookingStatus)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid booking_status. Allowed: ${allowed.join(', ')}`);
  }
  return status as BookingStatus;
};

const ensurePetBelongsToUser = async (userId: bigint, petId: bigint) => {
  const pet = await prisma.pIQ_Pets.findFirst({ where: { pet_id: petId, user_id: userId } });
  if (!pet) throw new ApiError(httpStatus.FORBIDDEN, 'Pet does not belong to user');
};

const createBooking = async (
  userId: bigint,
  body: {
    pet_id: number | string | bigint;
    services_id: number;
    biz_dtls_id?: number | null;
    service_provider_id?: number | null;
    booked_dtm: string;
    booking_comments?: string | null;
  }
) => {
  const pet_id = BigInt(body.pet_id);
  await ensurePetBelongsToUser(userId, pet_id);

  const service = await prisma.pIQ_Service_Master.findUnique({ where: { services_id: body.services_id } });
  if (!service) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid services_id');

  const booked = new Date(body.booked_dtm);
  if (isNaN(booked.getTime())) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid booked_dtm');
  
  // Allow 5-minute grace period to handle network latency
  const GRACE_PERIOD = 5 * 60 * 1000; // 5 minutes
  if (booked.getTime() <= (Date.now() - GRACE_PERIOD)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST, 
      'Booking date must be in the future. Please select a later date/time.'
    );
  }

  // Create booking and appointment in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the booking
    const booking = await tx.pIQ_Bookings.create({
      data: {
        pet_id,
        services_id: body.services_id,
        biz_dtls_id: body.biz_dtls_id ?? null,
        service_provider_id: body.service_provider_id ?? null,
        user_id: userId,
        booked_dtm: booked,
        booking_status: 'Pending',
        booking_comments: body.booking_comments ?? null,
      },
      include: {
        PIQ_Service_Master: { select: { service_title: true, service_type: true } },
      },
    });

    // Also create an appointment for the user to see immediately
    const appointment = await tx.pIQ_Appointments.create({
      data: {
        pet_id,
        booking_id: booking.booking_id,
        appointment_type: booking.PIQ_Service_Master?.service_title || booking.PIQ_Service_Master?.service_type || 'Checkup',
        appointment_date: booked,
        appointment_status: 'Awaiting Approval',
        appointment_comments: body.booking_comments ?? null,
      },
    });

    return { booking, appointment };
  });

  // Send notifications asynchronously (don't await to avoid blocking)
  notificationService.sendBookingConfirmationToUser(result.booking.booking_id).catch(console.error);
  notificationService.sendBookingNotificationToProvider(result.booking.booking_id).catch(console.error);

  // Fetch complete booking details with relationships for frontend confirmation page
  const completeBooking = await prisma.pIQ_Bookings.findUnique({
    where: { booking_id: result.booking.booking_id },
    include: {
      PIQ_Service_Master: true,
      PIQ_Service_Provider: true,
      PIQ_Pets: true,
    },
  });

  return {
    ...serializeBigInt(result.booking),
    appointment: serializeBigInt(result.appointment),
    service: completeBooking?.PIQ_Service_Master ? serializeBigInt(completeBooking.PIQ_Service_Master) : null,
    provider: completeBooking?.PIQ_Service_Provider ? serializeBigInt(completeBooking.PIQ_Service_Provider) : null,
    pet: completeBooking?.PIQ_Pets ? serializeBigInt(completeBooking.PIQ_Pets) : null,
  };
};

const listBookings = async (
  userId: bigint,
  opts: { page?: number; limit?: number; status?: string }
) => {
  const page = Math.max(1, Number(opts.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
  const skip = (page - 1) * limit;

  const where: any = { user_id: userId };
  if (opts.status) where.booking_status = assertStatus(opts.status);

  const [items, total] = await Promise.all([
    prisma.pIQ_Bookings.findMany({ where, orderBy: { booked_dtm: 'desc' }, skip, take: limit }),
    prisma.pIQ_Bookings.count({ where }),
  ]);

  return {
    items: items.map(serializeBigInt),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};

const getBooking = async (userId: bigint, id: number) => {
  const booking = await prisma.pIQ_Bookings.findUnique({ where: { booking_id: id } });
  if (!booking || booking.user_id !== userId) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  return serializeBigInt(booking);
};

const updateBooking = async (
  userId: bigint,
  id: number,
  body: Partial<{ booked_dtm: string; booking_status: BookingStatus; booking_comments: string | null }>
) => {
  const existing = await prisma.pIQ_Bookings.findUnique({ where: { booking_id: id } });
  if (!existing || existing.user_id !== userId) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');

  const data: any = {};
  if (body.booked_dtm) {
    const d = new Date(body.booked_dtm);
    if (isNaN(d.getTime())) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid booked_dtm');
    if (d.getTime() <= Date.now()) throw new ApiError(httpStatus.BAD_REQUEST, 'Date for rescheduling needs to be a future date/time');
    data.booked_dtm = d;
  }
  if (body.booking_status) data.booking_status = assertStatus(body.booking_status);
  if (body.booking_comments !== undefined) data.booking_comments = body.booking_comments;

  const updated = await prisma.pIQ_Bookings.update({ where: { booking_id: id }, data });
  return serializeBigInt(updated);
};

const cancelBooking = async (userId: bigint, id: number, reason?: string) => {
  const existing = await prisma.pIQ_Bookings.findUnique({ where: { booking_id: id } });
  if (!existing || existing.user_id !== userId) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  
  if (existing.booking_status === 'Cancelled') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking already cancelled');
  }
  if (existing.booking_status === 'Completed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot cancel completed booking');
  }

  // Check if payment is processing (prevent race condition)
  const processingPayment = await prisma.pIQ_Payments.findFirst({
    where: {
      booking_id: id,
      payment_status: { in: ['pending', 'processing'] },
    },
  });

  if (processingPayment) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot cancel booking while payment is processing. Please try again in a moment.'
    );
  }

  // Check if payment was successful and needs refund
  const successfulPayment = await prisma.pIQ_Payments.findFirst({
    where: {
      booking_id: id,
      payment_status: 'success',
    },
  });

  // Perform cancellation in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update booking status
    const updated = await tx.pIQ_Bookings.update({
      where: { booking_id: id },
      data: {
        booking_status: 'Cancelled',
        cancellation_reason: reason || null,
        cancelled_by: 'user',
        cancelled_at: new Date(),
      },
    });
    
    // Update related appointment
    await tx.pIQ_Appointments.updateMany({
      where: { booking_id: id },
      data: { appointment_status: 'Cancelled' },
    });

    // If payment was successful, mark it for refund
    if (successfulPayment) {
      await tx.pIQ_Payments.update({
        where: { payment_id: successfulPayment.payment_id },
        data: {
          payment_status: 'refund_pending',
          // Note: Actual Razorpay refund should be processed asynchronously
          // Add refund_initiated_at timestamp for tracking
        },
      });

      // Mark commission as reversed (if exists)
      // Note: Using raw query to avoid TypeScript errors until Prisma regenerates
      await tx.$executeRaw`
        UPDATE "PIQ_Commission" 
        SET status = 'reversed' 
        WHERE payment_id = ${successfulPayment.payment_id}
      `;
    }

    return updated;
  });
  
  // Send cancellation notification
  notificationService.sendBookingCancellationEmail(id).catch(console.error);

  // Log refund requirement for admin processing
  if (successfulPayment) {
    console.warn(`REFUND REQUIRED: Booking ${id}, Payment ${successfulPayment.payment_id}, Amount: ₹${successfulPayment.amount}`);
    // TODO: Implement automatic Razorpay refund or admin notification
  }
  
  return serializeBigInt(result);
};

const rescheduleBooking = async (userId: bigint, id: number, newDate: string) => {
  const existing = await prisma.pIQ_Bookings.findUnique({ where: { booking_id: id } });
  if (!existing || existing.user_id !== userId) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  
  if (existing.booking_status === 'Cancelled') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot reschedule cancelled booking');
  }
  if (existing.booking_status === 'Completed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot reschedule completed booking');
  }

  const d = new Date(newDate);
  if (isNaN(d.getTime())) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid date');
  if (d.getTime() <= Date.now()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Rescheduled date must be in future');
  }

  const updated = await prisma.pIQ_Bookings.update({
    where: { booking_id: id },
    data: {
      rescheduled_from: existing.booked_dtm,
      booked_dtm: d,
      booking_status: 'Pending',
    },
  });
  
  // Update appointment
  await prisma.pIQ_Appointments.updateMany({
    where: { booking_id: id },
    data: {
      appointment_date: d,
      appointment_status: 'Awaiting Approval',
    },
  });
  
  return serializeBigInt(updated);
};

const deleteBooking = async (userId: bigint, id: number) => {
  const existing = await prisma.pIQ_Bookings.findUnique({ where: { booking_id: id } });
  if (!existing || existing.user_id !== userId) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  
  // Soft delete by marking as cancelled
  const updated = await prisma.pIQ_Bookings.update({
    where: { booking_id: id },
    data: { booking_status: 'Cancelled' },
  });
  
  return serializeBigInt(updated);
};

export const bookingService = {
  createBooking,
  listBookings,
  getBooking,
  updateBooking,
  cancelBooking,
  rescheduleBooking,
  deleteBooking,
};
