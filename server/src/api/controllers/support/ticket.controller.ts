import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { supportTicketService } from '../../services/support/supportTicket.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

const createTicket = catchAsync(async (req: any, res: Response) => {
  const requesterId = BigInt(req.user.user_id);
  const ticket = await supportTicketService.createTicket(requesterId, req.body);
  res.status(httpStatus.CREATED).json({ success: true, data: ticket });
});

const listMyTickets = catchAsync(async (req: any, res: Response) => {
  const requesterId = BigInt(req.user.user_id);
  const tickets = await supportTicketService.listByRequester(requesterId, req.query);
  res.status(httpStatus.OK).json({ success: true, data: tickets });
});

const getTicket = catchAsync(async (req: Request, res: Response) => {
  const ticketId = Number(req.params.ticketId);
  const ticket = await supportTicketService.getTicket(ticketId);
  res.status(httpStatus.OK).json({ success: true, data: ticket });
});

const addMessage = catchAsync(async (req: any, res: Response) => {
  const ticketId = Number(req.params.ticketId);
  const author = {
    userId: req.user?.user_id ? BigInt(req.user.user_id) : undefined,
    providerId: req.user?.provider_id ? Number(req.user.provider_id) : undefined,
    adminId: req.user?.admin_id ? BigInt(req.user.admin_id) : undefined,
    role: req.user?.role,
  };
  const message = await supportTicketService.addMessage(ticketId, author, req.body);
  res.status(httpStatus.CREATED).json({ success: true, data: message });
});

const updateStatus = catchAsync(async (req: any, res: Response) => {
  const ticketId = Number(req.params.ticketId);
  const adminId = req.user?.admin_id ? BigInt(req.user.admin_id) : undefined;
  const updated = await supportTicketService.updateStatus(ticketId, req.body.status, adminId);
  res.status(httpStatus.OK).json({ success: true, data: updated });
});

const assignTicket = catchAsync(async (req: any, res: Response) => {
  const ticketId = Number(req.params.ticketId);
  const assignedTo = BigInt(req.body.assigned_to_admin_id);
  const assignedBy = req.user?.admin_id ? BigInt(req.user.admin_id) : undefined;
  const assignment = await supportTicketService.assignTicket(ticketId, assignedTo, assignedBy);
  res.status(httpStatus.OK).json({ success: true, data: assignment });
});

const listAllTickets = catchAsync(async (req: Request, res: Response) => {
  const tickets = await supportTicketService.listAll(req.query);
  res.status(httpStatus.OK).json({ success: true, data: tickets });
});

export const ticketController = {
  createTicket,
  listMyTickets,
  getTicket,
  addMessage,
  updateStatus,
  assignTicket,
  listAllTickets,
};
