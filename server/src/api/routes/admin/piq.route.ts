import { Router } from 'express';
import { auth } from '../../../middlewares/auth.js';
import adminPIQ from '../../controllers/admin/piq.controller.js';
import { statsController } from '../../controllers/admin/stats.controller.js';
import { providerController } from '../../controllers/admin/provider.controller.js';
import { providerDocumentsController } from '../../controllers/admin/providerDocuments.controller.js';

const router = Router();

// Simple session validation for admin
router.get('/auth/me', auth('admin'), adminPIQ.getAdminMe);

// Dashboard stats
router.get('/stats', auth('admin'), statsController.getDashboardStats);
router.get('/stats/providers-by-type', auth('admin'), statsController.getProviderCountsByType);
router.post('/stats/bulk-user-stats', auth('admin'), statsController.getBulkUserStats);
router.get('/stats/revenue/summary', auth('admin'), statsController.getRevenueSummary);
router.get('/stats/revenue/series', auth('admin'), statsController.getRevenueSeries);
router.get('/stats/bookings/breakdown', auth('admin'), statsController.getBookingBreakdown);
router.get('/stats/engagement/overview', auth('admin'), statsController.getEngagementOverview);

// Roles
router.get('/roles', auth('admin'), adminPIQ.getRoles);

// Core PIQ resources
router.get('/piq/users', auth('admin'), adminPIQ.getUsers);
router.get('/piq/pets', auth('admin'), adminPIQ.getPets);
router.get('/piq/providers', auth('admin'), adminPIQ.getProviders);

// Appointments
router.get('/appointments', auth('admin'), adminPIQ.getAppointments);

// Provider management (nested under /piq)
const providerRouter = Router();
providerRouter.get('/', providerController.getAllProviders);
providerRouter.get('/stats', providerController.getProviderStats);
providerRouter.get('/:id', providerController.getProviderById);
providerRouter.patch('/:id/status', providerController.updateProviderStatus);

router.use('/piq/providers', auth('admin'), providerRouter);

// Provider documents
router.post('/providers/documents/upload-url', auth('admin'), providerDocumentsController.generateUploadUrl);
router.post('/providers/documents', auth('admin'), providerDocumentsController.saveDocumentMetadata);
router.get('/providers/:providerId/documents', auth('admin'), providerDocumentsController.getProviderDocuments);
router.patch('/providers/documents/:documentId/status', auth('admin'), providerDocumentsController.updateDocumentStatus);
router.delete('/providers/documents/:documentId', auth('admin'), providerDocumentsController.deleteDocument);

export default router;
