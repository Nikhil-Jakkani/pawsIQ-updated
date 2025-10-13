import httpStatus from 'http-status';
import { ApiError } from '../../utils/ApiError.js';
import prisma from '../../../lib/prisma.js';
import { serializeBigInt } from '../../utils/bigIntSerializer.js';

export type AppointmentStatus = 'Awaiting Approval' | 'Scheduled' | 'Cancelled' | 'Completed';
export type AppointmentType = 'Checkup' | 'Vaccination' | 'Grooming' | 'Training' | 'Others';

const assertStatus = (status: string): AppointmentStatus => {
  const allowed: AppointmentStatus[] = ['Awaiting Approval', 'Scheduled', 'Cancelled', 'Completed'];
  if (!allowed.includes(status as AppointmentStatus)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid status. Allowed: ${allowed.join(', ')}`);
  }
  return status as AppointmentStatus;
};

const assertType = (type: string): AppointmentType => {
  const allowed: AppointmentType[] = ['Checkup', 'Vaccination', 'Grooming', 'Training', 'Others'];
  if (!allowed.includes(type as AppointmentType)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid appointment_type. Allowed: ${allowed.join(', ')}`);
  }
  return type as AppointmentType;
};

const ensurePetBelongsToUser = async (userId: bigint, petId: bigint) => {
  const pet = await prisma.pIQ_Pets.findFirst({ where: { pet_id: petId, user_id: userId } });
  if (!pet) throw new ApiError(httpStatus.FORBIDDEN, 'Pet does not belong to user');
};

// User-facing operations
const createAppointment = async (
  userId: bigint,
  body: {
    pet_id: number | string | bigint;
    appointment_type: AppointmentType;
    appointment_date: string;
    appointment_status?: AppointmentStatus;
    appointment_comments?: string | null;
  }
) => {
  const pet_id = BigInt(body.pet_id);
  await ensurePetBelongsToUser(userId, pet_id);

  const type = assertType(body.appointment_type);
  const status: AppointmentStatus = body.appointment_status ? assertStatus(body.appointment_status) : 'Awaiting Approval';

  const dt = new Date(body.appointment_date);
  if (isNaN(dt.getTime())) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid appointment_date');
  
  // Add grace period validation like bookings
  const GRACE_PERIOD = 5 * 60 * 1000; // 5 minutes
  if (dt.getTime() <= (Date.now() - GRACE_PERIOD)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST, 
      'Appointment date must be in the future'
    );
  }

  const created = await prisma.pIQ_Appointments.create({
    data: {
      pet_id,
      appointment_type: type,
      appointment_date: dt,
      appointment_status: status,
      appointment_comments: body.appointment_comments ?? null,
    },
  });

  return serializeBigInt(created);
};

const getUserAppointments = async (
  userId: bigint,
  opts: { page?: number; limit?: number }
) => {
  const page = Math.max(1, Number(opts.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.pIQ_Appointments.findMany({
      where: { PIQ_Pets: { user_id: userId } },
      orderBy: { appointment_date: 'desc' },
      skip,
      take: limit,
      include: {
        PIQ_Pets: { select: { pet_name: true, pet_type: true } },
        Booking: {
          select: {
            booking_id: true,
            booking_status: true,
            service_provider_id: true,
            PIQ_Service_Provider: {
              select: {
                service_provider_id: true,
                serv_provider_name: true,
                serv_provider_type: true,
                serv_provider_location: true,
              },
            },
            PIQ_Provider_Reviews: {
              where: { user_id: userId },
              orderBy: { reviewed_at: 'desc' },
              take: 1,
              select: {
                review_id: true,
                rating: true,
                review_text: true,
                reviewed_at: true,
              },
            },
          },
        },
      },
    }),
    prisma.pIQ_Appointments.count({ where: { PIQ_Pets: { user_id: userId } } }),
  ]);

  const providerIds = Array.from(
    new Set(
      items
        .map((it) => it.Booking?.service_provider_id)
        .filter((id): id is number => typeof id === 'number' && Number.isFinite(id))
    )
  );

  let providerRatingsMap: Record<number, { averageRating: number; totalReviews: number }> = {};

  if (providerIds.length) {
    const aggregates = await prisma.pIQ_Provider_Reviews.groupBy({
      by: ['service_provider_id'],
      where: { service_provider_id: { in: providerIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    providerRatingsMap = aggregates.reduce((acc, item) => {
      const id = item.service_provider_id ?? 0;
      if (!id) return acc;
      const avg = item._avg.rating ? Number(item._avg.rating) : 0;
      acc[id] = {
        averageRating: avg ? Math.round(avg * 10) / 10 : 0,
        totalReviews: item._count.rating ?? 0,
      };
      return acc;
    }, {} as Record<number, { averageRating: number; totalReviews: number }>);
  }

  const formattedItems = items.map((it) => {
    const { PIQ_Pets, Booking, ...rest } = it;

    const provider = Booking?.PIQ_Service_Provider;
    const providerId = provider?.service_provider_id ?? null;
    const providerSummary = providerId ? providerRatingsMap[providerId] : undefined;
    const userReview = Booking?.PIQ_Provider_Reviews?.[0] ?? null;

    const base = {
      ...rest,
      booking_id: it.booking_id ?? Booking?.booking_id ?? null,
      booking_status: Booking?.booking_status ?? null,
      pet_name: PIQ_Pets?.pet_name ?? null,
      pet_type: PIQ_Pets?.pet_type ?? null,
      provider: provider
        ? {
            service_provider_id: provider.service_provider_id,
            serv_provider_name: provider.serv_provider_name,
            serv_provider_type: provider.serv_provider_type,
            serv_provider_location: provider.serv_provider_location,
            average_rating: providerSummary?.averageRating ?? 0,
            total_reviews: providerSummary?.totalReviews ?? 0,
          }
        : null,
      user_review: userReview
        ? {
            review_id: userReview.review_id,
            rating: userReview.rating,
            review_text: userReview.review_text,
            reviewed_at: userReview.reviewed_at,
          }
        : null,
    };

    return serializeBigInt(base);
  });

  return {
    items: formattedItems,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};

const getUserAppointmentById = async (userId: bigint, id: number) => {
  const appt = await prisma.pIQ_Appointments.findUnique({ 
    where: { appointment_id: id }, 
    include: { 
      PIQ_Pets: true,
      Booking: {
        include: {
          PIQ_Service_Provider: {
            select: {
              service_provider_id: true,
              serv_provider_name: true,
              serv_provider_type: true,
              serv_provider_location: true,
              serv_provider_contact_nbr: true,
            },
          },
          PIQ_Service_Master: {
            select: {
              services_id: true,
              service_title: true,
              service_type: true,
              service_description: true,
              service_price_amt: true,
              service_duration: true,
            },
          },
        },
      },
    },
  });
  if (!appt || appt.PIQ_Pets?.user_id !== userId) throw new ApiError(httpStatus.NOT_FOUND, 'Appointment not found');
  
  // Flatten provider details for easier access
  const result = {
    ...appt,
    booking_id: appt.Booking?.booking_id ?? null,
    booking_status: appt.Booking?.booking_status ?? null,
    booked_dtm: appt.Booking?.booked_dtm ?? appt.create_dtm ?? null,
    service_provider_id: appt.Booking?.PIQ_Service_Provider?.service_provider_id,
    provider_name: appt.Booking?.PIQ_Service_Provider?.serv_provider_name,
    provider_type: appt.Booking?.PIQ_Service_Provider?.serv_provider_type,
    provider_location: appt.Booking?.PIQ_Service_Provider?.serv_provider_location,
    provider_contact: appt.Booking?.PIQ_Service_Provider?.serv_provider_contact_nbr ?? null,
    services_id: appt.Booking?.services_id ?? null,
    service_title: appt.Booking?.PIQ_Service_Master?.service_title ?? null,
    service_type: appt.Booking?.PIQ_Service_Master?.service_type ?? appt.appointment_type,
    service_description: appt.Booking?.PIQ_Service_Master?.service_description ?? null,
    service_price: appt.Booking?.PIQ_Service_Master?.service_price_amt !== undefined && appt.Booking?.PIQ_Service_Master?.service_price_amt !== null
      ? Number(appt.Booking.PIQ_Service_Master.service_price_amt)
      : null,
    service_duration: appt.Booking?.PIQ_Service_Master?.service_duration ?? null,
  };
  
  return serializeBigInt(result);
};

const updateUserAppointment = async (
  userId: bigint,
  id: number,
  body: Partial<{
    pet_id: number | string | bigint;
    appointment_type: AppointmentType;
    appointment_date: string;
    appointment_status: AppointmentStatus;
    appointment_comments: string | null;
  }>
) => {
  const existing = await prisma.pIQ_Appointments.findUnique({ where: { appointment_id: id }, include: { PIQ_Pets: true } });
  if (!existing || existing.PIQ_Pets.user_id !== userId) throw new ApiError(httpStatus.NOT_FOUND, 'Appointment not found');

  const data: any = {};
  
  // ❌ SECURITY FIX: Users cannot change which pet the appointment is for
  if (body.pet_id !== undefined) {
    throw new ApiError(
      httpStatus.BAD_REQUEST, 
      'Cannot change pet for existing appointment. Please cancel and create a new appointment.'
    );
  }
  
  // ❌ BUSINESS LOGIC FIX: Users cannot change appointment type after creation
  if (body.appointment_type) {
    throw new ApiError(
      httpStatus.BAD_REQUEST, 
      'Cannot change appointment type. Please cancel and create a new appointment.'
    );
  }
  
  // ✅ AUTHORIZATION FIX: Users can only cancel appointments, not set other statuses
  if (body.appointment_status) {
    const status = assertStatus(body.appointment_status);
    if (status !== 'Cancelled') {
      throw new ApiError(
        httpStatus.FORBIDDEN, 
        'Users can only cancel appointments. Status changes to Scheduled/Completed require provider/admin approval.'
      );
    }
    data.appointment_status = status;
  }
  
  // ✅ Allow comments changes
  if (body.appointment_comments !== undefined) {
    data.appointment_comments = body.appointment_comments;
  }
  
  // ✅ Allow date changes (rescheduling) with validation
  if (body.appointment_date) {
    const dt = new Date(body.appointment_date);
    if (isNaN(dt.getTime())) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid appointment_date');
    
    // Validate future date with grace period
    const GRACE_PERIOD = 5 * 60 * 1000;
    if (dt.getTime() <= (Date.now() - GRACE_PERIOD)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST, 
        'Appointment date must be in the future'
      );
    }
    
    data.appointment_date = dt;
  }
  
  if (Object.keys(data).length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No valid fields to update');
  }

  const updated = await prisma.pIQ_Appointments.update({ where: { appointment_id: id }, data });
  return serializeBigInt(updated);
};

const deleteUserAppointment = async (userId: bigint, id: number) => {
  const appt = await prisma.pIQ_Appointments.findUnique({ where: { appointment_id: id }, include: { PIQ_Pets: true } });
  if (!appt || appt.PIQ_Pets.user_id !== userId) throw new ApiError(httpStatus.NOT_FOUND, 'Appointment not found');
  await prisma.pIQ_Appointments.delete({ where: { appointment_id: id } });
  return { success: true };
};

export const appointmentService = {
  createAppointment,
  getUserAppointments,
  getUserAppointmentById,
  updateUserAppointment,
  deleteUserAppointment,
};
