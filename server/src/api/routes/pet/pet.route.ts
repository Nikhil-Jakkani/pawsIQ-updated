import express from 'express';
import httpStatus from 'http-status';
import { userAuth } from '../../middlewares/user.auth.js';
import { validate } from '../../middlewares/validate.js';
import { petValidation } from '../../validations/user/pet.validation.js';
import { petController } from '../../controllers/user/pet.controller.js';
import { db } from '../../../config/db.js';
import prisma from '../../../lib/prisma.js';

const router = express.Router();

function toJsonSafe(value: any): any {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(toJsonSafe);
  if (t === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) out[k] = toJsonSafe(v);
    return out;
  }
  return value;
}

router.get('/breeds/:petType', async (req: any, res) => {
  try {
    const petType = req.params.petType;
    if (!petType) return res.status(httpStatus.BAD_REQUEST).send({ message: 'petType is required' });

    const breedData = {
      dog: [
        'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'French Bulldog', 'Bulldog',
        'Poodle', 'Beagle', 'Rottweiler', 'German Shorthaired Pointer', 'Yorkshire Terrier',
        'Siberian Husky', 'Dachshund', 'Boxer', 'Great Dane', 'Chihuahua', 'Shih Tzu',
        'Boston Terrier', 'Pomeranian', 'Australian Shepherd', 'Cocker Spaniel', 'Border Collie',
        'Maltese', 'Jack Russell Terrier', 'Doberman Pinscher', 'Mastiff', 'Basset Hound',
        'Weimaraner', 'Saint Bernard', 'Bloodhound', 'Newfoundland', 'Dalmatian', 'Mixed Breed'
      ],
      cat: [
        'Persian', 'Maine Coon', 'British Shorthair', 'Ragdoll', 'Siamese', 'American Shorthair',
        'Scottish Fold', 'Sphynx', 'Russian Blue', 'Abyssinian', 'Bengal', 'Birman',
        'Oriental Shorthair', 'Devon Rex', 'Cornish Rex', 'Manx', 'Himalayan', 'Exotic Shorthair',
        'Norwegian Forest Cat', 'Siberian', 'Tonkinese', 'Burmese', 'Bombay', 'Chartreux',
        'Havana Brown', 'Japanese Bobtail', 'Korat', 'LaPerm', 'Munchkin', 'Mixed Breed'
      ],
      other: [
        'Mixed Breed', 'Unknown', 'Crossbreed'
      ]
    };

    const petTypeKey = petType.toLowerCase() as keyof typeof breedData;
    const breeds = breedData[petTypeKey] || breedData.other;
    return res.status(httpStatus.OK).send({ breeds });
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: e?.message || 'Failed to fetch breeds' });
  }
});

router.post('/', userAuth as any, async (req: any, res) => {
  try {
    const name = req.body?.name ?? req.body?.pet_name;
    const type = req.body?.type ?? req.body?.pet_type ?? req.body?.pet_species;
    const breed = req.body?.breed ?? req.body?.pet_breed;
    const gender = req.body?.gender ?? req.body?.pet_gender;
    const birthdate = req.body?.birthdate ?? req.body?.pet_birth_dtm;
    const color = req.body?.color ?? req.body?.pet_colour;
    const bloodGroup = req.body?.bloodGroup ?? req.body?.pet_blood_grp;
    const weight = req.body?.weight ?? req.body?.pet_weight;
    const microchipped = req.body?.microchipped;
    const microchipNumber = req.body?.microchipNumber ?? req.body?.microchip_number;
    const neutered = req.body?.neutered;
    if (!name) return res.status(httpStatus.BAD_REQUEST).send({ message: 'name is required' });

    const insert: Record<string, any> = {
      user_id: Number(req.user.user_id),
      pet_name: name,
      pet_status: 'Active',
      last_updated_dtm: new Date(),
    };
    if (type) insert.pet_type = type;
    if (breed) insert.pet_breed = breed;
    if (gender) insert.pet_gender = gender;
    if (birthdate) insert.pet_birth_dtm = birthdate;
    if (color) insert.pet_colour = color;
    if (bloodGroup) insert.pet_blood_grp = bloodGroup;
    if (weight !== undefined && weight !== null && weight !== '') {
      const w = Number(weight);
      if (!Number.isNaN(w)) insert.pet_weight = Math.round(w);
    }
    if (typeof microchipped === 'boolean') insert.microchipped = microchipped;
    if (typeof neutered === 'boolean') insert.neutered = neutered;
    if (microchipNumber !== undefined && microchipNumber !== null && microchipNumber !== '') {
      insert.microchip_number = String(microchipNumber);
    }

    const { data: created, error } = await db
      .from('PIQ_Pets')
      .insert(insert)
      .select('*')
      .single();

    if (error || !created) return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: error?.message || 'Failed to create pet' });
    const createdSafePrimaries = {
      ...created,
      pet_id: created?.pet_id != null ? Number(created.pet_id) : created?.pet_id,
      user_id: created?.user_id != null ? Number(created.user_id) : created?.user_id,
    };
    const createdSafe = toJsonSafe(createdSafePrimaries);

    try {
      const petIdNum = Number(createdSafe.pet_id);
      const alerg = req.body?.allergies;
      if (typeof alerg === 'string' && alerg.trim()) {
        const names = alerg.split(',').map((s: string) => s.trim()).filter(Boolean);
        if (names.length) {
          await prisma.pIQ_Pet_Allergy.createMany({
            data: names.map((n: string) => ({ pet_id: BigInt(petIdNum), allergy_name: n } as any))
          });
        }
      }

      const med = req.body?.medicalConditions;
      if (typeof med === 'string' && med.trim()) {
        const names = med.split(',').map((s: string) => s.trim()).filter(Boolean);
        if (names.length) {
          await prisma.pIQ_PET_MEDICAL_CONDITION.createMany({
            data: names.map((n: string) => ({ pet_id: BigInt(petIdNum), condition_name: n } as any))
          });
        }
      }

      const vacc: any[] = Array.isArray(req.body?.vaccinations) ? req.body.vaccinations : [];
      if (vacc.length) {
        const payloads = vacc.map((v) => ({
          pet_id: petIdNum,
          vaccine_mstr_id: v.vaccine_mstr_id ?? null,
          vaccination_name: v.vaccine || v.vaccination_name || v.title || null,
          vaccine_given_date: v.date ? new Date(v.date) : (v.vaccine_given_date ? new Date(v.vaccine_given_date) : null),
          vaccine_due_date: v.nextDue ? new Date(v.nextDue) : (v.vaccine_due_date ? new Date(v.vaccine_due_date) : null),
          vaccine_status: v.vaccine_status ?? (v.date || v.vaccine_given_date ? 'given' : 'planned'),
          is_record_valid: true,
          updated_dtm: new Date(),
        })).filter((p) => p.vaccination_name);
        if (payloads.length) {
          await prisma.pIQ_Pets_Vaccination.createMany({ data: payloads as any });
        }
      }
    } catch (relErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[PawsIQ] Failed to persist related health data on create:', relErr);
      }
    }

    return res.status(httpStatus.CREATED).send(createdSafe);
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: e?.message || 'Failed to create pet' });
  }
});

router.get('/user/:userId', userAuth as any, async (req: any, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(httpStatus.BAD_REQUEST).send({ message: 'userId is required' });

    if (Number(req.user?.user_id) !== userId) {
      return res.status(httpStatus.FORBIDDEN).send({ message: 'Forbidden' });
    }

    const { data: pets, error } = await db
      .from('PIQ_Pets')
      .select('*')
      .eq('user_id', userId)
      .or('pet_status.is.null,pet_status.neq.Inactive');

    if (error) return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: error.message || 'Failed to fetch pets' });

    const { data: user, error: userErr } = await db
      .from('PIQ_User')
      .select('user_full_name, user_email_id, user_phone_number')
      .eq('user_id', userId)
      .single();

    const enriched = (pets || []).map((p: any) => {
      let ageYears: number | null = null;
      if (p?.pet_birth_dtm) {
        const dob = new Date(p.pet_birth_dtm);
        const now = new Date();
        ageYears = Math.max(0, Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)));
      }

      const fullName = user?.user_full_name || '';
      const first = fullName.split(' ')[0] || '';
      const last = fullName.split(' ').slice(1).join(' ') || '';

      return {
        ...p,
        id: p.pet_id,
        name: p.pet_name,
        species: p.pet_species ?? p.pet_type ?? '',
        breed: p.pet_breed ?? '',
        gender: p.pet_gender ?? 'Unknown',
        age: ageYears ?? undefined,
        // Never surface raw storage path as an image URL; UI resolves signed URL from imagePath
        profileImage: `https://source.unsplash.com/random/400x300?${encodeURIComponent(p.pet_type || 'pet')}`,
        imagePath: p.pet_image ?? null,
        status: p.pet_status || 'active',
        microchipped: p.microchipped ?? false,
        neutered: p.neutered ?? false,
        vaccinated: p.vaccinated ?? false,
        lastUpdated: p.last_updated_dtm ?? undefined,
        pet_species: p.pet_species ?? p.pet_type ?? '',
        profile: ageYears != null ? [{ pet_age: ageYears }] : [],
        ownerName: fullName || undefined,
        ownerEmail: user?.user_email_id || undefined,
        ownerPhone: user?.user_phone_number || undefined,
        user: {
          user_first_name: first,
          user_last_name: last,
          user_email: user?.user_email_id || '',
        },
        medications: Array.isArray(p.medications) ? p.medications : [],
        dietaryRestrictions: Array.isArray(p.dietaryRestrictions) ? p.dietaryRestrictions : [],
      };
    });

    return res.status(httpStatus.OK).send(enriched);
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: e?.message || 'Failed to fetch pets' });
  }
});

router.get('/:petId', userAuth as any, async (req: any, res) => {
  try {
    const petId = Number(req.params.petId);
    if (!petId) return res.status(httpStatus.BAD_REQUEST).send({ message: 'petId is required' });

    const { data: pet, error } = await db
      .from('PIQ_Pets')
      .select('*')
      .eq('pet_id', petId)
      .or('pet_status.is.null,pet_status.neq.Inactive')
      .single();

    if (error || !pet) return res.status(httpStatus.NOT_FOUND).send({ message: 'Pet not found' });
    if (Number(pet.user_id) !== Number(req.user.user_id)) return res.status(httpStatus.FORBIDDEN).send({ message: 'Forbidden' });
    const safePetPrimaries = {
      ...pet,
      pet_id: pet?.pet_id != null ? Number(pet.pet_id) : pet?.pet_id,
      user_id: pet?.user_id != null ? Number(pet.user_id) : pet?.user_id,
    };
    const safePet = toJsonSafe(safePetPrimaries);
    // Enrich: include joined allergies and medical_conditions for profile display
    try {
      const [als, conds] = await Promise.all([
        prisma.pIQ_Pet_Allergy.findMany({ where: { pet_id: BigInt(safePet.pet_id) } as any, select: { allergy_name: true } }),
        prisma.pIQ_PET_MEDICAL_CONDITION.findMany({ where: { pet_id: BigInt(safePet.pet_id) } as any, select: { condition_name: true } }),
      ]);
      const allergyStr = als.map((a: any) => a.allergy_name).filter(Boolean).join(', ');
      const condStr = conds.map((c: any) => c.condition_name).filter(Boolean).join(', ');
      (safePet as any).allergies = allergyStr;
      (safePet as any).medical_conditions = condStr;
    } catch (_) {}
    return res.status(httpStatus.OK).send(safePet);
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: e?.message || 'Failed to fetch pet' });
  }
});

router.patch('/:petId', userAuth as any, validate(petValidation.updatePetProfile), petController.updatePetProfile);

router.delete('/:petId', userAuth as any, async (req: any, res) => {
  try {
    const petId = Number(req.params.petId);
    if (!petId) return res.status(httpStatus.BAD_REQUEST).send({ message: 'petId is required' });

    const { data: existing, error: selErr } = await db
      .from('PIQ_Pets')
      .select('pet_id, user_id')
      .eq('pet_id', petId)
      .single();
    if (selErr || !existing) return res.status(httpStatus.NOT_FOUND).send({ message: 'Pet not found' });
    if (Number(existing.user_id) !== Number(req.user.user_id)) return res.status(httpStatus.FORBIDDEN).send({ message: 'Forbidden' });

    const { data: updated, error } = await db
      .from('PIQ_Pets')
      .update({ pet_status: 'Inactive', last_updated_dtm: new Date() })
      .eq('pet_id', petId)
      .select('pet_id')
      .single();

    if (error || !updated) return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: error?.message || 'Failed to delete pet' });
    return res.sendStatus(httpStatus.NO_CONTENT);
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: e?.message || 'Failed to delete pet' });
  }
});

router.put('/:petId/image', userAuth as any, async (req: any, res) => {
  const petId = Number(req.params.petId);
  const { path } = req.body || {};
  if (!petId || !path) return res.status(httpStatus.BAD_REQUEST).send({ message: 'petId and path are required' });

  // Ensure pet belongs to user
  const { data: pet, error: selErr } = await db.from('PIQ_Pets').select('pet_id, user_id').eq('pet_id', petId).single();
  if (selErr || !pet) return res.status(httpStatus.NOT_FOUND).send({ message: 'Pet not found' });
  if (Number(pet.user_id) !== Number(req.user.user_id)) return res.status(httpStatus.FORBIDDEN).send({ message: 'Forbidden' });

  const { data: updated, error } = await db
    .from('PIQ_Pets')
    .update({ pet_image: path, last_updated_dtm: new Date() })
    .eq('pet_id', petId)
    .select('*')
    .single();

  if (error || !updated) return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: error?.message || 'Failed to update pet image' });
  return res.status(httpStatus.OK).send(updated);
});

router.get('/:petId/allergies', userAuth as any, async (req: any, res) => {
  try {
    const petId = Number(req.params.petId);
    if (!petId) return res.status(httpStatus.BAD_REQUEST).json({ message: 'Invalid petId' });
    const { data: pet, error: selErr } = await db.from('PIQ_Pets').select('user_id').eq('pet_id', petId).single();
    if (selErr || !pet) return res.status(httpStatus.NOT_FOUND).json({ message: 'Pet not found' });
    if (Number(pet.user_id) !== Number(req.user.user_id)) return res.status(httpStatus.FORBIDDEN).json({ message: 'Forbidden' });
    const items = await prisma.pIQ_Pet_Allergy.findMany({ where: { pet_id: BigInt(petId) }, orderBy: { last_updated_dtm: 'desc' } as any });
    return res.status(httpStatus.OK).json(toJsonSafe({ allergies: items }));
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to fetch allergies' });
  }
});

router.post('/:petId/allergies', userAuth as any, async (req: any, res) => {
  try {
    const petId = Number(req.params.petId);
    const { allergyName, severity, notes } = req.body || {};
    if (!petId || !allergyName) return res.status(httpStatus.BAD_REQUEST).json({ message: 'petId and allergyName are required' });
    const { data: pet, error: selErr } = await db.from('PIQ_Pets').select('user_id').eq('pet_id', petId).single();
    if (selErr || !pet) return res.status(httpStatus.NOT_FOUND).json({ message: 'Pet not found' });
    if (Number(pet.user_id) !== Number(req.user.user_id)) return res.status(httpStatus.FORBIDDEN).json({ message: 'Forbidden' });
    const created = await prisma.pIQ_Pet_Allergy.create({ data: { pet_id: BigInt(petId), allergy_name: allergyName, severity, notes } as any });
    return res.status(httpStatus.CREATED).json(toJsonSafe(created));
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to create allergy' });
  }
});

router.post('/:petId/allergies/batch', userAuth as any, async (req: any, res) => {
  try {
    const petId = Number(req.params.petId);
    const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
    if (!petId || entries.length === 0) return res.status(httpStatus.BAD_REQUEST).json({ message: 'No entries to insert' });
    const { data: pet, error: selErr } = await db.from('PIQ_Pets').select('user_id').eq('pet_id', petId).single();
    if (selErr || !pet) return res.status(httpStatus.NOT_FOUND).json({ message: 'Pet not found' });
    if (Number(pet.user_id) !== Number(req.user.user_id)) return res.status(httpStatus.FORBIDDEN).json({ message: 'Forbidden' });
    const data = entries.map((e: any) => ({ pet_id: BigInt(petId), allergy_name: e.allergyName, severity: e.severity ?? null, notes: e.notes ?? null }));
    const created = await prisma.pIQ_Pet_Allergy.createMany({ data: data as any });
    return res.status(httpStatus.CREATED).json(toJsonSafe({ count: created.count }));
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to create allergies' });
  }
});

router.delete('/allergies/:id', userAuth as any, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(httpStatus.BAD_REQUEST).json({ message: 'Invalid id' });
    const rec = await prisma.pIQ_Pet_Allergy.findUnique({ where: { id: BigInt(id) } as any });
    if (!rec) return res.sendStatus(httpStatus.NO_CONTENT);
    const petId = Number(rec.pet_id);
    const { data: pet, error: selErr } = await db.from('PIQ_Pets').select('user_id').eq('pet_id', petId).single();
    if (selErr || !pet) return res.status(httpStatus.NOT_FOUND).json({ message: 'Pet not found' });
    if (Number(pet.user_id) !== Number(req.user.user_id)) return res.status(httpStatus.FORBIDDEN).json({ message: 'Forbidden' });
    await prisma.pIQ_Pet_Allergy.delete({ where: { id: BigInt(id) } as any });
    return res.sendStatus(httpStatus.NO_CONTENT);
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to delete allergy' });
  }
});

router.get('/:petId/conditions', userAuth as any, async (req: any, res) => {
  try {
    const petId = Number(req.params.petId);
    if (!petId) return res.status(httpStatus.BAD_REQUEST).json({ message: 'Invalid petId' });
    const { data: pet, error: selErr } = await db.from('PIQ_Pets').select('user_id').eq('pet_id', petId).single();
    if (selErr || !pet) return res.status(httpStatus.NOT_FOUND).json({ message: 'Pet not found' });
    if (Number(pet.user_id) !== Number(req.user.user_id)) return res.status(httpStatus.FORBIDDEN).json({ message: 'Forbidden' });
    const items = await prisma.pIQ_PET_MEDICAL_CONDITION.findMany({ where: { pet_id: BigInt(petId) }, orderBy: { last_updated_dtm: 'desc' } as any });
    return res.status(httpStatus.OK).json(toJsonSafe({ conditions: items }));
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to fetch conditions' });
  }
});

router.post('/:petId/conditions', userAuth as any, async (req: any, res) => {
  try {
    const petId = Number(req.params.petId);
    const { conditionName, severity, notes } = req.body || {};
    if (!petId || !conditionName) return res.status(httpStatus.BAD_REQUEST).json({ message: 'petId and conditionName are required' });
    const { data: pet, error: selErr } = await db.from('PIQ_Pets').select('user_id').eq('pet_id', petId).single();
    if (selErr || !pet) return res.status(httpStatus.NOT_FOUND).json({ message: 'Pet not found' });
    if (Number(pet.user_id) !== Number(req.user.user_id)) return res.status(httpStatus.FORBIDDEN).json({ message: 'Forbidden' });
    const created = await prisma.pIQ_PET_MEDICAL_CONDITION.create({ data: { pet_id: BigInt(petId), condition_name: conditionName, severity, notes } as any });
    return res.status(httpStatus.CREATED).json(toJsonSafe(created));
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to create condition' });
  }
});

router.post('/:petId/conditions/batch', userAuth as any, async (req: any, res) => {
  try {
    const petId = Number(req.params.petId);
    const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
    if (!petId || entries.length === 0) return res.status(httpStatus.BAD_REQUEST).json({ message: 'No entries to insert' });
    const { data: pet, error: selErr } = await db.from('PIQ_Pets').select('user_id').eq('pet_id', petId).single();
    if (selErr || !pet) return res.status(httpStatus.NOT_FOUND).json({ message: 'Pet not found' });
    if (Number(pet.user_id) !== Number(req.user.user_id)) return res.status(httpStatus.FORBIDDEN).json({ message: 'Forbidden' });
    const data = entries.map((e: any) => ({ pet_id: BigInt(petId), condition_name: e.conditionName, severity: e.severity ?? null, notes: e.notes ?? null }));
    const created = await prisma.pIQ_PET_MEDICAL_CONDITION.createMany({ data: data as any });
    return res.status(httpStatus.CREATED).json(toJsonSafe({ count: created.count }));
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to create conditions' });
  }
});

router.delete('/conditions/:id', userAuth as any, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(httpStatus.BAD_REQUEST).json({ message: 'Invalid id' });
    const rec = await prisma.pIQ_PET_MEDICAL_CONDITION.findUnique({ where: { id: BigInt(id) } as any });
    if (!rec) return res.sendStatus(httpStatus.NO_CONTENT);
    const petId = Number(rec.pet_id);
    const { data: pet, error: selErr } = await db.from('PIQ_Pets').select('user_id').eq('pet_id', petId).single();
    if (selErr || !pet) return res.status(httpStatus.NOT_FOUND).json({ message: 'Pet not found' });
    if (Number(pet.user_id) !== Number(req.user.user_id)) return res.status(httpStatus.FORBIDDEN).json({ message: 'Forbidden' });
    await prisma.pIQ_PET_MEDICAL_CONDITION.delete({ where: { id: BigInt(id) } as any });
    return res.sendStatus(httpStatus.NO_CONTENT);
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to delete condition' });
  }
});

export default router;