import { Router } from 'express';
import { auth } from '../../../middlewares/auth.js';
import adminPIQ from '../../controllers/admin/piq.controller.js';

const router = Router();

// Simple session validation for admin
router.get('/auth/me', auth('admin'), adminPIQ.getAdminMe);

// Dashboard stats
router.get('/stats', auth('admin'), adminPIQ.getStats);

// Roles
router.get('/roles', auth('admin'), adminPIQ.getRoles);

// Core PIQ resources
router.get('/piq/users', auth('admin'), adminPIQ.getUsers);
router.get('/piq/pets', auth('admin'), adminPIQ.getPets);
router.get('/piq/providers', auth('admin'), adminPIQ.getProviders);

export default router;
