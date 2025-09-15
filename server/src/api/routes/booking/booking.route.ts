import express from 'express';
import { auth } from '../../../middlewares/auth.js';
import { bookingController } from '../../controllers/booking/booking.controller.js';

const router = express.Router();

router
  .route('/')
  .post(auth('user'), bookingController.create)
  .get(auth('user'), bookingController.listMine);

router
  .route('/:id')
  .get(auth('user'), bookingController.getMine)
  .put(auth('user'), bookingController.updateMine)
  .delete(auth('user'), bookingController.removeMine);

export default router;
