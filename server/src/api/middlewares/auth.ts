import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../../lib/prisma.js';
import config from '../../config/config.js';

interface JwtPayload {
  id?: string;
  sub?: string;
  role?: string;
}

/**
 * Auth middleware factory that checks for specific roles
 * @param requiredRoles - Single role or array of roles ('user', 'provider', 'admin')
 */
export const auth = (...requiredRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
      }

      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      const userId = decoded.id || decoded.sub;
      const userRole = decoded.role;

      if (!userId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
      }

      // Check if user has required role
      if (requiredRoles.length > 0 && userRole && !requiredRoles.includes(userRole)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
      }

      // Verify user exists based on role
      if (userRole === 'admin' || requiredRoles.includes('admin')) {
        const admin = await prisma.pIQ_Admins.findUnique({ 
          where: { admin_id: BigInt(userId) } 
        });
        if (!admin) {
          throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
        }
        (req as any).user = admin;
      } else if (userRole === 'provider' || requiredRoles.includes('provider')) {
        const provider = await prisma.pIQ_Service_Provider.findUnique({ 
          where: { service_provider_id: parseInt(userId, 10) } 
        });
        if (!provider) {
          throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
        }
        (req as any).user = provider;
      } else {
        const user = await prisma.pIQ_User.findUnique({ 
          where: { user_id: BigInt(userId) } 
        });
        if (!user) {
          throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
        }
        (req as any).user = user;
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
  };
};
