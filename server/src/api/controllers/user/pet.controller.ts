import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';

export const petController = {
  async updatePetProfile(req: Request, res: Response) {
    const { petId } = req.params;
    const updateData = req.body;

    try {
      const pet = await prisma.pIQ_Pets.update({
        where: { pet_id: Number(petId) },
        data: updateData,
      });

      res.status(httpStatus.OK).json(pet);
    } catch (error) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Pet not found');
    }
  },
};
