import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { chatService, ChatActor } from '../../services/chat/chat.service.js';

const buildActorFromRequest = (req: any): ChatActor => {
  const role = (req.userRole || req.user?.role || '').toLowerCase();

  if (role === 'admin') {
    const adminId = req.user?.admin_id ?? req.user?.adminId;
    return { role: 'admin', adminId: adminId !== undefined ? BigInt(adminId) : undefined };
  }

  if (role === 'provider') {
    const providerId = req.user?.service_provider_id ?? req.user?.provider_id ?? req.user?.id;
    return { role: 'provider', providerId: providerId !== undefined ? Number(providerId) : undefined };
  }

  if (role === 'user') {
    const userId = req.user?.user_id ?? req.user?.id;
    return { role: 'user', userId: userId !== undefined ? BigInt(userId) : undefined };
  }

  throw new Error('Unable to determine actor from request');
};

const createConversation = catchAsync(async (req: any, res: Response) => {
  const actor = buildActorFromRequest(req);
  const conversation = await chatService.createConversation(actor, req.body);
  res.status(httpStatus.CREATED).json({ success: true, data: conversation });
});

const listConversations = catchAsync(async (req: any, res: Response) => {
  const actor = buildActorFromRequest(req);
  const conversations = await chatService.listConversations(actor, req.query);
  res.status(httpStatus.OK).json({ success: true, data: conversations });
});

const getConversation = catchAsync(async (req: any, res: Response) => {
  const actor = buildActorFromRequest(req);
  const conversationId = Number(req.params.conversationId);
  const conversation = await chatService.getConversation(actor, conversationId);
  res.status(httpStatus.OK).json({ success: true, data: conversation });
});

const listMessages = catchAsync(async (req: any, res: Response) => {
  const actor = buildActorFromRequest(req);
  const conversationId = Number(req.params.conversationId);
  const messages = await chatService.listMessages(actor, conversationId, req.query);
  res.status(httpStatus.OK).json({ success: true, data: messages });
});

const sendMessage = catchAsync(async (req: any, res: Response) => {
  const actor = buildActorFromRequest(req);
  const conversationId = Number(req.params.conversationId);
  const message = await chatService.sendMessage(actor, conversationId, req.body);
  res.status(httpStatus.CREATED).json({ success: true, data: message });
});

const updateConversation = catchAsync(async (req: any, res: Response) => {
  const actor = buildActorFromRequest(req);
  const conversationId = Number(req.params.conversationId);
  const updated = await chatService.updateConversation(actor, conversationId, req.body);
  res.status(httpStatus.OK).json({ success: true, data: updated });
});

const markRead = catchAsync(async (req: any, res: Response) => {
  const actor = buildActorFromRequest(req);
  const conversationId = Number(req.params.conversationId);
  await chatService.markRead(actor, conversationId);
  res.status(httpStatus.NO_CONTENT).send();
});

export const chatController = {
  createConversation,
  listConversations,
  getConversation,
  listMessages,
  sendMessage,
  updateConversation,
  markRead,
};
