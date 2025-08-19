import express from 'express';
import { auth } from '../../../middlewares/auth.js';
import { reminderController } from '../../controllers/reminder/reminder.controller.js';

const router = express.Router();

router
  .route('/')
  .get(auth('user'), reminderController.listMine)
  .post(auth('user'), reminderController.createMine);

router
  .route('/:id')
  .patch(auth('user'), reminderController.updateMine)
  .delete(auth('user'), reminderController.deleteMine);

export default router;
