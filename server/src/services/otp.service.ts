import { db } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

const OTP_EXPIRY_MINUTES = 10;

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const storeOTP = async (email: string, otp: string): Promise<void> => {
  const expiresAt = moment.utc().add(OTP_EXPIRY_MINUTES, 'minutes').toISOString();
  
  const { data: user } = await db
    .from('PIQ_User')
    .select('user_id')
    .eq('user_email_id', email.toLowerCase())
    .single();
    
  if (!user) {
    return;
  }
  
  await db
    .from('password_reset_otps')
    .update({ is_used: true })
    .eq('email', email.toLowerCase())
    .eq('is_used', false);
  
  const otpId = uuidv4();
  
  await db
    .from('password_reset_otps')
    .insert({
      id: otpId,
      user_id: user.user_id,
      email: email.toLowerCase(),
      otp,
      expires_at: expiresAt,
      is_used: false,
    });
};

const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
  const currentTime = moment.utc().toISOString();
  
  // Get the most recent valid OTP for this email
  const { data: otpRecord, error } = await db
    .from('password_reset_otps')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('otp', otp)
    .eq('is_used', false)
    .gt('expires_at', currentTime)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !otpRecord) {
    return false;
  }

  // Mark this OTP as used (consume it)
  await db
    .from('password_reset_otps')
    .update({ 
      is_used: true,
      used_at: moment.utc().toISOString()
    })
    .eq('id', otpRecord.id);

  return true;
};

// Check OTP without consuming it (used for pre-verification)
const checkOTP = async (email: string, otp: string): Promise<boolean> => {
  const currentTime = moment.utc().toISOString();

  const { data: otpRecord, error } = await db
    .from('password_reset_otps')
    .select('id')
    .eq('email', email.toLowerCase())
    .eq('otp', otp)
    .eq('is_used', false)
    .gt('expires_at', currentTime)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return !error && !!otpRecord;
};

export const otpService = {
  generateOTP,
  storeOTP,
  verifyOTP,
  checkOTP,
};
