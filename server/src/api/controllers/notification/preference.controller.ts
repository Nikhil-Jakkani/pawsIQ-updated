import { Response } from 'express';
import httpStatus from 'http-status';
import { notificationPreferenceService } from '../../services/notification/preference.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

const resolveUserId = (req: any): number => {
  const possibleId = req.user?.user_id ?? req.user?.userId ?? req.user?.id;
  if (!possibleId) {
    throw new Error('Authenticated user context missing user ID');
  }
  return Number(possibleId);
};

const listMyPreferences = catchAsync(async (req: any, res: Response) => {
  const userId = resolveUserId(req);
  const preferences = await notificationPreferenceService.listPreferences(userId);
  res.status(httpStatus.OK).json({ success: true, data: preferences });
});

const upsertMyPreferences = catchAsync(async (req: any, res: Response) => {
  const userId = resolveUserId(req);
  const { preferences } = req.body;
  const updated = await notificationPreferenceService.upsertPreferences(userId, preferences);
  res.status(httpStatus.OK).json({ success: true, data: updated });
});

const resetMyPreferences = catchAsync(async (req: any, res: Response) => {
  const userId = resolveUserId(req);
  const { channel } = req.body || {};
  await notificationPreferenceService.deletePreferences(userId, channel);
  res.status(httpStatus.NO_CONTENT).send();
});

export const notificationPreferenceController = {
  listMyPreferences,
  upsertMyPreferences,
  resetMyPreferences,
};
