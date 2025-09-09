import jwt from 'jsonwebtoken';
import moment from 'moment';
import httpStatus from 'http-status';
import { db } from '../../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { tokenTypes, tokenExpiration } from '../../../config/tokens.js';
import config from '../../../config/config.js';

/**
 * Generate token
 */
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

/**
 * Save a token
 */
const saveToken = async (token: string, userId: number, expires: moment.Moment, type: string, blacklisted = false) => {
  const { data, error } = await db
    .from('tokens')
    .insert([
      {
        token,
        user_id: userId,
        expires: expires.toDate(),
        type,
        blacklisted,
      },
    ])
    .select();

  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error saving token');
  }

  return data[0];
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 */
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

  // Generate refresh token (7 days)
  const refreshTokenExpires = moment().add(tokenExpiration.refresh, 'seconds');
  const refreshToken = generateToken(userId, refreshTokenExpires, tokenTypes.REFRESH, role);
  
  // Save refresh token to database
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

/**
 * Generate new access token using refresh token
 */
const refreshAuth = async (refreshToken: string) => {
  try {
    const refreshTokenDoc = await verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await db
      .from('PIQ_User')
      .select('*')
      .eq('user_id', refreshTokenDoc.sub)
      .single();

    if (!user.data) {
      throw new Error('User not found');
    }

    // Delete the old refresh token
    await db
      .from('tokens')
      .delete()
      .eq('token', refreshToken);

    // Generate new tokens
    return await generateAuthTokens(user.data.user_id, user.data.role);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }
};

/**
 * Generate verify email token
 */
const generateVerifyEmailToken = async (user: any, role: string) => {
  const expires = moment().add(process.env.JWT_VERIFY_EMAIL_EXPIRATION_DAYS || '7', 'days');
  const verifyEmailToken = generateToken(user.user_id, expires, tokenTypes.VERIFY_EMAIL, role);
  
  await saveToken(verifyEmailToken, user.user_id, expires, tokenTypes.VERIFY_EMAIL);
  
  return verifyEmailToken;
};

export const tokenService = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateVerifyEmailToken,
  refreshAuth,
};
