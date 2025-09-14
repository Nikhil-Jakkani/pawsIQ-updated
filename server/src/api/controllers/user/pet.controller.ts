import { Request, Response } from 'express';
import httpStatus from 'http-status';
import prisma from '../../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';

export const petController = {
  async updatePetProfile(req: Request, res: Response) {
    const { petId } = req.params;

    try {
      const id = Number(petId);
      if (!id) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid petId');

      // Ensure pet exists
      const existing = await prisma.pIQ_Pets.findUnique({ where: { pet_id: id } });
      if (!existing) throw new ApiError(httpStatus.NOT_FOUND, 'Pet not found');

      // Map incoming payload fields to DB columns. Accepts both camelCase and legacy keys.
      const body: any = req.body || {};
      const data: any = {
        last_updated_dtm: new Date(),
      };

      // Name
      const name = body.name ?? body.pet_name;
      if (typeof name === 'string') data.pet_name = name;

      // Type/species
      const type = body.type ?? body.pet_type ?? body.pet_species;
      if (typeof type === 'string') data.pet_type = type;

      // Breed
      const breed = body.breed ?? body.pet_breed;
      if (typeof breed === 'string') data.pet_breed = breed;

      // Gender
      const gender = body.gender ?? body.pet_gender;
      if (typeof gender === 'string') data.pet_gender = gender;

      // Birthdate (ISO date string)
      const birthdate = body.birthdate ?? body.pet_birth_dtm;
      if (birthdate) data.pet_birth_dtm = new Date(birthdate);

      // Color
      const color = body.color ?? body.pet_colour;
      if (typeof color === 'string') data.pet_colour = color;

      // Perform update
      const pet = await prisma.pIQ_Pets.update({
        where: { pet_id: id },
        data,
      });

      return res.status(httpStatus.OK).json(pet);
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error?.message || 'Failed to update pet');
    }
  },
};
