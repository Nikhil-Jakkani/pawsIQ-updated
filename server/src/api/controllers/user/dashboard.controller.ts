import { Request, Response } from 'express';
import httpStatus from 'http-status';
import prisma from '../../../lib/prisma.js';
import { reminderService } from '../../services/reminder/reminder.service.js';
import { createHash } from 'crypto';

export const getDashboard = async (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user?.user_id) {
      return res.status(httpStatus.UNAUTHORIZED).json({ error: 'Please authenticate' });
    }

    const userIdBig = BigInt(user.user_id);

    const now = new Date();
    const ninetyDaysAhead = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [pets, totalAppointments, recentAppointments, reminders] = await Promise.all([
      prisma.pIQ_Pets.findMany({
        where: { user_id: userIdBig },
        orderBy: { created_at: 'asc' },
        select: {
          pet_id: true,
          pet_name: true,
          pet_type: true,
          pet_breed: true,
          pet_gender: true,
          pet_birth_dtm: true,
          pet_image: true,
          created_at: true,
          last_updated_dtm: true,
        },
      }),
      prisma.pIQ_Appointments.count({ where: { PIQ_Pets: { user_id: userIdBig } } }),
      prisma.pIQ_Appointments.findMany({
        where: { PIQ_Pets: { user_id: userIdBig }, appointment_date: { lte: ninetyDaysAhead } },
        orderBy: { appointment_date: 'desc' },
        take: 10,
        select: {
          appointment_id: true,
          pet_id: true,
          appointment_type: true,
          appointment_date: true,
          appointment_status: true,
          appointment_comments: true,
        },
      }),
      reminderService.getUserCareReminders(userIdBig),
    ]);

    const normalizeBigInt = (obj: any) => JSON.parse(
      JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? v.toString() : v))
    );

    const payload = {
      pets: normalizeBigInt(pets),
      appointments: {
        total: totalAppointments,
        recent: normalizeBigInt(recentAppointments),
      },
      reminders: reminders.items,
      reminderCount: reminders.count,
      serverTime: now.toISOString(),
    };

    const petsMaxTs = pets.reduce<number>((acc: number, p: any) => {
      const ts = new Date(p.last_updated_dtm || p.created_at || p.pet_birth_dtm || now).getTime();
      return Math.max(acc, ts);
    }, 0);
    const latestAppt = recentAppointments[0]?.appointment_date ? new Date(recentAppointments[0].appointment_date).getTime() : 0;
    const reminderCount = reminders.count || (Array.isArray(reminders.items) ? reminders.items.length : 0);
    const etagBase = JSON.stringify({
      u: String(userIdBig),
      pc: pets.length,
      pm: petsMaxTs,
      at: totalAppointments,
      al: recentAppointments.length,
      la: latestAppt,
      rc: reminderCount,
    });
    const etag = createHash('sha1').update(etagBase).digest('hex');

    if (req.headers['if-none-match'] === etag) {
      res.set('ETag', etag);
      res.set('Cache-Control', 'private, max-age=15');
      return res.status(httpStatus.NOT_MODIFIED).end();
    }

    res.set('Cache-Control', 'private, max-age=15');
    res.set('ETag', etag);
    return res.status(httpStatus.OK).json(payload);
  } catch (error: any) {
    console.error('Dashboard aggregation error:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to load dashboard' });
  }
};

export default { getDashboard };
