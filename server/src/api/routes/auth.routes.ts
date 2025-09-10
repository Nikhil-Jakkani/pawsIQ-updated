import { Router } from 'express';
import { googleLogin, facebookLogin, refreshToken, login, sendOTP, verifyOTP } from '../controllers/auth.controller.js';

const router = Router();

// Google OAuth login
router.post('/auth/google/login', googleLogin);

// Facebook OAuth login
router.post('/auth/facebook/login', facebookLogin);

// Unified credentials login (tries admin then user)
router.post('/auth/login', login);

// Refresh access token
router.post('/auth/refresh-token', refreshToken);

// Send OTP to phone number
router.post('/auth/send-otp', sendOTP);

// Verify OTP and authenticate
router.post('/auth/verify-otp', verifyOTP);

export default router;
