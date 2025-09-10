import express from 'express';
import { userAuthController } from '../../controllers/user/auth.controller.js';
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

// Mobile OTP routes
router.post('/send-mobile-otp', userAuthController.sendMobileOTP);
router.post('/verify-mobile-otp', userAuthController.verifyMobileOTP);

// Protected routes
router.use(auth());
router.get('/me', userAuthController.me);
router.post('/logout', userAuthController.logout);

export default router;
