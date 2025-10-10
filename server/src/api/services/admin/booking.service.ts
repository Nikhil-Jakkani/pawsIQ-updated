import prisma from '../../../lib/prisma.js';
import httpStatus from 'http-status';

const serializeBigInt = <T>(data: T): T => {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
  ) as T;
};

export const adminBookingService = {
  // List bookings with advanced filtering
  list: async ({
    page = 1,
    limit = 20,
    status,
    search,
    serviceType,
    startDate,
    endDate,
  }: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    serviceType?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (p - 1) * l;
    
    const where: any = {};
    const andConditions: any[] = [];

    // Status filter
    if (status && status !== 'all') {
      where.booking_status = status;
    }

    // Search filter (customer name, email, pet name, provider name)
    if (search) {
      andConditions.push({
        OR: [
          { PIQ_User: { user_full_name: { contains: search, mode: 'insensitive' } } },
          { PIQ_User: { user_email_id: { contains: search, mode: 'insensitive' } } },
          { PIQ_Pets: { pet_name: { contains: search, mode: 'insensitive' } } },
          { PIQ_Service_Provider: { serv_provider_name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    // Service type filter
    if (serviceType && serviceType !== 'all') {
      andConditions.push({
        PIQ_Service_Master: { service_type: { contains: serviceType, mode: 'insensitive' } },
      });
    }

    // Date range filter
    if (startDate) {
      andConditions.push({ booked_dtm: { gte: new Date(startDate) } });
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      andConditions.push({ booked_dtm: { lte: endDateTime } });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [items, total] = await Promise.all([
      prisma.pIQ_Bookings.findMany({
        where,
        orderBy: { booked_dtm: 'desc' },
        skip,
        take: l,
        include: {
          PIQ_Pets: { select: { pet_name: true, pet_type: true, user_id: true } },
          PIQ_User: { select: { user_full_name: true, user_email_id: true, user_phone_number: true } },
          PIQ_Service_Master: { 
            select: { 
              service_type: true, 
              service_title: true, 
              service_price_amt: true,
              service_duration: true 
            } 
          },
          PIQ_Service_Provider: { 
            select: { 
              serv_provider_name: true, 
              serv_provider_type: true,
              serv_provider_location: true 
            } 
          },
        },
      }),
      prisma.pIQ_Bookings.count({ where }),
    ]);

    return {
      results: items.map(serializeBigInt),
      page: p,
      limit: l,
      totalResults: total,
      totalPages: Math.ceil(total / l),
    };
  },

  // Get booking by ID with full details
  getById: async (bookingId: number) => {
    const booking = await prisma.pIQ_Bookings.findUnique({
      where: { booking_id: bookingId },
      include: {
        PIQ_Pets: { 
          select: { 
            pet_id: true,
            pet_name: true, 
            pet_type: true, 
            pet_breed: true,
            user_id: true 
          } 
        },
        PIQ_User: { 
          select: { 
            user_id: true,
            user_full_name: true, 
            user_email_id: true, 
            user_phone_number: true 
          } 
        },
        PIQ_Service_Master: { 
          select: { 
            services_id: true,
            service_type: true, 
            service_title: true, 
            service_description: true,
            service_price_amt: true,
            service_duration: true 
          } 
        },
        PIQ_Service_Provider: { 
          select: { 
            service_provider_id: true,
            serv_provider_name: true, 
            serv_provider_type: true,
            serv_provider_location: true,
            serv_provider_contact_nbr: true 
          } 
        },
        PIQ_Payments: {
          select: {
            payment_id: true,
            amount: true,
            payment_status: true,
            payment_method: true,
            transaction_date: true,
          },
        },
      },
    });

    return booking ? serializeBigInt(booking) : null;
  },

  // Update booking status
  updateStatus: async (bookingId: number, status: string, reason?: string) => {
    const updateData: any = {
      booking_status: status,
      last_updated_dtm: new Date(),
    };

    if (status.toLowerCase() === 'cancelled') {
      updateData.cancelled_at = new Date();
      updateData.cancelled_by = 'admin';
      if (reason) {
        updateData.cancellation_reason = reason;
      }
    }

    const booking = await prisma.pIQ_Bookings.update({
      where: { booking_id: bookingId },
      data: updateData,
      include: {
        PIQ_Pets: { select: { pet_name: true } },
        PIQ_User: { select: { user_full_name: true, user_email_id: true } },
        PIQ_Service_Provider: { select: { serv_provider_name: true } },
      },
    });

    return serializeBigInt(booking);
  },

  // Reschedule booking
  reschedule: async (bookingId: number, newDate: Date, reason?: string) => {
    const existingBooking = await prisma.pIQ_Bookings.findUnique({
      where: { booking_id: bookingId },
    });

    if (!existingBooking) {
      throw new Error('Booking not found');
    }

    const booking = await prisma.pIQ_Bookings.update({
      where: { booking_id: bookingId },
      data: {
        rescheduled_from: existingBooking.booked_dtm,
        booked_dtm: newDate,
        booking_comments: reason 
          ? `${existingBooking.booking_comments || ''}\n[Rescheduled by admin: ${reason}]`.trim()
          : existingBooking.booking_comments,
        last_updated_dtm: new Date(),
      },
      include: {
        PIQ_Pets: { select: { pet_name: true } },
        PIQ_User: { select: { user_full_name: true, user_email_id: true } },
      },
    });

    return serializeBigInt(booking);
  },

  // Cancel booking
  cancel: async (bookingId: number, reason: string) => {
    const booking = await prisma.pIQ_Bookings.update({
      where: { booking_id: bookingId },
      data: {
        booking_status: 'cancelled',
        cancelled_at: new Date(),
        cancelled_by: 'admin',
        cancellation_reason: reason,
        last_updated_dtm: new Date(),
      },
      include: {
        PIQ_Pets: { select: { pet_name: true } },
        PIQ_User: { select: { user_full_name: true, user_email_id: true } },
      },
    });

    return serializeBigInt(booking);
  },

  // Get booking statistics
  getStats: async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      todayBookings,
      upcomingBookings,
      noShowBookings,
      disputedBookings,
      totalRevenue,
    ] = await Promise.all([
      prisma.pIQ_Bookings.count(),
      prisma.pIQ_Bookings.count({ where: { booking_status: 'confirmed' } }),
      prisma.pIQ_Bookings.count({ where: { booking_status: 'completed' } }),
      prisma.pIQ_Bookings.count({ where: { booking_status: 'cancelled' } }),
      prisma.pIQ_Bookings.count({
        where: {
          booked_dtm: { gte: today, lt: tomorrow },
        },
      }),
      prisma.pIQ_Bookings.count({
        where: {
          booked_dtm: { gte: now },
          booking_status: { not: 'cancelled' },
        },
      }),
      prisma.pIQ_Bookings.count({ where: { booking_status: 'no_show' } }),
      prisma.pIQ_Bookings.count({ where: { booking_status: 'disputed' } }),
      prisma.pIQ_Payments.aggregate({
        where: { payment_status: 'success' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      todayBookings,
      upcomingBookings,
      noShowBookings,
      disputedBookings,
      totalRevenue: totalRevenue._sum.amount?.toString() || '0',
    };
  },

  // Bulk update bookings
  bulkUpdate: async (bookingIds: number[], status: string, reason?: string) => {
    const updateData: any = {
      booking_status: status,
      last_updated_dtm: new Date(),
    };

    if (status.toLowerCase() === 'cancelled') {
      updateData.cancelled_at = new Date();
      updateData.cancelled_by = 'admin';
      if (reason) {
        updateData.cancellation_reason = reason;
      }
    }

    const result = await prisma.pIQ_Bookings.updateMany({
      where: { booking_id: { in: bookingIds } },
      data: updateData,
    });

    return {
      count: result.count,
      bookingIds,
      status,
    };
  },

  // Delete booking (soft delete by setting status)
  deleteBooking: async (bookingId: number) => {
    await prisma.pIQ_Bookings.update({
      where: { booking_id: bookingId },
      data: {
        booking_status: 'cancelled',
        cancelled_at: new Date(),
        cancelled_by: 'admin',
        cancellation_reason: 'Deleted by admin',
        last_updated_dtm: new Date(),
      },
    });

    return true;
  },
};
