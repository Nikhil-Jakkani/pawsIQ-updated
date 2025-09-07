import httpStatus from 'http-status';
import { ApiError } from '../../utils/ApiError.js';
import db from '../../../config/db.js';

// Persist a food activity with calories only
export const logFoodActivity = async (userId: number, payload: { pet_id: number; calories: number; note?: string; image_url?: string }) => {
  const { pet_id, calories, note, image_url } = payload || {} as any;
  if (!pet_id || typeof calories !== 'number') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'pet_id and numeric calories are required');
  }

  // Basic guardrails
  const kcal = Math.max(0, Math.round(calories));

  // Insert into a table. Assumes a table 'PIQ_Food_Activities' exists with columns shown below.
  // If the table doesn't exist yet, we can switch to a health record fallback or you can run a migration.
  const { data, error } = await (db as any)
    .from('PIQ_Food_Activities')
    .insert([
      {
        user_id: userId,
        pet_id,
        calories: kcal,
        note: note || null,
        image_url: image_url || null,
        created_at: new Date().toISOString(),
      },
    ])
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('logFoodActivity insert error:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to save food activity');
  }

  return data;
};

export default {
  logFoodActivity,
};