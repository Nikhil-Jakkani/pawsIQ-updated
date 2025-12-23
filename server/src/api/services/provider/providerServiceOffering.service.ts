import httpStatus from 'http-status';
import { ApiError } from '../../utils/ApiError.js';
import prisma from '../../../lib/prisma.js';

/**
 * List all service offerings for a provider
 */
const listServiceOfferings = async (providerId: number) => {
  const offerings = await prisma.pIQ_Provider_ServiceOffering.findMany({
    where: { service_provider_id: providerId },
    include: {
      PIQ_Service_Master: {
        select: {
          services_id: true,
          service_type: true,
          service_sub_type: true,
          service_title: true,
          service_description: true,
          service_price_amt: true,
          service_duration: true,
          pet_type: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  const serviceIds = Array.from(
    new Set(offerings.map((offering: any) => offering.services_id))
  );

  const pricingMap: Record<number, any> = {};

  if (serviceIds.length > 0) {
    const pricingRecords = await prisma.pIQ_Provider_ServicePricing.findMany({
      where: {
        service_provider_id: providerId,
        services_id: { in: serviceIds },
        effective_to: null,
      },
      orderBy: {
        effective_from: 'desc',
      },
    });

    for (const pricing of pricingRecords) {
      if (!pricingMap[pricing.services_id]) {
        pricingMap[pricing.services_id] = pricing;
      }
    }
  }

  return offerings.map((offering: any) => {
    const pricing = pricingMap[offering.services_id];

    return {
      offering_id: offering.offering_id,
      service_id: offering.services_id,
      custom_title: offering.custom_title,
      custom_description: offering.custom_description,
      is_active: offering.is_active,
      created_at: offering.created_at,
      last_updated_dtm: offering.last_updated_dtm,
      // Service master details
      service_type: offering.PIQ_Service_Master?.service_type,
      service_sub_type: offering.PIQ_Service_Master?.service_sub_type,
      service_title: offering.PIQ_Service_Master?.service_title,
      service_description: offering.PIQ_Service_Master?.service_description,
      default_price: offering.PIQ_Service_Master?.service_price_amt,
      default_duration: offering.PIQ_Service_Master?.service_duration,
      pet_type: offering.PIQ_Service_Master?.pet_type,
      // Custom pricing
      custom_price: pricing?.base_price || null,
      discount_percent: pricing?.discount_percent || 0,
      pricing_id: pricing?.pricing_id || null,
    };
  });
};

/**
 * Get a single service offering by ID
 */
const getServiceOffering = async (providerId: number, offeringId: number) => {
  const offering = await prisma.pIQ_Provider_ServiceOffering.findFirst({
    where: {
      offering_id: offeringId,
      service_provider_id: providerId,
    },
    include: {
      PIQ_Service_Master: {
        select: {
          services_id: true,
          service_type: true,
          service_sub_type: true,
          service_title: true,
          service_description: true,
          service_price_amt: true,
          service_duration: true,
          pet_type: true,
        },
      },
    },
  });

  if (!offering) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service offering not found');
  }

  const pricing = await prisma.pIQ_Provider_ServicePricing.findFirst({
    where: {
      service_provider_id: providerId,
      services_id: offering.services_id,
      effective_to: null,
    },
    orderBy: {
      effective_from: 'desc',
    },
  });

  return {
    offering_id: offering.offering_id,
    service_id: offering.services_id,
    custom_title: offering.custom_title,
    custom_description: offering.custom_description,
    is_active: offering.is_active,
    created_at: offering.created_at,
    last_updated_dtm: offering.last_updated_dtm,
    service_type: offering.PIQ_Service_Master?.service_type,
    service_sub_type: offering.PIQ_Service_Master?.service_sub_type,
    service_title: offering.PIQ_Service_Master?.service_title,
    service_description: offering.PIQ_Service_Master?.service_description,
    default_price: offering.PIQ_Service_Master?.service_price_amt,
    default_duration: offering.PIQ_Service_Master?.service_duration,
    pet_type: offering.PIQ_Service_Master?.pet_type,
    custom_price: pricing?.base_price || null,
    discount_percent: pricing?.discount_percent || 0,
    pricing_id: pricing?.pricing_id || null,
  };
};

/**
 * Create a new service offering for a provider
 */
const createServiceOffering = async (
  providerId: number,
  payload: {
    services_id: number;
    custom_title?: string;
    custom_description?: string;
    is_active?: boolean;
    custom_price?: number;
    discount_percent?: number;
  }
) => {
  // Check if service exists in master
  const service = await prisma.pIQ_Service_Master.findUnique({
    where: { services_id: payload.services_id },
  });

  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service not found in master list');
  }

  // Check if provider already offers this service
  const existing = await prisma.pIQ_Provider_ServiceOffering.findFirst({
    where: {
      service_provider_id: providerId,
      services_id: payload.services_id,
    },
  });

  if (existing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'You already offer this service. Please update the existing offering instead.'
    );
  }

  // Create the offering
  const offering = await prisma.pIQ_Provider_ServiceOffering.create({
    data: {
      service_provider_id: providerId,
      services_id: payload.services_id,
      custom_title: payload.custom_title || null,
      custom_description: payload.custom_description || null,
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      last_updated_dtm: new Date(),
    },
    include: {
      PIQ_Service_Master: {
        select: {
          services_id: true,
          service_type: true,
          service_sub_type: true,
          service_title: true,
          service_description: true,
          service_price_amt: true,
          service_duration: true,
          pet_type: true,
        },
      },
    },
  });

  let customPrice = null;
  let discountPercent = 0;
  let pricingId = null;

  if (payload.custom_price !== undefined || payload.discount_percent !== undefined) {
    const pricing = await prisma.pIQ_Provider_ServicePricing.create({
      data: {
        service_provider_id: providerId,
        services_id: payload.services_id,
        base_price: payload.custom_price || service.service_price_amt,
        discount_percent: payload.discount_percent || 0,
        effective_from: new Date(),
        last_updated_dtm: new Date(),
      },
    });

    customPrice = pricing.base_price;
    discountPercent = pricing.discount_percent;
    pricingId = pricing.pricing_id;
  }

  return {
    offering_id: offering.offering_id,
    service_id: offering.services_id,
    custom_title: offering.custom_title,
    custom_description: offering.custom_description,
    is_active: offering.is_active,
    created_at: offering.created_at,
    last_updated_dtm: offering.last_updated_dtm,
    service_type: offering.PIQ_Service_Master?.service_type,
    service_sub_type: offering.PIQ_Service_Master?.service_sub_type,
    service_title: offering.PIQ_Service_Master?.service_title,
    service_description: offering.PIQ_Service_Master?.service_description,
    default_price: offering.PIQ_Service_Master?.service_price_amt,
    default_duration: offering.PIQ_Service_Master?.service_duration,
    pet_type: offering.PIQ_Service_Master?.pet_type,
    custom_price: customPrice,
    discount_percent: discountPercent,
    pricing_id: pricingId,
  };
};

/**
 * Update an existing service offering
 */
const updateServiceOffering = async (
  providerId: number,
  offeringId: number,
  payload: {
    custom_title?: string;
    custom_description?: string;
    is_active?: boolean;
    custom_price?: number;
    discount_percent?: number;
  }
) => {
  // Check if offering exists and belongs to provider
  const existing = await prisma.pIQ_Provider_ServiceOffering.findFirst({
    where: {
      offering_id: offeringId,
      service_provider_id: providerId,
    },
    include: {
      PIQ_Service_Master: {
        select: {
          service_price_amt: true,
        },
      },
    },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service offering not found or you do not have permission to update it');
  }

  // Update the offering
  const updated = await prisma.pIQ_Provider_ServiceOffering.update({
    where: { offering_id: offeringId },
    data: {
      custom_title: payload.custom_title !== undefined ? payload.custom_title : undefined,
      custom_description: payload.custom_description !== undefined ? payload.custom_description : undefined,
      is_active: payload.is_active !== undefined ? payload.is_active : undefined,
      last_updated_dtm: new Date(),
    },
    include: {
      PIQ_Service_Master: {
        select: {
          services_id: true,
          service_type: true,
          service_sub_type: true,
          service_title: true,
          service_description: true,
          service_price_amt: true,
          service_duration: true,
          pet_type: true,
        },
      },
    },
  });

  let customPrice = null;
  let discountPercent = 0;
  let pricingId = null;

  if (payload.custom_price !== undefined || payload.discount_percent !== undefined) {
    const oldPricing = await prisma.pIQ_Provider_ServicePricing.findFirst({
      where: {
        service_provider_id: providerId,
        services_id: existing.services_id,
        effective_to: null,
      },
    });

    if (oldPricing) {
      await prisma.pIQ_Provider_ServicePricing.update({
        where: { pricing_id: oldPricing.pricing_id },
        data: {
          effective_to: new Date(),
        },
      });
    }

    const newPricing = await prisma.pIQ_Provider_ServicePricing.create({
      data: {
        service_provider_id: providerId,
        services_id: existing.services_id,
        base_price: payload.custom_price !== undefined ? payload.custom_price : (oldPricing?.base_price || existing.PIQ_Service_Master!.service_price_amt),
        discount_percent: payload.discount_percent !== undefined ? payload.discount_percent : (oldPricing?.discount_percent || 0),
        effective_from: new Date(),
        last_updated_dtm: new Date(),
      },
    });

    customPrice = newPricing.base_price;
    discountPercent = newPricing.discount_percent;
    pricingId = newPricing.pricing_id;
  } else {
    const latestPricing = await prisma.pIQ_Provider_ServicePricing.findFirst({
      where: {
        service_provider_id: providerId,
        services_id: existing.services_id,
        effective_to: null,
      },
      orderBy: {
        effective_from: 'desc',
      },
    });

    if (latestPricing) {
      customPrice = latestPricing.base_price;
      discountPercent = latestPricing.discount_percent;
      pricingId = latestPricing.pricing_id;
    }
  }

  return {
    offering_id: updated.offering_id,
    service_id: updated.services_id,
    custom_title: updated.custom_title,
    custom_description: updated.custom_description,
    is_active: updated.is_active,
    created_at: updated.created_at,
    last_updated_dtm: updated.last_updated_dtm,
    service_type: updated.PIQ_Service_Master?.service_type,
    service_sub_type: updated.PIQ_Service_Master?.service_sub_type,
    service_title: updated.PIQ_Service_Master?.service_title,
    service_description: updated.PIQ_Service_Master?.service_description,
    default_price: updated.PIQ_Service_Master?.service_price_amt,
    default_duration: updated.PIQ_Service_Master?.service_duration,
    pet_type: updated.PIQ_Service_Master?.pet_type,
    custom_price: customPrice,
    discount_percent: discountPercent,
    pricing_id: pricingId,
  };
};

/**
 * Delete a service offering
 */
const deleteServiceOffering = async (providerId: number, offeringId: number) => {
  // Check if offering exists and belongs to provider
  const existing = await prisma.pIQ_Provider_ServiceOffering.findFirst({
    where: {
      offering_id: offeringId,
      service_provider_id: providerId,
    },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service offering not found or you do not have permission to delete it');
  }

  // ✅ IMPROVED: Check for ALL non-completed bookings (not just Pending/Confirmed)
  const futureBookings = await prisma.pIQ_Bookings.count({
    where: {
      service_provider_id: providerId,
      services_id: existing.services_id,
      booking_status: { notIn: ['Cancelled', 'Completed'] },
    },
  });

  if (futureBookings > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot delete service offering. You have ${futureBookings} active booking(s) for this service. Please complete or cancel them first.`
    );
  }

  // ✅ IMPROVED: Soft delete instead of hard delete (preserves history)
  await prisma.pIQ_Provider_ServiceOffering.update({
    where: { offering_id: offeringId },
    data: {
      is_active: false,
      last_updated_dtm: new Date(),
    },
  });

  return { success: true, message: 'Service offering deactivated successfully' };
};

/**
 * List all available services from master that provider can add
 */
const listAvailableServices = async (providerId: number) => {
  // Get all services from master
  const allServices = await prisma.pIQ_Service_Master.findMany({
    where: {
      is_record_valid: true,
    },
    orderBy: [{ service_type: 'asc' }, { service_sub_type: 'asc' }],
  });

  // Get services already offered by provider
  const offeredServices = await prisma.pIQ_Provider_ServiceOffering.findMany({
    where: { service_provider_id: providerId },
    select: { services_id: true },
  });

  const offeredServiceIds = new Set(offeredServices.map((o: any) => o.services_id));

  // Filter out already offered services
  const availableServices = allServices
    .filter((service: any) => !offeredServiceIds.has(service.services_id))
    .map((service: any) => ({
      services_id: service.services_id,
      service_type: service.service_type,
      service_sub_type: service.service_sub_type,
      service_title: service.service_title,
      service_description: service.service_description,
      service_price_amt: service.service_price_amt,
      service_duration: service.service_duration,
      pet_type: service.pet_type,
    }));

  return availableServices;
};

export const providerServiceOfferingService = {
  listServiceOfferings,
  getServiceOffering,
  createServiceOffering,
  updateServiceOffering,
  deleteServiceOffering,
  listAvailableServices,
};
