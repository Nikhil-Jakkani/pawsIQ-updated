import { Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { bookingService } from '../../services/booking/booking.service.js';

const create = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const data = await bookingService.createBooking(userId, req.body);
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
