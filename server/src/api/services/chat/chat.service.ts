import httpStatus from 'http-status';
import prisma from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { serializeBigInt } from '../../utils/bigIntSerializer.js';

export type ChatActor = {
  role: 'user' | 'provider' | 'admin';
  userId?: bigint;
  providerId?: number;
  adminId?: bigint;
};

export type CreateConversationPayload = {
  topic?: string | null;
  context_type?: string | null;
  participants?: Array<{ role: 'user' | 'provider' | 'admin'; id: number | string }>;
  initial_message?: {
    message_body: string;
    attachments?: unknown;
  } | null;
};

const buildActorFilter = (actor: ChatActor) => {
  switch (actor.role) {
    case 'user':
      return { participants: { some: { user_id: actor.userId } } };
    case 'provider':
      return { participants: { some: { provider_id: actor.providerId } } };
    case 'admin':
      return {};
    default:
      throw new ApiError(httpStatus.FORBIDDEN, 'Unsupported actor role');
  }
};

const ensureAccess = async (conversationId: number, actor: ChatActor) => {
  if (actor.role === 'admin') {
    return;
  }

  const participantWhere =
    actor.role === 'user'
      ? {
          conversation_id: conversationId,
          user_id: actor.userId,
        }
      : {
          conversation_id: conversationId,
          provider_id: actor.providerId,
        };

  const participant = await prisma.chatParticipant.findFirst({ where: participantWhere });
  if (!participant) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied to this conversation');
  }
};

const normalizeParticipant = (participant: { role: 'user' | 'provider' | 'admin'; id: number | string }) => {
  if (participant.role === 'user') {
    return {
      role: 'user' as const,
      user_id: BigInt(participant.id),
      provider_id: null,
      admin_id: null,
    };
  }
  if (participant.role === 'provider') {
    return {
      role: 'provider' as const,
      user_id: null,
      provider_id: Number(participant.id),
      admin_id: null,
    };
  }
  return {
    role: 'admin' as const,
    user_id: null,
    provider_id: null,
    admin_id: BigInt(participant.id),
  };
};

const uniqueParticipants = (items: Array<{ role: 'user' | 'provider' | 'admin'; id: number | string }>) => {
  const seen = new Set<string>();
  const result: Array<{ role: 'user' | 'provider' | 'admin'; id: number | string }> = [];
  for (const item of items) {
    const key = `${item.role}:${item.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
};

const createConversation = async (actor: ChatActor, payload: CreateConversationPayload) => {
  const actorParticipant: { role: 'user' | 'provider' | 'admin'; id: number | string } =
    actor.role === 'user'
      ? { role: 'user', id: actor.userId ? Number(actor.userId) : 0 }
      : actor.role === 'provider'
      ? { role: 'provider', id: actor.providerId ?? 0 }
      : { role: 'admin', id: actor.adminId ? Number(actor.adminId) : 0 };

  if (!actorParticipant.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Invalid actor for chat creation');
  }

  const participantsInput = uniqueParticipants([
    actorParticipant,
    ...((payload.participants ?? []).filter((p) => p.id !== null && p.id !== undefined) as Array<{
      role: 'user' | 'provider' | 'admin';
      id: number | string;
    }>),
  ]);

  if (!participantsInput.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Conversation must include participants');
  }

  const created = await prisma.$transaction(async (tx) => {
    const conversation = await tx.chatConversation.create({
      data: {
        topic: payload.topic ?? null,
        context_type: payload.context_type ?? null,
        created_by_user_id: actor.role === 'user' ? actor.userId ?? null : null,
        created_by_provider_id: actor.role === 'provider' ? actor.providerId ?? null : null,
        created_by_admin_id: actor.role === 'admin' ? actor.adminId ?? null : null,
      },
    });

    await tx.chatParticipant.createMany({
      data: participantsInput.map((participant) => ({
        conversation_id: conversation.conversation_id,
        ...normalizeParticipant(participant),
      })),
      skipDuplicates: true,
    });

    if (payload.initial_message?.message_body) {
      const authorFields =
        actor.role === 'user'
          ? { author_user_id: actor.userId ?? null }
          : actor.role === 'provider'
          ? { author_provider_id: actor.providerId ?? null }
          : { author_admin_id: actor.adminId ?? null };

      await tx.chatMessage.create({
        data: {
          conversation_id: conversation.conversation_id,
          author_role: actor.role,
          message_body: payload.initial_message.message_body,
          attachments: payload.initial_message.attachments ?? [],
          ...authorFields,
        },
      });

      await tx.chatConversation.update({
        where: { conversation_id: conversation.conversation_id },
        data: { last_message_at: new Date() },
      });
    }

    return conversation.conversation_id;
  });

  const conversation = await prisma.chatConversation.findUnique({
    where: { conversation_id: created },
    include: {
      participants: {
        include: {
          user: true,
          provider: true,
          admin: true,
        },
      },
      messages: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  });

  return serializeBigInt(conversation);
};

const listConversations = async (actor: ChatActor, query: any) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  const isArchived =
    query.is_archived === undefined || query.is_archived === null
      ? undefined
      : query.is_archived === 'true' || query.is_archived === true;

  const where = {
    ...(isArchived !== undefined ? { is_archived: isArchived } : {}),
    ...buildActorFilter(actor),
  };

  const [items, total] = await Promise.all([
    prisma.chatConversation.findMany({
      where,
      orderBy: { last_message_at: 'desc' },
      skip,
      take: limit,
      include: {
        participants: {
          include: {
            user: true,
            provider: true,
            admin: true,
          },
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.chatConversation.count({ where }),
  ]);

  return serializeBigInt({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

const getConversation = async (actor: ChatActor, conversationId: number) => {
  await ensureAccess(conversationId, actor);
  const conversation = await prisma.chatConversation.findUnique({
    where: { conversation_id: conversationId },
    include: {
      participants: {
        include: {
          user: true,
          provider: true,
          admin: true,
        },
      },
      messages: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  });

  if (!conversation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Conversation not found');
  }

  return serializeBigInt(conversation);
};

const listMessages = async (actor: ChatActor, conversationId: number, query: any) => {
  await ensureAccess(conversationId, actor);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
  const cursor = query.cursor ? Number(query.cursor) : undefined;

  const messages = await prisma.chatMessage.findMany({
    where: { conversation_id: conversationId, ...(cursor ? { message_id: { lt: cursor } } : {}) },
    orderBy: { message_id: 'desc' },
    take: limit,
  });

  const reordered = messages.slice().reverse();
  return serializeBigInt({
    items: reordered,
    nextCursor: messages.length === limit ? messages[messages.length - 1].message_id : null,
  });
};

const sendMessage = async (
  actor: ChatActor,
  conversationId: number,
  body: { message_body: string; attachments?: unknown }
) => {
  await ensureAccess(conversationId, actor);

  const authorFields =
    actor.role === 'user'
      ? { author_user_id: actor.userId ?? null }
      : actor.role === 'provider'
      ? { author_provider_id: actor.providerId ?? null }
      : { author_admin_id: actor.adminId ?? null };

  const message = await prisma.chatMessage.create({
    data: {
      conversation_id: conversationId,
      author_role: actor.role,
      message_body: body.message_body,
      attachments: body.attachments ?? [],
      ...authorFields,
    },
  });

  await prisma.chatConversation.update({
    where: { conversation_id: conversationId },
    data: { last_message_at: new Date() },
  });

  return serializeBigInt(message);
};

const updateConversation = async (
  actor: ChatActor,
  conversationId: number,
  data: { is_archived?: boolean | null }
) => {
  await ensureAccess(conversationId, actor);
  const updated = await prisma.chatConversation.update({
    where: { conversation_id: conversationId },
    data: {
      ...(data.is_archived !== undefined ? { is_archived: Boolean(data.is_archived) } : {}),
    },
  });
  return serializeBigInt(updated);
};

const markRead = async (actor: ChatActor, conversationId: number) => {
  await ensureAccess(conversationId, actor);

  const where =
    actor.role === 'user'
      ? { conversation_id: conversationId, user_id: actor.userId }
      : actor.role === 'provider'
      ? { conversation_id: conversationId, provider_id: actor.providerId }
      : { conversation_id: conversationId, admin_id: actor.adminId };

  await prisma.chatParticipant.updateMany({
    where,
    data: { last_read_at: new Date() },
  });
};

export const chatService = {
  createConversation,
  listConversations,
  getConversation,
  listMessages,
  sendMessage,
  updateConversation,
  markRead,
};
