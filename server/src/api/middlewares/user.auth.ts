import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../../lib/prisma.js';
import config from '../../config/config.js';

interface JwtPayload {
  sub: string;
}

export const userAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    const user = await prisma.pIQ_User.findUnique({ where: { user_id: BigInt(parseInt(decoded.sub, 10)) } });
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    (req as any).user = user;
    next();
  } catch (error) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
};
