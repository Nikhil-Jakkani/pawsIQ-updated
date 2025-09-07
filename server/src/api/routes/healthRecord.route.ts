import express from 'express';
import { healthRecordController } from '../controllers/healthRecord.controller.js';
import { userAuth } from '../middlewares/user.auth.js';

const router = express.Router();

router.post(
  '/pets/:petId/health-records/upload-url',
  userAuth,
  healthRecordController.getSignedUploadUrl
);

router.post(
  '/pets/:petId/health-records',
  userAuth,
  healthRecordController.createHealthRecord
);

router.get(
  '/pets/:petId/health-records',
  userAuth,
  healthRecordController.getPetHealthRecords
);

router.get(
  '/health-records/:recordId',
  userAuth,
  healthRecordController.getHealthRecord
);

router.delete(
  '/health-records/:recordId',
  userAuth,
  healthRecordController.deleteHealthRecord
);

export default router;
