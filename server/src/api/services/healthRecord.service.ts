import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import { ApiError } from '../utils/ApiError.js';
import { db } from '../../config/db.js';
import prisma from '../../lib/prisma.js';

interface FileData {
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
}

interface RecordData {
  recordType: string;
  title: string;
  description?: string;
  recordDate: string;
  nextDueDate?: string | null;
}

interface HealthRecord {
  health_record_id: number;
  pet_id: number;
  record_type: string;
  title: string;
  description: string | null;
  record_date: Date;
  next_due_date: Date | null;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: Date;
  last_updated_dtm: Date | null;
}

const createHealthRecord = async (petId: number, recordData: RecordData, fileData: FileData): Promise<HealthRecord> => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Verify pet exists and belongs to user
    const pet = await tx.pIQ_Pets.findUnique({
      where: { pet_id: petId },
    });

    if (!pet) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Pet not found');
    }

    // Create health record using raw query
    const result = await tx.$queryRaw<HealthRecord[]>`
      INSERT INTO "PIQ_Health_Records" (
        pet_id,
        record_type,
        title,
        description,
        record_date,
        next_due_date,
        file_path,
        file_name,
        file_type,
        file_size
      ) VALUES (
        ${petId},
        ${recordData.recordType},
        ${recordData.title},
        ${recordData.description || null},
        ${new Date(recordData.recordDate)}::date,
        ${recordData.nextDueDate ? new Date(recordData.nextDueDate) : null}::date,
        ${fileData.path},
        ${fileData.originalName},
        ${fileData.mimeType},
        ${fileData.size}
      )
      RETURNING *
    `;

    return result[0];
  });
};

const getPetHealthRecords = async (petId: number, userId: number): Promise<HealthRecord[]> => {
  // Single query that both verifies ownership and fetches records
  const records = await prisma.$queryRaw<HealthRecord[]>`
    SELECT hr.*
    FROM "PIQ_Health_Records" hr
    JOIN "PIQ_Pets" p ON p.pet_id = hr.pet_id
    WHERE hr.pet_id = ${petId} AND p.user_id = ${userId}
    ORDER BY hr.record_date DESC
  `;

  if (!records || records.length === 0) {
    // If no rows returned, either pet doesn't belong to user or has no records
    // Check ownership explicitly to return proper status code
    const own = await prisma.pIQ_Pets.findFirst({ where: { pet_id: petId, user_id: userId } });
    if (!own) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Pet not found or access denied');
    }
  }

  // Generate signed URLs for each file (6 days expiry to reduce refresh churn)
  const recordsWithUrls = await Promise.all(
    records.map(async (record: HealthRecord) => {
      if (!record.file_path) return { ...record, fileUrl: null };
      
      try {
        const { data, error } = await db.storage
          .from('health-records')
          .createSignedUrl(record.file_path, 518400); // 6 days expiry

        if (error) {
          console.error('Error generating signed URL:', error);
          return { ...record, fileUrl: null };
        }

        return { ...record, fileUrl: data?.signedUrl || null };
      } catch (error: any) {
        console.error('Error generating signed URL:', error);
        return { ...record, fileUrl: null };
      }
    })
  );

  return recordsWithUrls;
};

const getHealthRecordById = async (recordId: number, userId: number): Promise<HealthRecord> => {
  const rows = await prisma.$queryRaw<Array<HealthRecord & { user_id: bigint | number }>>`
    SELECT hr.*, p.user_id
    FROM "PIQ_Health_Records" hr
    JOIN "PIQ_Pets" p ON hr.pet_id = p.pet_id
    WHERE hr.health_record_id = ${recordId}
  `;

  if (!rows || rows.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Health record not found');
  }

  const row = rows[0];

  if (Number(row.user_id) !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to access this record');
  }

  const { user_id: _omit, ...record } = row as any;
  return record as HealthRecord;
};

const deleteHealthRecord = async (recordId: number, userId: number): Promise<{ success: boolean }> => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Get record with pet info using raw query
    const [record] = await tx.$queryRaw<Array<{
      health_record_id: bigint;
      pet_id: bigint;
      user_id: bigint;
      file_path: string;
    }>>`
      SELECT hr.health_record_id, hr.pet_id, hr.file_path, p.user_id
      FROM "PIQ_Health_Records" hr
      JOIN "PIQ_Pets" p ON hr.pet_id = p.pet_id
      WHERE hr.health_record_id = ${recordId}
    `;

    if (!record) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Health record not found');
    }

    // Verify the pet belongs to the user
    if (Number(record.user_id) !== userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to delete this record');
    }

    // Delete the file from storage if it exists
    if (record.file_path) {
      try {
        const { error } = await db.storage
          .from('health-records')
          .remove([record.file_path]);

        if (error) {
          console.error('Error deleting file from storage:', error);
          // Continue with record deletion even if file deletion fails
        }
      } catch (error: any) {
        console.error('Error deleting file from storage:', error);
        // Continue with record deletion
      }
    }

    // Delete the record from the database using raw query
    await tx.$executeRaw`
      DELETE FROM "PIQ_Health_Records"
      WHERE health_record_id = ${recordId}
    `;

    return { success: true };
  });
};

export const healthRecordService = {
  createHealthRecord,
  getPetHealthRecords,
  getHealthRecordById,
  deleteHealthRecord,
} as const;
