import prisma from '../../../lib/prisma.js';

const serializeBigInt = <T>(data: T): T => {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
  ) as T;
};

const listServices = async () => {
  const items = await prisma.pIQ_Service_Master.findMany({
    orderBy: [{ service_type: 'asc' }, { service_sub_type: 'asc' }, { service_title: 'asc' }],
  });
  // Normalize fields so frontend can render without extra mapping
  return items.map((s) => {
    const row = serializeBigInt(s as any) as any;
    return {
      // Original columns
      ...row,
      // UI-friendly fields
      service_name: row.service_title || row.service_type || 'Service',
      service_description: row.service_description || '',
      duration_minutes: Number(row.service_duration ?? 60),
      price: Number(row.service_price_amt ?? 0),
    };
  });
};

const getService = async (services_id: number) => {
  const item = await prisma.pIQ_Service_Master.findUnique({ where: { services_id } });
  if (!item) return null;
  const row = serializeBigInt(item as any) as any;
  return {
    ...row,
    service_name: row.service_title || row.service_type || 'Service',
    service_description: row.service_description || '',
    duration_minutes: Number(row.service_duration ?? 60),
    price: Number(row.service_price_amt ?? 0),
  };
};

const listProvidersForService = async (services_id: number, location?: string) => {
  const service = await prisma.pIQ_Service_Master.findUnique({ where: { services_id } });
  if (!service) return [];

  // Find providers who have explicitly added this service to their offerings
  const whereConditions: any = {
    AND: [
      { serv_provider_status: 'active' }, // Only show active providers
      {
        PIQ_Provider_ServiceOffering: {
          some: {
            services_id: services_id, // Provider must offer this specific service
            is_active: true, // Service offering must be active
          },
        },
      },
    ],
  };

  // Add location filter if provided
  if (location && location.trim().length > 0) {
    whereConditions.AND.push({
      serv_provider_location: { contains: location.trim(), mode: 'insensitive' },
    });
  }

  const providers = await prisma.pIQ_Service_Provider.findMany({
    where: whereConditions,
    orderBy: [{ serv_provider_name: 'asc' }],
  });

  return providers.map(serializeBigInt);
};

const removeService = async (services_id: number) => {
  const existing = await prisma.pIQ_Service_Master.findUnique({ where: { services_id } });
  if (!existing) throw new Error('Service not found');
  await prisma.pIQ_Service_Master.delete({ where: { services_id } });
  return { success: true };
};

export const serviceMasterService = {
  listServices,
  getService,
  listProvidersForService,
  removeService,
};
