import bcryptjs from 'bcryptjs';
import { db } from '../../../config/db.js';
import prisma from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import httpStatus from 'http-status';
import { serializeBigInt } from '../../utils/bigIntSerializer.js';
import { transformPets } from '../../utils/petTransformer.js';

export const userService = {
  /**
   * Get user by ID
   */
  getUserById: async (userId: number) => {
    const { data: user, error } = await db
      .from('PIQ_User')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Fetch user's pets (consistent with dashboard filter)
    const { data: pets, error: petsError } = await db
      .from('PIQ_Pets')
      .select('*')
      .eq('user_id', user.user_id)
      // Exclude all variations of deleted/inactive statuses
      .not('pet_status', 'in', '(deleted,Deleted,inactive,Inactive)')
      .order('created_at', { ascending: true });

    if (petsError) {
      // Log the error but don't fail the request
      console.error('Error fetching pets:', petsError);
    }

    // Transform pets data using shared utility
    const transformedPets = transformPets(pets || []);

    // Bookings summary from Prisma (by user_id)
    const userIdBig = BigInt(user.user_id);
    const now = new Date();
    const [totalBookings, upcomingBookings, recentBookings] = await Promise.all([
      prisma.pIQ_Bookings.count({ where: { user_id: userIdBig } }),
      prisma.pIQ_Bookings.findMany({
        where: { user_id: userIdBig, booked_dtm: { gte: now } },
        orderBy: { booked_dtm: 'asc' },
        take: 10,
      }),
      prisma.pIQ_Bookings.findMany({
        where: { user_id: userIdBig },
        orderBy: { booked_dtm: 'desc' },
        take: 10,
      }),
    ]);

    // Remove sensitive data
    const { user_password, ...userWithoutPassword } = user;

    // Attach transformed pets and bookings to the user object
    (userWithoutPassword as any).pets = transformedPets;
    (userWithoutPassword as any).bookings = {
      total: totalBookings,
      upcoming: serializeBigInt(upcomingBookings),
      recent: serializeBigInt(recentBookings),
    };

    return userWithoutPassword;
  },

  /**
   * Get user by email
   */
  getUserByEmail: async (email: string) => {
    const { data: user, error } = await db
      .from('PIQ_User')
      .select('*')
      .eq('user_email_id', email.toLowerCase())
      .single();

    if (error) return null;
    return user;
  },

  /**
   * Update user by ID
   */
  updateUserById: async (userId: number, updateBody: any) => {
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Check if email is already taken
    if (updateBody.user_email_id && (await userService.getUserByEmail(updateBody.user_email_id))) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }

    // Hash password if it's being updated
    if (updateBody.user_password) {
      updateBody.user_password = await bcryptjs.hash(updateBody.user_password, 10);
    }

    // Prepare update payload
    const updatePayload: any = {
      ...updateBody,
      last_updated_dtm: new Date(),
    };

    // Allow user_location updates
    if (updateBody.user_location !== undefined) {
      updatePayload.user_location = updateBody.user_location;
    }

    // Update user
    const { data: updatedUser, error } = await db
      .from('PIQ_User')
      .update(updatePayload)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error updating user');
    }

    // Remove sensitive data
    const { user_password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  },

  /**
   * Delete user by ID
   */
  deleteUserById: async (userId: number) => {
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Soft delete by updating status
    const { error } = await db
      .from('PIQ_User')
      .update({ user_status: 'deleted', last_updated_dtm: new Date() })
      .eq('user_id', userId);

    if (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error deleting user');
    }
  },

  /**
   * Query users with pagination
   */
  queryUsers: async (filter: any, options: any) => {
    const { page = 1, limit = 10, sortBy, sortType = 'asc' } = options;
    const offset = (page - 1) * limit;
    
    let query = db
      .from('PIQ_User')
      .select('user_id, user_full_name, user_email_id, user_phone_number, created_at, last_updated_dtm, user_status')
      .neq('user_status', 'deleted');

    // Apply filters
    if (filter.user_full_name) {
      query = query.ilike('user_full_name', `%${filter.user_full_name}%`);
    }
    if (filter.user_email_id) {
      query = query.ilike('user_email_id', `%${filter.user_email_id}%`);
    }
    if (filter.user_status) {
      query = query.eq('user_status', filter.user_status);
    }

    // Apply sorting
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortType === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching users');
    }

    return {
      results: users,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      totalResults: count || 0,
    };
  },
};
