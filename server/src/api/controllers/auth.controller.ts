import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import moment from 'moment';
import { db } from '../../config/db.js';
import { tokenService } from '../services/user/token.service.js';
import { tokenTypes } from '../../config/tokens.js';
import { authService as adminAuthService } from '../services/admin/auth.service.js';
import { userAuthService } from '../services/user/auth.service.js';
import { twilioService } from '../services/twilio.service.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const generateTokens = async (userId: number, role: string = 'user') => {
  const tokens = await tokenService.generateAuthTokens(userId, role);
  return {
    accessToken: tokens.access.token,
    refreshToken: tokens.refresh.token,
  };
};

// Unified credentials login: tries admin first, then user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Try admin login first
    try {
      const adminResult = await adminAuthService.login(email, password);
      return res.status(200).json(adminResult); // { user, tokens }
    } catch (e) {
      // fall through to user login
    }

    // Then try user login
    try {
      const userResult = await userAuthService.loginUserWithEmailAndPassword(email, password);
      // Ensure role is present
      return res.status(200).json({
        user: { ...userResult.user, role: 'user' },
        tokens: userResult.tokens,
      });
    } catch (e) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }
  } catch (error) {
    console.error('Credentials login error:', error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      console.error('No credential provided in request');
      return res.status(400).json({ error: 'Missing Google credential' });
    }

    if (!GOOGLE_CLIENT_ID) {
      console.error('Google Client ID is not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });
    } catch (error) {
      console.error('Google token verification failed:', error);
      return res.status(401).json({ error: 'Invalid Google token' });
    }
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      console.error('Invalid Google token payload:', payload);
      return res.status(400).json({ error: 'Invalid Google token payload' });
    }
    
    const email = payload.email.toLowerCase();
    let { data: existingUser, error: userError } = await db
      .from('PIQ_User')
      .select('*')
      .eq('user_email_id', email)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('Database error:', userError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!existingUser) {
      const randomPassword = await bcrypt.hash(`oauth-${Date.now()}-${Math.random()}`, 10);
      const insertResult = await db
        .from('PIQ_User')
        .insert([
          {
            user_full_name: payload.name || 'User',
            user_email_id: email,
            user_password: randomPassword,
            user_phone_number: '',
            user_status: 'active',
            created_at: new Date(),
            last_updated_dtm: new Date(),
          },
        ])
        .select()
        .single();

      if (insertResult.error) {
        console.error('Supabase insert error:', insertResult.error);
        return res.status(500).json({ error: 'Failed to create user' });
      }
      existingUser = insertResult.data as any;
    }

    try {
      const { accessToken, refreshToken } = await generateTokens(existingUser.user_id, 'user');
      
      res.json({
        accessToken,
        refreshToken,
        user: {
          id: existingUser.user_id,
          email: existingUser.user_email_id,
          name: existingUser.user_full_name,
          role: 'user',
          avatar: payload.picture,
        },
      });
    } catch (tokenError) {
      console.error('Token generation failed:', tokenError);
      return res.status(500).json({ error: 'Failed to generate authentication tokens' });
    }
    
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
};

export const facebookLogin = async (req: Request, res: Response) => {
  try {
    const { accessToken, userID, name, email } = req.body;
    
    if (!accessToken || !userID) {
      return res.status(400).json({ error: 'Invalid Facebook token' });
    }
    
    const { data } = await axios.get(
      `https://graph.facebook.com/v13.0/me?fields=id,name,email,picture&access_token=${accessToken}`
    );
    
    if (data.id !== userID) {
      return res.status(400).json({ error: 'Invalid Facebook user' });
    }
    
    const userEmail = (email || `${userID}@facebook.com`).toLowerCase();
    let { data: existingUser } = await db
      .from('PIQ_User')
      .select('*')
      .eq('user_email_id', userEmail)
      .single();

    if (!existingUser) {
      const randomPassword = await bcrypt.hash(`oauth-${Date.now()}-${Math.random()}`, 10);
      const insertResult = await db
        .from('PIQ_User')
        .insert([
          {
            user_full_name: name || 'Facebook User',
            user_email_id: userEmail,
            user_password: randomPassword,
            user_phone_number: '',
            user_status: 'active',
            created_at: new Date(),
            last_updated_dtm: new Date(),
          },
        ])
        .select()
        .single();

      if (insertResult.error) {
        console.error('Supabase insert error:', insertResult.error);
        return res.status(500).json({ error: 'Failed to create user' });
      }
      existingUser = insertResult.data as any;
    }

    const tokens = await tokenService.generateAuthTokens(existingUser.user_id, 'user');
    
    res.json({
      accessToken: tokens.access.token,
      refreshToken: tokens.refresh.token,
      user: {
        id: existingUser.user_id,
        email: existingUser.user_email_id,
        name: existingUser.user_full_name,
        role: 'user',
        avatar: data?.picture?.data?.url,
      },
    });
    
  } catch (error) {
    console.error('Facebook login error:', error);
    res.status(500).json({ error: 'Facebook authentication failed' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }
    
    try {
      // Use service method to preserve role and rotate tokens
      const tokens = await tokenService.refreshAuth(refreshToken);
      return res.json({ accessToken: tokens.access.token, refreshToken: tokens.refresh.token });
    } catch (e) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(403).json({ error: 'Invalid refresh token' });
  }
};

// Send OTP to phone number
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body as { phoneNumber: string };
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Format and validate phone number
    const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);
    
    if (!twilioService.validatePhoneNumber(formattedPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    // Send OTP via Twilio
    const result = await twilioService.sendOTP(formattedPhone, 'sms');
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      sid: result.sid,
      status: result.status
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      error: 'Failed to send OTP',
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Verify OTP and authenticate user
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, code } = req.body as { phoneNumber: string; code: string };
    
    if (!phoneNumber || !code) {
      return res.status(400).json({ 
        error: 'Phone number and code are required' 
      });
    }
    
    // Format phone number
    const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);
    
    // Verify OTP via Twilio
    const result = await twilioService.verifyOTP(formattedPhone, code);
    
    if (!result.valid) {
      return res.status(400).json({ 
        error: 'Invalid OTP code',
        status: result.status 
      });
    }
    
    // Check if user exists with this phone number
    let { data: existingUser, error: userError } = await db
      .from('PIQ_User')
      .select('*')
      .eq('user_phone_number', formattedPhone)
      .single();
    
    // If user doesn't exist, create a new one
    if (!existingUser) {
      const randomPassword = await bcrypt.hash(`otp-${Date.now()}-${Math.random()}`, 10);
      const insertResult = await db
        .from('PIQ_User')
        .insert([
          {
            user_full_name: 'OTP User',
            user_email_id: `user-${formattedPhone.replace('+', '')}@otp.pawsiq.com`,
            user_password: randomPassword,
            user_phone_number: formattedPhone,
            user_status: 'active',
            created_at: new Date(),
            last_updated_dtm: new Date(),
          },
        ])
        .select()
        .single();

      if (insertResult.error) {
        console.error('Supabase insert error:', insertResult.error);
        return res.status(500).json({ error: 'Failed to create user' });
      }
      existingUser = insertResult.data as any;
    }
    
    // Generate authentication tokens
    const { accessToken, refreshToken } = await generateTokens(existingUser.user_id, 'user');
    
    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: existingUser.user_id,
        email: existingUser.user_email_id,
        name: existingUser.user_full_name,
        phone: existingUser.user_phone_number,
        role: 'user',
      },
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      error: 'Failed to verify OTP',
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};
