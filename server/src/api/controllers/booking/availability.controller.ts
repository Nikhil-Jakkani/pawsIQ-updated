import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { availabilityService } from '../../services/booking/availability.service.js';

const getDay = catchAsync(async (req: Request, res: Response) => {
  const services_id = Number(req.query.services_id);
  const provider_id = Number(req.query.provider_id);
  const date = String(req.query.date);
  if (!services_id || !provider_id || !date) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: 'services_id, provider_id and date are required' });
  }
  const data = await availabilityService.getDaySlots({ services_id, provider_id, date });
  return res.status(httpStatus.OK).json(data);
});

const getRange = catchAsync(async (req: Request, res: Response) => {
  const services_id = Number(req.query.services_id);
  const provider_id = Number(req.query.provider_id);
  const start = String(req.query.start || new Date().toISOString().slice(0, 10));
  const days = Number(req.query.days || 14);
  if (!services_id || !provider_id) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: 'services_id and provider_id are required' });
  }
  const data = await availabilityService.getRange({ services_id, provider_id, start, days });
  return res.status(httpStatus.OK).json(data);
});

export const availabilityController = {
  getDay,
  getRange,
};
