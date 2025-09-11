import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { providerService } from '../../services/provider/index.js';

const getMyProfile = catchAsync(async (req: any, res: Response) => {
  const provider = await providerService.getProviderById(req.user.service_provider_id);
  // Map serv_provider_type to providerType for frontend consistency
  const userProfile = {
    ...provider,
    providerType: provider.serv_provider_type,
  };
  res.send(userProfile);
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  // Extract provider ID from the entity attached by auth middleware
  // @ts-ignore
  const id = req.user?.service_provider_id || req.user?.id;
  if (!id) {
    throw new Error('Provider ID not found in request');
  }
  const updated = await providerService.updateProviderProfile(Number(id), req.body);
  res.status(httpStatus.OK).send(updated);
});

export const providerController = {
  getMyProfile,
  updateMyProfile,
};
