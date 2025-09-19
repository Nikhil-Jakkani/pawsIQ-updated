import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { serviceMasterService } from '../../services/service/serviceMaster.service.js';

const list = catchAsync(async (_req: any, res: Response) => {
  const data = await serviceMasterService.listServices();
  res.status(httpStatus.OK).json({ items: data });
});

const get = catchAsync(async (req: any, res: Response) => {
  const services_id = Number(req.params.services_id);
  const data = await serviceMasterService.getService(services_id);
  if (!data) return res.status(httpStatus.NOT_FOUND).json({ message: 'Service not found' });
  res.status(httpStatus.OK).json(data);
});

const listProviders = catchAsync(async (req: any, res: Response) => {
  const services_id = Number(req.params.services_id);
  const data = await serviceMasterService.listProvidersForService(services_id);
  res.status(httpStatus.OK).json({ items: data });
});

const remove = catchAsync(async (req: Request, res: Response) => {
  const services_id = Number(req.params.services_id);
  await serviceMasterService.removeService(services_id);
  res.status(httpStatus.NO_CONTENT).send();
});

export const serviceMasterController = {
  list,
  get,
  listProviders,
  remove,
};
