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

    // Read from consolidated single-row table
    const row = await prisma.pIQ_Pet_Vaccination.findUnique({ where: { pet_id: BigInt(petId) } as any });
    if (!row) return res.status(httpStatus.OK).json([]);

    // Synthesize array matching legacy client expectations
    const names: string[] = Array.isArray(row.selected_vaccines) ? row.selected_vaccines : [];
    const given: Record<string, string> = (row.vaccination_dates as any) || {};
    const due: Record<string, string> = (row.next_due_dates as any) || {};
    const toIsoOrNull = (val: any): string | null => {
      try {
        if (!val) return null;
        const d = new Date(val);
        return Number.isNaN(d.getTime()) ? null : d.toISOString();
      } catch (_) {
        return null;
      }
    };
    const out = names.map((name) => {
      const gIso = toIsoOrNull(given?.[name]);
      const dIso = toIsoOrNull(due?.[name]);
      return {
        id: undefined,
        vaccination_name: name,
        vaccine_given_date: gIso,
        vaccine_due_date: dIso,
        vaccine_status: gIso ? 'given' : (dIso ? 'planned' : null),
      };
    });
    return res.status(httpStatus.OK).json(toJsonSafe(out));
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
    const name: string | null = body.vaccination_name ?? body.vaccine_name ?? body.title ?? null;
    if (!name) return res.status(httpStatus.BAD_REQUEST).json({ message: 'vaccination_name is required' });

    const toIsoOrNull = (val: any): string | null => {
      try {
        if (!val) return null;
        const d = new Date(val);
        return Number.isNaN(d.getTime()) ? null : d.toISOString();
      } catch (_) {
        return null;
      }
    };
    const given = toIsoOrNull(body.vaccine_given_date);
    const due = toIsoOrNull(body.vaccine_due_date);

    const existing = await prisma.pIQ_Pet_Vaccination.findUnique({ where: { pet_id: BigInt(petId) } as any });
    const selected = new Set<string>(Array.isArray(existing?.selected_vaccines) ? existing!.selected_vaccines : []);
    selected.add(name);
    const vaccination_dates: any = Object.assign({}, (existing?.vaccination_dates as any) || {});
    const next_due_dates: any = Object.assign({}, (existing?.next_due_dates as any) || {});
    if (given) vaccination_dates[name] = given; else delete vaccination_dates[name];
    if (due) next_due_dates[name] = due; else delete next_due_dates[name];

    const up = await prisma.pIQ_Pet_Vaccination.upsert({
      where: { pet_id: BigInt(petId) } as any,
      create: { pet_id: BigInt(petId), selected_vaccines: Array.from(selected), vaccination_dates, next_due_dates } as any,
      update: { selected_vaccines: Array.from(selected), vaccination_dates, next_due_dates, last_updated_dtm: new Date() } as any,
    });
    return res.status(httpStatus.CREATED).json(toJsonSafe(up));
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

    const existing = await prisma.pIQ_Pet_Vaccination.findUnique({ where: { pet_id: BigInt(petId) } as any });
    const selected = new Set<string>(Array.isArray(existing?.selected_vaccines) ? existing!.selected_vaccines : []);
    const vaccination_dates: any = Object.assign({}, (existing?.vaccination_dates as any) || {});
    const next_due_dates: any = Object.assign({}, (existing?.next_due_dates as any) || {});
    const toIsoOrNull = (val: any): string | null => {
      try {
        if (!val) return null;
        const d = new Date(val);
        return Number.isNaN(d.getTime()) ? null : d.toISOString();
      } catch (_) {
        return null;
      }
    };
    for (const entry of entries) {
      const name = entry.vaccineName || entry.vaccination_name || entry.title;
      if (!name) continue;
      selected.add(name);
      const given = toIsoOrNull(entry.recordDate || entry.vaccine_given_date);
      const due = toIsoOrNull(entry.nextDueDate || entry.vaccine_due_date);
      if (given) vaccination_dates[name] = given; else delete vaccination_dates[name];
      if (due) next_due_dates[name] = due; else delete next_due_dates[name];
    }
    const up = await prisma.pIQ_Pet_Vaccination.upsert({
      where: { pet_id: BigInt(petId) } as any,
      create: { pet_id: BigInt(petId), selected_vaccines: Array.from(selected), vaccination_dates, next_due_dates } as any,
      update: { selected_vaccines: Array.from(selected), vaccination_dates, next_due_dates, last_updated_dtm: new Date() } as any,
    });
    return res.status(httpStatus.CREATED).json(toJsonSafe({ count: Array.from(selected).length, row: up }));
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to save vaccinations' });
  }
});

// PUT
router.put('/vaccinations/:id', userAuth as any, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    // This endpoint used old per-row model; not applicable with consolidated schema.
    return res.status(httpStatus.NOT_IMPLEMENTED).json({ message: 'Update single vaccination not supported with consolidated schema. Use POST /pets/:petId/vaccinations instead.' });
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to update vaccination' });
  }
});

// DELETE
router.delete('/vaccinations/:id', userAuth as any, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    // Not applicable in consolidated schema. Use query by pet + name instead.
    return res.status(httpStatus.NOT_IMPLEMENTED).json({ message: 'Delete by ID not supported with consolidated schema. Use DELETE /vaccines/pets/:petId?vaccine=Name' });
  } catch (e: any) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message || 'Failed to delete vaccination' });
  }
});

export default router;
