import express from 'express';
import { userAuthController } from '../../controllers/user/auth.controller.js';
import { verifyFirebasePhone } from '../../controllers/auth.controller.js';
import { auth } from '../../../middlewares/auth.js';

const router = express.Router();

// Public routes
router.post('/register', userAuthController.register);
router.post('/login', userAuthController.login);
router.post('/refresh-tokens', userAuthController.refreshTokens);
router.post('/forgot-password', userAuthController.forgotPassword);
router.post('/reset-password', userAuthController.resetPassword);
router.post('/verify-email', userAuthController.verifyEmail);
router.post('/verify-otp', userAuthController.verifyOTP);

// Firebase Phone verification route for users
router.post('/phone/verify', verifyFirebasePhone);

// Protected routes (user-only)
router.get('/me', auth('user'), userAuthController.me);
router.post('/logout', auth('user'), userAuthController.logout);

export default router;
