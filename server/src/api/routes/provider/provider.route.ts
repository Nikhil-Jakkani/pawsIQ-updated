import { Router } from 'express';
import { auth } from '../../../middlewares/auth.js';
import { validate } from '../../../middlewares/validate.js';
import { providerController, providerReviewController, providerServiceOfferingController, providerSettingsController, providerDashboardController } from '../../controllers/provider/index.js';
import { providerProfileValidation, providerReviewValidation, providerServiceOfferingValidation, providerSettingsValidation } from '../../validations/provider/index.js';

const router = Router();

// Dashboard routes
router.get('/dashboard/metrics', auth('provider'), providerDashboardController.getDashboardMetrics);
router.get('/dashboard/revenue', auth('provider'), providerDashboardController.getRevenueMetrics);
router.get('/dashboard/appointments', auth('provider'), providerDashboardController.getRecentAppointments);
router.get('/dashboard/clients', auth('provider'), providerDashboardController.getClients);
router.get('/dashboard/type-metrics', auth('provider'), providerDashboardController.getTypeSpecificMetrics);
router.get('/dashboard/overview', auth('provider'), providerDashboardController.getDashboardOverview);

// Profile routes
router.get('/me', auth('provider'), providerController.getMyProfile);
router.patch('/me', auth('provider'), validate(providerSettingsValidation.updateProfile), providerController.updateMyProfile);

// Settings routes
router.post('/settings/photos/upload-url', auth('provider'), validate(providerSettingsValidation.generatePhotoUpload), providerSettingsController.generatePhotoUploadUrl);
router.post('/settings/documents/upload-url', auth('provider'), validate(providerSettingsValidation.generateDocumentUpload), providerSettingsController.generateDocumentUploadUrl);
router.post('/settings/password', auth('provider'), validate(providerSettingsValidation.updatePassword), providerSettingsController.updatePassword);

// Document routes
router.get('/documents', auth('provider'), providerSettingsController.listMyDocuments);
router.post('/documents', auth('provider'), validate(providerSettingsValidation.saveDocument), providerSettingsController.saveDocument);
router.delete('/documents/:documentId', auth('provider'), validate(providerSettingsValidation.deleteDocument), providerSettingsController.deleteDocument);

// Reviews
router.get('/reviews', auth('provider'), validate(providerReviewValidation.getMyReviews), providerReviewController.getMyReviews);

// Service Offering routes
router.get('/services/available', auth('provider'), providerServiceOfferingController.listAvailableServices);
router.get('/services', auth('provider'), providerServiceOfferingController.listMyServiceOfferings);
router.get('/services/:offering_id', auth('provider'), validate(providerServiceOfferingValidation.getById), providerServiceOfferingController.getMyServiceOffering);
router.post('/services', auth('provider'), validate(providerServiceOfferingValidation.create), providerServiceOfferingController.createMyServiceOffering);
router.patch('/services/:offering_id', auth('provider'), validate(providerServiceOfferingValidation.update), providerServiceOfferingController.updateMyServiceOffering);
router.delete('/services/:offering_id', auth('provider'), validate(providerServiceOfferingValidation.deleteById), providerServiceOfferingController.deleteMyServiceOffering);

export default router;
