import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { activityService } from '../../services/user/index.js';

const logFood = catchAsync(async (req: any, res: Response) => {
  // Expect: { pet_id: number, calories: number, note?: string, image_url?: string }
  const userId = req.user?.user_id || req.user?.id; // user auth middleware sets this
  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).send({ message: 'Unauthorized' });
  }

  const { pet_id, calories, note, image_url } = req.body || {};

  const saved = await activityService.logPetActivity(
    Number(userId),
    Number(pet_id),
    {
      activityType: 'food',
      value: Number(calories),
      note,
      metadata: image_url ? { image_url } : undefined,
    },
  );

  res.status(httpStatus.CREATED).send(saved);
});

export default {
  logFood,
};