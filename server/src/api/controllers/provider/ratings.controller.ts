import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { db } from '../../../config/db.js';
import { catchAsync } from '../../utils/catchAsync.js';

const getProviderRatings = catchAsync(async (req: Request, res: Response) => {
  const { providerId } = req.params;
  
  try {
    // This would integrate with reviews/ratings tables
    // For now, return sample data based on provider ID
    const ratings = {
      averageRating: 4.2 + (Math.random() * 0.8), // 4.2 - 5.0 range
      totalReviews: Math.floor(Math.random() * 100) + 10, // 10-110 reviews
      ratingDistribution: {
        5: Math.floor(Math.random() * 50) + 20,
        4: Math.floor(Math.random() * 30) + 15,
        3: Math.floor(Math.random() * 15) + 5,
        2: Math.floor(Math.random() * 8) + 2,
        1: Math.floor(Math.random() * 5) + 1
      },
      recentReviews: [
        {
          id: 1,
          rating: 5,
          comment: "Excellent service! Very professional and caring.",
          userName: "Sarah M.",
          date: new Date().toISOString()
        },
        {
          id: 2,
          rating: 4,
          comment: "Good experience overall. Would recommend.",
          userName: "John D.",
          date: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        }
      ]
    };
    
    res.status(httpStatus.OK).send({ 
      data: {
        averageRating: Math.round(ratings.averageRating * 10) / 10,
        totalReviews: ratings.totalReviews,
        ratingDistribution: ratings.ratingDistribution,
        recentReviews: ratings.recentReviews
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
