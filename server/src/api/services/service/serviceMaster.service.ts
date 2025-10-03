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

const listProvidersForService = async (services_id: number) => {
  const service = await prisma.pIQ_Service_Master.findUnique({ where: { services_id } });
  if (!service) return [];

  const type = (service.service_type || '').trim();
  const sub = (service.service_sub_type || '').trim();

  const primary = await prisma.pIQ_Service_Provider.findMany({
    where: {
      AND: [
        { serv_provider_status: 'active' }, // Only show active providers
        {
          OR: [
            { serv_provider_type: { equals: type, mode: 'insensitive' } },
            { serv_provider_type: { contains: type, mode: 'insensitive' } },
            sub ? { serv_provider_type: { equals: sub, mode: 'insensitive' } } : undefined,
            sub ? { serv_provider_type: { contains: sub, mode: 'insensitive' } } : undefined,
          ].filter(Boolean) as any,
        },
      ],
    },
    orderBy: [{ serv_provider_name: 'asc' }],
  });

  if (primary.length > 0) return primary.map(serializeBigInt);

  const fallback = await prisma.pIQ_Service_Provider.findMany({
    where: {
      serv_provider_status: { equals: 'active', mode: 'insensitive' },
    },
    orderBy: [{ serv_provider_name: 'asc' }],
  });
  return fallback.map(serializeBigInt);
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
