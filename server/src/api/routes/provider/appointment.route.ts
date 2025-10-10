import express from 'express';
import { auth } from '../../../middlewares/auth.js';
import { validate } from '../../../middlewares/validate.js';
import { providerAppointmentValidation } from '../../validations/provider/index.js';

const router = express.Router();

// Upcoming appointments for provider
router.get('/upcoming', auth('provider'), async (req: any, res, next) => {
  try {
    const id = req.user?.service_provider_id || req.user?.provider_id || req.user?.id;
    // Get upcoming appointments (first page, status not completed/cancelled)
    const data = await (await import('../../services/provider/provider.service.js')).providerService.getAppointments(Number(id), { page: 1, limit: 20 });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// Paginated appointments list
router.get('/', auth('provider'), async (req: any, res, next) => {
  try {
    const id = req.user?.service_provider_id || req.user?.provider_id || req.user?.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const data = await (await import('../../services/provider/provider.service.js')).providerService.getAppointments(Number(id), { page, limit });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// Update appointment status (currently not implemented due to missing schema relation)
router.patch('/:id/status', auth('provider'), validate(providerAppointmentValidation.updateStatus), async (req: any, res, next) => {
  try {
    const id = req.user?.service_provider_id || req.user?.provider_id || req.user?.id;
    const apptId = Number(req.params.id);
    const { status } = req.body as { status: 'Scheduled' | 'Cancelled' | 'Completed' };
    const data = await (await import('../../services/provider/provider.service.js')).providerService.updateAppointmentStatus(Number(id), apptId, status);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

export default router;
