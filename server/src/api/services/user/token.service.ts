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
      const { data } = await db.from('PIQ_Admins').select('admin_id').eq('admin_id', sub).single();
      subjectExists = !!data;
    } else if (role === 'user') {
      const { data } = await db.from('PIQ_User').select('user_id').eq('user_id', sub).single();
      subjectExists = !!data;
    } else if (role === 'provider') {
      const { data } = await db
        .from('PIQ_Service_Provider')
        .select('service_provider_id')
        .eq('service_provider_id', sub)
        .single();
      subjectExists = !!data;
    }
    if (!subjectExists) {
      throw new Error('Subject not found');
    }

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

export const tokenService = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateVerifyEmailToken,
  refreshAuth,
};
