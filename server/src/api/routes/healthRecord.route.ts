import express from 'express';
import { healthRecordController } from '../controllers/healthRecord.controller.js';
import { userAuth } from '../middlewares/user.auth.js';

const router = express.Router();

// Routes
// Get signed URL for file upload
router.post(
  '/pets/:petId/health-records/upload-url',
  userAuth,
  healthRecordController.getSignedUploadUrl
);

// Create health record with file details
router.post(
  '/pets/:petId/health-records',
  userAuth,
  healthRecordController.createHealthRecord
);

// Get all health records for a pet
router.get(
  '/pets/:petId/health-records',
  userAuth,
  healthRecordController.getPetHealthRecords
);

// Get a single health record by ID
router.get(
  '/health-records/:recordId',
  userAuth,
  healthRecordController.getHealthRecord
);

// Delete a health record
router.delete(
  '/health-records/:recordId',
  userAuth,
  healthRecordController.deleteHealthRecord
);

export default router;
