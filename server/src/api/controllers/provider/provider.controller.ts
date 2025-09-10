import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { providerService } from '../../services/provider/index.js';

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  // Support multiple possible id field names from auth middleware/entity
  // @ts-ignore
  const id = (req.user?.provider_id || req.user?.service_provider_id || req.user?.id) as number;
  const provider = await providerService.getProviderById(Number(id));
  res.status(httpStatus.OK).send(provider);
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  // @ts-ignore
  const id = (req.user?.provider_id || req.user?.service_provider_id || req.user?.id) as number;
  const updated = await providerService.updateProviderProfile(Number(id), req.body);
  res.status(httpStatus.OK).send(updated);
});

export const providerController = {
  getMyProfile,
  updateMyProfile,
};
