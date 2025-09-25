import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { userAuthService } from '../../services/user/auth.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiError } from '../../utils/ApiError.js';

export const userAuthController = {
  login: catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await userAuthService.loginUserWithEmailAndPassword(email, password);
    res.status(httpStatus.OK).send(user);
  }),

  register: catchAsync(async (req: Request, res: Response) => {
    const user = await userAuthService.registerUser(req.body);
    res.status(httpStatus.CREATED).send(user);
  }),

  me: catchAsync(async (req: any, res: Response) => {
    const user = await userAuthService.getCurrentUser(req.user.user_id);
    res.status(httpStatus.OK).send(user);
  }),

  refreshTokens: catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      console.log('[Auth Controller] Refresh token missing in request');
      throw new ApiError(httpStatus.BAD_REQUEST, 'Refresh token is required');
    }
    
    try {
      console.log('[Auth Controller] Processing token refresh request');
      const tokens = await userAuthService.refreshAuth(refreshToken);
      console.log('[Auth Controller] Token refresh successful');
      res.send({ ...tokens });
    } catch (error) {
      console.error('[Auth Controller] Token refresh failed:', error);
      throw error;
    }
  }),

  logout: catchAsync(async (req: any, res: Response) => {
    await userAuthService.logout(req.body.refreshToken);
    res.status(httpStatus.NO_CONTENT).send();
  }),

  forgotPassword: catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    await userAuthService.generateResetPasswordOTP(email);
    res.status(httpStatus.NO_CONTENT).send();
  }),

  resetPassword: catchAsync(async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;
    await userAuthService.resetPasswordWithOTP(email, otp, newPassword);
    res.status(httpStatus.NO_CONTENT).send();
  }),

  verifyEmail: catchAsync(async (req: Request, res: Response) => {
    // await userAuthService.verifyEmail(req.query.token as string);
    res.status(httpStatus.NO_CONTENT).send();
  }),

  verifyOTP: catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }
    
    const isValid = await userAuthService.verifyOTP(email, otp);
    
    if (!isValid) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Invalid OTP.'
      });
    }
    
    return res.status(httpStatus.OK).json({ 
      success: true,
      message: 'OTP verified successfully' 
    });
  }),

  // Send OTP to mobile number
  sendMobileOTP: catchAsync(async (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Phone number is required' });
    }
    await userAuthService.sendMobileOTP(phone);
    return res.status(httpStatus.NO_CONTENT).send();
  }),

  // Verify OTP for mobile number (non-consuming)
  verifyMobileOTP: catchAsync(async (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Phone and OTP are required' });
    }
    const isValid = await userAuthService.verifyMobileOTP(phone, otp);
    if (!isValid) {
      return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Invalid or expired OTP' });
    }
    return res.status(httpStatus.OK).json({ success: true, message: 'OTP verified' });
  }),
};
