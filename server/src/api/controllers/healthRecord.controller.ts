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
  filePath?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
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

  const hasFile = Boolean(filePath && fileName);

  const recordData = {
    recordType,
    title,
    description,
    recordDate,
    nextDueDate,
  };

  const fileData = hasFile
    ? {
        path: filePath as string,
        originalName: fileName as string,
        mimeType: fileType || '',
        size: Number(fileSize || 0),
      }
    : undefined;

  const healthRecord = await healthRecordService.createHealthRecord(
    parseInt(petId, 10),
    recordData,
    fileData
  );

  res.status(httpStatus.CREATED).send(healthRecord);
});

export const getSignedUploadUrl = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { petId } = req.params;
  const { fileName, fileType } = req.body;
  
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const BUCKET_NAME = 'health-records';
  try {
    const { error: bucketCreateError } = await db.storage.createBucket(BUCKET_NAME, { public: true });
    if (bucketCreateError) {
      const msg = (bucketCreateError as any)?.message || String(bucketCreateError);
      const status = (bucketCreateError as any)?.status || (bucketCreateError as any)?.statusCode;
      if (!(typeof msg === 'string' && msg.toLowerCase().includes('already exists')) && status !== 409) {
        console.error('Error creating storage bucket:', bucketCreateError);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Storage bucket is missing');
      }
    }
  } catch (bucketError: any) {
    console.error('Error ensuring storage bucket exists:', bucketError);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to prepare storage');
  }

  const fileExt = fileName.split('.').pop();
  const filePath = `${req.user.user_id}/${petId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await db.storage
    .from(BUCKET_NAME)
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
