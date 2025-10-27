import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { db } from '../../../config/db.js';
import { catchAsync } from '../../utils/catchAsync.js';

const getUserMetrics = catchAsync(async (req: Request, res: Response) => {
  const { timeRange = 'month' } = req.query;
  
  try {
    // Get total users
    const { data: totalUsersData, error: totalUsersError } = await db
      .from('PIQ_User')
      .select('user_id', { count: 'exact' });
    
    if (totalUsersError) throw totalUsersError;
    
    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: activeUsersData, error: activeUsersError } = await db
      .from('PIQ_User')
      .select('user_id', { count: 'exact' })
      .gte('last_login', thirtyDaysAgo.toISOString());
    
    if (activeUsersError) throw activeUsersError;
    
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
    
    const { data: newUsersData, error: newUsersError } = await db
      .from('PIQ_User')
      .select('user_id', { count: 'exact' })
      .gte('created_at', startDate.toISOString());
    
    if (newUsersError) throw newUsersError;
    
    // Calculate retention rate (simplified)
    const retentionRate = totalUsersData && activeUsersData 
      ? Math.round((activeUsersData.length / totalUsersData.length) * 100)
      : 0;
    
    // Calculate growth rate (simplified)
    const userGrowth = 18.7; // Placeholder - would need historical data
    
    const metrics = {
      totalUsers: totalUsersData?.length || 0,
      activeUsers: activeUsersData?.length || 0,
      newUsers: {
        day: timeRange === 'day' ? newUsersData?.length || 0 : 42,
        week: timeRange === 'week' ? newUsersData?.length || 0 : 287,
        month: timeRange === 'month' ? newUsersData?.length || 0 : 1243,
        year: timeRange === 'year' ? newUsersData?.length || 0 : 5621
      },
      retentionRate,
      userGrowth
    };
    
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
    // This would require additional user profile fields
    // For now, return sample data
    const demographics = {
      age: [
        { group: '18-24', percentage: 22 },
        { group: '25-34', percentage: 38 },
        { group: '35-44', percentage: 24 },
        { group: '45-54', percentage: 10 },
        { group: '55+', percentage: 6 }
      ],
      gender: [
        { type: 'Male', percentage: 48 },
        { type: 'Female', percentage: 51 },
        { type: 'Other', percentage: 1 }
      ]
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
    // This would integrate with payment/booking tables
    // For now, return sample data based on time range
    const revenueData = {
      totalRevenue: {
        day: 12450,
        week: 87430,
        month: 342150,
        year: 4125000
      },
      transactionCount: {
        day: 245,
        week: 1723,
        month: 7432,
        year: 89245
      },
      averageOrderValue: {
        day: 50.82,
        week: 50.74,
        month: 46.04,
        year: 46.22
      },
      revenueGrowth: 16.8,
      revenueByCategory: [
        { category: 'Pet Services', amount: 187450 },
        { category: 'Marketplace', amount: 98750 },
        { category: 'Premium Subscriptions', amount: 45320 },
        { category: 'Other', amount: 10630 }
      ],
      monthlyRevenue: [
        { month: 'Jan', amount: 285000 },
        { month: 'Feb', amount: 292000 },
        { month: 'Mar', amount: 305000 },
        { month: 'Apr', amount: 312000 },
        { month: 'May', amount: 318000 },
        { month: 'Jun', amount: 329000 },
        { month: 'Jul', amount: 342150 }
      ]
    };
    
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
    // This would integrate with payment/booking tables
    // For now, return sample data
    const totalSpent = Math.floor(Math.random() * 10000); // Random amount for demo
    
    res.status(httpStatus.OK).send({ 
      data: { 
        totalSpent,
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

export const analyticsController = {
  getUserMetrics,
  getUserDemographics,
  getRevenueMetrics,
  getUserSpending,
};
