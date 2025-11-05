import { supabase } from '../../../config/supabase.js';

/**
 * Provider Dashboard Service
 * Handles all dashboard-related data fetching for providers
 */

interface DashboardMetrics {
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  averageRating: number;
  totalReviews: number;
  completionRate: number;
  activeClients: number;
}

interface RevenueMetrics {
  totalRevenue: number;
  pendingAmount: number;
  paidAmount: number;
  revenueGrowth: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  transactionCount: number;
  averageTransactionValue: number;
}

interface TypeSpecificMetrics {
  veterinarian?: {
    consultations: number;
    prescriptionsIssued: number;
    labReportsGenerated: number;
  };
  trainer?: {
    trainingSessions: number;
    progressReports: number;
    activePrograms: number;
  };
  groomer?: {
    groomingSessions: number;
    completedSessions: number;
    recurringClients: number;
  };
  pet_sitter?: {
    activeBookings: number;
    upcomingSits: number;
    totalPetsCared: number;
  };
}

/**
 * Get dashboard metrics for a provider
 */
export const getDashboardMetrics = async (providerId: number): Promise<DashboardMetrics> => {
  try {
    // Get total appointments
    const { data: allAppointments, error: appointmentsError } = await supabase
      .from('PIQ_Bookings')
      .select('booking_id, booking_status')
      .eq('service_provider_id', providerId);

    if (appointmentsError) throw appointmentsError;

    const totalAppointments = allAppointments?.length || 0;
    const completedAppointments = allAppointments?.filter(a => (a.booking_status || '').toLowerCase() === 'completed').length || 0;
    const pendingAppointments = allAppointments?.filter(a => (a.booking_status || '').toLowerCase() === 'pending').length || 0;
    const cancelledAppointments = allAppointments?.filter(a => (a.booking_status || '').toLowerCase() === 'cancelled').length || 0;
    const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

    // Get ratings and reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('PIQ_Provider_Reviews')
      .select('rating')
      .eq('service_provider_id', providerId);

    if (reviewsError) throw reviewsError;

    const totalReviews = reviews?.length || 0;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews
      : 0;

    // Get unique active clients (clients with bookings in last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: activeClientsData, error: clientsError } = await supabase
      .from('PIQ_Bookings')
      .select('user_id')
      .eq('service_provider_id', providerId)
      .gte('booked_dtm', sixMonthsAgo.toISOString());

    if (clientsError) throw clientsError;

    const uniqueClients = new Set(activeClientsData?.map(b => b.user_id) || []);
    const activeClients = uniqueClients.size;

    return {
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      cancelledAppointments,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      completionRate: Math.round(completionRate * 10) / 10,
      activeClients,
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw new Error('Failed to fetch dashboard metrics');
  }
};

/**
 * Get revenue metrics for a provider
 */
export const getRevenueMetrics = async (providerId: number): Promise<RevenueMetrics> => {
  try {
    // Get all payments for this provider
    const { data: payments, error: paymentsError } = await supabase
      .from('PIQ_Payments')
      .select(`
        amount,
        payment_status,
        transaction_date,
        PIQ_Bookings!inner(service_provider_id)
      `)
      .eq('PIQ_Bookings.service_provider_id', providerId);

    if (paymentsError) throw paymentsError;

    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
    const paidTransactions = payments?.filter(p => (p.payment_status || '').toLowerCase() === 'success') || [];
    const pendingTransactions = payments?.filter(p => (p.payment_status || '').toLowerCase() === 'pending') || [];
    const paidAmount = paidTransactions.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
    const pendingAmount = pendingTransactions.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
    const transactionCount = paidTransactions.length || 0;
    const averageTransactionValue = transactionCount > 0 ? paidAmount / transactionCount : 0;

    // Calculate revenue growth (compare last month to previous month)
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);

    const lastMonthRevenue = paidTransactions.filter(p => {
      const date = p.transaction_date ? new Date(p.transaction_date) : null;
      return date && date >= lastMonthStart && date <= lastMonthEnd;
    }).reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    const prevMonthRevenue = paidTransactions.filter(p => {
      const date = p.transaction_date ? new Date(p.transaction_date) : null;
      return date && date >= prevMonthStart && date <= prevMonthEnd;
    }).reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

    const revenueGrowth = prevMonthRevenue > 0
      ? ((lastMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
      : 0;

    // Get monthly revenue for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenueMap = new Map<string, number>();
    paidTransactions
      .filter(p => {
        const date = p.transaction_date ? new Date(p.transaction_date) : null;
        return date && date >= sixMonthsAgo;
      })
      .forEach(p => {
        const date = new Date(p.transaction_date as string);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenueMap.set(monthKey, (monthlyRevenueMap.get(monthKey) || 0) + Number(p.amount || 0));
      });

    const monthlyRevenue = Array.from(monthlyRevenueMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalRevenue: Math.round(totalRevenue),
      pendingAmount: Math.round(pendingAmount),
      paidAmount: Math.round(paidAmount),
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      monthlyRevenue,
      transactionCount,
      averageTransactionValue: Math.round(averageTransactionValue),
    };
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    throw new Error('Failed to fetch revenue metrics');
  }
};

/**
 * Get recent appointments for a provider
 */
export const getRecentAppointments = async (providerId: number, limit: number = 10) => {
  try {
    const { data: bookings, error } = await supabase
      .from('PIQ_Bookings')
      .select(`
        booking_id,
        booked_dtm,
        booking_status,
        booking_comments,
        user_id,
        pet_id,
        services_id,
        PIQ_User!inner(user_id, user_full_name, user_email_id),
        PIQ_Pets!inner(pet_id, pet_name, pet_type),
        PIQ_Service_Master!inner(services_id, service_title, service_type)
      `)
      .eq('service_provider_id', providerId)
      .order('booked_dtm', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return bookings?.map(b => {
      const user = Array.isArray(b.PIQ_User) ? b.PIQ_User[0] : b.PIQ_User;
      const pet = Array.isArray(b.PIQ_Pets) ? b.PIQ_Pets[0] : b.PIQ_Pets;
      const service = Array.isArray(b.PIQ_Service_Master) ? b.PIQ_Service_Master[0] : b.PIQ_Service_Master;
      
      return {
        id: b.booking_id,
        date: b.booked_dtm,
        status: b.booking_status,
        comments: b.booking_comments,
        clientName: user?.user_full_name || user?.user_email_id || 'Unknown',
        clientEmail: user?.user_email_id,
        petName: pet?.pet_name || 'Unknown',
        petType: pet?.pet_type || 'Unknown',
        serviceName: service?.service_title || 'Unknown',
        serviceType: service?.service_type || 'Unknown',
      };
    }) || [];
  } catch (error) {
    console.error('Error fetching recent appointments:', error);
    throw new Error('Failed to fetch recent appointments');
  }
};

/**
 * Get clients for a provider
 */
export const getClients = async (providerId: number) => {
  try {
    const { data: bookings, error } = await supabase
      .from('PIQ_Bookings')
      .select(`
        user_id,
        booked_dtm,
        PIQ_User!inner(user_id, user_full_name, user_email_id, user_phone_number)
      `)
      .eq('service_provider_id', providerId)
      .order('booked_dtm', { ascending: false });

    if (error) throw error;

    // Group by user and get stats
    const clientsMap = new Map();
    bookings?.forEach(b => {
      const user = Array.isArray(b.PIQ_User) ? b.PIQ_User[0] : b.PIQ_User;
      const userId = b.user_id;
      if (!clientsMap.has(userId)) {
        clientsMap.set(userId, {
          id: userId,
          name: user?.user_full_name || 'Unknown',
          email: user?.user_email_id,
          phone: user?.user_phone_number,
          totalBookings: 0,
          lastBooking: b.booked_dtm,
        });
      }
      const client = clientsMap.get(userId);
      client.totalBookings++;
      if (new Date(b.booked_dtm) > new Date(client.lastBooking)) {
        client.lastBooking = b.booked_dtm;
      }
    });

    return Array.from(clientsMap.values()).sort((a, b) => 
      new Date(b.lastBooking).getTime() - new Date(a.lastBooking).getTime()
    );
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw new Error('Failed to fetch clients');
  }
};

/**
 * Get provider-type-specific metrics
 */
export const getTypeSpecificMetrics = async (
  providerId: number,
  providerType: string
): Promise<TypeSpecificMetrics> => {
  try {
    const metrics: TypeSpecificMetrics = {};

    switch (providerType.toLowerCase()) {
      case 'veterinarian':
      case 'vet':
        // Count consultations (completed appointments)
        const { data: consultations } = await supabase
          .from('PIQ_Bookings')
          .select('booking_id')
          .eq('service_provider_id', providerId)
          .eq('booking_status', 'Completed');

        // Count prescriptions (if table exists)
        let prescriptions: any[] = [];
        try {
          const prescriptionResult = await supabase
            .from('PIQ_Prescriptions')
            .select('prescription_id')
            .eq('service_provider_id', providerId);
          prescriptions = prescriptionResult.data || [];
        } catch (e) {
          // Table might not exist, use empty array
          prescriptions = [];
        }

        // Count lab reports (if table exists)
        let labReports: any[] = [];
        try {
          const labReportResult = await supabase
            .from('PIQ_Lab_Reports')
            .select('report_id')
            .eq('service_provider_id', providerId);
          labReports = labReportResult.data || [];
        } catch (e) {
          // Table might not exist, use empty array
          labReports = [];
        }

        metrics.veterinarian = {
          consultations: consultations?.length || 0,
          prescriptionsIssued: prescriptions?.length || 0,
          labReportsGenerated: labReports?.length || 0,
        };
        break;

      case 'trainer':
        const { data: trainingSessions } = await supabase
          .from('PIQ_Bookings')
          .select('booking_id')
          .eq('service_provider_id', providerId)
          .eq('booking_status', 'Completed');

        metrics.trainer = {
          trainingSessions: trainingSessions?.length || 0,
          progressReports: Math.floor((trainingSessions?.length || 0) * 0.3), // Mock: 30% have reports
          activePrograms: Math.floor((trainingSessions?.length || 0) * 0.2), // Mock: 20% active
        };
        break;

      case 'groomer':
      case 'grooming':
        const { data: groomingSessions } = await supabase
          .from('PIQ_Bookings')
          .select('booking_id, booking_status')
          .eq('service_provider_id', providerId);

        const completed = groomingSessions?.filter(s => (s.booking_status || '').toLowerCase() === 'completed').length || 0;

        metrics.groomer = {
          groomingSessions: groomingSessions?.length || 0,
          completedSessions: completed,
          recurringClients: Math.floor(completed * 0.4), // Mock: 40% recurring
        };
        break;

      case 'pet_sitter':
      case 'pet sitter':
      case 'physical activity':
        const { data: sittingSessions } = await supabase
          .from('PIQ_Bookings')
          .select('booking_id, booking_status, booked_dtm')
          .eq('service_provider_id', providerId);

        const now = new Date();
        const active = sittingSessions?.filter(s => 
          (s.booking_status || '').toLowerCase() === 'confirmed' && new Date(s.booked_dtm) <= now
        ).length || 0;
        const upcoming = sittingSessions?.filter(s => 
          (s.booking_status || '').toLowerCase() === 'confirmed' && new Date(s.booked_dtm) > now
        ).length || 0;

        metrics.pet_sitter = {
          activeBookings: active,
          upcomingSits: upcoming,
          totalPetsCared: sittingSessions?.length || 0,
        };
        break;

      default:
        // Return empty metrics for unknown types
        break;
    }

    return metrics;
  } catch (error) {
    console.error('Error fetching type-specific metrics:', error);
    throw new Error('Failed to fetch type-specific metrics');
  }
};

export default {
  getDashboardMetrics,
  getRevenueMetrics,
  getRecentAppointments,
  getClients,
  getTypeSpecificMetrics,
};
