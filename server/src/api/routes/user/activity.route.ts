import express from 'express';
import { userAuth as auth } from '../../middlewares/user.auth.js';
import activityController from '../../controllers/user/activity.controller.js';

const router = express.Router();

// POST /api/v1/user/activities/food
router.post('/food', auth, activityController.logFood);

export default router;