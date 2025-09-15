import express from 'express';
import { auth } from '../../../middlewares/auth.js';
import { serviceMasterController } from '../../controllers/service/serviceMaster.controller.js';

const router = express.Router();

router.get('/services', auth('user'), serviceMasterController.list);
router.get('/services/:services_id', auth('user'), serviceMasterController.get);
router.get('/services/:services_id/providers', auth('user'), serviceMasterController.listProviders);

export default router;
