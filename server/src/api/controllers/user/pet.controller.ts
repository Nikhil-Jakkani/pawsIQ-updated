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

      // Support legacy and new shapes for health data
      const allergiesStr: string | undefined = body.allergies; // legacy comma-separated
      const selected_allergies: string[] | undefined = Array.isArray(body.selected_allergies)
        ? body.selected_allergies
        : (typeof body.allergies === 'string' ? body.allergies.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined);
      const other_allergies: string | undefined = body.other_allergies;

      const medStr: string | undefined = body.medicalConditions; // legacy comma-separated
      const selected_conditions: string[] | undefined = Array.isArray(body.selected_conditions)
        ? body.selected_conditions
        : (typeof body.medicalConditions === 'string' ? body.medicalConditions.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined);
      const other_conditions: string | undefined = body.other_conditions;
      const current_medications: string | undefined = body.current_medications ?? body.medications;
      const dietary_needs: string | undefined = body.dietary_needs ?? body.dietaryNeeds;

      const vaccinationsArr: any[] = Array.isArray(body.vaccinations) ? body.vaccinations : [];
      const selected_vaccines: string[] | undefined = Array.isArray(body.selected_vaccines) ? body.selected_vaccines : undefined;
      const vaccination_dates: any | undefined = body.vaccination_dates; // JSON object name->date
      const next_due_dates: any | undefined = body.next_due_dates; // JSON object name->date
      const custom_vaccines: string | undefined = body.custom_vaccines;

      const pet = await prisma.$transaction(async (tx) => {
        const updated = await tx.pIQ_Pets.update({ where: { pet_id: id }, data });

        // Allergies: single row per pet
        if (selected_allergies || typeof other_allergies === 'string' || typeof allergiesStr === 'string') {
          const nextSelected = Array.isArray(selected_allergies)
            ? selected_allergies
            : (typeof allergiesStr === 'string' ? allergiesStr.split(',').map((s) => s.trim()).filter(Boolean) : []);
          await tx.pIQ_Pet_Allergy.upsert({
            where: { pet_id: BigInt(id) },
            create: {
              pet_id: BigInt(id),
              selected_allergies: nextSelected,
              other_allergies: other_allergies ?? null,
            } as any,
            update: {
              selected_allergies: nextSelected,
              other_allergies: other_allergies ?? null,
              last_updated_dtm: new Date(),
            } as any,
          });
        }

        // Health conditions: single row per pet
        if (selected_conditions || typeof other_conditions === 'string' || typeof current_medications === 'string' || typeof dietary_needs === 'string' || typeof medStr === 'string') {
          const nextSelected = Array.isArray(selected_conditions)
            ? selected_conditions
            : (typeof medStr === 'string' ? medStr.split(',').map((s) => s.trim()).filter(Boolean) : []);
          await tx.pIQ_Pet_Medical_Condition.upsert({
            where: { pet_id: BigInt(id) },
            create: {
              pet_id: BigInt(id),
              selected_conditions: nextSelected,
              other_conditions: other_conditions ?? null,
              current_medications: current_medications ?? null,
              dietary_needs: dietary_needs ?? null,
            } as any,
            update: {
              selected_conditions: nextSelected,
              other_conditions: other_conditions ?? null,
              current_medications: current_medications ?? null,
              dietary_needs: dietary_needs ?? null,
              last_updated_dtm: new Date(),
            } as any,
          });
        }

        // Vaccinations: single row per pet
        if (selected_vaccines || vaccinationsArr.length || vaccination_dates || next_due_dates || typeof custom_vaccines === 'string') {
          let vaccines = Array.isArray(selected_vaccines) ? selected_vaccines : [];
          // Adapt from legacy vaccinations array into maps if provided
          const vDates: Record<string, any> = vaccination_dates && typeof vaccination_dates === 'object' ? vaccination_dates : {};
          const nextDue: Record<string, any> = next_due_dates && typeof next_due_dates === 'object' ? next_due_dates : {};
          if (!vaccines.length && vaccinationsArr.length) {
            vaccines = vaccinationsArr.map((v) => v.vaccination_name || v.vaccine || v.title).filter(Boolean);
            for (const v of vaccinationsArr) {
              const key = v.vaccination_name || v.vaccine || v.title;
              if (!key) continue;
              if (v.date || v.vaccine_given_date) vDates[key] = new Date(v.date || v.vaccine_given_date).toISOString();
              if (v.nextDue || v.vaccine_due_date) nextDue[key] = new Date(v.nextDue || v.vaccine_due_date).toISOString();
            }
          }
          await tx.pIQ_Pet_Vaccination.upsert({
            where: { pet_id: BigInt(id) },
            create: {
              pet_id: BigInt(id),
              selected_vaccines: vaccines,
              vaccination_dates: Object.keys(vDates).length ? vDates : ({} as any),
              next_due_dates: Object.keys(nextDue).length ? nextDue : ({} as any),
              custom_vaccines: custom_vaccines ?? null,
            } as any,
            update: {
              selected_vaccines: vaccines,
              vaccination_dates: Object.keys(vDates).length ? vDates : ({} as any),
              next_due_dates: Object.keys(nextDue).length ? nextDue : ({} as any),
              custom_vaccines: custom_vaccines ?? null,
              last_updated_dtm: new Date(),
            } as any,
          });
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
