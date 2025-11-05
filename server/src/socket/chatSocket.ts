import type { Server as HttpServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { Server, type Socket } from 'socket.io';
import config from '../config/config.js';
import { chatEvents, type ConversationPayload, type MessagePayload, type TypingPayload } from '../events/chatEvents.js';

const CONVERSATION_ROOM_PREFIX = 'conversation:';
const ACTOR_ROOM_PREFIX = 'actor:';

let ioInstance: Server | null = null;
let listenersRegistered = false;

const getActorRoom = (role: string, id: string | number | bigint | null | undefined) => {
  if (!role || id === null || id === undefined) {
    return null;
  }
  return `${ACTOR_ROOM_PREFIX}${role}:${id.toString()}`;
};

const extractToken = (socket: Socket): string | null => {
  const { auth, query, headers } = socket.handshake;

  if (auth?.token && typeof auth.token === 'string') {
    return auth.token;
  }
  if (query?.token && typeof query.token === 'string') {
    return query.token;
  }

  const header = headers['authorization'] || headers['Authorization'];
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7);
  }

  return null;
};

const registerChatEventListeners = (io: Server) => {
  if (listenersRegistered) return;

  const broadcastConversation = (conversation: ConversationPayload | null | undefined, eventName: string) => {
    if (!conversation) return;
    const conversationRoom = `${CONVERSATION_ROOM_PREFIX}${conversation.conversation_id}`;
    io.to(conversationRoom).emit(eventName, conversation);

    const participants = conversation.participants || [];
    participants.forEach((participant) => {
      const { role } = participant || {};
      const room =
        (role === 'user' && getActorRoom('user', participant?.user_id ?? null)) ||
        (role === 'provider' && getActorRoom('provider', participant?.provider_id ?? null)) ||
        (role === 'admin' && getActorRoom('admin', participant?.admin_id ?? null));
      if (room) {
        io.to(room).emit(eventName, conversation);
      }
    });
  };

  chatEvents.on('conversation:created', (conversation: ConversationPayload) => {
    broadcastConversation(conversation, 'conversation:created');
  });

  chatEvents.on('conversation:updated', ({ conversation }: { conversation: ConversationPayload }) => {
    broadcastConversation(conversation, 'conversation:updated');
  });

  chatEvents.on('message:created', ({ conversationId, message, conversation }: MessagePayload) => {
    const conversationRoom = `${CONVERSATION_ROOM_PREFIX}${conversationId}`;
    io.to(conversationRoom).emit('message:created', message);
    if (conversation) {
      broadcastConversation(conversation, 'conversation:updated');
    }
  });

  chatEvents.on('participant:read', (payload) => {
    const room = `${CONVERSATION_ROOM_PREFIX}${payload.conversationId}`;
    io.to(room).emit('participant:read', payload);
  });

  chatEvents.on('participant:typing', (payload: TypingPayload) => {
    const room = `${CONVERSATION_ROOM_PREFIX}${payload.conversationId}`;
    io.to(room).emit('participant:typing', payload);
  });

  listenersRegistered = true;
};

const authenticateSocket = (socket: Socket) => {
  const token = extractToken(socket);
  if (!token) {
    throw new Error('Missing authentication token');
  }

  const payload: any = jwt.verify(token, config.jwtSecret);
  if (!payload?.role || !payload?.sub) {
    throw new Error('Invalid authentication payload');
  }

  const normalizedRole = String(payload.role).toLowerCase();
  const actorId = payload.sub;

  return {
    role: normalizedRole as 'user' | 'provider' | 'admin',
    actorId: actorId?.toString(),
    raw: payload,
  };
};

const handleSocketConnection = (socket: Socket) => {
  try {
    const auth = authenticateSocket(socket);
    socket.data.actor = auth;

    const actorRoom = getActorRoom(auth.role, auth.actorId);
    if (actorRoom) {
      socket.join(actorRoom);
    }

    socket.emit('session:ready', { role: auth.role, actorId: auth.actorId });
  } catch (error: any) {
    socket.emit('session:error', { message: error.message || 'Authentication failed' });
    socket.disconnect(true);
    return;
  }

  socket.on('joinConversation', (conversationId: number | string) => {
    if (!conversationId) return;
    const room = `${CONVERSATION_ROOM_PREFIX}${conversationId}`;
    socket.join(room);
  });

  socket.on('leaveConversation', (conversationId: number | string) => {
    if (!conversationId) return;
    const room = `${CONVERSATION_ROOM_PREFIX}${conversationId}`;
    socket.leave(room);
  });

  socket.on('typing', (payload: { conversationId: number | string; typing: boolean }) => {
    if (!payload?.conversationId) return;
    const actor = socket.data.actor;
    if (!actor?.actorId) return;

    const typingPayload: TypingPayload = {
      conversationId: Number(payload.conversationId),
      typing: Boolean(payload.typing),
      actor: {
        role: actor.role,
        id: actor.actorId,
      },
    };

    chatEvents.emit('participant:typing', typingPayload);
  });

  socket.on('disconnect', () => {
    // socket.io automatically cleans up rooms; nothing specific to do for now
  });
};

export const initChatSocket = (server: HttpServer) => {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new Server(server, {
    cors: {
      origin: ['http://localhost:3001', 'https://pawsiq.in', 'https://www.pawsiq.in'],
      credentials: true,
    },
  });

  registerChatEventListeners(ioInstance);

  ioInstance.on('connection', handleSocketConnection);

  console.log('[Socket] Chat socket server initialized');

  return ioInstance;
};
