import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { userAuthService } from '../../services/user/auth.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

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
    const tokens = await userAuthService.refreshAuth(req.body.refreshToken);
    res.send({ ...tokens });
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
        message: 'Invalid or expired OTP. Please request a new one.'
      });
    }
    
    return res.status(httpStatus.OK).json({ 
      success: true,
      message: 'OTP verified successfully' 
    });
  }),
};
