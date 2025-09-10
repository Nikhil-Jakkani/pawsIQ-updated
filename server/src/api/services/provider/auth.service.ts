import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { db } from '../../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { tokenService } from '../user/token.service.js';
import { tokenTypes } from '../../../config/tokens.js';

const login = async (email: string, password: string) => {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const { data: provider, error } = await db
    .from('PIQ_Service_Provider')
    .select('*')
    .eq('serv_provider_email', normalizedEmail)
    .single();

  if (error || !provider) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  const stored = provider.serv_provider_password || '';
  let isPasswordMatch = false;
  try {
    // Detect bcrypt hash
    if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
      isPasswordMatch = await bcrypt.compare(password, stored);
    } else {
      // Fallback for non-hashed legacy passwords
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
  const { data: existingProvider } = await db
    .from('PIQ_Service_Provider')
    .select('serv_provider_email')
    .eq('serv_provider_email', providerBody.provider_email || providerBody.serv_provider_email)
    .single();

  if (existingProvider) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  const hashedPassword = await bcrypt.hash(providerBody.provider_password || providerBody.serv_provider_password, 10);
  // Map incoming fields to DB columns
  const newProviderData: any = {
    serv_provider_name: providerBody.provider_name || providerBody.serv_provider_name,
    serv_provider_email: (providerBody.provider_email || providerBody.serv_provider_email)?.toLowerCase(),
    serv_provider_password: hashedPassword,
    serv_provider_contact_nbr: providerBody.provider_contact_number || providerBody.serv_provider_contact_nbr || null,
    serv_provider_desc: providerBody.provider_desc || providerBody.serv_provider_desc || null,
    serv_provider_status: 'active',
    serv_provider_exp_years: providerBody.provider_experience_years || providerBody.serv_provider_exp_years || null,
    serv_provider_certificates: providerBody.provider_certificates || providerBody.serv_provider_certificates || null,
    serv_provider_insta_acct_dtls: providerBody.provider_insta || providerBody.serv_provider_insta_acct_dtls || null,
    serv_provider_fb_acct_dtls: providerBody.provider_fb || providerBody.serv_provider_fb_acct_dtls || null,
  };

  const { data: newProvider, error } = await db
    .from('PIQ_Service_Provider')
    .insert(newProviderData)
    .select()
    .single();

  if (error || !newProvider) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Could not create provider');
  }

  return newProvider;
};

export const providerAuthService = {
  login,
  register,
};
