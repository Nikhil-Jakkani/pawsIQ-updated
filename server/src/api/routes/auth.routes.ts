import { Router } from 'express';
import { googleLogin, facebookLogin, refreshToken, login } from '../controllers/auth.controller.js';

const router = Router();

// Google OAuth login
router.post('/auth/google/login', googleLogin);

// Facebook OAuth login
router.post('/auth/facebook/login', facebookLogin);

// Unified credentials login (tries admin then user)
router.post('/auth/login', login);

// Refresh access token
router.post('/auth/refresh-token', refreshToken);

export default router;
