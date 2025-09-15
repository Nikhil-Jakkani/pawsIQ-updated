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
  return items.map(serializeBigInt);
};

const getService = async (services_id: number) => {
  const item = await prisma.pIQ_Service_Master.findUnique({ where: { services_id } });
  return item ? serializeBigInt(item) : null;
};

const listProvidersForService = async (services_id: number) => {
  const service = await prisma.pIQ_Service_Master.findUnique({ where: { services_id } });
  if (!service) return [];

  const type = (service.service_type || '').trim();
  const sub = (service.service_sub_type || '').trim();

  const primary = await prisma.pIQ_Service_Provider.findMany({
    where: {
      OR: [
        { serv_provider_type: { equals: type, mode: 'insensitive' } },
        { serv_provider_type: { contains: type, mode: 'insensitive' } },
        sub ? { serv_provider_type: { equals: sub, mode: 'insensitive' } } : undefined,
        sub ? { serv_provider_type: { contains: sub, mode: 'insensitive' } } : undefined,
      ].filter(Boolean) as any,
    },
    orderBy: [{ serv_provider_name: 'asc' }],
  });

  if (primary.length > 0) return primary.map(serializeBigInt);

  const fallback = await prisma.pIQ_Service_Provider.findMany({
    where: {
      OR: [
        { serv_provider_status: { equals: 'active', mode: 'insensitive' } },
        { serv_provider_status: null },
      ],
    },
    orderBy: [{ serv_provider_name: 'asc' }],
  });
  return fallback.map(serializeBigInt);
};

export const serviceMasterService = {
  listServices,
  getService,
  listProvidersForService,
};
