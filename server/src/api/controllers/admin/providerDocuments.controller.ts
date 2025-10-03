import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { providerDocumentsService } from '../../services/admin/providerDocuments.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

/**
 * Generate upload URL for provider document
 */
const generateUploadUrl = catchAsync(async (req: Request, res: Response) => {
  const { providerId, documentType, fileName } = req.body;
  
  if (!providerId || !documentType || !fileName) {
    return res.status(httpStatus.BAD_REQUEST).json({ 
      message: 'Provider ID, document type, and file name are required' 
    });
  }
  
  const result = await providerDocumentsService.generateUploadUrl(
    parseInt(providerId),
    documentType,
    fileName
  );
  
  res.status(httpStatus.OK).json(result);
});

/**
 * Save document metadata after upload
 */
const saveDocumentMetadata = catchAsync(async (req: Request, res: Response) => {
  const { providerId, documentType, fileName, storagePath } = req.body;
  const uploadedBy = (req as any).user?.email || 'admin';
  
  if (!providerId || !documentType || !fileName || !storagePath) {
    return res.status(httpStatus.BAD_REQUEST).json({ 
      message: 'All fields are required' 
    });
  }
  
  const document = await providerDocumentsService.saveDocumentMetadata(
    parseInt(providerId),
    documentType,
    fileName,
    storagePath,
    uploadedBy
  );
  
  res.status(httpStatus.CREATED).json(document);
});

/**
 * Get all documents for a provider
 */
const getProviderDocuments = catchAsync(async (req: Request, res: Response) => {
  const providerId = parseInt(req.params.providerId);
  
  const documents = await providerDocumentsService.getProviderDocuments(providerId);
  
  res.status(httpStatus.OK).json(documents);
});

/**
 * Update document verification status
 */
const updateDocumentStatus = catchAsync(async (req: Request, res: Response) => {
  const documentId = parseInt(req.params.documentId);
  const { status, notes } = req.body;
  const verifiedBy = (req as any).user?.email || 'admin';
  
  if (!status) {
    return res.status(httpStatus.BAD_REQUEST).json({ 
      message: 'Status is required' 
    });
  }
  
  const result = await providerDocumentsService.updateDocumentStatus(
    documentId,
    status,
    verifiedBy,
    notes
  );
  
  res.status(httpStatus.OK).json(result);
});

/**
 * Delete document
 */
const deleteDocument = catchAsync(async (req: Request, res: Response) => {
  const documentId = parseInt(req.params.documentId);
  
  await providerDocumentsService.deleteDocument(documentId);
  
  res.status(httpStatus.OK).json({ message: 'Document deleted successfully' });
});

export const providerDocumentsController = {
  generateUploadUrl,
  saveDocumentMetadata,
  getProviderDocuments,
  updateDocumentStatus,
  deleteDocument,
};
