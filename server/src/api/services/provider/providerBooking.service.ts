import httpStatus from 'http-status';
import prisma from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';

const serializeBigInt = <T>(data: T): T => {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
  ) as T;
};

const getProvider = async (providerId: number) => {
  const prov = await prisma.pIQ_Service_Provider.findUnique({ where: { service_provider_id: providerId } });
  if (!prov) throw new ApiError(httpStatus.NOT_FOUND, 'Provider not found');
  return prov;
};

const listRelevantBookings = async (
  providerId: number,
  opts: { page?: number; limit?: number; status?: string }
) => {
  const provider = await getProvider(providerId);
  const type = (provider.serv_provider_type || '').trim();

  const page = Math.max(1, Number(opts.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
  const skip = (page - 1) * limit;

  const where: any = {
    OR: [
      { service_provider_id: providerId },
      { PIQ_Service_Master: { service_type: { equals: type, mode: 'insensitive' } } },
      { PIQ_Service_Master: { service_type: { contains: type, mode: 'insensitive' } } },
      { PIQ_Service_Master: { service_sub_type: { equals: type, mode: 'insensitive' } } },
      { PIQ_Service_Master: { service_sub_type: { contains: type, mode: 'insensitive' } } },
    ],
  };
  if (opts.status) where.booking_status = opts.status;

  const [items, total] = await Promise.all([
    prisma.pIQ_Bookings.findMany({
      where,
      orderBy: { booked_dtm: 'asc' },
      skip,
      take: limit,
      include: {
        PIQ_Pets: { select: { pet_name: true, pet_type: true } },
        PIQ_User: { select: { user_full_name: true, user_email_id: true } },
        PIQ_Service_Master: { select: { services_id: true, service_type: true, service_title: true, service_price_amt: true } },
      },
    }),
    prisma.pIQ_Bookings.count({ where }),
  ]);

  return {
    items: items.map((b) =>
      serializeBigInt({
        ...b,
        pet_name: b.PIQ_Pets?.pet_name ?? null,
        pet_type: b.PIQ_Pets?.pet_type ?? null,
        user_name: b.PIQ_User?.user_full_name ?? null,
        user_email: b.PIQ_User?.user_email_id ?? null,
        service_type: b.PIQ_Service_Master?.service_type ?? null,
        service_title: b.PIQ_Service_Master?.service_title ?? null,
        service_price_amt: b.PIQ_Service_Master?.service_price_amt ?? null,
      })
    ),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};

const approveBooking = async (providerId: number, bookingId: number) => {
  const provider = await getProvider(providerId);
  const booking = await prisma.pIQ_Bookings.findUnique({
    where: { booking_id: bookingId },
    include: { PIQ_Service_Master: true },
  });
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  if (booking.booking_status !== 'Pending') throw new ApiError(httpStatus.BAD_REQUEST, 'Booking is not pending');

  if (booking.service_provider_id && booking.service_provider_id !== providerId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to approve this booking');
  }

  // Update booking and appointment in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update the booking status
    const updatedBooking = await tx.pIQ_Bookings.update({
      where: { booking_id: bookingId },
      data: { service_provider_id: providerId, booking_status: 'Confirmed' },
    });

    // Find and update the existing appointment (created when booking was made)
    const updatedAppointment = await tx.pIQ_Appointments.updateMany({
      where: { 
        pet_id: booking.pet_id,
        appointment_date: booking.booked_dtm,
        appointment_status: 'Awaiting Approval'
      },
      data: { appointment_status: 'Scheduled' },
    });

    return { booking: updatedBooking, appointmentUpdated: updatedAppointment.count > 0 };
  });

  return serializeBigInt({ booking: result.booking, appointmentUpdated: result.appointmentUpdated });
};

const declineBooking = async (providerId: number, bookingId: number) => {
  await getProvider(providerId);
  const booking = await prisma.pIQ_Bookings.findUnique({ where: { booking_id: bookingId } });
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  if (booking.booking_status !== 'Pending') throw new ApiError(httpStatus.BAD_REQUEST, 'Booking is not pending');

  // Update booking and appointment in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update the booking status
    const updatedBooking = await tx.pIQ_Bookings.update({
      where: { booking_id: bookingId },
      data: { booking_status: 'Cancelled' },
    });

    // Update the corresponding appointment to cancelled
    const updatedAppointment = await tx.pIQ_Appointments.updateMany({
      where: { 
        pet_id: booking.pet_id,
        appointment_date: booking.booked_dtm,
        appointment_status: 'Awaiting Approval'
      },
      data: { appointment_status: 'Cancelled' },
    });

    return { booking: updatedBooking, appointmentUpdated: updatedAppointment.count > 0 };
  });

  return serializeBigInt(result.booking);
};

export const providerBookingService = {
  listRelevantBookings,
  approveBooking,
  declineBooking,
};
