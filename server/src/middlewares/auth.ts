import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import prisma from '../lib/prisma.js';
import { ApiError } from '../api/utils/ApiError.js';
import { tokenTypes } from '../config/tokens.js';
import config from '../config/config.js';

const auth = (...requiredRights: string[]) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      // Get token from header
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
      }

      // Verify token
      const payload: any = jwt.verify(token, config.jwtSecret);

      // For ACCESS tokens, we rely on JWT verification only.
      // For other token types (e.g., REFRESH, VERIFY_EMAIL), ensure it's present and valid in DB.
      if (payload.type !== tokenTypes.ACCESS) {
        const { data: tokenDoc, error } = await db
          .from('tokens')
          .select('*')
          .eq('token', token)
          .eq('blacklisted', false)
          .single();

        if (error || !tokenDoc) {
          throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
        }

        // Check if token is expired (redundant for ACCESS since jwt.verify already checked exp)
        if (new Date() > new Date(tokenDoc.expires)) {
          throw new ApiError(httpStatus.UNAUTHORIZED, 'Token expired');
        }
      }

      const { role } = payload;
      if (!role) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token: Role is missing');
      }

      const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : role;

      // Check if the user's role is allowed
      if (requiredRights.length && !requiredRights.includes(normalizedRole)) {
        console.warn('[Auth] Access denied - Role mismatch:', { role: normalizedRole, required: requiredRights });
        throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
      }

      let entity: any;
      let entityError: any;

      switch (normalizedRole) {
        case 'user': {
          const { data, error } = await db.from('PIQ_User').select('*').eq('user_id', payload.sub).single();
          entity = data;
          entityError = error;
          if (
            entity &&
            typeof entity.user_status === 'string' &&
            entity.user_status.trim()
          ) {
            const status = entity.user_status.trim().toLowerCase();
            if (status === 'inactive' || status === 'blocked') {
              throw new ApiError(httpStatus.UNAUTHORIZED, 'User account is not active');
            }
          }
          break;
        }
        case 'admin': {
          try {
            const adminId = BigInt(payload.sub);
            entity = await prisma.pIQ_Admins.findUnique({
              where: { admin_id: adminId }
            });
            entityError = null;
          } catch (error) {
            console.error('[Auth] Admin lookup error:', error);
            entityError = error;
          }
          // No admin_status column in schema; skip status checks
          break;
        }
        case 'provider': {
          const { data, error } = await db.from('PIQ_Service_Provider').select('*').eq('service_provider_id', payload.sub).single();
          entity = data;
          entityError = error;
          break;
        }
        default:
          throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid role specified in token');
      }

      if (entityError || !entity) {
        console.error('[Auth] Entity not found:', { role: normalizedRole, error: entityError?.message });
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
      }

      // Attach user/admin/provider entity to the request object
      req.user = entity;
      req.token = token;
      req.userRole = normalizedRole;

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        next(new ApiError(httpStatus.UNAUTHORIZED, 'Token expired'));
      } else if (error instanceof jwt.JsonWebTokenError) {
        next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token'));
      } else {
        next(error);
      }
    }
  };
};

export { auth };
