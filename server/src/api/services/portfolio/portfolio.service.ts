import httpStatus from 'http-status';
import prisma from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { supabase } from '../../../config/supabase.js';

const serializeBigInt = <T>(data: T): T => {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
  ) as T;
};

/**
 * Get all portfolio items for a provider
 */
const getProviderPortfolio = async (providerId: number) => {
  const items = await prisma.pIQ_Provider_Portfolio.findMany({
    where: { service_provider_id: providerId },
    orderBy: [{ is_featured: 'desc' }, { display_order: 'asc' }, { created_at: 'desc' }],
  });

  return items.map(serializeBigInt);
};

/**
 * Get single portfolio item
 */
const getPortfolioItem = async (providerId: number, portfolioId: number) => {
  const item = await prisma.pIQ_Provider_Portfolio.findFirst({
    where: {
      portfolio_id: portfolioId,
      service_provider_id: providerId,
    },
  });

  if (!item) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Portfolio item not found');
  }

  return serializeBigInt(item);
};

/**
 * Create portfolio item
 */
const createPortfolioItem = async (
  providerId: number,
  data: {
    title: string;
    description?: string;
    image_url: string;
    display_order?: number;
    is_featured?: boolean;
  }
) => {
  const item = await prisma.pIQ_Provider_Portfolio.create({
    data: {
      service_provider_id: providerId,
      title: data.title,
      description: data.description || null,
      image_url: data.image_url,
      display_order: data.display_order || 0,
      is_featured: data.is_featured || false,
    },
  });

  return serializeBigInt(item);
};

/**
 * Update portfolio item
 */
const updatePortfolioItem = async (
  providerId: number,
  portfolioId: number,
  data: {
    title?: string;
    description?: string | null;
    image_url?: string;
    display_order?: number;
    is_featured?: boolean;
  }
) => {
  const existing = await prisma.pIQ_Provider_Portfolio.findFirst({
    where: {
      portfolio_id: portfolioId,
      service_provider_id: providerId,
    },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Portfolio item not found');
  }

  const updated = await prisma.pIQ_Provider_Portfolio.update({
    where: { portfolio_id: portfolioId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.image_url !== undefined && { image_url: data.image_url }),
      ...(data.display_order !== undefined && { display_order: data.display_order }),
      ...(data.is_featured !== undefined && { is_featured: data.is_featured }),
    },
  });

  return serializeBigInt(updated);
};

/**
 * Delete portfolio item
 */
const deletePortfolioItem = async (providerId: number, portfolioId: number) => {
  const existing = await prisma.pIQ_Provider_Portfolio.findFirst({
    where: {
      portfolio_id: portfolioId,
      service_provider_id: providerId,
    },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Portfolio item not found');
  }

  await prisma.pIQ_Provider_Portfolio.delete({
    where: { portfolio_id: portfolioId },
  });

  return { success: true };
};

/**
 * Generate Supabase signed upload URL for portfolio image
 */
const generateUploadUrl = async (providerId: number, fileName: string) => {
  const bucket = 'portfolio-images';
  const filePath = `${providerId}/${Date.now()}-${fileName}`;

  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === bucket);

  if (!bucketExists) {
    await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    });
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate upload URL');
  }

  return {
    upload_url: data.signedUrl,
    file_path: filePath,
    token: data.token,
  };
};

export const portfolioService = {
  getProviderPortfolio,
  getPortfolioItem,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  generateUploadUrl,
};
