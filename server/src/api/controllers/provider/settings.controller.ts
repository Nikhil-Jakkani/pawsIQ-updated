import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { providerService } from '../../services/provider/index.js';

/**
 * Generate signed upload URL for provider photo
 */
const generatePhotoUploadUrl = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;
  const { fileName, variant } = req.body;

  if (!fileName) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: 'fileName is required' });
  }

  const result = await providerService.generateProviderPhotoUploadUrl(providerId, {
    fileName,
    variant: variant || 'profile',
  });

  res.status(httpStatus.OK).json(result);
});

/**
 * Generate signed upload URL for provider document
 */
const generateDocumentUploadUrl = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;
  const { fileName, documentType } = req.body;

  if (!fileName || !documentType) {
    return res.status(httpStatus.BAD_REQUEST).json({ 
      message: 'fileName and documentType are required' 
    });
  }

  const result = await providerService.generateProviderDocumentUploadUrl(providerId, {
    fileName,
    documentType,
  });

  res.status(httpStatus.OK).json(result);
});

/**
 * List all documents for authenticated provider
 */
const listMyDocuments = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;
  const documents = await providerService.listProviderDocuments(providerId);
  res.status(httpStatus.OK).json({ documents });
});

/**
 * Save document metadata after upload
 */
const saveDocument = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;
  const { documentType, storagePath } = req.body;

  if (!documentType || !storagePath) {
    return res.status(httpStatus.BAD_REQUEST).json({ 
      message: 'documentType and storagePath are required' 
    });
  }

  const document = await providerService.saveProviderDocument(providerId, {
    documentType,
    storagePath,
  });

  res.status(httpStatus.CREATED).json(document);
});

/**
 * Delete a document
 */
const deleteDocument = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;
  const documentId = parseInt(req.params.documentId);

  if (!documentId) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: 'documentId is required' });
  }

  const result = await providerService.deleteProviderDocument(providerId, documentId);
  res.status(httpStatus.OK).json(result);
});

/**
 * Update provider password
 */
const updatePassword = catchAsync(async (req: any, res: Response) => {
  const providerId = req.user.service_provider_id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(httpStatus.BAD_REQUEST).json({ 
      message: 'currentPassword and newPassword are required' 
    });
  }

  const result = await providerService.updateProviderPassword(providerId, {
    currentPassword,
    newPassword,
  });

  res.status(httpStatus.OK).json(result);
});

export const providerSettingsController = {
  generatePhotoUploadUrl,
  generateDocumentUploadUrl,
  listMyDocuments,
  saveDocument,
  deleteDocument,
  updatePassword,
};
