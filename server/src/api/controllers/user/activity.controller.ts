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
  const saved = await activityService.logFoodActivity(Number(userId), req.body);
  res.status(httpStatus.CREATED).send(saved);
});

export default {
  logFood,
};