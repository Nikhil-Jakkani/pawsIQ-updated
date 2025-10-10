import { Router } from 'express';
import { authController } from '../../controllers/admin/auth.controller.js';
import { validate } from '../../middlewares/validate.js';
import { loginSchema } from '../../validations/admin/auth.validation.js';
import { auth } from '../../middlewares/auth.js';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', auth('admin'), authController.getMe);

export default router;
