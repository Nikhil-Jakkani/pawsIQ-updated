import express from 'express';
import httpStatus from 'http-status';
import { userAuth } from '../../middlewares/user.auth.js';
import { validate } from '../../middlewares/validate.js';
import { petValidation } from '../../validations/user/pet.validation.js';
import { petController } from '../../controllers/user/pet.controller.js';
import { db } from '../../../config/db.js';

const router = express.Router();

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
    if (!name) return res.status(httpStatus.BAD_REQUEST).send({ message: 'name is required' });

    const insert: Record<string, any> = {
      user_id: req.user.user_id,
      pet_name: name,
      last_updated_dtm: new Date(),
    };
    if (type) insert.pet_type = type;
    if (breed) insert.pet_breed = breed;
    if (gender) insert.pet_gender = gender;
    if (birthdate) insert.pet_birth_dtm = birthdate;
    if (color) insert.pet_colour = color;

    const { data: created, error } = await db
      .from('PIQ_Pets')
      .insert(insert)
      .select('*')
      .single();

    if (error || !created) return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: error?.message || 'Failed to create pet' });
    return res.status(httpStatus.CREATED).send(created);
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
      .eq('user_id', userId);

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
        profileImage: p.pet_image ?? `https://source.unsplash.com/random/400x300?${encodeURIComponent(p.pet_type || 'pet')}`,
        status: 'active',
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

    const { error } = await db
      .from('PIQ_Pets')
      .delete()
      .eq('pet_id', petId);

    if (error) return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: error.message || 'Failed to delete pet' });
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

export default router;