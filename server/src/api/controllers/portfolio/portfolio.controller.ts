import { Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { portfolioService } from '../../services/portfolio/portfolio.service.js';

/**
 * Get provider portfolio
 * GET /provider/portfolio
 */
const getMyPortfolio = catchAsync(async (req: any, res: Response) => {
  const providerId = Number(req.user.service_provider_id);
  const items = await portfolioService.getProviderPortfolio(providerId);

  res.status(httpStatus.OK).json({
    success: true,
    data: items,
  });
});

/**
 * Get public provider portfolio
 * GET /providers/:providerId/portfolio
 */
const getPublicPortfolio = catchAsync(async (req: any, res: Response) => {
  const providerId = Number(req.params.providerId);
  const items = await portfolioService.getProviderPortfolio(providerId);

  res.status(httpStatus.OK).json({
    success: true,
    data: items,
  });
});

/**
 * Get single portfolio item
 * GET /provider/portfolio/:id
 */
const getItem = catchAsync(async (req: any, res: Response) => {
  const providerId = Number(req.user.service_provider_id);
  const portfolioId = Number(req.params.id);
  const item = await portfolioService.getPortfolioItem(providerId, portfolioId);

  res.status(httpStatus.OK).json({
    success: true,
    data: item,
  });
});

/**
 * Create portfolio item
 * POST /provider/portfolio
 */
const create = catchAsync(async (req: any, res: Response) => {
  const providerId = Number(req.user.service_provider_id);
  const item = await portfolioService.createPortfolioItem(providerId, req.body);

  res.status(httpStatus.CREATED).json({
    success: true,
    data: item,
  });
});

/**
 * Update portfolio item
 * PATCH /provider/portfolio/:id
 */
const update = catchAsync(async (req: any, res: Response) => {
  const providerId = Number(req.user.service_provider_id);
  const portfolioId = Number(req.params.id);
  const item = await portfolioService.updatePortfolioItem(providerId, portfolioId, req.body);

  res.status(httpStatus.OK).json({
    success: true,
    data: item,
  });
});

/**
 * Delete portfolio item
 * DELETE /provider/portfolio/:id
 */
const remove = catchAsync(async (req: any, res: Response) => {
  const providerId = Number(req.user.service_provider_id);
  const portfolioId = Number(req.params.id);
  await portfolioService.deletePortfolioItem(providerId, portfolioId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Portfolio item deleted',
  });
});

/**
 * Generate upload URL for portfolio image
 * POST /provider/portfolio/upload-url
 */
const generateUploadUrl = catchAsync(async (req: any, res: Response) => {
  const providerId = Number(req.user.service_provider_id);
  const { file_name } = req.body;

  const result = await portfolioService.generateUploadUrl(providerId, file_name);

  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
});

export const portfolioController = {
  getMyPortfolio,
  getPublicPortfolio,
  getItem,
  create,
  update,
  remove,
  generateUploadUrl,
};
