import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { userService } from '../../services/user/user.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { supabase } from '../../../config/supabase.js';

export const userController = {
  getProfile: catchAsync(async (req: any, res: Response) => {
    const user = await userService.getUserById(req.user.user_id);
    res.send(user);
  }),

  updateProfile: catchAsync(async (req: any, res: Response) => {
    const user = await userService.updateUserById(req.user.user_id, req.body);
    res.send(user);
  }),

  getUsers: catchAsync(async (req: any, res: Response) => {
    const filter = req.query;
    const options = {
      page: parseInt(req.query.page as string, 10) || 1,
      limit: parseInt(req.query.limit as string, 10) || 10,
      sortBy: req.query.sortBy as string,
      sortType: req.query.sortType as 'asc' | 'desc',
    };
    
    const result = await userService.queryUsers(filter, options);
    res.send(result);
  }),

  getUser: catchAsync(async (req: Request, res: Response) => {
    const user = await userService.getUserById(parseInt(req.params.userId, 10));
    res.send(user);
  }),

  createUser: catchAsync(async (req: Request, res: Response) => {
    res.status(httpStatus.CREATED).send();
  }),

  updateUser: catchAsync(async (req: Request, res: Response) => {
    const user = await userService.updateUserById(parseInt(req.params.userId, 10), req.body);
    res.send(user);
  }),

  deleteUser: catchAsync(async (req: Request, res: Response) => {
    await userService.deleteUserById(parseInt(req.params.userId, 10));
    res.status(httpStatus.NO_CONTENT).send();
  }),

  // Upload user profile photo - generates signed upload URL
  uploadProfilePhoto: catchAsync(async (req: any, res: Response) => {
    const userId = req.user.user_id;
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'fileName and fileType are required');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(fileType.toLowerCase())) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid file type. Only images are allowed.');
    }

    // Create bucket if it doesn't exist
    const bucketName = 'user-photos';
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b: any) => b.name === bucketName);

    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
      });
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/profile/${timestamp}_${sanitizedFileName}`;

    // Generate signed upload URL (valid for 5 minutes)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(filePath);

    if (signedUrlError || !signedUrlData) {
      console.error('Signed URL error:', signedUrlError);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate upload URL');
    }

    res.send({
      uploadUrl: signedUrlData.signedUrl,
      token: signedUrlData.token,
      path: signedUrlData.path,
      filePath,
    });
  }),

  // Confirm profile photo upload and update user record
  confirmProfilePhoto: catchAsync(async (req: any, res: Response) => {
    const userId = req.user.user_id;
    const { filePath } = req.body;

    if (!filePath) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'filePath is required');
    }

    // Generate signed URL for viewing (valid for 6 days)
    const bucketName = 'user-photos';
    const { data: signedUrl, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 518400); // 6 days in seconds

    if (error || !signedUrl) {
      console.error('Error generating signed URL:', error);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get image URL');
    }

    // Update user's profile picture URL
    const updatedUser = await userService.updateUserById(userId, {
      profile_picture_url: signedUrl.signedUrl,
    });

    res.send({
      message: 'Profile photo uploaded successfully',
      profilePhotoUrl: signedUrl.signedUrl,
      user: updatedUser,
    });
  }),

  // Refresh user profile photo signed URL
  refreshProfilePhoto: catchAsync(async (req: any, res: Response) => {
    const userId = req.user.user_id;
    const user = await userService.getUserById(userId);

    if (!user.profile_picture_url) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No profile photo found');
    }

    // Extract file path from existing URL
    const urlObj = new URL(user.profile_picture_url);
    const pathMatch = urlObj.pathname.match(/\/user-photos\/(.+)/);
    
    if (!pathMatch) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid profile photo URL format');
    }

    const filePath = pathMatch[1];

    // Generate new signed URL (6 days)
    const bucketName = 'user-photos';
    const { data: signedUrl, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 518400);

    if (error || !signedUrl) {
      console.error('Error refreshing signed URL:', error);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to refresh image URL');
    }

    // Update user record with new signed URL
    const updatedUser = await userService.updateUserById(userId, {
      profile_picture_url: signedUrl.signedUrl,
    });

    res.send({
      profilePhotoUrl: signedUrl.signedUrl,
      user: updatedUser,
    });
  }),

  // Change password
  changePassword: catchAsync(async (req: any, res: Response) => {
    const userId = req.user.user_id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Current and new passwords are required');
    }

    if (newPassword.length < 8) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'New password must be at least 8 characters');
    }

    await userService.changePassword(userId, currentPassword, newPassword);

    res.send({ message: 'Password changed successfully' });
  }),
};
