import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { providerService } from '../../services/admin/provider.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

/**
 * Get all providers with optional status filter
 */
const getAllProviders = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.query;
  const providers = await providerService.getAllProviders(status as string);
  res.status(httpStatus.OK).json(providers);
});

/**
 * Get provider by ID
 */
const getProviderById = catchAsync(async (req: Request, res: Response) => {
  const providerId = parseInt(req.params.id);
  const provider = await providerService.getProviderById(providerId);
  
  if (!provider) {
    return res.status(httpStatus.NOT_FOUND).json({ message: 'Provider not found' });
  }
  
  res.status(httpStatus.OK).json(provider);
});

/**
 * Update provider status (approve/reject)
 */
const updateProviderStatus = catchAsync(async (req: Request, res: Response) => {
  const providerId = parseInt(req.params.id);
  const { status, notes } = req.body;

  if (!status) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: 'Status is required' });
  }

  const provider = await providerService.updateProviderStatus(providerId, status, notes);
  res.status(httpStatus.OK).json(provider);
});

/**
 * Get provider statistics
 */
const getProviderStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await providerService.getProviderStats();
  res.status(httpStatus.OK).json(stats);
});

export const providerController = {
  getAllProviders,
  getProviderById,
  updateProviderStatus,
  getProviderStats
};
