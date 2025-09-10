import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import prisma from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { tokenService } from '../user/token.service.js';

const login = async (email: string, password: string) => {
  const normalizedEmail = (email || '').toLowerCase().trim();

  const provider = await prisma.pIQ_Service_Provider.findFirst({
    where: {
      serv_provider_email: {
        equals: normalizedEmail,
        mode: 'insensitive',
      },
    },
  });

  if (!provider) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  const stored = provider.serv_provider_password || '';
  let isPasswordMatch = false;
  try {
    if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
      isPasswordMatch = await bcrypt.compare(password, stored);
    } else {
      isPasswordMatch = stored === password;
    }
  } catch (_) {
    isPasswordMatch = false;
  }

  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  if (
    provider.serv_provider_status &&
    typeof provider.serv_provider_status === 'string' &&
    provider.serv_provider_status.trim().toLowerCase() !== 'active'
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Your account is not active. Please contact support.');
  }

  const tokens = await tokenService.generateAuthTokens(provider.service_provider_id, 'provider');
  return { provider, tokens };
};

const register = async (providerBody: any) => {
  const email = (providerBody.provider_email || providerBody.serv_provider_email || '').toLowerCase().trim();
  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Provider email is required');
  }

  const existingProvider = await prisma.pIQ_Service_Provider.findFirst({
    where: {
      serv_provider_email: {
        equals: email,
        mode: 'insensitive',
      },
    },
    select: { service_provider_id: true },
  });

  if (existingProvider) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  const hashedPassword = await bcrypt.hash(
    providerBody.provider_password || providerBody.serv_provider_password,
    10
  );

  const newProvider = await prisma.pIQ_Service_Provider.create({
    data: {
      serv_provider_name: providerBody.provider_name || providerBody.serv_provider_name || null,
      serv_provider_email: email,
      serv_provider_password: hashedPassword,
      serv_provider_contact_nbr:
        providerBody.provider_contact_number || providerBody.serv_provider_contact_nbr || null,
      serv_provider_desc: providerBody.provider_desc || providerBody.serv_provider_desc || null,
      serv_provider_status: 'active',
      serv_provider_exp_years:
        providerBody.provider_experience_years || providerBody.serv_provider_exp_years || null,
      serv_provider_certificates:
        providerBody.provider_certificates || providerBody.serv_provider_certificates || null,
      serv_provider_insta_acct_dtls:
        providerBody.provider_insta || providerBody.serv_provider_insta_acct_dtls || null,
      serv_provider_fb_acct_dtls:
        providerBody.provider_fb || providerBody.serv_provider_fb_acct_dtls || null,
    },
  });

  return newProvider;
};

export const providerAuthService = {
  login,
  register,
};
