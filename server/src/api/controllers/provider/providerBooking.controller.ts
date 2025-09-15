import { Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { providerBookingService } from '../../services/provider/providerBooking.service.js';

const listPending = catchAsync(async (req: any, res: Response) => {
  const providerId = Number(req.user?.service_provider_id || req.user?.provider_id || req.user?.id);
  const { page, limit, status } = req.query;
  const data = await providerBookingService.listRelevantBookings(providerId, {
    page: Number(page),
    limit: Number(limit),
    status: (status as string) || 'Pending',
  });
  res.status(httpStatus.OK).json(data);
});

const approve = catchAsync(async (req: any, res: Response) => {
  const providerId = Number(req.user?.service_provider_id || req.user?.provider_id || req.user?.id);
  const id = Number(req.params.id);
  const data = await providerBookingService.approveBooking(providerId, id);
  res.status(httpStatus.OK).json(data);
});

const decline = catchAsync(async (req: any, res: Response) => {
  const providerId = Number(req.user?.service_provider_id || req.user?.provider_id || req.user?.id);
  const id = Number(req.params.id);
  const data = await providerBookingService.declineBooking(providerId, id);
  res.status(httpStatus.OK).json(data);
});

export const providerBookingController = {
  listPending,
  approve,
  decline,
};
