import express from 'express';
import { auth } from '../../../middlewares/auth.js';
import { bizEntityController } from '../../controllers/service/bizEntity.controller.js';

const router = express.Router();

// List business entities for a service; any authenticated user can view
router.get('/services/:services_id/biz-entities', auth('user'), bizEntityController.listByService);

// Create a business entity entry for a service; admin or provider
router.post('/services/:services_id/biz-entities', auth('provider', 'admin'), bizEntityController.create);

// Single business entity CRUD
router.get('/biz-entities/:biz_dtls_id', auth('user'), bizEntityController.getById);
router.put('/biz-entities/:biz_dtls_id', auth('provider', 'admin'), bizEntityController.update);
router.delete('/biz-entities/:biz_dtls_id', auth('provider', 'admin'), bizEntityController.remove);

export default router;
