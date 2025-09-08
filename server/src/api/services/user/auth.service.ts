import moment from 'moment';
import { db } from '../../../config/db.js';
import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { tokenService } from './token.service.js';
import { userService } from './user.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { tokenTypes } from '../../../config/tokens.js';
import { sendEmail, sendOTPEmail } from '../../../services/email.service.js';
import { otpService } from '../../../services/otp.service.js';

const loginUserWithEmailAndPassword = async (email: string, password: string) => {
  // Find user by email
  const { data: users, error } = await db
    .from('PIQ_User')
    .select('*')
    .eq('user_email_id', email.toLowerCase())
    .single();

  if (error || !users) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  // Check password
  const isPasswordMatch = await bcrypt.compare(password, users.user_password);
  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  // Update last login time
  await db
    .from('PIQ_User')
    .update({ last_login_dtm: new Date() })
    .eq('user_id', users.user_id);

  // Generate tokens
  const tokens = await tokenService.generateAuthTokens(users.user_id, 'user');
  
  return { user: users, tokens };
};

const registerUser = async (userData: any) => {
  // Check if email is already taken
  const { data: existingUser } = await db
    .from('PIQ_User')
    .select('user_id')
    .eq('user_email_id', userData.user_email_id.toLowerCase())
    .single();

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.user_password, 10);
  
  // Create user
  const { data: newUser, error } = await db
    .from('PIQ_User')
    .insert([
      {
        user_full_name: userData.user_full_name,
        user_email_id: userData.user_email_id.toLowerCase(),
        user_password: hashedPassword,
        user_phone_number: userData.user_phone_number,
        user_status: 'active',
        created_at: new Date(),
        last_updated_dtm: new Date(),
      },
    ])
    .select()
    .single();

  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating user');
  }

  // Generate tokens
  const tokens = await tokenService.generateAuthTokens(newUser.user_id, 'user');
  
  return { user: newUser, tokens };
};

const getCurrentUser = async (userId: number) => {
  const { data: user, error } = await db
    .from('PIQ_User')
    .select('user_id, user_full_name, user_email_id, user_phone_number, created_at')
    .eq('user_id', userId)
    .single();

  if (error || !user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

const refreshAuth = async (refreshToken: string) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user_id);
    if (!user) {
      throw new Error();
    }
    await db.from('tokens').delete().eq('token', refreshToken);
    return tokenService.generateAuthTokens(user.user_id, user.role || 'user');
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

const logout = async (refreshToken: string) => {
  await db.from('tokens').delete().eq('token', refreshToken);
};

const generateResetPasswordOTP = async (email: string) => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    return { success: true };
  }
  
  try {
    const otp = otpService.generateOTP();
    await otpService.storeOTP(email, otp);
    
    try {
      await sendOTPEmail(email, otp);
      return { success: true };
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to send OTP. Please try again.'
      );
    }
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to generate OTP'
    );
  }
};

interface ResetPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const resetPasswordWithOTP = async (email: string, otp: string, newPassword: string): Promise<ResetPasswordResponse> => {
  const isOtpValid = await otpService.verifyOTP(email, otp);
  
  if (!isOtpValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP');
  }
  
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await db
      .from('PIQ_User')
      .update({ user_password: hashedPassword })
      .eq('user_id', user.user_id);

    if (updateError) {
      throw updateError;
    }
    
    await db.from('tokens').delete().eq('user_id', user.user_id);
    
    return { 
      success: true,
      message: 'Password reset successful' 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR, 
      `Failed to reset password: ${errorMessage}`
    );
  }
};

const sendMobileOTP = async (phone: string): Promise<{ success: boolean }> => {
  // Generate OTP and store using phone as identifier
  const otp = otpService.generateOTP();
  await otpService.storeOTP(phone, otp);
  console.log(`Generated OTP for ${phone}: ${otp}`);
  return { success: true };
};

const verifyMobileOTP = async (phone: string, otp: string): Promise<boolean> => {
  return await otpService.checkOTP(phone, otp);
};

// Define the auth service interface
export interface IUserAuthService {
  loginUserWithEmailAndPassword(email: string, password: string): Promise<{ user: any; tokens: any }>;
  registerUser(userData: any): Promise<any>;
  getCurrentUser(userId: number): Promise<any>;
  refreshAuth(refreshToken: string): Promise<any>;
  logout(refreshToken: string): Promise<void>;
  generateResetPasswordOTP(email: string): Promise<{ success: boolean }>;
  resetPasswordWithOTP(email: string, otp: string, newPassword: string): Promise<{ success: boolean }>;
  verifyOTP(email: string, otp: string): Promise<boolean>;
  sendMobileOTP(phone: string): Promise<{ success: boolean }>;
  verifyMobileOTP(phone: string, otp: string): Promise<boolean>;
}

// Non-consuming verification used by /verify-otp endpoint
const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
  return await otpService.checkOTP(email, otp);
};

export const userAuthService: IUserAuthService = {
  loginUserWithEmailAndPassword,
  registerUser,
  getCurrentUser,
  refreshAuth,
  logout,
  generateResetPasswordOTP,
  resetPasswordWithOTP,
  verifyOTP,
  sendMobileOTP,
  verifyMobileOTP,
};
