import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { db } from '../../../config/db.js';
import { catchAsync } from '../../utils/catchAsync.js';

const getProviderRatings = catchAsync(async (req: Request, res: Response) => {
  const { providerId } = req.params;
  
  try {
    // Get all reviews for the provider
    const { data: reviews, error: reviewsError } = await db
      .from('PIQ_Provider_Reviews')
      .select(`
        review_id,
        rating,
        review_text,
        reviewed_at,
        PIQ_User (
          user_id,
          user_full_name
        )
      `)
      .eq('service_provider_id', providerId)
      .order('reviewed_at', { ascending: false });
    
    if (reviewsError) throw reviewsError;
    
    // Calculate average rating
    const totalReviews = reviews?.length || 0;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / totalReviews
      : 0;
    
    // Calculate rating distribution
    const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews?.forEach(r => {
      const rating = Number(r.rating);
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });
    
    // Get recent reviews (top 10)
    const recentReviews = reviews?.slice(0, 10).map(r => {
      const user = Array.isArray(r.PIQ_User) ? r.PIQ_User[0] : r.PIQ_User;
      return {
        id: r.review_id,
        rating: Number(r.rating),
        comment: r.review_text || '',
        userName: user?.user_full_name || 'Anonymous',
        date: r.reviewed_at
      };
    }) || [];
    
    res.status(httpStatus.OK).send({ 
      data: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        ratingDistribution,
        recentReviews
      }
    });
  } catch (error) {
    console.error('Error fetching provider ratings:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ 
      message: 'Failed to fetch provider ratings' 
    });
  }
});

const getProviderServices = catchAsync(async (req: Request, res: Response) => {
  const { providerId } = req.query;
  
  try {
    // Get provider service offerings from database
    const { data: services, error } = await db
      .from('PIQ_Provider_Service_Offering')
      .select(`
        offering_id,
        services_id,
        custom_title,
        custom_description,
        is_active,
        PIQ_Service_Master (
          service_title,
          service_description,
          default_price,
          default_duration,
          service_category
        )
      `)
      .eq('service_provider_id', providerId)
      .eq('is_active', true);
    
    if (error) {
      console.error('Database error:', error);
      throw error;
    }
    
    // Transform the data
    const transformedServices = services?.map((service: any) => {
      const masterService = Array.isArray(service.PIQ_Service_Master) 
        ? service.PIQ_Service_Master[0] 
        : service.PIQ_Service_Master;
      
      return {
        id: service.offering_id,
        serviceId: service.services_id,
        title: service.custom_title || masterService?.service_title || 'Service',
        description: service.custom_description || masterService?.service_description || '',
        price: masterService?.default_price || 0,
        duration: masterService?.default_duration || 30,
        category: masterService?.service_category || 'General',
        isActive: service.is_active
      };
    }) || [];
    
    res.status(httpStatus.OK).send({ 
      data: { 
        services: transformedServices 
      } 
    });
  } catch (error) {
    console.error('Error fetching provider services:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ 
      message: 'Failed to fetch provider services' 
    });
  }
});

export const ratingsController = {
  getProviderRatings,
  getProviderServices,
};
