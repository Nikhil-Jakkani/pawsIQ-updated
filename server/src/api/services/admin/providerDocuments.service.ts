import prisma from '../../../lib/prisma.js';
import { db } from '../../../config/db.js';
import { randomUUID } from 'crypto';

const BUCKET_NAME = 'provider-documents';
const URL_EXPIRY = 6 * 24 * 60 * 60; // 6 days in seconds

/**
 * Generate upload URL for provider document
 */
const generateUploadUrl = async (providerId: number, documentType: string, fileName: string) => {
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uid = randomUUID();
  const path = `provider-${providerId}/${documentType}/${uid}-${cleanFileName}`;
  
  const { data, error } = await db.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(path);
  
  if (error || !data) {
    throw new Error(error?.message || 'Failed to create signed upload URL');
  }
  
  return {
    uploadUrl: data.signedUrl,
    path,
    token: data.token,
  };
};

/**
 * Save document metadata to database
 */
const saveDocumentMetadata = async (
  providerId: number,
  documentType: string,
  fileName: string,
  storagePath: string,
  uploadedBy: string
) => {
  try {
    const document = await (prisma as any).pIQ_Provider_Documents.create({
      data: {
        service_provider_id: providerId,
        document_type: documentType,
        document_url: storagePath, // Using document_url field from schema
        status: 'pending',
      }
    });
    
    return document;
  } catch (error) {
    console.error('Error saving document metadata:', error);
    throw error;
  }
};

/**
 * Get all documents for a provider
 */
const getProviderDocuments = async (providerId: number) => {
  try {
    const documents = await (prisma as any).pIQ_Provider_Documents.findMany({
      where: {
        service_provider_id: providerId
      },
      orderBy: {
        uploaded_at: 'desc'
      }
    });
    
    // Generate signed URLs for each document
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc: any) => {
        const { data, error } = await db.storage
          .from(BUCKET_NAME)
          .createSignedUrl(doc.document_url, URL_EXPIRY);
        
        return {
          ...doc,
          viewUrl: error ? null : data?.signedUrl,
        };
      })
    );
    
    return documentsWithUrls;
  } catch (error) {
    console.error('Error fetching provider documents:', error);
    return [];
  }
};

/**
 * Update document verification status
 */
const updateDocumentStatus = async (documentId: number, status: string, verifiedBy: string, notes?: string) => {
  try {
    const result = await (prisma as any).pIQ_Provider_Documents.update({
      where: {
        document_id: documentId
      },
      data: {
        status: status,
        verified_at: new Date(),
        remarks: notes || ''
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error updating document status:', error);
    throw error;
  }
};

/**
 * Delete document
 */
const deleteDocument = async (documentId: number) => {
  try {
    // Get document details first
    const document = await (prisma as any).pIQ_Provider_Documents.findUnique({
      where: {
        document_id: documentId
      }
    });
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Delete from Supabase storage
    const { error } = await db.storage
      .from(BUCKET_NAME)
      .remove([document.document_url]);
    
    if (error) {
      console.error('Error deleting from storage:', error);
      // Continue with database deletion even if storage deletion fails
    }
    
    // Delete from database
    await (prisma as any).pIQ_Provider_Documents.delete({
      where: {
        document_id: documentId
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

export const providerDocumentsService = {
  generateUploadUrl,
  saveDocumentMetadata,
  getProviderDocuments,
  updateDocumentStatus,
  deleteDocument,
};
