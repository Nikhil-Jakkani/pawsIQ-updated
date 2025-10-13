import express from 'express';
import { userController } from '../../controllers/user/user.controller.js';
import { auth } from '../../../middlewares/auth.js';
import { userAuth } from '../../middlewares/user.auth.js';
import { validate } from '../../../middlewares/validate.js';
import { userValidation } from '../../validations/user/user.validation.js';
import dashboardController from '../../controllers/user/dashboard.controller.js';

const router = express.Router();

// User profile routes
router
  .route('/profile')
  .get(userAuth, userController.getProfile)
  .patch(userAuth, validate(userValidation.updateProfile), userController.updateProfile);

// User profile photo routes
router.post('/profile/photo/upload', userAuth, userController.uploadProfilePhoto);
router.post('/profile/photo/confirm', userAuth, userController.confirmProfilePhoto);
router.get('/profile/photo/refresh', userAuth, userController.refreshProfilePhoto);

// Password change
router.post('/profile/change-password', userAuth, userController.changePassword);

// Aggregated dashboard data for the current user
router.get('/dashboard', userAuth, dashboardController.getDashboard);

// User management routes (admin only)
router.use(auth('admin'));
router
  .route('/')
  .get(validate(userValidation.getUsers), userController.getUsers)
  .post(validate(userValidation.createUser), userController.createUser);

router
  .route('/:userId')
  .get(validate(userValidation.getUser), userController.getUser)
  .patch(validate(userValidation.updateUser), userController.updateUser)
  .delete(validate(userValidation.deleteUser), userController.deleteUser);

export default router;
