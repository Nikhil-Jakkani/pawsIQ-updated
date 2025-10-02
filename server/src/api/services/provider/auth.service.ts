import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { db } from '../../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { tokenService } from '../user/token.service.js';

const login = async (email: string, password: string) => {
  const normalizedEmail = (email || '').toLowerCase().trim();

  const { data: provider, error } = await db
    .from('PIQ_Service_Provider')
    .select('*')
    .ilike('serv_provider_email', normalizedEmail)
    .single();

  if (error || !provider) {
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
  // Validate required fields
  const email = (providerBody.provider_email || providerBody.serv_provider_email || '').toLowerCase().trim();
  let phone = providerBody.provider_contact_number || providerBody.serv_provider_contact_nbr;
  if (typeof phone === 'string') {
    phone = phone.trim();
  }
  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Provider email is required');
  }
  if (!phone) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Provider phone number is required for verification');
  }

  const { data: existingProvider } = await db
    .from('PIQ_Service_Provider')
    .select('service_provider_id')
    .ilike('serv_provider_email', email)
    .single();

  if (existingProvider) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  const hashedPassword = await bcrypt.hash(
    providerBody.provider_password || providerBody.serv_provider_password,
    10
  );

  const newProviderData: any = {
    serv_provider_name: providerBody.provider_name || providerBody.serv_provider_name || null,
    serv_provider_email: email,
    serv_provider_password: hashedPassword,
    serv_provider_contact_nbr: phone,
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
    serv_provider_type:
      providerBody.serv_provider_type || providerBody.provider_type || providerBody.services_offered || null,
    how_hear_about_us: providerBody.how_hear_about_us || null,
    provider_src: providerBody.provider_src || null,
    is_provider_bgchecked:
      typeof providerBody.is_provider_bgchecked === 'boolean'
        ? providerBody.is_provider_bgchecked
        : null,
    last_updated_dtm: new Date(),
  };

  const { data: newProvider, error } = await db
    .from('PIQ_Service_Provider')
    .insert(newProviderData)
    .select('service_provider_id, serv_provider_name, serv_provider_email, serv_provider_contact_nbr')
    .single();

  if (error || !newProvider) {
    if (error) {
      console.error('Provider insert error:', error);
      console.log('newProvider:', newProvider);
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Could not create provider${error?.message ? `: ${error.message}` : ''}`
    );
  }

  return newProvider;
};

export const providerAuthService = {
  login,
  register,
};
