import { Router } from 'express';
import { auth } from '../../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { userController } from '../../controllers/admin/user.controller.js';
import { userValidation } from '../../validations/admin/user.validation.js';

const router = Router();

router
  .route('/')
  .post(auth('admin'), validate(userValidation.createUser), userController.createUser)
  .get(auth('admin'), validate(userValidation.getUsers), userController.getUsers);

router
  .route('/:userId')
  .get(auth('admin'), validate(userValidation.getUser), userController.getUser)
  .patch(auth('admin'), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth('admin'), validate(userValidation.deleteUser), userController.deleteUser);

export default router;
