import httpStatus from 'http-status';
import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../utils/ApiError.js';

const prisma = new PrismaClient();

// Helpers
const serializeBigInt = <T>(data: T): T =>
  JSON.parse(
    JSON.stringify(data as any, (_k, v) => (typeof v === 'bigint' ? v.toString() : v))
  );

export type ReminderPriority = 'high' | 'normal';

export interface CareReminder {
  id: string;
  pet_id: number; // safe number for client usage
  pet_name: string | null;
  pet_type: string | null;
  title: string;
  subtitle: string;
  due_in_days: number;
  priority: ReminderPriority;
  due_date?: string;
  source?: 'computed' | 'appointment' | 'custom';
}

const daysBetween = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
const clampToNumber = (v: bigint | number | null | undefined): number => {
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'number') return v;
  return 0;
};
const ensurePetBelongsToUser = async (userId: bigint, petId: bigint) => {
  const pet = await prisma.pIQ_Pets.findFirst({ where: { pet_id: petId, user_id: userId } });
  if (!pet) throw new ApiError(httpStatus.FORBIDDEN, 'Pet does not belong to user');
};

// Read all (computed + custom + upcoming appointments)
export const getUserCareReminders = async (userId: bigint): Promise<{ items: CareReminder[]; count: number }> => {
  const [pets, customReminders] = await Promise.all([
    prisma.pIQ_Pets.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' } }),
    prisma.pIQ_Reminders.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' } }),
  ]);

  const today = new Date();
  const items: CareReminder[] = [];

  // Computed reminders per pet
  for (const pet of pets) {
    const petIdNum = clampToNumber(pet.pet_id);
    const petName = pet.pet_name ?? null;
    const petType = pet.pet_type?.toLowerCase() ?? null;
    const birth = pet.pet_birth_dtm ? new Date(pet.pet_birth_dtm) : undefined;
    const ageYears = birth ? Math.max(0, Math.floor(daysBetween(today, birth) / 365)) : 3;
    const lastCheckup = new Date(pet.created_at);
    const daysSinceCheckup = Math.max(0, daysBetween(today, lastCheckup));

    const groomingFreq = petType === 'dog' ? 14 : 7;
    const groomingDueIn = Math.max(0, groomingFreq - (daysSinceCheckup % groomingFreq));
    items.push({
      id: `grooming-${petIdNum}`,
      pet_id: petIdNum,
      pet_name: petName,
      pet_type: petType,
      title: 'Grooming',
      subtitle: 'days left',
      due_in_days: groomingDueIn,
      priority: (daysSinceCheckup % groomingFreq) > groomingFreq - 3 ? 'high' : 'normal',
      source: 'computed',
    });

    const vaccineDate = new Date(lastCheckup);
    vaccineDate.setFullYear(vaccineDate.getFullYear() + 1);
    const daysToVaccine = Math.ceil((vaccineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysToVaccine > 0 && daysToVaccine <= 90) {
      items.push({
        id: `vaccine-${petIdNum}`,
        pet_id: petIdNum,
        pet_name: petName,
        pet_type: petType,
        title: 'Vaccination',
        subtitle: 'days left',
        due_in_days: daysToVaccine,
        priority: daysToVaccine <= 30 ? 'high' : 'normal',
        due_date: vaccineDate.toISOString(),
        source: 'computed',
      });
    }

    const nextCheckupDays = ageYears > 7 ? 180 : 365;
    const daysToCheckup = Math.max(0, nextCheckupDays - daysSinceCheckup);
    if (daysToCheckup > 0 && daysToCheckup <= 60) {
      items.push({
        id: `checkup-${petIdNum}`,
        pet_id: petIdNum,
        pet_name: petName,
        pet_type: petType,
        title: 'Health Checkup',
        subtitle: 'days left',
        due_in_days: daysToCheckup,
        priority: daysToCheckup <= 14 ? 'high' : 'normal',
        source: 'computed',
      });
    }

    const dentalFreq = petType === 'dog' ? 180 : 365;
    const daysToDental = Math.max(0, dentalFreq - (daysSinceCheckup % dentalFreq));
    if (daysToDental <= 30) {
      items.push({
        id: `dental-${petIdNum}`,
        pet_id: petIdNum,
        pet_name: petName,
        pet_type: petType,
        title: 'Dental Care',
        subtitle: 'days left',
        due_in_days: daysToDental,
        priority: daysToDental <= 7 ? 'high' : 'normal',
        source: 'computed',
      });
    }

    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const daysToFlea = Math.ceil((startOfNextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysToFlea <= 7) {
      items.push({
        id: `flea-${petIdNum}`,
        pet_id: petIdNum,
        pet_name: petName,
        pet_type: petType,
        title: 'Flea Prevention',
        subtitle: 'days left',
        due_in_days: Math.max(0, daysToFlea),
        priority: daysToFlea <= 2 ? 'high' : 'normal',
        source: 'computed',
      });
    }
  }

  // Upcoming appointments within 90 days as reminder items
  const ninetyDaysAhead = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
  const appts = await prisma.pIQ_Appointments.findMany({
    where: { PIQ_Pets: { user_id: userId }, appointment_date: { gte: today, lte: ninetyDaysAhead } },
    orderBy: { appointment_date: 'asc' },
  });
  for (const a of appts) {
    const petIdNum = clampToNumber(a.pet_id);
    const pet = pets.find((p: { pet_id: bigint }) => clampToNumber(p.pet_id) === petIdNum);
    const dt = new Date(a.appointment_date);
    const days = Math.max(0, Math.ceil((dt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    items.push({
      id: `appointment-${a.appointment_id}`,
      pet_id: petIdNum,
      pet_name: pet?.pet_name ?? null,
      pet_type: pet?.pet_type?.toLowerCase() ?? null,
      title: a.appointment_type,
      subtitle: 'days left',
      due_in_days: days,
      priority: days <= 2 ? 'high' : 'normal',
      due_date: dt.toISOString(),
      source: 'appointment',
    });
  }

  // Custom reminders saved in DB
  for (const r of customReminders) {
    const petIdNum = clampToNumber(r.pet_id);
    const pet = pets.find((p: { pet_id: bigint }) => clampToNumber(p.pet_id) === petIdNum);
    const due = r.due_date ? new Date(r.due_date) : undefined;
    const days = due ? Math.max(0, Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    items.push({
      id: `custom-${r.reminder_id}`,
      pet_id: petIdNum,
      pet_name: pet?.pet_name ?? null,
      pet_type: pet?.pet_type?.toLowerCase() ?? null,
      title: r.title,
      subtitle: 'days left',
      due_in_days: days,
      priority: ((r.priority || 'normal') as ReminderPriority) === 'high' ? 'high' : 'normal',
      due_date: due?.toISOString(),
      source: 'custom',
    });
  }

  const sorted = items
    .sort((a, b) => (a.priority === 'high' && b.priority !== 'high' ? -1 : b.priority === 'high' && a.priority !== 'high' ? 1 : a.due_in_days - b.due_in_days))
    .slice(0, 12);

  return { items: serializeBigInt(sorted), count: sorted.length };
};

// CRUD for custom reminders
const createReminder = async (
  userId: bigint,
  body: { pet_id: number | string | bigint; title: string; reminder_type?: string; due_date?: string; priority?: ReminderPriority; notes?: string }
) => {
  if (!body?.title?.trim()) throw new ApiError(httpStatus.BAD_REQUEST, 'title is required');
  const petId = BigInt(body.pet_id);
  await ensurePetBelongsToUser(userId, petId);
  let due: Date | null = null;
  if (body.due_date) {
    const d = new Date(body.due_date);
    if (isNaN(d.getTime())) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid due_date');
    due = d;
  }
  const created = await prisma.pIQ_Reminders.create({
    data: {
      user_id: userId,
      pet_id: petId,
      title: body.title,
      reminder_type: body.reminder_type || 'custom',
      due_date: due,
      priority: (body.priority || 'normal') as string,
      notes: body.notes || null,
    },
  });
  return serializeBigInt(created);
};

const updateReminder = async (
  userId: bigint,
  id: number,
  body: Partial<{ pet_id: number | string | bigint; title: string; reminder_type: string; due_date: string; priority: ReminderPriority; notes: string }>
) => {
  const existing = await prisma.pIQ_Reminders.findUnique({ where: { reminder_id: id } });
  if (!existing || existing.user_id !== userId) throw new ApiError(httpStatus.NOT_FOUND, 'Reminder not found');
  const data: any = {};
  if (body.pet_id !== undefined) {
    const newPetId = BigInt(body.pet_id);
    await ensurePetBelongsToUser(userId, newPetId);
    data.pet_id = newPetId;
  }
  if (body.title !== undefined) data.title = body.title;
  if (body.reminder_type !== undefined) data.reminder_type = body.reminder_type;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.due_date !== undefined) {
    const d = new Date(body.due_date);
    if (isNaN(d.getTime())) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid due_date');
    data.due_date = d;
  }
  const updated = await prisma.pIQ_Reminders.update({ where: { reminder_id: id }, data });
  return serializeBigInt(updated);
};

const deleteReminder = async (userId: bigint, id: number) => {
  const existing = await prisma.pIQ_Reminders.findUnique({ where: { reminder_id: id } });
  if (!existing || existing.user_id !== userId) throw new ApiError(httpStatus.NOT_FOUND, 'Reminder not found');
  await prisma.pIQ_Reminders.delete({ where: { reminder_id: id } });
  return { success: true };
};

export const reminderService = {
  getUserCareReminders,
  createReminder,
  updateReminder,
  deleteReminder,
};
