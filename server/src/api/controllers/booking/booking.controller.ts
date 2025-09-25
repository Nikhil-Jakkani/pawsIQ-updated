import { Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { bookingService } from '../../services/booking/booking.service.js';

// Parse a label like "9:00 AM" into hours/minutes (24h)
const parseLabelTime = (label: string): { h: number; m: number } | null => {
  if (!label || typeof label !== 'string') return null;
  const parts = label.trim().split(' ');
  if (parts.length < 2) return null;
  const [hm, ampm] = parts as [string, string];
  const [hStr, mStr] = hm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  let hour = h;
  const up = ampm.toUpperCase();
  if (up === 'PM' && hour < 12) hour += 12;
  if (up === 'AM' && hour === 12) hour = 0;
  return { h: hour, m };
};

const combineDateTimeISO = (dateStr?: string, time?: string): string | null => {
  if (!dateStr || !time) return null;
  // If time already an ISO, trust it
  if (time.includes('T')) return time;
  const parsed = parseLabelTime(time);
  if (!parsed) return null;
  const { h, m } = parsed;
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(5, 7)) - 1;
  const day = parseInt(dateStr.substring(8, 10));
  const utcMillis = Date.UTC(year, month, day, h, m, 0, 0);
  return new Date(utcMillis).toISOString();
};

const create = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const body = req.body || {};

  // Accept both legacy frontend payload and backend schema
  const booked_dtm = body.booked_dtm
    || combineDateTimeISO(String(body.date || ''), String(body.time || ''));

  const normalized = {
    pet_id: body.pet_id ?? body.petId,
    services_id: body.services_id ?? (body.serviceId ? Number(body.serviceId) : undefined),
    biz_dtls_id: body.biz_dtls_id ?? body.bizDtlsId ?? null,
    service_provider_id: body.service_provider_id ?? (body.providerId ? Number(body.providerId) : null),
    booked_dtm,
    booking_comments: body.booking_comments ?? body.notes ?? null,
  } as any;

  const data = await bookingService.createBooking(userId, normalized);
  res.status(httpStatus.CREATED).json(data);
});

const listMine = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const { page, limit, status } = req.query;
  const data = await bookingService.listBookings(userId, { page: Number(page), limit: Number(limit), status: status as string });
  res.status(httpStatus.OK).json(data);
});

const getMine = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const id = Number(req.params.id);
  const data = await bookingService.getBooking(userId, id);
  res.status(httpStatus.OK).json(data);
});

const updateMine = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const id = Number(req.params.id);
  const data = await bookingService.updateBooking(userId, id, req.body);
  res.status(httpStatus.OK).json(data);
});

const removeMine = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const id = Number(req.params.id);
  const data = await bookingService.deleteBooking(userId, id);
  res.status(httpStatus.OK).json(data);
});

export const bookingController = {
  create,
  listMine,
  getMine,
  updateMine,
  removeMine,
};
