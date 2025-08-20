import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { reminderService } from '../../services/reminder/reminder.service.js';

const listMine = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const data = await reminderService.getUserCareReminders(userId);
  res.status(httpStatus.OK).json(data);
});

const createMine = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const created = await reminderService.createReminder(userId, req.body);
  res.status(httpStatus.CREATED).json(created);
});

const updateMine = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const id = Number(req.params.id);
  const updated = await reminderService.updateReminder(userId, id, req.body);
  res.status(httpStatus.OK).json(updated);
});

const deleteMine = catchAsync(async (req: any, res: Response) => {
  const userId = BigInt(req.user.user_id);
  const id = Number(req.params.id);
  const out = await reminderService.deleteReminder(userId, id);
  res.status(httpStatus.OK).json(out);
});

export const reminderController = {
  listMine,
  createMine,
  updateMine,
  deleteMine,
};
