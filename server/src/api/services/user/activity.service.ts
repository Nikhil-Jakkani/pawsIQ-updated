import httpStatus from 'http-status';
import { ApiError } from '../../utils/ApiError.js';
import prisma from '../../../lib/prisma.js';

type ActivityType = 'walking' | 'food' | 'water' | 'play' | 'sleep';

const ACTIVITY_CONFIG: Record<ActivityType, { unit: string; goal: number }> = {
  walking: { unit: 'min', goal: 60 },
  food: { unit: 'portions', goal: 3 },
  water: { unit: 'cups', goal: 6 },
  play: { unit: 'min', goal: 45 },
  sleep: { unit: 'hours', goal: 12 },
};

const ACTIVITY_TYPES = Object.keys(ACTIVITY_CONFIG) as ActivityType[];

// Temporary helper until prisma client is regenerated with the Pet Activity model
const petActivityModel = () => (prisma as any).pIQ_Pet_Activity;

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const subtractDays = (date: Date, amount: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - amount);
  return copy;
};

const toJsonSafe = (record: any) => {
  if (!record) return record;
  const safe: Record<string, any> = { ...record };
  if (record.activity_id != null) safe.activity_id = Number(record.activity_id);
  if (record.pet_id != null) safe.pet_id = Number(record.pet_id);
  if (record.user_id != null) safe.user_id = Number(record.user_id);
  return safe;
};

const ensurePetOwnership = async (userId: number, petId: number) => {
  const pet = await prisma.pIQ_Pets.findFirst({
    where: {
      pet_id: BigInt(petId),
      user_id: BigInt(userId),
    },
    select: { pet_id: true },
  });

  if (!pet) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Pet not found or access denied');
  }
};

const buildWeekSkeleton = (days: number) => {
  const today = startOfDay(new Date());
  const buckets: { key: string; bucket: any }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = startOfDay(subtractDays(today, i));
    const key = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString('en-US', { weekday: 'short' });
    const bucket: Record<string, any> = { day: label };
    ACTIVITY_TYPES.forEach((type) => {
      bucket[type] = 0;
    });
    buckets.push({ key, bucket });
  }
  return buckets;
};

const buildSummary = (entries: any[], days: number) => {
  const skeleton = buildWeekSkeleton(Math.max(1, Math.min(days, 30)));
  const bucketMap = new Map<string, Record<string, any>>();
  skeleton.forEach(({ key, bucket }) => bucketMap.set(key, bucket));
  const todayKey = skeleton.length ? skeleton[skeleton.length - 1].key : '';
  const todayTotals: Record<ActivityType, number> = {
    walking: 0,
    food: 0,
    water: 0,
    play: 0,
    sleep: 0,
  };

  entries.forEach((entry) => {
    const type = entry.activity_type as ActivityType;
    if (!ACTIVITY_CONFIG[type]) return;
    const value = Number(entry.value ?? 0) || 0;
    const entryKey = startOfDay(new Date(entry.logged_at)).toISOString().slice(0, 10);
    const bucket = bucketMap.get(entryKey);
    if (bucket) {
      bucket[type] = Number((bucket[type] || 0) + value);
    }
    if (entryKey === todayKey) {
      todayTotals[type] = Number((todayTotals[type] || 0) + value);
    }
  });

  const today: Record<ActivityType, { value: number; goal: number; unit: string }> = {} as any;
  ACTIVITY_TYPES.forEach((type) => {
    const cfg = ACTIVITY_CONFIG[type];
    today[type] = {
      value: Number(todayTotals[type] || 0),
      goal: cfg.goal,
      unit: cfg.unit,
    };
  });

  return {
    today,
    week: skeleton.map(({ bucket }) => bucket),
  };
};

export const getPetActivitySummary = async (userId: number, petId: number, days = 7) => {
  if (!petId) throw new ApiError(httpStatus.BAD_REQUEST, 'petId is required');

  await ensurePetOwnership(userId, petId);
  const windowDays = Math.max(1, Math.min(days, 30));
  const fromDate = startOfDay(subtractDays(new Date(), windowDays - 1));

  const entries = await petActivityModel().findMany({
    where: {
      pet_id: BigInt(petId),
      user_id: BigInt(userId),
      logged_at: {
        gte: fromDate,
      },
    },
    orderBy: { logged_at: 'desc' },
  });

  return {
    entries: entries.map(toJsonSafe),
    summary: buildSummary(entries, windowDays),
  };
};

export const logPetActivity = async (
  userId: number,
  petId: number,
  payload: {
    activityType: ActivityType;
    value: number;
    unit?: string;
    note?: string;
    metadata?: Record<string, any>;
    loggedAt?: string | Date;
  },
) => {
  if (!petId) throw new ApiError(httpStatus.BAD_REQUEST, 'petId is required');

  await ensurePetOwnership(userId, petId);

  const activityType = payload.activityType;
  if (!ACTIVITY_CONFIG[activityType]) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Unsupported activity type');
  }

  const value = Number(payload.value);
  if (Number.isNaN(value)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Numeric value is required');
  }

  const unit = payload.unit || ACTIVITY_CONFIG[activityType].unit;

  const created = await petActivityModel().create({
    data: {
      pet_id: BigInt(petId),
      user_id: BigInt(userId),
      activity_type: activityType,
      value,
      unit,
      note: payload.note || null,
      metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : undefined,
      logged_at: payload.loggedAt ? new Date(payload.loggedAt) : new Date(),
    },
  });

  const summaryPayload = await getPetActivitySummary(userId, petId, 7);

  return {
    activity: toJsonSafe(created),
    summary: summaryPayload.summary,
  };
};

export { startOfDay, subtractDays, toJsonSafe, ensurePetOwnership, buildWeekSkeleton, buildSummary };

export default {
  logPetActivity,
  getPetActivitySummary,
  ACTIVITY_CONFIG,
};