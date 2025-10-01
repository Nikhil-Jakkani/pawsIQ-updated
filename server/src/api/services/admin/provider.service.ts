import prisma from '../../../lib/prisma.js';

/**
 * Get all providers with optional status filter
 */
const getAllProviders = async (status?: string) => {
  const where: any = {};
  
  if (status && status !== 'all') {
    where.serv_provider_status = status;
  }
  
  const providers = await prisma.pIQ_Service_Provider.findMany({
    where,
    orderBy: {
      created_at: 'desc'
    }
  });
  
  return providers;
};

/**
 * Get provider by ID
 */
const getProviderById = async (providerId: number) => {
  const provider = await prisma.pIQ_Service_Provider.findUnique({
    where: {
      service_provider_id: providerId
    }
  });
  
  return provider;
};

/**
 * Update provider status (for approval/rejection)
 */
const updateProviderStatus = async (providerId: number, status: string, notes?: string) => {
  const validStatuses = ['inactive', 'active', 'rejected', 'suspended'];
  
  if (!validStatuses.includes(status.toLowerCase())) {
    throw new Error('Invalid status. Must be one of: inactive, active, rejected, suspended');
  }
  
  const provider = await prisma.pIQ_Service_Provider.update({
    where: {
      service_provider_id: providerId
    },
    data: {
      serv_provider_status: status.toLowerCase(),
      last_updated_dtm: new Date()
    }
  });
  
  return provider;
};

/**
 * Get provider statistics by status
 */
const getProviderStats = async () => {
  const [total, pending, approved, rejected] = await Promise.all([
    prisma.pIQ_Service_Provider.count(),
    prisma.pIQ_Service_Provider.count({ where: { serv_provider_status: 'inactive' } }),
    prisma.pIQ_Service_Provider.count({ where: { serv_provider_status: 'active' } }),
    prisma.pIQ_Service_Provider.count({ where: { serv_provider_status: 'rejected' } })
  ]);
  
  return {
    total,
    pending,
    approved,
    rejected
  };
};

/**
 * Get providers grouped by type
 */
const getProvidersByType = async () => {
  const providers = await prisma.pIQ_Service_Provider.findMany({
    where: {
      serv_provider_status: 'active'
    },
    select: {
      serv_provider_type: true
    }
  });
  
  const typeCounts: Record<string, number> = {};
  
  providers.forEach((provider: any) => {
    const type = (provider.serv_provider_type || 'other').toLowerCase().trim();
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  return typeCounts;
};

export const providerService = {
  getAllProviders,
  getProviderById,
  updateProviderStatus,
  getProviderStats,
  getProvidersByType
};
