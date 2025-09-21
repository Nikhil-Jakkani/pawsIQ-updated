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

      const existing = await prisma.pIQ_Pets.findUnique({ where: { pet_id: id } });
      if (!existing) throw new ApiError(httpStatus.NOT_FOUND, 'Pet not found');

      const body: any = req.body || {};
      const data: any = {
        last_updated_dtm: new Date(),
      };

      const name = body.name ?? body.pet_name;
      if (typeof name === 'string') data.pet_name = name;

      const type = body.type ?? body.pet_type ?? body.pet_species;
      if (typeof type === 'string') data.pet_type = type;

      const breed = body.breed ?? body.pet_breed;
      if (typeof breed === 'string') data.pet_breed = breed;

      const gender = body.gender ?? body.pet_gender;
      if (typeof gender === 'string') data.pet_gender = gender;

      const birthdate = body.birthdate ?? body.pet_birth_dtm;
      if (birthdate) data.pet_birth_dtm = new Date(birthdate);

      const color = body.color ?? body.pet_colour;
      if (typeof color === 'string') data.pet_colour = color;

      const bloodGroup = body.bloodGroup ?? body.pet_blood_grp;
      if (typeof bloodGroup === 'string') data.pet_blood_grp = bloodGroup;

      const weight = body.weight ?? body.pet_weight;
      if (weight !== undefined && weight !== null && weight !== '') {
        const w = Number(weight);
        if (!Number.isNaN(w)) data.pet_weight = Math.round(w);
      }

      if (typeof body.microchipped === 'boolean') data.microchipped = body.microchipped;

      const microchipNumber = body.microchipNumber ?? body.microchip_number;
      if (microchipNumber !== undefined && microchipNumber !== null && microchipNumber !== '') {
        const m = BigInt(String(microchipNumber));
        data.microchip_number = m;
      }

      if (typeof body.neutered === 'boolean') data.neutered = body.neutered;

      const allergiesStr: string | undefined = body.allergies;
      const medStr: string | undefined = body.medicalConditions;
      const vaccinations: any[] = Array.isArray(body.vaccinations) ? body.vaccinations : [];

      const pet = await prisma.$transaction(async (tx) => {
        const updated = await tx.pIQ_Pets.update({ where: { pet_id: id }, data });

        if (typeof allergiesStr === 'string') {
          await tx.pIQ_Pet_Allergy.deleteMany({ where: { pet_id: BigInt(id) } as any });
          const names = allergiesStr.split(',').map((s) => s.trim()).filter(Boolean);
          if (names.length) {
            await tx.pIQ_Pet_Allergy.createMany({ data: names.map((n) => ({ pet_id: BigInt(id), allergy_name: n } as any)) });
          }
        }

        if (typeof medStr === 'string') {
          await tx.pIQ_PET_MEDICAL_CONDITION.deleteMany({ where: { pet_id: BigInt(id) } as any });
          const names = medStr.split(',').map((s) => s.trim()).filter(Boolean);
          if (names.length) {
            await tx.pIQ_PET_MEDICAL_CONDITION.createMany({ data: names.map((n) => ({ pet_id: BigInt(id), condition_name: n } as any)) });
          }
        }

        if (vaccinations.length) {
          await tx.pIQ_Pets_Vaccination.deleteMany({ where: { pet_id: id } });
          const payloads = vaccinations.map((v) => ({
            pet_id: id,
            vaccine_mstr_id: v.vaccine_mstr_id ?? null,
            vaccination_name: v.vaccine || v.vaccination_name || v.title || null,
            vaccine_given_date: v.date ? new Date(v.date) : (v.vaccine_given_date ? new Date(v.vaccine_given_date) : null),
            vaccine_due_date: v.nextDue ? new Date(v.nextDue) : (v.vaccine_due_date ? new Date(v.vaccine_due_date) : null),
            vaccine_status: v.vaccine_status ?? (v.date || v.vaccine_given_date ? 'given' : 'planned'),
            is_record_valid: true,
            updated_dtm: new Date(),
          })).filter((p) => p.vaccination_name);
          if (payloads.length) {
            await tx.pIQ_Pets_Vaccination.createMany({ data: payloads as any });
          }
        }

        return updated;
      });

      const safe = {
        ...pet,
        pet_id: (pet as any)?.pet_id != null ? Number((pet as any).pet_id) : (pet as any)?.pet_id,
        user_id: (pet as any)?.user_id != null ? Number((pet as any).user_id) : (pet as any)?.user_id,
      } as any;
      if ((pet as any)?.microchip_number != null) {
        try { safe.microchip_number = (pet as any).microchip_number.toString(); } catch {}
      }

      return res.status(httpStatus.OK).json(safe);
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error?.message || 'Failed to update pet');
    }
  },
};
