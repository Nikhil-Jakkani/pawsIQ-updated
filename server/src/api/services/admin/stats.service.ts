import prisma from '../../../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

type DateRange = {
  startDate?: Date;
  endDate?: Date;
};

const buildDateRangeFilter = (range: DateRange) => {
  if (!range.startDate && !range.endDate) {
    return undefined;
  }

  const filter: { gte?: Date; lte?: Date } = {};

  if (range.startDate) {
    filter.gte = range.startDate;
  }

  if (range.endDate) {
    filter.lte = range.endDate;
  }

  return filter;
};

const toNumber = (value: Decimal | number | null | undefined) => {
  if (value === null || value === undefined) {
    return 0;
  }
  if (value instanceof Decimal) {
    return Number(value.toString());
  }
  return Number(value);
};

/**
 * Get comprehensive dashboard statistics
 */
const getDashboardStats = async () => {
  // Get all statistics in parallel
  const [
    totalUsers,
    activeUsers,
    totalPets,
    totalAppointments,
    activeProviders,
    pendingProviders,
    totalBookings,
    pendingBookings,
    completedBookings,
    cancelledBookings,
    totalRevenue,
    totalCommission,
    pendingPayouts,
    pendingPayoutAmount,
  ] = await Promise.all([
    prisma.pIQ_User.count(),
    prisma.pIQ_User.count({ where: { user_status: 'active' } }),
    prisma.pIQ_Pets.count(),
    prisma.pIQ_Appointments.count(),
    prisma.pIQ_Service_Provider.count({ where: { serv_provider_status: 'active' } }),
    prisma.pIQ_Service_Provider.count({ where: { serv_provider_status: 'inactive' } }),
    prisma.pIQ_Bookings.count(),
    prisma.pIQ_Bookings.count({ where: { booking_status: 'Pending' } }),
    prisma.pIQ_Bookings.count({ where: { booking_status: 'Completed' } }),
    prisma.pIQ_Bookings.count({ where: { booking_status: 'Cancelled' } }),
    prisma.pIQ_Payments.aggregate({
      where: { payment_status: 'success' },
      _sum: { amount: true },
    }),
    prisma.$queryRaw`
      SELECT COALESCE(SUM(commission_amount), 0) as total
      FROM "PIQ_Commission"
      WHERE status IN ('calculated', 'settled')
    `,
    prisma.pIQ_Provider_Payouts.count({ where: { status: 'Pending' } }),
    prisma.pIQ_Provider_Payouts.aggregate({
      where: { status: 'Pending' },
      _sum: { amount: true },
    }),
  ]);

  const commissionTotal = (totalCommission as any)[0]?.total || 0;

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
    },
    pets: totalPets,
    appointments: totalAppointments,
    providers: {
      total: activeProviders + pendingProviders,
      active: activeProviders,
      pending: pendingProviders,
    },
    bookings: {
      total: totalBookings,
      pending: pendingBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
    },
    revenue: {
      total: Number(totalRevenue._sum.amount || 0),
      commission: Number(commissionTotal),
      provider: Number(totalRevenue._sum.amount || 0) - Number(commissionTotal),
    },
    payouts: {
      pending: pendingPayouts,
      pendingAmount: Number(pendingPayoutAmount._sum.amount || 0),
    },
  };
};

const getRevenueSummary = async (range: DateRange = {}) => {
  const paymentDateFilter = buildDateRangeFilter(range);
  const payoutDateFilter = buildDateRangeFilter(range);

  const [payments, commissions, payouts] = await Promise.all([
    prisma.pIQ_Payments.aggregate({
      where: {
        payment_status: 'success',
        ...(paymentDateFilter ? { transaction_date: paymentDateFilter } : {}),
      },
      _sum: { amount: true },
      _count: { payment_id: true },
    }),
    prisma.pIQ_Commission.aggregate({
      where: payoutDateFilter ? { created_at: payoutDateFilter } : {},
      _sum: { commission_amount: true, provider_amount: true },
    }),
    prisma.pIQ_Provider_Payouts.aggregate({
      where: payoutDateFilter ? { initiated_at: payoutDateFilter } : {},
      _sum: { amount: true },
      _count: { payout_id: true },
    }),
  ]);

  const grossRevenue = toNumber(payments._sum.amount);
  const commissionTotal = toNumber(commissions._sum.commission_amount);
  const providerEarnings = toNumber(commissions._sum.provider_amount);
  const payoutsInitiated = toNumber(payouts._sum.amount);

  return {
    grossRevenue,
    commissionRevenue: commissionTotal,
    netProviderRevenue: providerEarnings,
    payoutLiability: Math.max(providerEarnings - payoutsInitiated, 0),
    payoutInitiated: payoutsInitiated,
    successfulPayments: payments._count.payment_id,
  };
};

const allowedIntervals = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
} as const;

type RevenueInterval = keyof typeof allowedIntervals;

const getRevenueSeries = async (interval: RevenueInterval = 'daily', points = 30) => {
  const truncUnit = allowedIntervals[interval];
  const truncUnitFragment = Prisma.raw(`'${truncUnit}'`);
  const rows = await prisma.$queryRaw<
    {
      bucket: Date;
      gross: Decimal | null;
      commission: Decimal | null;
      provider: Decimal | null;
      bookings: bigint;
    }[]
  >(Prisma.sql`
    SELECT
      date_trunc(${truncUnitFragment}, "transaction_date") AS bucket,
      SUM("amount") AS gross,
      SUM("commission_amount") AS commission,
      SUM("provider_amount") AS provider,
      COUNT(DISTINCT "booking_id") AS bookings
    FROM (
      SELECT
        p."transaction_date",
        p."amount",
        c."commission_amount",
        c."provider_amount",
        p."booking_id"
      FROM "PIQ_Payments" p
      LEFT JOIN "PIQ_Commission" c ON c."payment_id" = p."payment_id"
      WHERE p."payment_status" = 'success'
    ) data
    GROUP BY bucket
    ORDER BY bucket DESC
    LIMIT ${points}
  `);

  return rows
    .map((row) => ({
      bucket: row.bucket,
      grossRevenue: toNumber(row.gross),
      commissionRevenue: toNumber(row.commission),
      netProviderRevenue: toNumber(row.provider),
      bookings: Number(row.bookings || 0),
    }))
    .sort((a, b) => a.bucket.getTime() - b.bucket.getTime());
};

const serviceTypeMap: Record<string, string> = {
  veterinary: 'Veterinary',
  veterinarian: 'Veterinary',
  vet: 'Veterinary',
  'diagnostic services': 'Diagnostic Services',
  diagnostics: 'Diagnostic Services',
  boarding: 'Boarding',
  grooming: 'Grooming',
  groomer: 'Grooming',
  training: 'Training',
  trainer: 'Training',
  'physical activity': 'Physical Activity',
  'pet sitter': 'Physical Activity',
  'pet sitting': 'Physical Activity',
};

const getBookingBreakdownByType = async (range: DateRange = {}) => {
  const dateFilter = buildDateRangeFilter(range);

  let whereClause = Prisma.sql``;
  if (dateFilter?.gte) {
    whereClause = Prisma.sql`${whereClause} AND b."booked_dtm" >= ${dateFilter.gte}`;
  }
  if (dateFilter?.lte) {
    whereClause = Prisma.sql`${whereClause} AND b."booked_dtm" <= ${dateFilter.lte}`;
  }

  const rows = await prisma.$queryRaw<
    { type: string | null; total: bigint; revenue: Decimal | null }[]
  >(Prisma.sql`
    SELECT
      LOWER(sm."service_type") AS type,
      COUNT(b."booking_id") AS total,
      SUM(COALESCE(c."commission_amount", 0) + COALESCE(c."provider_amount", 0)) AS revenue
    FROM "PIQ_Bookings" b
    JOIN "PIQ_Service_Master" sm ON sm."services_id" = b."services_id"
    LEFT JOIN "PIQ_Commission" c ON c."booking_id" = b."booking_id"
    WHERE 1 = 1
    ${whereClause}
    GROUP BY type
  `);

  const result: Record<string, { count: number; revenue: number }> = {
    Veterinary: { count: 0, revenue: 0 },
    'Diagnostic Services': { count: 0, revenue: 0 },
    Boarding: { count: 0, revenue: 0 },
    Grooming: { count: 0, revenue: 0 },
    Training: { count: 0, revenue: 0 },
    'Physical Activity': { count: 0, revenue: 0 },
  };

  rows.forEach((row) => {
    if (!row.type) {
      return;
    }
    const normalized = serviceTypeMap[row.type.trim()] || 'Other';
    if (!result[normalized]) {
      result[normalized] = { count: 0, revenue: 0 };
    }
    result[normalized].count += Number(row.total || 0);
    result[normalized].revenue += toNumber(row.revenue);
  });

  return result;
};

const getEngagementOverview = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    activeUsers7,
    activeUsers30,
    repeatCustomers,
    totalUsers,
    newUsers30,
    totalPets,
  ] = await Promise.all([
    prisma.pIQ_Bookings.groupBy({
      by: ['user_id'],
      where: { booked_dtm: { gte: sevenDaysAgo } },
      _count: { booking_id: true },
    }),
    prisma.pIQ_Bookings.groupBy({
      by: ['user_id'],
      where: { booked_dtm: { gte: thirtyDaysAgo } },
      _count: { booking_id: true },
    }),
    prisma.pIQ_Bookings.groupBy({
      by: ['user_id'],
      having: { booking_id: { _count: { gt: 1 } } },
      _count: { booking_id: true },
    }),
    prisma.pIQ_User.count(),
    prisma.pIQ_User.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
    prisma.pIQ_Pets.count(),
  ]);

  const active7 = activeUsers7.length;
  const active30 = activeUsers30.length;
  const repeat = repeatCustomers.length;

  return {
    activeUsers7: active7,
    activeUsers30: active30,
    repeatCustomers: repeat,
    repeatRate: active30 === 0 ? 0 : Number((repeat / active30).toFixed(2)),
    totalUsers,
    newUsers30,
    averagePetsPerUser: totalUsers === 0 ? 0 : Number((totalPets / totalUsers).toFixed(2)),
  };
};

/**
 * Get provider counts by service type (6 specific types)
 */
const getProviderCountsByType = async () => {
  const providers = await prisma.pIQ_Service_Provider.findMany({
    where: {
      serv_provider_status: 'active',
    },
    select: {
      service_provider_id: true,
      serv_provider_type: true,
    },
  });

  // Initialize counts for all 6 service types
  const typeCounts: Record<string, number> = {
    'veterinary': 0,
    'diagnostic services': 0,
    'boarding': 0,
    'grooming': 0,
    'training': 0,
    'physical activity': 0,
  };
  
  // Count providers by type
  providers.forEach((provider: any) => {
    const type = (provider.serv_provider_type || '').toLowerCase().trim();
    
    // Map variations to standard types
    if (type === 'veterinarian' || type === 'vet' || type === 'veterinary') {
      typeCounts['veterinary']++;
    } else if (type === 'diagnostic services' || type === 'diagnostics') {
      typeCounts['diagnostic services']++;
    } else if (type === 'boarding') {
      typeCounts['boarding']++;
    } else if (type === 'groomer' || type === 'grooming') {
      typeCounts['grooming']++;
    } else if (type === 'trainer' || type === 'training') {
      typeCounts['training']++;
    } else if (type === 'physical activity' || type === 'pet sitter' || type === 'pet sitting') {
      typeCounts['physical activity']++;
    }
  });

  // Return all 6 service types (even if count is 0)
  const serviceTypes = [
    {
      type: 'Veterinary',
      count: typeCounts['veterinary'],
      icon: 'stethoscope',
      color: 'indigo',
    },
    {
      type: 'Diagnostic Services',
      count: typeCounts['diagnostic services'],
      icon: 'microscope',
      color: 'purple',
    },
    {
      type: 'Boarding',
      count: typeCounts['boarding'],
      icon: 'home',
      color: 'blue',
    },
    {
      type: 'Grooming',
      count: typeCounts['grooming'],
      icon: 'cut',
      color: 'pink',
    },
    {
      type: 'Training',
      count: typeCounts['training'],
      icon: 'graduation-cap',
      color: 'green',
    },
    {
      type: 'Physical Activity',
      count: typeCounts['physical activity'],
      icon: 'running',
      color: 'amber',
    },
  ];

  return serviceTypes;
};

/**
 */
const getUserStats = async (userId: number) => {
  const userIdBigInt = BigInt(userId);
  
  // Get pets count
  const pets = await prisma.pIQ_Pets.count({ where: { user_id: userIdBigInt } });
  
  // Get appointments count through pets
  const userPets = await prisma.pIQ_Pets.findMany({
    where: { user_id: userIdBigInt },
    select: { pet_id: true }
  });
  
  const petIds = userPets.map(p => p.pet_id);
  const appointments = petIds.length > 0 
    ? await prisma.pIQ_Appointments.count({ where: { pet_id: { in: petIds } } })
    : 0;

  return {
    pets,
    appointments,
  };
};

/**
 * Get stats for multiple users at once
 */
const getBulkUserStats = async (userIds: number[]) => {
  const bigIntIds = userIds.map(id => BigInt(id));
  
  // Get pets grouped by user
  const petsData = await prisma.pIQ_Pets.groupBy({
    by: ['user_id'],
    where: { user_id: { in: bigIntIds } },
    _count: true,
  });

  // Create a map of user stats
  const statsMap: Record<string, { pets: number; appointments: number }> = {};
  
  userIds.forEach(id => {
    statsMap[id] = { pets: 0, appointments: 0 };
  });

  // Set pet counts
  petsData.forEach((item: any) => {
    const userId = Number(item.user_id);
    statsMap[userId].pets = item._count;
  });

  // Get all pets for these users to count appointments
  const allPets = await prisma.pIQ_Pets.findMany({
    where: { user_id: { in: bigIntIds } },
    select: { pet_id: true, user_id: true }
  });

  // Get ALL appointments in ONE query to avoid N+1 problem
  const allPetIds = allPets.map(p => p.pet_id);
  const appointmentsData = allPetIds.length > 0 
    ? await prisma.pIQ_Appointments.groupBy({
        by: ['pet_id'],
        where: { pet_id: { in: allPetIds } },
        _count: true,
      })
    : [];

  // Create a map of pet_id -> appointment count
  const appointmentCountMap: Record<string, number> = {};
  appointmentsData.forEach((item: any) => {
    appointmentCountMap[item.pet_id.toString()] = item._count;
  });

  // Aggregate appointments by user
  for (const userId of userIds) {
    const userPets = allPets.filter(p => Number(p.user_id) === userId);
    statsMap[userId].appointments = userPets.reduce((sum, pet) => {
      return sum + (appointmentCountMap[pet.pet_id.toString()] || 0);
    }, 0);
  }

  return statsMap;
};

export const statsService = {
  getDashboardStats,
  getRevenueSummary,
  getRevenueSeries,
  getBookingBreakdownByType,
  getEngagementOverview,
  getProviderCountsByType,
  getUserStats,
  getBulkUserStats,
};
