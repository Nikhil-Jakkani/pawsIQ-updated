import httpStatus from 'http-status';
import { ApiError } from '../../utils/ApiError.js';
import prisma from '../../../lib/prisma.js';

const db = prisma as any;

const getProviderById = async (id: number) => {
  const provider = await prisma.pIQ_Service_Provider.findUnique({
    where: { service_provider_id: id },
    select: {
      service_provider_id: true,
      serv_provider_name: true,
      serv_provider_email: true,
      serv_provider_contact_nbr: true,
      serv_provider_desc: true,
      serv_provider_type: true,
      serv_provider_status: true,
      serv_provider_exp_years: true,
      serv_provider_certificates: true,
      serv_provider_location: true,
      provider_src: true,
      is_provider_bgchecked: true,
      created_at: true,
      last_updated_dtm: true,
    },
  });

  if (!provider) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provider not found');
  }

  const todayIso = new Date();

  // Fetch related data with error handling
  let upcomingBookings = [];
  let reviews = [];
  let metricsRecord = null;
  let payoutsSummary = [];

  try {
    [upcomingBookings, reviews, metricsRecord, payoutsSummary] = await Promise.all([
      db.pIQ_Bookings.findMany({
        where: {
          service_provider_id: id,
          booked_dtm: { gte: todayIso },
          booking_status: { in: ['Pending', 'Confirmed'] },
        },
        orderBy: { booked_dtm: 'asc' },
        take: 10,
        include: {
          PIQ_User: { select: { user_full_name: true } },
          PIQ_Pets: { select: { pet_name: true, pet_type: true } },
          PIQ_Service_Master: { select: { service_title: true, service_type: true } },
        },
      }).catch(() => []),
      db.ProviderReviews.findMany({
        where: { service_provider_id: id },
        orderBy: { reviewed_at: 'desc' },
        take: 5,
      }).catch(() => []),
      db.ProviderDashboardMetrics.findFirst({
        where: { service_provider_id: id },
        orderBy: { metric_date: 'desc' },
      }).catch(() => null),
      db.ProviderPayouts.groupBy({
        by: ['status'],
        where: { service_provider_id: id },
        _sum: { amount: true },
        _count: { payout_id: true },
      }).catch(() => []),
    ]);
  } catch (error) {
    console.warn('Error fetching provider dashboard data:', error);
  }

  const upcomingAppointments = upcomingBookings.map((booking: any) => ({
    id: booking.booking_id,
    date: booking.booked_dtm,
    status: booking.booking_status,
    client: booking.PIQ_User?.user_full_name ?? null,
    pet: booking.PIQ_Pets?.pet_name ?? null,
    petType: booking.PIQ_Pets?.pet_type ?? null,
    service: booking.PIQ_Service_Master?.service_title ?? booking.PIQ_Service_Master?.service_type ?? null,
  }));

  const recentReviews = reviews.map((review: any) => ({
    id: review.review_id,
    rating: review.rating,
    comment: review.review_text,
    reviewedAt: review.reviewed_at,
    client: null, // Will be populated if needed
    bookingId: review.booking_id,
  }));

  const performance = {
    earnings: Number(metricsRecord?.earnings ?? 0),
    totalBookings: metricsRecord?.total_bookings ?? 0,
    completedBookings: metricsRecord?.completed_bookings ?? 0,
    cancelledBookings: metricsRecord?.cancelled_bookings ?? 0,
    newClients: metricsRecord?.new_clients ?? 0,
    rating: metricsRecord?.average_rating ? Number(metricsRecord.average_rating) : null,
    payoutSummary: payoutsSummary.map((row: any) => ({
      status: row.status,
      totalAmount: row._sum.amount ? Number(row._sum.amount) : 0,
      count: row._count.payout_id,
    })),
  };

  return {
    ...provider,
    upcomingAppointments,
    recentReviews,
    performance,
  };
};

const getAvailability = async (providerId: number, opts: { start?: string; end?: string }) => {
  const where: any = { service_provider_id: providerId };
  if (opts.start) where.start_time = { gte: new Date(opts.start) };
  if (opts.end) where.end_time = { lte: new Date(opts.end) };

  const items = await db.ProviderAvailability.findMany({
    where,
    orderBy: { start_time: 'asc' },
    include: { service: { select: { services_id: true, service_title: true, service_type: true } } },
  });

  return items.map((slot: any) => ({
    id: slot.availability_id,
    serviceId: slot.services_id,
    start: slot.start_time,
    end: slot.end_time,
    capacity: slot.capacity,
    isRecurring: slot.is_recurring,
    recurrenceRule: slot.recurrence_rule,
    serviceTitle: slot.service?.service_title ?? null,
    serviceType: slot.service?.service_type ?? null,
  }));
};

const upsertAvailability = async (
  providerId: number,
  entries: Array<{
    availability_id?: number;
    services_id?: number | null;
    start_time: string;
    end_time: string;
    capacity?: number;
    is_recurring?: boolean;
    recurrence_rule?: string | null;
  }>,
) => {
  const results = [] as any[];
  await prisma.$transaction(async (tx) => {
    for (const entry of entries) {
      const data = {
        service_provider_id: providerId,
        services_id: entry.services_id ?? null,
        start_time: new Date(entry.start_time),
        end_time: new Date(entry.end_time),
        capacity: entry.capacity ?? 1,
        is_recurring: entry.is_recurring ?? false,
        recurrence_rule: entry.recurrence_rule ?? null,
      };

      if (entry.availability_id) {
        const updated = await (tx as any).ProviderAvailability.update({
          where: { availability_id: entry.availability_id, service_provider_id: providerId },
          data,
        });
        results.push(updated);
      } else {
        const created = await (tx as any).ProviderAvailability.create({ data });
        results.push(created);
      }
    }
  });
  return results;
};

const deleteAvailability = async (providerId: number, availabilityId: number) => {
  await db.ProviderAvailability.delete({
    where: { availability_id: availabilityId, service_provider_id: providerId },
  });
  return { success: true };
};

const listPricing = async (providerId: number) => {
  const now = new Date();
  const records = await db.ProviderServicePricing.findMany({
    where: { service_provider_id: providerId },
    orderBy: [{ services_id: 'asc' }, { effective_from: 'desc' }],
    include: { service: { select: { services_id: true, service_title: true, service_type: true, service_price_amt: true } } },
  });

  return records.map((price: any) => ({
    id: price.pricing_id,
    serviceId: price.services_id,
    serviceTitle: price.service?.service_title ?? null,
    serviceType: price.service?.service_type ?? null,
    defaultPrice: price.service?.service_price_amt ?? null,
    basePrice: price.base_price,
    discountPercent: price.discount_percent,
    currency: price.currency,
    effectiveFrom: price.effective_from,
    effectiveTo: price.effective_to,
    isActive: !price.effective_to || price.effective_to > now,
  }));
};

const upsertPricing = async (
  providerId: number,
  payload: Array<{
    pricing_id?: number;
    services_id: number;
    base_price?: number;
    discount_percent?: number;
    currency?: string;
    effective_from?: string;
    effective_to?: string | null;
  }>,
) => {
  const results = [] as any[];
  await prisma.$transaction(async (tx) => {
    for (const entry of payload) {
      const data = {
        service_provider_id: providerId,
        services_id: entry.services_id,
        base_price: entry.base_price ?? 0,
        discount_percent: entry.discount_percent ?? 0,
        currency: entry.currency ?? 'INR',
        effective_from: entry.effective_from ? new Date(entry.effective_from) : new Date(),
        effective_to: entry.effective_to ? new Date(entry.effective_to) : null,
      };
      if (entry.pricing_id) {
        const updated = await (tx as any).ProviderServicePricing.update({
          where: { pricing_id: entry.pricing_id, service_provider_id: providerId },
          data,
        });
        results.push(updated);
      } else {
        const created = await (tx as any).ProviderServicePricing.create({ data });
        results.push(created);
      }
    }
  });
  return results;
};

const deletePricing = async (providerId: number, pricingId: number) => {
  await db.ProviderServicePricing.delete({
    where: { pricing_id: pricingId, service_provider_id: providerId },
  });
  return { success: true };
};

const listPayouts = async (providerId: number, opts: { status?: string; page?: number; limit?: number }) => {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 10));
  const skip = (page - 1) * limit;
  const where: any = { service_provider_id: providerId };
  if (opts.status) where.status = opts.status;

  const [items, total] = await Promise.all([
    db.ProviderPayouts.findMany({
      where,
      orderBy: { initiated_at: 'desc' },
      skip,
      take: limit,
    }),
    db.ProviderPayouts.count({ where }),
  ]);

  return {
    items: items.map((row: any) => ({
      id: row.payout_id,
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
      initiatedAt: row.initiated_at,
      settledAt: row.settled_at,
      referenceNumber: row.reference_number,
      remarks: row.remarks,
    })),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};

const listReviews = async (providerId: number, opts: { page?: number; limit?: number; rating?: number }) => {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 10));
  const skip = (page - 1) * limit;
  const where: any = { service_provider_id: providerId };
  if (opts.rating) where.rating = opts.rating;

  const [items, total] = await Promise.all([
    db.ProviderReviews.findMany({
      where,
      orderBy: { reviewed_at: 'desc' },
      skip,
      take: limit,
    }),
    db.ProviderReviews.count({ where }),
  ]);

  return {
    items: items.map((review: any) => ({
      id: review.review_id,
      rating: review.rating,
      comment: review.review_text,
      reviewedAt: review.reviewed_at,
      bookingId: review.booking_id,
      userId: review.user_id,
      bookingDate: null, // Can be populated separately if needed
      clientName: null, // Can be populated separately if needed
      clientEmail: null, // Can be populated separately if needed
    })),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};

const updateProviderProfile = async (id: number, body: any) => {
  const allowedMap: Record<string, string> = {
    provider_name: 'serv_provider_name',
    provider_contact_number: 'serv_provider_contact_nbr',
    provider_desc: 'serv_provider_desc',
    provider_experience_years: 'serv_provider_exp_years',
    provider_certificates: 'serv_provider_certificates',
    provider_insta: 'serv_provider_insta_acct_dtls',
    provider_fb: 'serv_provider_fb_acct_dtls',
  };

  const data: any = {};
  for (const [key, dbKey] of Object.entries(allowedMap)) {
    if (body[key] !== undefined) data[dbKey] = body[key];
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No valid fields to update');
  }

  const updated = await prisma.pIQ_Service_Provider.update({
    where: { service_provider_id: id },
    data,
  });

  if (!updated) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update provider profile');
  }

  return updated;
};

export const getAppointments = async (
  providerId: number,
  opts: { page?: number; limit?: number; status?: string },
) => {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 10));
  const skip = (page - 1) * limit;
  const where: any = { service_provider_id: providerId };
  if (opts.status) where.booking_status = opts.status;

  const [items, total] = await Promise.all([
    prisma.pIQ_Bookings.findMany({
      where,
      orderBy: { booked_dtm: 'desc' },
      skip,
      take: limit,
      include: {
        PIQ_User: { select: { user_full_name: true, user_email_id: true } },
        PIQ_Pets: { select: { pet_name: true, pet_type: true } },
        PIQ_Service_Master: { select: { service_title: true, service_type: true } },
      },
    }),
    db.pIQ_Bookings.count({ where }),
  ]);

  return {
    items: items.map((booking) => ({
      id: booking.booking_id,
      date: booking.booked_dtm,
      status: booking.booking_status,
      client: booking.PIQ_User?.user_full_name ?? null,
      clientEmail: booking.PIQ_User?.user_email_id ?? null,
      pet: booking.PIQ_Pets?.pet_name ?? null,
      petType: booking.PIQ_Pets?.pet_type ?? null,
      service: booking.PIQ_Service_Master?.service_title ?? booking.PIQ_Service_Master?.service_type ?? null,
      comments: booking.booking_comments ?? null,
    })),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};

const updateAppointmentStatus = async (
  providerId: number,
  appointmentId: number,
  status: 'Scheduled' | 'Cancelled' | 'Completed',
) => {
  const appointment = await db.pIQ_Appointments.findUnique({
    where: { appointment_id: appointmentId },
    select: { booking_id: true },
  }) as { booking_id: number | null } | null;

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Appointment not found');
  }

  if (!appointment.booking_id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Appointment not linked to a booking');
  }

  const booking = await db.pIQ_Bookings.findUnique({ where: { booking_id: appointment.booking_id } });

  if (!booking || booking.service_provider_id !== providerId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to update this appointment');
  }

  const updated = await prisma.pIQ_Appointments.update({
    where: { appointment_id: appointmentId },
    data: { appointment_status: status },
  });

  return updated;
};

export const providerService = {
  getProviderById,
  updateProviderProfile,
  getAvailability,
  upsertAvailability,
  deleteAvailability,
  listPricing,
  upsertPricing,
  deletePricing,
  listPayouts,
  listReviews,
  getAppointments,
  updateAppointmentStatus,
};
