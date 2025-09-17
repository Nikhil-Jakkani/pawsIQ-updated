import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { db } from '../../../config/db.js';
import { tokenService } from '../../services/user/token.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { providerAuthService } from '../../services/provider/auth.service.js';
import { adminAuth } from '../../../config/firebaseAdmin.js';

const register = catchAsync(async (req: Request, res: Response) => {
  const provider = await providerAuthService.register(req.body);
  res.status(httpStatus.CREATED).send({ provider });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const { provider_email, provider_password } = req.body;
  const { provider, tokens } = await providerAuthService.login(provider_email, provider_password);

  const user = {
    id: provider.service_provider_id,
    email: provider.serv_provider_email,
    name: provider.serv_provider_name,
    phone: provider.serv_provider_contact_nbr,
    role: 'provider' as const,
  };
  res.send({ user, tokens });
});

// Social logins for providers
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const { credential } = req.body as { credential: string };
  if (!credential) {
    return res.status(httpStatus.BAD_REQUEST).json({ error: 'Missing Google credential' });
  }
  if (!GOOGLE_CLIENT_ID) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Server configuration error' });
  }

  const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    return res.status(httpStatus.BAD_REQUEST).json({ error: 'Invalid Google token payload' });
  }

  const email = payload.email.toLowerCase();

  let { data: provider } = await db
    .from('PIQ_Service_Provider')
    .select('*')
    .ilike('serv_provider_email', email)
    .single();

  if (!provider) {
    const randomPassword = await bcrypt.hash(`oauth-${Date.now()}-${Math.random()}`, 10);
    const insertResult = await db
      .from('PIQ_Service_Provider')
      .insert([
        {
          serv_provider_name: payload.name || 'Provider',
          serv_provider_email: email,
          serv_provider_password: randomPassword,
          serv_provider_contact_nbr: '',
          serv_provider_status: 'active',
          created_at: new Date(),
          last_updated_dtm: new Date(),
          provider_src: 'google',
        },
      ])
      .select()
      .single();

    if (insertResult.error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create provider' });
    }
    provider = insertResult.data as any;
  }

  const tokens = await tokenService.generateAuthTokens(provider.service_provider_id, 'provider');
  const user = {
    id: provider.service_provider_id,
    email: provider.serv_provider_email,
    name: provider.serv_provider_name,
    role: 'provider' as const,
    avatar: payload.picture,
  };
  return res.json({ user, tokens });
});

const facebookLogin = catchAsync(async (req: Request, res: Response) => {
  const { accessToken, userID, name, email } = req.body as {
    accessToken: string;
    userID: string;
    name?: string;
    email?: string;
  };
  if (!accessToken || !userID) {
    return res.status(httpStatus.BAD_REQUEST).json({ error: 'Invalid Facebook token' });
  }

  const { data } = await axios.get(
    `https://graph.facebook.com/v13.0/me?fields=id,name,email,picture&access_token=${accessToken}`
  );
  if (data.id !== userID) {
    return res.status(httpStatus.BAD_REQUEST).json({ error: 'Invalid Facebook user' });
  }

  const userEmail = (email || data.email || `${userID}@facebook.com`).toLowerCase();
  let { data: provider } = await db
    .from('PIQ_Service_Provider')
    .select('*')
    .ilike('serv_provider_email', userEmail)
    .single();

  if (!provider) {
    const randomPassword = await bcrypt.hash(`oauth-${Date.now()}-${Math.random()}`, 10);
    const insertResult = await db
      .from('PIQ_Service_Provider')
      .insert([
        {
          serv_provider_name: name || data.name || 'Facebook Provider',
          serv_provider_email: userEmail,
          serv_provider_password: randomPassword,
          serv_provider_contact_nbr: '',
          serv_provider_status: 'active',
          created_at: new Date(),
          last_updated_dtm: new Date(),
          provider_src: 'facebook',
        },
      ])
      .select()
      .single();

    if (insertResult.error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create provider' });
    }
    provider = insertResult.data as any;
  }

  const tokens = await tokenService.generateAuthTokens(provider.service_provider_id, 'provider');
  const user = {
    id: provider.service_provider_id,
    email: provider.serv_provider_email,
    name: provider.serv_provider_name,
    role: 'provider' as const,
    avatar: data?.picture?.data?.url,
  };
  return res.json({ user, tokens });
});

export const providerAuthController = {
  register,
  login,
  googleLogin,
  facebookLogin,
  forgotPassword: catchAsync(async (req: Request, res: Response) => {
    const { email, provider_email } = req.body as { email?: string; provider_email?: string };
    const target = (email || provider_email || '').toLowerCase().trim();
    // Do not reveal whether an account exists. In a full implementation, generate a reset token and email it.
    if (target) {
      // Optionally record an audit log or enqueue an email job here.
      // await passwordResetService.enqueueProviderReset(target)
    }
    return res.status(httpStatus.OK).json({ success: true, message: 'If an account exists, a reset link will be sent.' });
  }),
  // Send OTP to provider phone
  verifyFirebasePhone: catchAsync(async (req: Request, res: Response) => {
    const { idToken } = req.body as { idToken: string };
    if (!idToken) {
      return res.status(httpStatus.BAD_REQUEST).json({ error: 'idToken is required' });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const phone = decoded.phone_number;
    if (!phone) {
      return res.status(httpStatus.BAD_REQUEST).json({ error: 'Phone number not present in Firebase token' });
    }

    // Find or create provider by phone
    let { data: provider } = await db
      .from('PIQ_Service_Provider')
      .select('*')
      .eq('serv_provider_contact_nbr', phone)
      .single();

    if (!provider) {
      const randomPassword = await bcrypt.hash(`otp-${Date.now()}-${Math.random()}`, 10);
      const syntheticEmail = `provider-${phone.replace('+', '')}@firebase.pawsiq.com`;
      const insertResult = await db
        .from('PIQ_Service_Provider')
        .insert([
          {
            serv_provider_name: 'Phone Provider',
            serv_provider_email: syntheticEmail,
            serv_provider_password: randomPassword,
            serv_provider_contact_nbr: phone,
            serv_provider_status: 'active',
            created_at: new Date(),
            last_updated_dtm: new Date(),
            provider_src: 'firebase',
          },
        ])
        .select()
        .single();

      if (insertResult.error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create provider' });
      }
      provider = insertResult.data as any;
    }

    const tokens = await tokenService.generateAuthTokens(provider.service_provider_id, 'provider');
    const user = {
      id: provider.service_provider_id,
      email: provider.serv_provider_email,
      name: provider.serv_provider_name,
      phone: provider.serv_provider_contact_nbr,
      role: 'provider' as const,
    };
    return res.json({ user, tokens });
  }),
};
