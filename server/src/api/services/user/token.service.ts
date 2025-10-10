import jwt from 'jsonwebtoken';
import moment from 'moment';
import httpStatus from 'http-status';
import { db } from '../../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { tokenTypes, tokenExpiration } from '../../../config/tokens.js';
import config from '../../../config/config.js';

const generateToken = (
  subject: number,
  expires: moment.Moment,
  type: string,
  role: string,
  secret: string = config.jwtSecret
) => {
  const payload = {
    sub: subject,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
    role,
  };
  return jwt.sign(payload, secret);
};

const saveToken = async (token: string, userId: number, expires: moment.Moment, type: string, blacklisted = false) => {
  const { data: saved, error } = await db
    .from('tokens')
    .insert({
      token,
      user_id: userId,
      expires: expires.toDate(),
      type,
      blacklisted,
    })
    .select()
    .single();
  
  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to save token');
  }
  return saved;
};


const verifyToken = async (token: string, type: string) => {
  const payload = jwt.verify(token, config.jwtSecret);
  
  const { data: tokenDoc, error } = await db
    .from('tokens')
    .select('*')
    .eq('token', token)
    .eq('type', type)
    .eq('blacklisted', false)
    .single();

  if (error || !tokenDoc) {
    throw new Error('Token not found');
  }

  if (moment().isAfter(tokenDoc.expires)) {
    throw new Error('Token expired');
  }

  return tokenDoc;
};

const generateAuthTokens = async (userId: number, role: string) => {
  const accessTokenExpires = moment().add(tokenExpiration.access, 'seconds');
  const accessToken = generateToken(userId, accessTokenExpires, tokenTypes.ACCESS, role);

  const refreshTokenExpires = moment().add(tokenExpiration.refresh, 'seconds');
  const refreshToken = generateToken(userId, refreshTokenExpires, tokenTypes.REFRESH, role);
  
  await saveToken(refreshToken, userId, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

const refreshAuth = async (refreshToken: string) => {
  try {
    const refreshTokenDoc = await verifyToken(refreshToken, tokenTypes.REFRESH);
    const payload: any = jwt.verify(refreshToken, config.jwtSecret);
    const role = payload?.role || 'user';
    const sub = Number(payload?.sub);

    let subjectExists = false;
    if (role === 'admin') {
      const { data: admin } = await db.from('PIQ_Admins').select('admin_id').eq('admin_id', sub).single();
      subjectExists = !!admin;
    } else if (role === 'user') {
      const { data: user } = await db.from('PIQ_User').select('user_id').eq('user_id', sub).single();
      subjectExists = !!user;
    } else if (role === 'provider') {
      const { data: provider } = await db.from('PIQ_Service_Provider').select('service_provider_id').eq('service_provider_id', sub).single();
      subjectExists = !!provider;
    }
    if (!subjectExists) {
      throw new Error('Subject not found');
    }

    // Delete the old refresh token
    await db.from('tokens').delete().eq('token', refreshToken);

    return await generateAuthTokens(sub, role);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }
};


const generateVerifyEmailToken = async (user: any, role: string) => {
  const expires = moment().add(process.env.JWT_VERIFY_EMAIL_EXPIRATION_DAYS || '7', 'days');
  const verifyEmailToken = generateToken(user.user_id, expires, tokenTypes.VERIFY_EMAIL, role);
  
  await saveToken(verifyEmailToken, user.user_id, expires, tokenTypes.VERIFY_EMAIL);
  
  return verifyEmailToken;
};

// Clean up expired tokens - should be called periodically
const cleanupExpiredTokens = async () => {
  try {
    // Use ISO string format for better PostgreSQL compatibility
    const now = new Date().toISOString();
    const { error } = await db
      .from('tokens')
      .delete()
      .lt('expires', now);
    
    if (error) {
      console.error('Failed to cleanup expired tokens:', error);
    }
  } catch (error) {
    console.error('Token cleanup error:', error);
  }
};

// Blacklist a specific token
const blacklistToken = async (token: string) => {
  try {
    const { error } = await db
      .from('tokens')
      .update({ blacklisted: true })
      .eq('token', token);
    
    if (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to blacklist token');
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to blacklist token');
  }
};

// Get user's active tokens count
const getUserActiveTokensCount = async (userId: number) => {
  try {
    const now = new Date().toISOString();
    const { count, error } = await db
      .from('tokens')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', tokenTypes.REFRESH)
      .eq('blacklisted', false)
      .gt('expires', now);
    
    if (error) {
      return 0;
    }
    return count || 0;
  } catch (error) {
    return 0;
  }
};

export const tokenService = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateVerifyEmailToken,
  refreshAuth,
  cleanupExpiredTokens,
  blacklistToken,
  getUserActiveTokensCount,
};
