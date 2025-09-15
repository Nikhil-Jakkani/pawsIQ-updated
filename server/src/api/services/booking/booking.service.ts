import httpStatus from 'http-status';
import prisma from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';

const serializeBigInt = <T>(data: T): T => {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
  ) as T;
};

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
    booked_dtm: string; // ISO
    booking_comments?: string | null;
  }
) => {
  const pet_id = BigInt(body.pet_id);
  await ensurePetBelongsToUser(userId, pet_id);

  const service = await prisma.pIQ_Service_Master.findUnique({ where: { services_id: body.services_id } });
  if (!service) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid services_id');

  const booked = new Date(body.booked_dtm);
  if (isNaN(booked.getTime())) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid booked_dtm');
  if (booked.getTime() <= Date.now()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Date for booking needs to be a future date/time');
  }

  const created = await prisma.pIQ_Bookings.create({
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
  });

  return serializeBigInt(created);
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

const deleteBooking = async (userId: bigint, id: number) => {
  const existing = await prisma.pIQ_Bookings.findUnique({ where: { booking_id: id } });
  if (!existing || existing.user_id !== userId) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  await prisma.pIQ_Bookings.delete({ where: { booking_id: id } });
  return { success: true };
};

export const bookingService = {
  createBooking,
  listBookings,
  getBooking,
  updateBooking,
  deleteBooking,
};
