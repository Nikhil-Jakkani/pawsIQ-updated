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
      // Consolidated shapes (arrays / JSON), fallback to legacy strings
      const selected_allergies: string[] = Array.isArray(req.body?.selected_allergies)
        ? req.body.selected_allergies
        : (typeof req.body?.allergies === 'string' ? req.body.allergies.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
      const other_allergies: string | null = (req.body?.other_allergies ?? null) || null;

      const selected_conditions: string[] = Array.isArray(req.body?.selected_conditions)
        ? req.body.selected_conditions
        : (typeof req.body?.medicalConditions === 'string' ? req.body.medicalConditions.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
      const other_conditions: string | null = (req.body?.other_conditions ?? null) || null;
      const current_medications: string | null = (req.body?.current_medications ?? req.body?.medications ?? null) || null;
      const dietary_needs: string | null = (req.body?.dietary_needs ?? req.body?.dietaryNeeds ?? null) || null;

      const vaccinationsArr: any[] = Array.isArray(req.body?.vaccinations) ? req.body.vaccinations : [];
      let selected_vaccines: string[] = Array.isArray(req.body?.selected_vaccines) ? req.body.selected_vaccines : [];
      const vDates: Record<string, any> = (req.body?.vaccination_dates && typeof req.body.vaccination_dates === 'object') ? req.body.vaccination_dates : {};
      const nextDue: Record<string, any> = (req.body?.next_due_dates && typeof req.body.next_due_dates === 'object') ? req.body.next_due_dates : {};
      const custom_vaccines: string | null = (req.body?.custom_vaccines ?? null) || null;
      if (!selected_vaccines.length && vaccinationsArr.length) {
        selected_vaccines = vaccinationsArr.map((v) => v.vaccination_name || v.vaccine || v.title).filter(Boolean);
        for (const v of vaccinationsArr) {
          const key = v.vaccination_name || v.vaccine || v.title;
          if (!key) continue;
          if (v.date || v.vaccine_given_date) vDates[key] = new Date(v.date || v.vaccine_given_date).toISOString();
          if (v.nextDue || v.vaccine_due_date) nextDue[key] = new Date(v.nextDue || v.vaccine_due_date).toISOString();
        }
      }

      await prisma.pIQ_Pet_Allergy.upsert({
        where: { pet_id: BigInt(petIdNum) } as any,
        create: { pet_id: BigInt(petIdNum), selected_allergies, other_allergies } as any,
        update: { selected_allergies, other_allergies, last_updated_dtm: new Date() } as any,
      });

      await prisma.pIQ_Pet_Medical_Condition.upsert({
        where: { pet_id: BigInt(petIdNum) } as any,
        create: { pet_id: BigInt(petIdNum), selected_conditions, other_conditions, current_medications, dietary_needs } as any,
        update: { selected_conditions, other_conditions, current_medications, dietary_needs, last_updated_dtm: new Date() } as any,
      });

      await prisma.pIQ_Pet_Vaccination.upsert({
        where: { pet_id: BigInt(petIdNum) } as any,
        create: { pet_id: BigInt(petIdNum), selected_vaccines, vaccination_dates: vDates, next_due_dates: nextDue, custom_vaccines } as any,
        update: { selected_vaccines, vaccination_dates: vDates, next_due_dates: nextDue, custom_vaccines, last_updated_dtm: new Date() } as any,
      });
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
    // Enrich from consolidated tables
    try {
      const [al, hc, vac] = await Promise.all([
        prisma.pIQ_Pet_Allergy.findUnique({ where: { pet_id: BigInt(safePet.pet_id) } as any }),
        prisma.pIQ_Pet_Medical_Condition.findUnique({ where: { pet_id: BigInt(safePet.pet_id) } as any }),
        prisma.pIQ_Pet_Vaccination.findUnique({ where: { pet_id: BigInt(safePet.pet_id) } as any }),
      ]);
      (safePet as any).allergies = Array.isArray(al?.selected_allergies) ? al!.selected_allergies.join(', ') : '';
      (safePet as any).other_allergies = al?.other_allergies ?? '';
      (safePet as any).medical_conditions = Array.isArray(hc?.selected_conditions) ? hc!.selected_conditions.join(', ') : '';
      (safePet as any).other_medical_conditions = hc?.other_conditions ?? '';
      (safePet as any).current_medications = hc?.current_medications ?? '';
      (safePet as any).dietary_needs = hc?.dietary_needs ?? '';
      (safePet as any).vaccinations = vac ? { selected_vaccines: vac.selected_vaccines, vaccination_dates: vac.vaccination_dates, next_due_dates: vac.next_due_dates, custom_vaccines: vac.custom_vaccines } : undefined;
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
    const row = await prisma.pIQ_Pet_Allergy.findUnique({ where: { pet_id: BigInt(petId) } as any });
    return res.status(httpStatus.OK).json(toJsonSafe(row || { pet_id: petId, selected_allergies: [], other_allergies: null }));
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to fetch allergies' });
  }
});

router.post('/:petId/allergies', userAuth as any, async (req: any, res) => {
  try {
    const petId = Number(req.params.petId);
    const { allergyName, other_allergies } = req.body || {};
    if (!petId || !allergyName) return res.status(httpStatus.BAD_REQUEST).json({ message: 'petId and allergyName are required' });
    const { data: pet, error: selErr } = await db.from('PIQ_Pets').select('user_id').eq('pet_id', petId).single();
    if (selErr || !pet) return res.status(httpStatus.NOT_FOUND).json({ message: 'Pet not found' });
    if (Number(pet.user_id) !== Number(req.user.user_id)) return res.status(httpStatus.FORBIDDEN).json({ message: 'Forbidden' });
    const existing = await prisma.pIQ_Pet_Allergy.findUnique({ where: { pet_id: BigInt(petId) } as any });
    const next = Array.isArray(existing?.selected_allergies) ? [...existing!.selected_allergies] : [];
    if (!next.includes(allergyName)) next.push(allergyName);
    const up = await prisma.pIQ_Pet_Allergy.upsert({
      where: { pet_id: BigInt(petId) },
      create: { pet_id: BigInt(petId), selected_allergies: next, other_allergies: other_allergies ?? existing?.other_allergies ?? null } as any,
      update: { selected_allergies: next, other_allergies: other_allergies ?? existing?.other_allergies ?? null, last_updated_dtm: new Date() } as any,
    });
    return res.status(httpStatus.CREATED).json(toJsonSafe(up));
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
    const existing = await prisma.pIQ_Pet_Allergy.findUnique({ where: { pet_id: BigInt(petId) } as any });
    const next = new Set<string>(Array.isArray(existing?.selected_allergies) ? existing!.selected_allergies : []);
    for (const e of entries) { if (e?.allergyName) next.add(e.allergyName); }
    const up = await prisma.pIQ_Pet_Allergy.upsert({
      where: { pet_id: BigInt(petId) },
      create: { pet_id: BigInt(petId), selected_allergies: Array.from(next), other_allergies: existing?.other_allergies ?? null } as any,
      update: { selected_allergies: Array.from(next), last_updated_dtm: new Date() } as any,
    });
    return res.status(httpStatus.CREATED).json(toJsonSafe(up));
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to create allergies' });
  }
});

// For consolidated model, delete by value via query ?name=XYZ (kept simple)
router.delete('/allergies/:petId', userAuth as any, async (req: any, res) => {
  try {
    const petId = Number(req.params.petId);
    const name = String(req.query.name || '').trim();
    if (!petId || !name) return res.status(httpStatus.BAD_REQUEST).json({ message: 'Invalid request' });
    const rec = await prisma.pIQ_Pet_Allergy.findUnique({ where: { pet_id: BigInt(petId) } as any });
    if (!rec) return res.sendStatus(httpStatus.NO_CONTENT);
    const { data: pet, error: selErr } = await db.from('PIQ_Pets').select('user_id').eq('pet_id', petId).single();
    if (selErr || !pet) return res.status(httpStatus.NOT_FOUND).json({ message: 'Pet not found' });
    if (Number(pet.user_id) !== Number(req.user.user_id)) return res.status(httpStatus.FORBIDDEN).json({ message: 'Forbidden' });
    const filtered = (rec.selected_allergies || []).filter((a: string) => a !== name);
    await prisma.pIQ_Pet_Allergy.update({ where: { pet_id: BigInt(petId) } as any, data: { selected_allergies: filtered, last_updated_dtm: new Date() } as any });
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
    const row = await prisma.pIQ_Pet_Medical_Condition.findUnique({ where: { pet_id: BigInt(petId) } as any });
    return res.status(httpStatus.OK).json(toJsonSafe(row || { pet_id: petId, selected_conditions: [], other_conditions: null, current_medications: null, dietary_needs: null }));
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to fetch conditions' });
  }
});

router.post('/:petId/conditions', userAuth as any, async (req: any, res) => {
  try {
    const petId = Number(req.params.petId);
    const { conditionName, other_conditions, current_medications, dietary_needs } = req.body || {};
    if (!petId || !conditionName) return res.status(httpStatus.BAD_REQUEST).json({ message: 'petId and conditionName are required' });
    const { data: pet, error: selErr } = await db.from('PIQ_Pets').select('user_id').eq('pet_id', petId).single();
    if (selErr || !pet) return res.status(httpStatus.NOT_FOUND).json({ message: 'Pet not found' });
    if (Number(pet.user_id) !== Number(req.user.user_id)) return res.status(httpStatus.FORBIDDEN).json({ message: 'Forbidden' });
    const existing = await prisma.pIQ_Pet_Medical_Condition.findUnique({ where: { pet_id: BigInt(petId) } as any });
    const next = Array.isArray(existing?.selected_conditions) ? [...existing!.selected_conditions] : [];
    if (!next.includes(conditionName)) next.push(conditionName);
    const up = await prisma.pIQ_Pet_Medical_Condition.upsert({
      where: { pet_id: BigInt(petId) },
      create: { pet_id: BigInt(petId), selected_conditions: next, other_conditions: other_conditions ?? existing?.other_conditions ?? null, current_medications: current_medications ?? existing?.current_medications ?? null, dietary_needs: dietary_needs ?? existing?.dietary_needs ?? null } as any,
      update: { selected_conditions: next, other_conditions: other_conditions ?? existing?.other_conditions ?? null, current_medications: current_medications ?? existing?.current_medications ?? null, dietary_needs: dietary_needs ?? existing?.dietary_needs ?? null, last_updated_dtm: new Date() } as any,
    });
    return res.status(httpStatus.CREATED).json(toJsonSafe(up));
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
    const existing = await prisma.pIQ_Pet_Medical_Condition.findUnique({ where: { pet_id: BigInt(petId) } as any });
    const next = new Set<string>(Array.isArray(existing?.selected_conditions) ? existing!.selected_conditions : []);
    for (const e of entries) { if (e?.conditionName) next.add(e.conditionName); }
    const up = await prisma.pIQ_Pet_Medical_Condition.upsert({
      where: { pet_id: BigInt(petId) },
      create: { pet_id: BigInt(petId), selected_conditions: Array.from(next), other_conditions: existing?.other_conditions ?? null, current_medications: existing?.current_medications ?? null, dietary_needs: existing?.dietary_needs ?? null } as any,
      update: { selected_conditions: Array.from(next), last_updated_dtm: new Date() } as any,
    });
    return res.status(httpStatus.CREATED).json(toJsonSafe(up));
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to create conditions' });
  }
});

router.delete('/conditions/:petId', userAuth as any, async (req: any, res) => {
  try {
    const petId = Number(req.params.petId);
    const name = String(req.query.name || '').trim();
    if (!petId || !name) return res.status(httpStatus.BAD_REQUEST).json({ message: 'Invalid request' });
    const rec = await prisma.pIQ_Pet_Medical_Condition.findUnique({ where: { pet_id: BigInt(petId) } as any });
    if (!rec) return res.sendStatus(httpStatus.NO_CONTENT);
    const { data: pet, error: selErr } = await db.from('PIQ_Pets').select('user_id').eq('pet_id', petId).single();
    if (selErr || !pet) return res.status(httpStatus.NOT_FOUND).json({ message: 'Pet not found' });
    if (Number(pet.user_id) !== Number(req.user.user_id)) return res.status(httpStatus.FORBIDDEN).json({ message: 'Forbidden' });
    const filtered = (rec.selected_conditions || []).filter((c: string) => c !== name);
    await prisma.pIQ_Pet_Medical_Condition.update({ where: { pet_id: BigInt(petId) } as any, data: { selected_conditions: filtered, last_updated_dtm: new Date() } as any });
    return res.sendStatus(httpStatus.NO_CONTENT);
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to delete condition' });
  }
});

export default router;