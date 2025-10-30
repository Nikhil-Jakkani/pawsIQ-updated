import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { db } from '../../../config/db.js';
import { catchAsync } from '../../utils/catchAsync.js';

const getUserMetrics = catchAsync(async (req: Request, res: Response) => {
  const { timeRange = 'month' } = req.query;
  
  try {
    // Get total users
    const { count: totalUsers, error: totalUsersError } = await db
      .from('PIQ_User')
      .select('*', { count: 'exact', head: true });
    
    if (totalUsersError) throw totalUsersError;
    
    // Get active users (with recent bookings)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: activeBookings, error: activeError } = await db
      .from('PIQ_Bookings')
      .select('user_id')
      .gte('created_dtm', thirtyDaysAgo.toISOString());
    
    if (activeError) throw activeError;
    
    const activeUsers = new Set(activeBookings?.map(b => b.user_id) || []).size;
    
    // Get new users by time range
    const timeRanges = {
      day: 1,
      week: 7,
      month: 30,
      year: 365
    };
    
    const daysBack = timeRanges[timeRange as keyof typeof timeRanges] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const { count: newUsers, error: newUsersError } = await db
      .from('PIQ_User')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());
    
    if (newUsersError) throw newUsersError;
    
    // Calculate retention rate
    const retentionRate = totalUsers && activeUsers 
      ? Math.round((activeUsers / totalUsers) * 100)
      : 0;
    
    // Calculate growth rate (compare last period vs current period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - daysBack);
    
    const { count: previousUsers, error: prevError } = await db
      .from('PIQ_User')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', startDate.toISOString());
    
    if (prevError) throw prevError;
    
    const userGrowth = previousUsers && previousUsers > 0
      ? Math.round(((newUsers || 0) - previousUsers) / previousUsers * 100)
      : 0;
    
    const metrics = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      newUsers: newUsers || 0,
      retentionRate,
      userGrowth
    };
    
    console.log('[Analytics Controller] Returning user metrics:', metrics);
    res.status(httpStatus.OK).send({ data: metrics });
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ 
      message: 'Failed to fetch user metrics' 
    });
  }
});

const getUserDemographics = catchAsync(async (req: Request, res: Response) => {
  try {
    // Get user location distribution
    const { data: locations, error: locError } = await db
      .from('PIQ_User')
      .select('user_location')
      .not('user_location', 'is', null);
    
    if (locError) throw locError;
    
    // Count locations
    const locationMap = new Map<string, number>();
    locations?.forEach(u => {
      const loc = u.user_location || 'Unknown';
      locationMap.set(loc, (locationMap.get(loc) || 0) + 1);
    });
    
    const totalLocs = locations?.length || 1;
    const topLocations = Array.from(locationMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([location, count]) => ({
        location,
        count,
        percentage: Math.round((count / totalLocs) * 100)
      }));
    
    // Get user account age distribution
    const now = new Date();
    const { data: allUsers, error: usersError } = await db
      .from('PIQ_User')
      .select('created_at');
    
    if (usersError) throw usersError;
    
    const ageGroups = {
      'New (< 1 month)': 0,
      '1-3 months': 0,
      '3-6 months': 0,
      '6-12 months': 0,
      'Over 1 year': 0
    };
    
    allUsers?.forEach(u => {
      const daysSince = Math.floor((now.getTime() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince < 30) ageGroups['New (< 1 month)']++;
      else if (daysSince < 90) ageGroups['1-3 months']++;
      else if (daysSince < 180) ageGroups['3-6 months']++;
      else if (daysSince < 365) ageGroups['6-12 months']++;
      else ageGroups['Over 1 year']++;
    });
    
    const totalAgeUsers = allUsers?.length || 1;
    const accountAge = Object.entries(ageGroups).map(([group, count]) => ({
      group,
      count,
      percentage: Math.round((count / totalAgeUsers) * 100)
    }));
    
    const demographics = {
      topLocations,
      accountAge
    };
    
    res.status(httpStatus.OK).send({ data: demographics });
  } catch (error) {
    console.error('Error fetching user demographics:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ 
      message: 'Failed to fetch user demographics' 
    });
  }
});

const getRevenueMetrics = catchAsync(async (req: Request, res: Response) => {
  const { timeRange = 'month' } = req.query;
  
  try {
    // Time range calculations
    const timeRanges = {
      day: 1,
      week: 7,
      month: 30,
      year: 365
    };
    
    const daysBack = timeRanges[timeRange as keyof typeof timeRanges] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    // Get successful payments in time range
    const { data: payments, error: paymentsError } = await db
      .from('PIQ_Payments')
      .select('amount, transaction_date, PIQ_Bookings(PIQ_Service_Master(service_type))')
      .eq('payment_status', 'success')
      .gte('transaction_date', startDate.toISOString());
    
    if (paymentsError) throw paymentsError;
    
    // Calculate total revenue and transaction count
    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
    const transactionCount = payments?.length || 0;
    const averageOrderValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;
    
    // Calculate revenue growth (compare with previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - daysBack);
    
    const { data: previousPayments, error: prevError } = await db
      .from('PIQ_Payments')
      .select('amount')
      .eq('payment_status', 'success')
      .gte('transaction_date', previousPeriodStart.toISOString())
      .lt('transaction_date', startDate.toISOString());
    
    if (prevError) throw prevError;
    
    const previousRevenue = previousPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
    const revenueGrowth = previousRevenue > 0
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
      : 0;
    
    // Revenue by service category
    const categoryMap = new Map<string, number>();
    payments?.forEach((p: any) => {
      const booking = Array.isArray(p.PIQ_Bookings) ? p.PIQ_Bookings[0] : p.PIQ_Bookings;
      const service = booking?.PIQ_Service_Master;
      const serviceType = Array.isArray(service) ? service[0]?.service_type : service?.service_type;
      const category = serviceType || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + Number(p.amount || 0));
    });
    
    const revenueByCategory = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount: Math.round(amount) }))
      .sort((a, b) => b.amount - a.amount);
    
    // Monthly revenue (last 12 months)
    const monthlyRevenue: { month: string; amount: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const { data: monthPayments, error: monthError } = await db
        .from('PIQ_Payments')
        .select('amount')
        .eq('payment_status', 'success')
        .gte('transaction_date', monthStart.toISOString())
        .lt('transaction_date', monthEnd.toISOString());
      
      if (monthError) throw monthError;
      
      const monthTotal = monthPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        amount: Math.round(monthTotal)
      });
    }
    
    const revenueData = {
      totalRevenue: Math.round(totalRevenue),
      transactionCount,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      revenueGrowth,
      revenueByCategory,
      monthlyRevenue
    };
    
    console.log('[Analytics Controller] Returning revenue metrics:', revenueData);
    res.status(httpStatus.OK).send({ data: revenueData });
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ 
      message: 'Failed to fetch revenue metrics' 
    });
  }
});

const getUserSpending = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    // Get all successful payments for user
    const { data: payments, error: paymentsError } = await db
      .from('PIQ_Payments')
      .select('amount, transaction_date')
      .eq('user_id', userId)
      .eq('payment_status', 'success');
    
    if (paymentsError) throw paymentsError;
    
    const totalSpent = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
    const transactionCount = payments?.length || 0;
    
    res.status(httpStatus.OK).send({ 
      data: { 
        totalSpent: Math.round(totalSpent),
        transactionCount,
        currency: 'INR'
      } 
    });
  } catch (error) {
    console.error('Error fetching user spending:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ 
      message: 'Failed to fetch user spending' 
    });
  }
});

const getServiceMetrics = catchAsync(async (req: Request, res: Response) => {
  try {
    // Get booking counts by service category
    const { data: bookings, error: bookingsError } = await db
      .from('PIQ_Bookings')
      .select('booking_id, PIQ_Service_Master(service_type, service_sub_type)');
    
    if (bookingsError) throw bookingsError;
    
    // Count bookings by category
    const categoryMap = new Map<string, number>();
    bookings?.forEach((b: any) => {
      const service = Array.isArray(b.PIQ_Service_Master) ? b.PIQ_Service_Master[0] : b.PIQ_Service_Master;
      const category = service?.service_type || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    const byCategory = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
    
    const totalBookings = bookings?.length || 0;
    
    // Calculate growth (compare last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const { count: recentBookings, error: recentError } = await db
      .from('PIQ_Bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_dtm', thirtyDaysAgo.toISOString());
    
    if (recentError) throw recentError;
    
    const { count: previousBookings, error: prevError } = await db
      .from('PIQ_Bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_dtm', sixtyDaysAgo.toISOString())
      .lt('created_dtm', thirtyDaysAgo.toISOString());
    
    if (prevError) throw prevError;
    
    const growth = previousBookings && previousBookings > 0
      ? Math.round(((recentBookings || 0) - previousBookings) / previousBookings * 100)
      : 0;
    
    const serviceData = {
      byCategory,
      totalBookings,
      growth
    };
    
    console.log('[Analytics Controller] Returning service metrics:', serviceData);
    res.status(httpStatus.OK).send({ data: serviceData });
  } catch (error) {
    console.error('Error fetching service metrics:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: 'Failed to fetch service metrics'
    });
  }
});

export const analyticsController = {
  getUserMetrics,
  getUserDemographics,
  getRevenueMetrics,
  getUserSpending,
  getServiceMetrics,
};
