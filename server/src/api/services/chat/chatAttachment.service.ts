import { randomUUID } from 'node:crypto';
import httpStatus from 'http-status';
import { db } from '../../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { ensureAccess, type ChatActor } from './chat.service.js';

const CHAT_BUCKET = 'chat-attachments';

const sanitizeExtension = (fileName: string): string => {
  const match = /\.([a-zA-Z0-9]{1,10})$/.exec(fileName || '');
  if (!match) {
    return 'bin';
  }
  return match[1].toLowerCase();
};

const buildPath = (conversationId: number, actor: ChatActor, fileName: string) => {
  const ext = sanitizeExtension(fileName);
  const segments = [conversationId.toString()];

  if (actor.role === 'user' && actor.userId) {
    segments.push(`user-${actor.userId.toString()}`);
  }
  if (actor.role === 'provider' && actor.providerId !== undefined && actor.providerId !== null) {
    segments.push(`provider-${actor.providerId}`);
  }
  if (actor.role === 'admin' && actor.adminId) {
    segments.push(`admin-${actor.adminId.toString()}`);
  }

  const key = randomUUID();
  return `${segments.join('/')}/${key}.${ext}`;
};

export const requestAttachmentUpload = async (
  actor: ChatActor,
  conversationId: number,
  payload: { file_name: string; file_size: number; file_type?: string | null }
) => {
  const normalizedConversationId = Number(conversationId);
  if (!normalizedConversationId || Number.isNaN(normalizedConversationId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid conversation id');
  }

  // Ensure caller has access to the conversation
  await ensureAccess(normalizedConversationId, actor);

  const path = buildPath(normalizedConversationId, actor, payload.file_name);

  const { data, error } = await db.storage.from(CHAT_BUCKET).createSignedUploadUrl(path);

  if (error || !data) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error?.message || 'Unable to start upload');
  }

  const tokenExpiresAt = typeof (data as any)?.tokenExpiresAt === 'string' ? (data as any).tokenExpiresAt : null;

  return {
    bucket: CHAT_BUCKET,
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    uploadExpiresAt: tokenExpiresAt,
    metadata: {
      file_name: payload.file_name,
      file_type: payload.file_type ?? null,
      file_size: payload.file_size,
    },
  };
};
