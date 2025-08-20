import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../utils/catchAsync.js';
import { healthRecordService } from '../services/healthRecord.service.js';
import { ApiError } from '../utils/ApiError.js';
import { db } from '../../config/db.js';

interface AuthenticatedRequest extends Request {
  user?: {
    user_id: number;
    email: string;
  };
}

interface HealthRecordBody {
  recordType: string;
  title: string;
  description?: string;
  recordDate: string;
  nextDueDate?: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export const createHealthRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { petId } = req.params;
  const { 
    recordType, 
    title, 
    description, 
    recordDate, 
    nextDueDate,
    filePath,
    fileName,
    fileType,
    fileSize
  } = req.body as HealthRecordBody;
  
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const healthRecord = await healthRecordService.createHealthRecord(
    parseInt(petId, 10),
    { 
      recordType, 
      title, 
      description, 
      recordDate, 
      nextDueDate 
    },
    {
      path: filePath,
      originalName: fileName,
      mimeType: fileType,
      size: Number(fileSize),
    }
  );

  res.status(httpStatus.CREATED).send(healthRecord);
});

export const getSignedUploadUrl = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { petId } = req.params;
  const { fileName, fileType } = req.body;
  
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  // Generate a unique file path
  const fileExt = fileName.split('.').pop();
  const filePath = `${req.user.user_id}/${petId}/${Date.now()}.${fileExt}`;
  
  // Get signed upload URL from Supabase
  const { data, error } = await db.storage
    .from('health-records')
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    console.error('Error creating signed URL:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create upload URL');
  }

  res.status(httpStatus.OK).send({
    signedUrl: data.signedUrl,
    path: filePath,
    token: data.token,
    publicUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/health-records/${filePath}`
  });
});

export const getPetHealthRecords = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { petId } = req.params;
  
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }
  
  const records = await healthRecordService.getPetHealthRecords(
    parseInt(petId, 10), 
    req.user.user_id
  );
  
  res.status(httpStatus.OK).send(records);
});

export const getHealthRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { recordId } = req.params;
  
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const record = await healthRecordService.getHealthRecordById(
    parseInt(recordId, 10),
    req.user.user_id
  );

  res.status(httpStatus.OK).send(record);
});

export const deleteHealthRecord = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { recordId } = req.params;
  
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }
  
  await healthRecordService.deleteHealthRecord(
    parseInt(recordId, 10), 
    req.user.user_id
  );
  
  res.status(httpStatus.NO_CONTENT).send();
});

export const healthRecordController = {
  createHealthRecord,
  getPetHealthRecords,
  deleteHealthRecord,
  getSignedUploadUrl,
  getHealthRecord,
};
