import { Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { bizEntityService } from '../../services/service/bizEntity.service.js';

const listByService = catchAsync(async (req: any, res: Response) => {
  const services_id = Number(req.params.services_id);
  const data = await bizEntityService.listByService(services_id);
  res.status(httpStatus.OK).json({ items: data });
});

const getById = catchAsync(async (req: any, res: Response) => {
  const id = Number(req.params.biz_dtls_id);
  const data = await bizEntityService.getById(id);
  res.status(httpStatus.OK).json(data);
});

const create = catchAsync(async (req: any, res: Response) => {
  const services_id = Number(req.params.services_id);
  const data = await bizEntityService.create(services_id, req.body);
  res.status(httpStatus.CREATED).json(data);
});

const update = catchAsync(async (req: any, res: Response) => {
  const id = Number(req.params.biz_dtls_id);
  const data = await bizEntityService.update(id, req.body);
  res.status(httpStatus.OK).json(data);
});

const remove = catchAsync(async (req: any, res: Response) => {
  const id = Number(req.params.biz_dtls_id);
  const data = await bizEntityService.remove(id);
  res.status(httpStatus.OK).json(data);
});

export const bizEntityController = {
  listByService,
  getById,
  create,
  update,
  remove,
};
