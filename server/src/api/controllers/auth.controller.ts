import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import moment from 'moment';
import prisma from '../../lib/prisma.js';
import { tokenService } from '../services/user/token.service.js';
import { tokenTypes } from '../../config/tokens.js';
import { authService as adminAuthService } from '../services/admin/auth.service.js';
import { userAuthService } from '../services/user/auth.service.js';
import { adminAuth } from '../../config/firebaseAdmin.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
// Facebook Graph API version (configurable, defaults to latest stable we support)
const FB_GRAPH_VERSION = process.env.FACEBOOK_GRAPH_API_VERSION || 'v19.0';
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

const generateTokens = async (userId: number, role: string = 'user') => {
  const tokens = await tokenService.generateAuthTokens(userId, role);
  return {
    accessToken: tokens.access.token,
    refreshToken: tokens.refresh.token,
  };
};

// Lightweight role discovery without role guard
export const whoAmI = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Please authenticate' });

    try {
      const payload: any = jwt.verify(token, (await import('../../config/config.js')).default.jwtSecret);
      return res.json({ sub: payload.sub, role: payload.role || null, type: payload.type || null });
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to determine identity' });
  }
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
    let existingUser = await prisma.pIQ_User.findUnique({ where: { user_email_id: email } });
    if (!existingUser) {
      const randomPassword = await bcrypt.hash(`oauth-${Date.now()}-${Math.random()}`, 10);
      existingUser = await prisma.pIQ_User.create({
        data: {
          user_full_name: payload.name || 'User',
          user_email_id: email,
          user_password: randomPassword,
          user_phone_number: '',
          user_status: 'active',
        },
      });
    }

    try {
      const { accessToken, refreshToken } = await generateTokens(Number(existingUser.user_id), 'user');
      
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
    
    // Optional server-side token introspection using debug_token if App ID and Secret are configured
    if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
      try {
        const appAccessToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;
        const debugResp = await axios.get(
          `https://graph.facebook.com/${FB_GRAPH_VERSION}/debug_token`,
          { params: { input_token: accessToken, access_token: appAccessToken } }
        );
        const debugData = debugResp.data && debugResp.data.data ? debugResp.data.data : null;
        if (!debugData || !debugData.is_valid) {
          return res.status(401).json({ error: 'Facebook token is not valid' });
        }
        if (debugData.app_id && FACEBOOK_APP_ID && debugData.app_id !== FACEBOOK_APP_ID) {
          return res.status(401).json({ error: 'Facebook token issued for a different app' });
        }
        if (debugData.user_id && userID && debugData.user_id !== userID) {
          return res.status(401).json({ error: 'Facebook token does not match the provided user' });
        }
      } catch (err: any) {
        console.error('Facebook debug_token validation failed:', err?.response?.data || err);
        return res.status(401).json({ error: 'Failed Facebook token validation' });
      }
    }

    const { data } = await axios.get(
      `https://graph.facebook.com/${FB_GRAPH_VERSION}/me?fields=id,name,email,picture&access_token=${accessToken}`
    );
    
    if (data.id !== userID) {
      return res.status(400).json({ error: 'Invalid Facebook user' });
    }
    
    const userEmail = (email || `${userID}@facebook.com`).toLowerCase();
    let existingUser = await prisma.pIQ_User.findUnique({ where: { user_email_id: userEmail } });

    if (!existingUser) {
      const randomPassword = await bcrypt.hash(`oauth-${Date.now()}-${Math.random()}`, 10);
      existingUser = await prisma.pIQ_User.create({
        data: {
          user_full_name: name || 'Facebook User',
          user_email_id: userEmail,
          user_password: randomPassword,
          user_phone_number: '',
          user_status: 'active',
        },
      });
    }

    const tokens = await tokenService.generateAuthTokens(Number(existingUser.user_id), 'user');
    
    res.json({
      accessToken: tokens.access.token,
      refreshToken: tokens.refresh.token,
      user: {
        id: existingUser.user_id,
        user_id: Number(existingUser.user_id),
        email: existingUser.user_email_id,
        user_email_id: existingUser.user_email_id,
        name: existingUser.user_full_name,
        user_full_name: existingUser.user_full_name,
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
export const verifyFirebasePhone = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body as { idToken: string };
    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const phone = decoded.phone_number;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number not present in Firebase token' });
    }

    // Check if user exists with this phone number
    let existingUser = await prisma.pIQ_User.findFirst({ where: { user_phone_number: phone } });

    // If user doesn't exist, create a new one
    if (!existingUser) {
      const randomPassword = await bcrypt.hash(`otp-${Date.now()}-${Math.random()}`, 10);
      const syntheticEmail = `user-${phone.replace('+', '')}@firebase.pawsiq.com`;
      existingUser = await prisma.pIQ_User.create({
        data: {
          user_full_name: 'Phone User',
          user_email_id: syntheticEmail,
          user_password: randomPassword,
          user_phone_number: phone,
          user_status: 'active',
        },
      });
    }

    const { accessToken, refreshToken } = await generateTokens(Number(existingUser.user_id), 'user');
    return res.json({
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
    console.error('Firebase phone verify error:', error);
    return res.status(500).json({ error: 'Failed to verify Firebase phone token' });
  }
};
