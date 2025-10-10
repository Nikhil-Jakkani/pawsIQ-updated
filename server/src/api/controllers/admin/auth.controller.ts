import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { authService } from '../../services/admin/auth.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const response = await authService.login(email, password);
  res.status(httpStatus.OK).send(response);
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const admin = (req as any).user;
  if (!admin) {
    res.status(httpStatus.UNAUTHORIZED).send({ message: 'Not authenticated' });
    return;
  }
  // Return admin data without password
  const { password, ...adminData } = admin;
  res.status(httpStatus.OK).send({ ...adminData, role: 'admin' });
});

export const authController = {
  login,
  getMe,
};
