import httpStatus from 'http-status';
import prisma from '../../../lib/prisma.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { supabase } from '../../../config/supabase.js';

export const getStats = catchAsync(async (_req, res) => {
  const [users, pets, appointments, providers] = await Promise.all([
    prisma.pIQ_User.count(),
    prisma.pIQ_Pets.count(),
    prisma.pIQ_Appointments.count(),
    prisma.pIQ_Service_Provider.count(),
  ]);
  res.status(httpStatus.OK).send({ users, pets, appointments, providers });
});

export const getUsers = catchAsync(async (req, res) => {
  const rawPage = req.query.page;
  const rawLimit = req.query.limit;

  if (rawPage !== undefined) {
    const pageValue = Number(rawPage);
    if (!Number.isFinite(pageValue) || pageValue < 1 || pageValue > 10000) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: 'Invalid page parameter. Must be an integer between 1 and 10000.',
      });
    }
  }

  if (rawLimit !== undefined) {
    const limitValue = Number(rawLimit);
    if (!Number.isFinite(limitValue) || limitValue < 1 || limitValue > 100) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: 'Invalid limit parameter. Must be an integer between 1 and 100.',
      });
    }
  }

  const page = Math.max(1, Math.min(10000, Number(rawPage) || 1));
  const limit = Math.max(1, Math.min(100, Number(rawLimit) || 20));
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const skip = (page - 1) * limit;

  const where: any = { NOT: { user_status: 'deleted' } };
  if (status) where.user_status = status;
  if (search) {
    where.OR = [
      { user_full_name: { contains: search, mode: 'insensitive' } },
      { user_email_id: { contains: search, mode: 'insensitive' } },
      { user_phone_number: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, count] = await Promise.all([
    prisma.pIQ_User.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      select: {
        user_id: true,
        user_full_name: true,
        user_email_id: true,
        user_phone_number: true,
        created_at: true,
        last_updated_dtm: true,
        user_status: true,
      },
    }),
    prisma.pIQ_User.count({ where }),
  ]);

  res.status(httpStatus.OK).send({
    results: items,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
    totalResults: count || 0,
  });
});

export const getPets = catchAsync(async (req, res) => {
  const rawPage = req.query.page;
  const rawLimit = req.query.limit;

  if (rawPage !== undefined) {
    const pageValue = Number(rawPage);
    if (!Number.isFinite(pageValue) || pageValue < 1 || pageValue > 10000) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: 'Invalid page parameter. Must be an integer between 1 and 10000.',
      });
    }
  }

  if (rawLimit !== undefined) {
    const limitValue = Number(rawLimit);
    if (!Number.isFinite(limitValue) || limitValue < 1 || limitValue > 100) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: 'Invalid limit parameter. Must be an integer between 1 and 100.',
      });
    }
  }

  const page = Math.max(1, Math.min(10000, Number(rawPage) || 1));
  const limit = Math.max(1, Math.min(100, Number(rawLimit) || 24));
  const search = String(req.query.search || '').trim();
  const userIdParam = String(req.query.userId || '').trim();
  const skip = (page - 1) * limit;

  const where: any = {};
  if (userIdParam) {
    // Validate userId is numeric before converting to BigInt
    if (!/^\d+$/.test(userIdParam)) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: 'Invalid userId format. Must be a positive integer.',
      });
    }
    where.user_id = BigInt(userIdParam);
  }
  if (search) {
    where.OR = [
      { pet_name: { contains: search, mode: 'insensitive' } },
      { pet_breed: { contains: search, mode: 'insensitive' } },
      { pet_type: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [pets, count] = await Promise.all([
    prisma.pIQ_Pets.findMany({
      where,
      orderBy: { last_updated_dtm: 'desc' },
      skip,
      take: limit,
      include: { PIQ_User: { select: { user_full_name: true, user_email_id: true, user_phone_number: true } } },
    }),
    prisma.pIQ_Pets.count({ where }),
  ]);

  // Generate placeholder image based on species
  const getPlaceholderImage = (species: string) => {
    const speciesLower = (species || 'pet').toLowerCase();
    if (speciesLower.includes('dog')) return 'https://placedog.net/400/300';
    if (speciesLower.includes('cat')) return 'https://placekitten.com/400/300';
    if (speciesLower.includes('bird')) return 'https://via.placeholder.com/400x300/3B82F6/ffffff?text=🐦+Bird';
    if (speciesLower.includes('fish')) return 'https://via.placeholder.com/400x300/06B6D4/ffffff?text=🐠+Fish';
    if (speciesLower.includes('rabbit')) return 'https://via.placeholder.com/400x300/A855F7/ffffff?text=🐰+Rabbit';
    return `https://via.placeholder.com/400x300/6366f1/ffffff?text=${encodeURIComponent(species || 'Pet')}`;
  };

  // Generate signed URLs for pet images
  const enriched = await Promise.all((pets || []).map(async (p: any) => {
    let ageYears: number | null = null;
    if (p?.pet_birth_dtm) {
      const dob = new Date(p.pet_birth_dtm);
      const now = new Date();
      ageYears = Math.max(0, Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)));
    }

    // Generate signed URL for pet image if it exists
    let imageUrl = getPlaceholderImage((p as any).pet_species ?? p.pet_type);
    let imageError = false;
    
    if (p.pet_image) {
      try {
        const { data, error } = await supabase.storage
          .from('pets-photos')
          .createSignedUrl(p.pet_image, 3600); // 1 hour expiry for admin view
        
        if (error) {
          console.error('Supabase error generating signed URL:', error);
          imageError = true;
        } else if (data?.signedUrl) {
          imageUrl = data.signedUrl;
        }
      } catch (err) {
        console.error('Error generating signed URL for pet image:', err);
        imageError = true;
      }
    }

    return {
      id: p.pet_id,
      name: p.pet_name,
      species: (p as any).pet_species ?? p.pet_type ?? '',
      breed: p.pet_breed ?? '',
      gender: p.pet_gender ?? 'Unknown',
      age: ageYears ?? undefined,
      profileImage: imageUrl,
      imageError: imageError, // Indicate if image loading failed
      status: p.pet_status || 'active',
      microchipped: (p as any).microchipped ?? false,
      neutered: (p as any).neutered ?? false,
      vaccinated: (p as any).vaccinated ?? false,
      lastUpdated: p.last_updated_dtm ?? undefined,
      ownerName: p.PIQ_User?.user_full_name || undefined,
      ownerEmail: p.PIQ_User?.user_email_id || undefined,
      ownerPhone: p.PIQ_User?.user_phone_number || undefined,
    };
  }));

  res.status(httpStatus.OK).send({
    results: enriched,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
    totalResults: count || 0,
  });
});

export const getRoles = catchAsync(async (_req, res) => {
  const [adminCount, userCount, providerCount] = await Promise.all([
    prisma.pIQ_Admins.count(),
    prisma.pIQ_User.count(),
    prisma.pIQ_Service_Provider.count(),
  ]);

  const roles = [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full access to all system features and settings',
      usersCount: adminCount || 0,
      permissions: { dashboard: { view: true, edit: true }, users: { view: true, create: true, edit: true, delete: true } },
    },
    {
      id: 'user',
      name: 'User',
      description: 'Pet owners using the app',
      usersCount: userCount || 0,
      permissions: { dashboard: { view: false, edit: false } },
    },
    {
      id: 'provider',
      name: 'Provider',
      description: 'Service providers on the platform',
      usersCount: providerCount || 0,
      permissions: { dashboard: { view: false, edit: false } },
    },
  ];

  res.status(httpStatus.OK).send({ results: roles });
});

// List provider applications for onboarding dashboard
export const getProviders = catchAsync(async (req, res) => {
  const rawPage = req.query.page;
  const rawLimit = req.query.limit;

  if (rawPage !== undefined) {
    const pageValue = Number(rawPage);
    if (!Number.isFinite(pageValue) || pageValue < 1 || pageValue > 10000) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: 'Invalid page parameter. Must be an integer between 1 and 10000.',
      });
    }
  }

  if (rawLimit !== undefined) {
    const limitValue = Number(rawLimit);
    if (!Number.isFinite(limitValue) || limitValue < 1 || limitValue > 100) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: 'Invalid limit parameter. Must be an integer between 1 and 100.',
      });
    }
  }

  const page = Math.max(1, Math.min(10000, Number(rawPage) || 1));
  const limit = Math.max(1, Math.min(100, Number(rawLimit) || 20));
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const type = String(req.query.type || '').trim();
  const location = String(req.query.location || '').trim();
  const skip = (page - 1) * limit;

  const where: any = {};
  const andConditions: any[] = [];
  
  if (status) where.serv_provider_status = status;
  
  if (type) {
    // Case-insensitive type matching - try multiple variations
    andConditions.push({
      OR: [
        { serv_provider_type: type },
        { serv_provider_type: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() },
        { serv_provider_type: type.toLowerCase() },
        { serv_provider_type: type.toUpperCase() },
      ]
    });
  }
  
  // Optional location filter (only apply if explicitly provided)
  if (location && location.length > 0) {
    where.serv_provider_location = { contains: location, mode: 'insensitive' };
  }
  
  if (search) {
    andConditions.push({
      OR: [
        { serv_provider_name: { contains: search, mode: 'insensitive' } },
        { serv_provider_email: { contains: search, mode: 'insensitive' } },
        { serv_provider_desc: { contains: search, mode: 'insensitive' } },
      ]
    });
  }
  
  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const [items, count] = await Promise.all([
    prisma.pIQ_Service_Provider.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      select: {
        service_provider_id: true,
        serv_provider_name: true,
        serv_provider_email: true,
        serv_provider_contact_nbr: true,
        serv_provider_type: true,
        serv_provider_desc: true,
        serv_provider_status: true,
        serv_provider_location: true,
        serv_provider_certificates: true,
        serv_provider_exp_years: true,
        provider_src: true,
        is_provider_bgchecked: true,
        created_at: true,
        last_updated_dtm: true,
      },
    }),
    prisma.pIQ_Service_Provider.count({ where }),
  ]);

  // Normalize for UI
  const results = (items || []).map((p: any) => ({
    id: p.service_provider_id,
    name: p.serv_provider_name || 'Provider',
    email: p.serv_provider_email || '',
    phone: p.serv_provider_contact_nbr || '',
    type: p.serv_provider_type || 'Service Provider',
    specialty: p.provider_src || '',
    status: p.serv_provider_status || 'Pending Review',
    location: p.serv_provider_location || '',
    date: (p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : ''),
    documents: (p.serv_provider_certificates ? String(p.serv_provider_certificates).split(',').map((s) => s.trim()).filter(Boolean) : []),
    experience: p.serv_provider_exp_years ? `${p.serv_provider_exp_years} years` : '—',
    address: p.serv_provider_desc || '—',
    notes: '',
    verified: !!p.is_provider_bgchecked,
  }));

  res.status(httpStatus.OK).send({
    results,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
    totalResults: count || 0,
  });
});

export const getAdminMe = catchAsync(async (req: any, res) => {
  // req.admin should be set by auth middleware
  const adminId = req.admin?.admin_id;
  
  if (!adminId) {
    return res.status(httpStatus.UNAUTHORIZED).send({ 
      message: 'Unauthorized - Admin not found in request' 
    });
  }

  // Fetch full admin profile from database
  const admin = await prisma.pIQ_Admins.findUnique({
    where: { admin_id: adminId },
    select: {
      admin_id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
    },
  });

  if (!admin) {
    return res.status(httpStatus.UNAUTHORIZED).send({ 
      message: 'Admin not found in database' 
    });
  }

  return res.status(httpStatus.OK).send({
    id: Number(admin.admin_id),
    name: admin.name,
    email: admin.email,
    role: admin.role || 'admin',
    createdAt: admin.created_at,
  });
});

export const getAppointments = catchAsync(async (req, res) => {
  const rawPage = req.query.page;
  const rawLimit = req.query.limit;

  if (rawPage !== undefined) {
    const pageValue = Number(rawPage);
    if (!Number.isFinite(pageValue) || pageValue < 1 || pageValue > 10000) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: 'Invalid page parameter. Must be an integer between 1 and 10000.',
      });
    }
  }

  if (rawLimit !== undefined) {
    const limitValue = Number(rawLimit);
    if (!Number.isFinite(limitValue) || limitValue < 1 || limitValue > 100) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: 'Invalid limit parameter. Must be an integer between 1 and 100.',
      });
    }
  }

  const page = Math.max(1, Math.min(10000, Number(rawPage) || 1));
  const limit = Math.max(1, Math.min(100, Number(rawLimit) || 20));
  const petIdsParam = String(req.query.petIds || '').trim();
  const skip = (page - 1) * limit;

  const where: any = {};
  if (petIdsParam) {
    // Validate and convert pet IDs
    const petIdStrings = petIdsParam.split(',').map(id => id.trim()).filter(id => id && /^\d+$/.test(id));
    
    if (petIdStrings.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: 'Invalid petIds format. Must be comma-separated positive integers.',
      });
    }
    
    const petIds = petIdStrings.map(id => BigInt(id));
    where.pet_id = { in: petIds };
  }

  const [appointments, count] = await Promise.all([
    prisma.pIQ_Appointments.findMany({
      where,
      orderBy: { appointment_date: 'desc' },
      skip,
      take: limit,
      include: { PIQ_Pets: { select: { pet_name: true } } },
    }),
    prisma.pIQ_Appointments.count({ where }),
  ]);

  const enriched = (appointments || []).map((a: any) => ({
    id: a.appointment_id,
    petId: a.pet_id,
    petName: a.PIQ_Pets?.pet_name || '',
    type: a.appointment_type || 'Appointment',
    date: a.appointment_date || null,
    status: a.appointment_status || 'pending',
    comments: a.appointment_comments || '',
  }));

  res.status(httpStatus.OK).send({
    results: enriched,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
    totalResults: count || 0,
  });
});

export default {
  getStats,
  getUsers,
  getPets,
  getRoles,
  getProviders,
  getAdminMe,
  getAppointments,
};
