import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../../../PawsIQ/lib/prisma';
import { ApiError } from '../../utils/ApiError.js';

export const petController = {
  async updatePetProfile(req: Request, res: Response) {
    const { petId } = req.params;
    const updateData = req.body;

    try {
      const pet = await prisma.pet.update({
        where: { id: petId },
        data: updateData,
      });

      res.status(httpStatus.OK).json(pet);
    } catch (error) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Pet not found');
    }
  },
};
