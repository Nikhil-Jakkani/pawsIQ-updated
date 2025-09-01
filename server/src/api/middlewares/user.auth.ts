import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { ApiError } from '../utils/ApiError.js';
import { supabase } from '../../config/supabase.js';
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

    const { data: user, error } = await supabase
      .from('PIQ_User')
      .select('*')
      .eq('user_id', parseInt(decoded.sub, 10))
      .single();

    if (error || !user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    (req as any).user = user;
    next();
  } catch (error) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
};
