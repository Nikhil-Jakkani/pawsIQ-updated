import { Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { bookingService } from '../../services/booking/booking.service.js';

// Parse a time label like "9:00 AM", "9:00AM", "9:00", or "09:00" into hours/minutes (24h)
const parseLabelTime = (label: string): { h: number; m: number } | null => {
  if (!label || typeof label !== 'string') return null;
  
  const trimmed = label.trim().toUpperCase();
  
  // Match patterns: "9:00 AM", "9:00AM", "9:00", "09:00"
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return null;
  
  let h = Number(match[1]);
  const m = Number(match[2]);
  const ampm = match[3];
  
  // Validate values
  if (isNaN(h) || isNaN(m) || m >= 60) return null;
  
  // Convert to 24-hour format if AM/PM specified
  if (ampm) {
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
  }
  
  // Validate hour range
  if (h >= 24 || h < 0) return null;
  
  return { h, m };
};

const combineDateTimeISO = (dateStr?: string, time?: string): string | null => {
  if (!dateStr || !time) return null;
  // If time already an ISO format, trust it
  if (time.includes('T')) return time;
  const parsed = parseLabelTime(time);
  if (!parsed) return null;
  const { h, m } = parsed;
  // Format as YYYY-MM-DDTHH:MM:SS without timezone conversion
  const paddedH = String(h).padStart(2, '0');
  const paddedM = String(m).padStart(2, '0');
  return `${dateStr}T${paddedH}:${paddedM}:00`;
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

const cancelMine = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const id = Number(req.params.id);
  const { reason } = req.body;
  const data = await bookingService.cancelBooking(userId, id, reason);
  res.status(httpStatus.OK).json(data);
});

const rescheduleMine = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const id = Number(req.params.id);
  const { new_date } = req.body;
  const data = await bookingService.rescheduleBooking(userId, id, new_date);
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
  cancelMine,
  rescheduleMine,
  removeMine,
};
