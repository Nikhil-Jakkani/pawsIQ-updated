import { supabase } from '@config/supabase.js';
import bcrypt from 'bcryptjs';
import { ApiError } from '../../utils/ApiError.js';
import httpStatus from 'http-status';
import { tokenService } from '../user/token.service.js';

const login = async (email: string, password: string): Promise<any> => {
  const { data, error: supabaseError } = await supabase
    .from('PIQ_Admins')
    .select('*')
    .eq('email', email)
    .single();

  if (supabaseError || !data) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  const admin = data;
  const isPasswordMatch = await bcrypt.compare(password, admin.password);

  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  // Generate tokens compatible with the main auth middleware (ACCESS token with role 'admin')
  const adminSub = Number((admin as any).admin_id);
  const tokens = await tokenService.generateAuthTokens(adminSub, 'admin');

  // Return user and tokens, consistent with user login shape
  const { password: _, ...userWithoutPassword } = admin;
  return { user: { ...userWithoutPassword, role: 'admin' }, tokens };
};

export const authService = {
  login,
};
