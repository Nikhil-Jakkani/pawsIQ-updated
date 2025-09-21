import express from 'express';
import httpStatus from 'http-status';
import prisma from '../../lib/prisma.js';
import { userAuth } from '../middlewares/user.auth.js';

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

router.get('/master', async (req: any, res) => {
  try {
    const petType = (req.query.petType || req.query.pet_type || '').toString();
    const breed = (req.query.breed || '').toString();
    const ageGroup = (req.query.ageGroup || req.query.age_group || '').toString();

    const where: any = {};
    if (petType) where.pet_type = { equals: petType, mode: 'insensitive' };
    if (breed) where.pet_breed = { equals: breed, mode: 'insensitive' };
    if (ageGroup) where.pet_age_grp = { equals: ageGroup, mode: 'insensitive' };

    const items = await prisma.pIQ_Vaccine_Master.findMany({ where, orderBy: { vaccine_name: 'asc' } });
    // Normalize for frontend
    const normalized = items.map((v) => ({
      vaccine_mstr_id: v.vaccine_mstr_id,
      pet_type: v.pet_type,
      pet_breed_group: v.pet_breed_group,
      pet_breed: v.pet_breed,
      age_group: v.pet_age_grp,
      vaccine: v.vaccine_name,
      purpose: v.vaccine_purpose,
      description: v.vaccine_description_dtls,
      recommended_age: v.vaccine_pet_age,
      frequency: v.vaccine_frequency,
      is_core: v.is_vaccine_core ?? null,
    }));

    return res.status(httpStatus.OK).json({ vaccines: normalized });
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to fetch vaccines' });
  }
});

// GET /pets/:petId/vaccinations
router.get('/pets/:petId/vaccinations', userAuth as any, async (req: any, res) => {
  try {
    const petId = Number(req.params.petId);
    if (!petId) return res.status(httpStatus.BAD_REQUEST).json({ message: 'Invalid petId' });

    const records = await prisma.pIQ_Pets_Vaccination.findMany({
      where: { pet_id: petId },
      orderBy: { vaccine_due_date: 'asc' },
    });

    return res.status(httpStatus.OK).json(toJsonSafe(records));
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to fetch pet vaccinations' });
  }
});

// POST /pets/:petId/vaccinations
router.post('/pets/:petId/vaccinations', userAuth as any, async (req: any, res) => {
  try {
    const petId = Number(req.params.petId);
    if (!petId) return res.status(httpStatus.BAD_REQUEST).json({ message: 'Invalid petId' });

    const body = req.body || {};
    const data: any = {
      pet_id: petId,
      vaccine_mstr_id: body.vaccine_mstr_id ?? null,
      vaccination_name: body.vaccination_name ?? body.vaccine_name ?? body.title ?? null,
      vaccine_given_date: body.vaccine_given_date ? new Date(body.vaccine_given_date) : null,
      vaccine_due_date: body.vaccine_due_date ? new Date(body.vaccine_due_date) : null,
      vaccine_status: body.vaccine_status ?? null,
      is_record_valid: body.is_record_valid ?? true,
      updated_dtm: new Date(),
    };

    if (!data.vaccination_name) return res.status(httpStatus.BAD_REQUEST).json({ message: 'vaccination_name is required' });

    const created = await prisma.pIQ_Pets_Vaccination.create({ data });
    return res.status(httpStatus.CREATED).json(toJsonSafe(created));
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to create vaccination' });
  }
});

// POST /pets/:petId/vaccinations/batch
router.post('/pets/:petId/vaccinations/batch', userAuth as any, async (req: any, res) => {
  try {
    const petId = Number(req.params.petId);
    if (!petId) return res.status(httpStatus.BAD_REQUEST).json({ message: 'Invalid petId' });
    const entries: any[] = Array.isArray(req.body?.entries) ? req.body.entries : [];
    if (!entries.length) return res.status(httpStatus.BAD_REQUEST).json({ message: 'entries array is required' });

    const payloads = entries.map((entry) => ({
      pet_id: petId,
      vaccine_mstr_id: entry.vaccine_mstr_id ?? null,
      vaccination_name: entry.vaccineName || entry.vaccination_name || entry.title,
      vaccine_given_date: entry.recordDate ? new Date(entry.recordDate) : (entry.vaccine_given_date ? new Date(entry.vaccine_given_date) : null),
      vaccine_due_date: entry.nextDueDate ? new Date(entry.nextDueDate) : (entry.vaccine_due_date ? new Date(entry.vaccine_due_date) : null),
      vaccine_status: entry.vaccine_status ?? (entry.vaccine_given_date || entry.recordDate ? 'given' : 'planned'),
      is_record_valid: true,
      updated_dtm: new Date(),
    })).filter((p) => p.vaccination_name);

    if (!payloads.length) return res.status(httpStatus.BAD_REQUEST).json({ message: 'No valid vaccination entries' });

    const created = await prisma.pIQ_Pets_Vaccination.createMany({ data: payloads });
    return res.status(httpStatus.CREATED).json(toJsonSafe({ count: created.count }));
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to save vaccinations' });
  }
});

// PUT
router.put('/vaccinations/:id', userAuth as any, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(httpStatus.BAD_REQUEST).send({ message: 'Invalid id' });
    const body = req.body || {};
    const data: any = {};
    if (body.vaccine_mstr_id !== undefined) data.vaccine_mstr_id = body.vaccine_mstr_id;
    if (body.vaccination_name !== undefined) data.vaccination_name = body.vaccination_name;
    if (body.vaccine_status !== undefined) data.vaccine_status = body.vaccine_status;
    if (body.vaccine_given_date !== undefined) data.vaccine_given_date = body.vaccine_given_date ? new Date(body.vaccine_given_date) : null;
    if (body.vaccine_due_date !== undefined) data.vaccine_due_date = body.vaccine_due_date ? new Date(body.vaccine_due_date) : null;
    data.updated_dtm = new Date();

    const updated = await prisma.pIQ_Pets_Vaccination.update({ where: { id }, data });
    return res.status(httpStatus.OK).json(toJsonSafe(updated));
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to update vaccination' });
  }
});

// DELETE
router.delete('/vaccinations/:id', userAuth as any, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(httpStatus.BAD_REQUEST).send({ message: 'Invalid id' });
    await prisma.pIQ_Pets_Vaccination.delete({ where: { id } });
    return res.sendStatus(httpStatus.NO_CONTENT);
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to delete vaccination' });
  }
});

export default router;
