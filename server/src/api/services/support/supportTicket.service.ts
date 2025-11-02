import httpStatus from 'http-status';
import prisma from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { serializeBigInt } from '../../utils/bigIntSerializer.js';

type TicketFilters = {
  status?: string | null;
  priority?: string | null;
  category?: string | null;
  requester_id?: number | string | null;
  service_provider_id?: number | string | null;
};

const normalizeNumber = (value: any) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const createTicket = async (requesterId: bigint, payload: any) => {
  const ticket = await prisma.supportTicket.create({
    data: {
      requester_id: requesterId,
      service_provider_id: payload.service_provider_id ?? null,
      subject: payload.subject,
      description: payload.description ?? null,
      category: payload.category ?? null,
      priority: payload.priority ?? 'medium',
      status: 'open',
      source: payload.source ?? 'web',
      sla_response_due: payload.sla_response_due ? new Date(payload.sla_response_due) : null,
      sla_resolution_due: payload.sla_resolution_due ? new Date(payload.sla_resolution_due) : null,
    },
  });
  return serializeBigInt(ticket);
};

const buildWhereClause = (filters: TicketFilters) => {
  const where: Record<string, unknown> = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  const requesterId = normalizeNumber(filters.requester_id);
  if (requesterId !== undefined) {
    where.requester_id = requesterId;
  }

  const providerId = normalizeNumber(filters.service_provider_id);
  if (providerId !== undefined) {
    where.service_provider_id = providerId;
  }

  return where;
};

const listByRequester = async (requesterId: bigint, query: any) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where = {
    requester_id: requesterId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.category ? { category: query.category } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    items: items.map(serializeBigInt),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getTicket = async (ticketId: number) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: { ticket_id: ticketId },
    include: {
      messages: {
        orderBy: { created_at: 'asc' },
      },
      assignments: true,
      sla_logs: true,
    },
  });
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');
  }
  return serializeBigInt(ticket);
};

const addMessage = async (
  ticketId: number,
  author: { userId?: bigint; providerId?: number; adminId?: bigint; role?: string },
  body: { message_body: string; attachments?: unknown }
) => {
  const ticket = await prisma.supportTicket.findUnique({ where: { ticket_id: ticketId } });
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');

  const message = await prisma.ticketMessage.create({
    data: {
      ticket_id: ticketId,
      author_user_id: author.userId ?? null,
      author_provider_id: author.providerId ?? null,
      author_admin_id: author.adminId ?? null,
      author_role: author.role ?? 'user',
      message_body: body.message_body,
      attachments: body.attachments ?? [],
    },
  });

  if (!ticket.first_response_at && author.role !== 'user') {
    await prisma.supportTicket.update({
      where: { ticket_id: ticketId },
      data: { first_response_at: new Date(), status: ticket.status === 'open' ? 'in_progress' : ticket.status },
    });
  }

  return serializeBigInt(message);
};

const updateStatus = async (ticketId: number, status: string, adminId?: bigint) => {
  const ticket = await prisma.supportTicket.findUnique({ where: { ticket_id: ticketId } });
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');

  const data: any = { status };
  if (status === 'resolved') data.resolved_at = new Date();
  if (status === 'closed') data.closed_at = new Date();
  if (status === 'open') data.reopened_count = ticket.reopened_count + 1;

  const updated = await prisma.supportTicket.update({ where: { ticket_id: ticketId }, data });

  if (adminId) {
    await prisma.ticketSLA.create({
      data: {
        ticket_id: ticketId,
        milestone: `status_${status}`,
        completed_at: new Date(),
        status: 'completed',
      },
    });
  }

  return serializeBigInt(updated);
};

const assignTicket = async (ticketId: number, assignedTo: bigint, assignedBy?: bigint) => {
  const ticket = await prisma.supportTicket.findUnique({ where: { ticket_id: ticketId } });
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');

  const assignment = await prisma.ticketAssignment.create({
    data: {
      ticket_id: ticketId,
      assigned_to_admin_id: assignedTo,
      assigned_by_admin_id: assignedBy ?? null,
    },
  });

  await prisma.supportTicket.update({
    where: { ticket_id: ticketId },
    data: { status: ticket.status === 'open' ? 'in_progress' : ticket.status },
  });

  return serializeBigInt(assignment);
};

const listAll = async (query: any) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where = buildWhereClause({
    status: query.status,
    priority: query.priority,
    category: query.category,
    requester_id: query.requester_id,
    service_provider_id: query.service_provider_id,
  });

  const [items, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      include: {
        requester: {
          select: {
            user_id: true,
            user_full_name: true,
            user_email_id: true,
          },
        },
        provider: {
          select: {
            service_provider_id: true,
            serv_provider_name: true,
          },
        },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    items: items.map(serializeBigInt),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const supportTicketService = {
  createTicket,
  listByRequester,
  getTicket,
  addMessage,
  updateStatus,
  assignTicket,
  listAll,
};
