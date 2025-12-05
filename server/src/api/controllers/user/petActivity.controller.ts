import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { activityService } from '../../services/user/index.js';

const getSummary = catchAsync(async (req: any, res: Response) => {
    const userId = Number(req.user?.user_id);
    const petId = Number(req.params.petId);
    const daysRaw = req.query?.days;
    const days = daysRaw ? Number(daysRaw) : 7;

    if (!userId) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
    }

    const payload = await activityService.getPetActivitySummary(userId, petId, Number.isNaN(days) ? 7 : days);
    return res.status(httpStatus.OK).json(payload);
});

const logActivity = catchAsync(async (req: any, res: Response) => {
    const userId = Number(req.user?.user_id);
    const petId = Number(req.params.petId);

    if (!userId) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
    }

    const result = await activityService.logPetActivity(userId, petId, req.body);
    return res.status(httpStatus.CREATED).json(result);
});

export default {
    getSummary,
    logActivity,
};
