import express from 'express';
import { validate } from '../../../middlewares/validate.js';
import { providerAuthController } from '../../controllers/provider/auth.controller.js';
import { providerAuthValidation } from '../../validations/provider/auth.validation.js';

const router = express.Router();

router.post('/register', validate(providerAuthValidation.register), providerAuthController.register);
router.post('/login', validate(providerAuthValidation.login), providerAuthController.login);
// Social OAuth logins
router.post('/google/login', providerAuthController.googleLogin);
router.post('/facebook/login', providerAuthController.facebookLogin);
// Forgot password (placeholder implementation)
router.post('/forgot-password', providerAuthController.forgotPassword);
// OTP endpoints
router.post('/send-otp', providerAuthController.sendOTP);
router.post('/verify-otp', providerAuthController.verifyOTP);

export default router;
