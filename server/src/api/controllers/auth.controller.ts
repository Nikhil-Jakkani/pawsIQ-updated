import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import moment from 'moment';
import { db } from '../../config/db.js';
import { tokenService } from '../services/user/token.service.js';
import { tokenTypes } from '../../config/tokens.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const generateTokens = async (userId: number, role: string = 'user') => {
  const tokens = await tokenService.generateAuthTokens(userId, role);
  return {
    accessToken: tokens.access.token,
    refreshToken: tokens.refresh.token,
  };
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
      const tokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
      const accessTokenExpires = moment().add(process.env.JWT_ACCESS_EXPIRATION_MINUTES || '15', 'minutes');
      const newAccessToken = tokenService.generateToken(tokenDoc.user_id, accessTokenExpires, tokenTypes.ACCESS, 'user');
      res.json({ accessToken: newAccessToken });
    } catch (e) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(403).json({ error: 'Invalid refresh token' });
  }
};
