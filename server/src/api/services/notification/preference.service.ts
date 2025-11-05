import prisma from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import httpStatus from 'http-status';

const normalizeChannel = (channel: string) => channel.trim().toLowerCase();
const normalizeKey = (key: string) => key.trim().toLowerCase();

const listPreferences = async (userId: number) => {
  return prisma.userNotificationPreference.findMany({
    where: { user_id: BigInt(userId) },
    orderBy: [{ channel: 'asc' }, { key: 'asc' }],
  });
};

const upsertPreferences = async (userId: number, preferences: { channel: string; key: string; enabled: boolean }[]) => {
  if (!preferences?.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Preferences payload cannot be empty');
  }

  const results = [] as any[];
  for (const pref of preferences) {
    const channel = normalizeChannel(pref.channel);
    const key = normalizeKey(pref.key);

    const result = await prisma.userNotificationPreference.upsert({
      where: {
        user_id_channel_key: {
          user_id: BigInt(userId),
          channel,
          key,
        },
      },
      create: {
        user_id: BigInt(userId),
        channel,
        key,
        enabled: Boolean(pref.enabled),
      },
      update: {
        enabled: Boolean(pref.enabled),
        updated_at: new Date(),
      },
    });
    results.push(result);
  }

  return results;
};

const deletePreferences = async (userId: number, channel?: string) => {
  const where: any = { user_id: BigInt(userId) };
  if (channel) {
    where.channel = normalizeChannel(channel);
  }
  await prisma.userNotificationPreference.deleteMany({ where });
};

export const notificationPreferenceService = {
  listPreferences,
  upsertPreferences,
  deletePreferences,
};
