import prisma from '../../../lib/prisma.js';

const serializeBigInt = <T>(data: T): T => {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
  ) as T;
};

export const adminBookingService = {
  list: async ({ page = 1, limit = 20, status }: { page?: number; limit?: number; status?: string }) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (p - 1) * l;
    const where: any = {};
    if (status) where.booking_status = status;
    const [items, total] = await Promise.all([
      prisma.pIQ_Bookings.findMany({
        where,
        orderBy: { created_dtm: 'desc' },
        skip,
        take: l,
        include: {
          PIQ_Pets: { select: { pet_name: true, pet_type: true, user_id: true } },
          PIQ_User: { select: { user_full_name: true, user_email_id: true } },
          PIQ_Service_Master: { select: { service_type: true, service_title: true } },
          PIQ_Service_Provider: { select: { serv_provider_name: true, serv_provider_type: true } },
        },
      }),
      prisma.pIQ_Bookings.count({ where }),
    ]);
    return {
      items: items.map(serializeBigInt),
      page: p,
      limit: l,
      total,
      pages: Math.ceil(total / l),
    };
  },
};
