import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { providerService } from '../../services/provider/index.js';

const getMyProfile = catchAsync(async (req: any, res: Response) => {
  const provider = await providerService.getProviderById(req.user.service_provider_id);
  const typedProvider = provider as any;
  const userProfile = {
    ...typedProvider,
    providerType: typedProvider.serv_provider_type,
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

const getAllProviders = catchAsync(async (req: Request, res: Response) => {
  const { type, status, search, page, limit } = req.query;

  const result = await providerService.listProviders({
    type: type as string,
    status: status as string,
    search: search as string,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  res.status(httpStatus.OK).json(result);
});

const getProviderById = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const provider = await providerService.getProviderById(id);
  res.status(httpStatus.OK).json(provider);
});

const updateProviderStatus = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status?: string };

  if (!status) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: 'status is required' });
  }

  const updated = await providerService.updateProviderStatus(id, status);
  res.status(httpStatus.OK).json({ success: true, data: updated });
});

export const providerController = {
  getMyProfile,
  updateMyProfile,
  getAllProviders,
  getProviderById,
  updateProviderStatus,
};
