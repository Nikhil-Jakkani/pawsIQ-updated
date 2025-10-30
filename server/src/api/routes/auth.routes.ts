import { Router } from 'express';
import { googleLogin, facebookLogin, refreshToken, login, verifyFirebasePhone, whoAmI } from '../controllers/auth.controller.js';

const router = Router();

// Google OAuth login
router.post('/auth/google/login', googleLogin);

// Facebook OAuth login
router.post('/auth/facebook/login', facebookLogin);

// User-only credentials login (providers use /provider/auth/login, admins use /admin/auth/login)
router.post('/auth/login', login);

// Refresh access token
router.post('/auth/refresh-token', refreshToken);

// Verify phone via Firebase ID token
router.post('/auth/phone/verify', verifyFirebasePhone);

// Identify current subject and role from token
router.get('/auth/whoami', whoAmI);

export default router;
