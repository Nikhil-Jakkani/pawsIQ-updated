import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { providerServiceOfferingService } from '../../services/provider/providerServiceOffering.service.js';

/**
 * List all service offerings for the authenticated provider
 */
const listMyServiceOfferings = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;
  const offerings = await providerServiceOfferingService.listServiceOfferings(providerId);
  res.status(httpStatus.OK).json({ items: offerings, total: offerings.length });
});

/**
 * Get a specific service offering
 */
const getMyServiceOffering = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;
  const offeringId = Number(req.params.offering_id);
  const offering = await providerServiceOfferingService.getServiceOffering(providerId, offeringId);
  res.status(httpStatus.OK).json(offering);
});

/**
 * Create a new service offering
 */
const createMyServiceOffering = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;
  const offering = await providerServiceOfferingService.createServiceOffering(providerId, req.body);
  res.status(httpStatus.CREATED).json(offering);
});

/**
 * Update an existing service offering
 */
const updateMyServiceOffering = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;
  const offeringId = Number(req.params.offering_id);
  const offering = await providerServiceOfferingService.updateServiceOffering(
    providerId,
    offeringId,
    req.body
  );
  res.status(httpStatus.OK).json(offering);
});

/**
 * Delete a service offering
 */
const deleteMyServiceOffering = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;
  const offeringId = Number(req.params.offering_id);
  const result = await providerServiceOfferingService.deleteServiceOffering(providerId, offeringId);
  res.status(httpStatus.OK).json(result);
});

/**
 * List available services from master that provider can add
 */
const listAvailableServices = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;
  const services = await providerServiceOfferingService.listAvailableServices(providerId);
  res.status(httpStatus.OK).json({ items: services, total: services.length });
});

export const providerServiceOfferingController = {
  listMyServiceOfferings,
  getMyServiceOffering,
  createMyServiceOffering,
  updateMyServiceOffering,
  deleteMyServiceOffering,
  listAvailableServices,
};
