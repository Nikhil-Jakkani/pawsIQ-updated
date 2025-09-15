import httpStatus from 'http-status';
import prisma from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';

const serializeBigInt = <T>(data: T): T => {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
  ) as T;
};

const ensureServiceExists = async (services_id: number) => {
  const service = await prisma.pIQ_Service_Master.findUnique({ where: { services_id } });
  if (!service) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid services_id');
};

const listByService = async (services_id: number) => {
  await ensureServiceExists(services_id);
  const items = await prisma.pIQ_Service_BizEntity_Details.findMany({ where: { services_id } });
  return items.map(serializeBigInt);
};

const getById = async (biz_dtls_id: number) => {
  const item = await prisma.pIQ_Service_BizEntity_Details.findUnique({ where: { biz_dtls_id } });
  if (!item) throw new ApiError(httpStatus.NOT_FOUND, 'Business entity not found');
  return serializeBigInt(item);
};

const create = async (
  services_id: number,
  data: {
    provider_biz_name: string;
    provider_biz_email: string;
    provider_biz_login_name: string;
    provider_biz_pwd: string;
    provider_biz_contact_number: string;
    provider_biz_address: string;
    provider_biz_certificates?: string | null;
    provider_biz_gst_number?: string | null;
    is_provider_bizentity_verified?: boolean;
  }
) => {
  await ensureServiceExists(services_id);
  const created = await prisma.pIQ_Service_BizEntity_Details.create({
    data: {
      services_id,
      provider_biz_name: data.provider_biz_name,
      provider_biz_email: data.provider_biz_email,
      provider_biz_login_name: data.provider_biz_login_name,
      provider_biz_pwd: data.provider_biz_pwd,
      provider_biz_contact_number: data.provider_biz_contact_number,
      provider_biz_address: data.provider_biz_address,
      provider_biz_certificates: data.provider_biz_certificates ?? null,
      provider_biz_gst_number: data.provider_biz_gst_number ?? null,
      is_provider_bizentity_verified: Boolean(data.is_provider_bizentity_verified ?? false),
    },
  });
  return serializeBigInt(created);
};

const update = async (
  biz_dtls_id: number,
  data: Partial<{
    provider_biz_name: string;
    provider_biz_email: string;
    provider_biz_login_name: string;
    provider_biz_pwd: string;
    provider_biz_contact_number: string;
    provider_biz_address: string;
    provider_biz_certificates?: string | null;
    provider_biz_gst_number?: string | null;
    is_provider_bizentity_verified?: boolean;
  }>
) => {
  const existing = await prisma.pIQ_Service_BizEntity_Details.findUnique({ where: { biz_dtls_id } });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, 'Business entity not found');
  const updated = await prisma.pIQ_Service_BizEntity_Details.update({ where: { biz_dtls_id }, data });
  return serializeBigInt(updated);
};

const remove = async (biz_dtls_id: number) => {
  const existing = await prisma.pIQ_Service_BizEntity_Details.findUnique({ where: { biz_dtls_id } });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, 'Business entity not found');
  await prisma.pIQ_Service_BizEntity_Details.delete({ where: { biz_dtls_id } });
  return { success: true };
};

export const bizEntityService = {
  listByService,
  getById,
  create,
  update,
  remove,
};
