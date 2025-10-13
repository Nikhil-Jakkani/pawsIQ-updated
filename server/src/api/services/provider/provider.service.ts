import httpStatus from 'http-status';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { ApiError } from '../../utils/ApiError.js';
import prisma from '../../../lib/prisma.js';
import { db as supabaseClient } from '../../../config/db.js';

const db = prisma as any;

const PROVIDER_PHOTO_BUCKET = 'provider-photos';
const PROVIDER_DOCUMENT_BUCKET = 'provider-documents';
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 24;

const ensuredBuckets = new Set<string>();

const sanitizeFileName = (fileName: string) => {
  const safeName = (fileName || 'file').trim().replace(/\s+/g, '_');
  return safeName.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const normalizeTextValue = (value: any) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => (item === null || item === undefined ? null : String(item).trim()))
      .filter((item) => item && item.length > 0);
    return cleaned.length > 0 ? cleaned.join(', ') : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  return value;
};

const extractStoragePath = (value: any) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'object' && value) {
    if ('path' in value && value.path) return String(value.path);
    if ('storagePath' in value && value.storagePath) return String(value.storagePath);
    if ('url' in value && value.url) return String(value.url);
  }
  return normalizeTextValue(value);
};

const stringifyIfObject = (value: any) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return null;
    }
  }
  return normalizeTextValue(value);
};

const ensureBucket = async (
  bucket: string,
  options: { public?: boolean; fileSizeLimit?: number } = {},
) => {
  if (ensuredBuckets.has(bucket)) return;
  try {
    const { data, error } = await supabaseClient.storage.listBuckets();
    if (!error) {
      const exists = data?.some((entry: any) => entry.name === bucket);
      if (!exists) {
        const bucketOptions: any = { public: options.public ?? false };
        if (options.fileSizeLimit !== undefined) {
          bucketOptions.fileSizeLimit = options.fileSizeLimit;
        }
        await supabaseClient.storage.createBucket(bucket, bucketOptions);
      }
    } else {
      const bucketOptions: any = { public: options.public ?? false };
      if (options.fileSizeLimit !== undefined) {
        bucketOptions.fileSizeLimit = options.fileSizeLimit;
      }
      await supabaseClient.storage.createBucket(bucket, bucketOptions);
    }
  } catch (error: any) {
    const message = String(error?.message || '').toLowerCase();
    if (!message.includes('exists')) {
      console.warn('Failed ensuring Supabase bucket', bucket, error);
    }
  }
  ensuredBuckets.add(bucket);
};

const generateSignedUpload = async (bucket: string, path: string) => {
  const { data, error } = await supabaseClient.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate upload URL');
  }
  return {
    uploadUrl: data.signedUrl,
    path,
    token: data.token,
    bucket,
  };
};

const getSignedFileUrl = async (bucket: string, path: string, expirySeconds = SIGNED_URL_EXPIRY_SECONDS) => {
  if (!path) return null;
  const { data, error } = await supabaseClient.storage.from(bucket).createSignedUrl(path, expirySeconds);
  if (error || !data) {
    return null;
  }
  return data.signedUrl;
};

const buildPhotoPath = (providerId: number, fileName: string, variant: string) => {
  const cleanVariant = sanitizeFileName(variant || 'profile');
  const cleanFileName = sanitizeFileName(fileName);
  return `${providerId}/${cleanVariant}/${Date.now()}-${randomUUID()}-${cleanFileName}`;
};

const buildDocumentPath = (providerId: number, documentType: string, fileName: string) => {
  const cleanType = sanitizeFileName(documentType || 'document');
  const cleanFileName = sanitizeFileName(fileName);
  return `${providerId}/${cleanType}/${Date.now()}-${randomUUID()}-${cleanFileName}`;
};

const generateProviderPhotoUploadUrl = async (
  providerId: number,
  { fileName, variant = 'profile' }: { fileName: string; variant?: 'profile' | 'cover' | 'gallery' | string },
) => {
  if (!fileName) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'fileName is required');
  }

  await ensureBucket(PROVIDER_PHOTO_BUCKET, { public: true });
  const path = buildPhotoPath(providerId, fileName, variant);
  const upload = await generateSignedUpload(PROVIDER_PHOTO_BUCKET, path);
  const { data } = supabaseClient.storage.from(PROVIDER_PHOTO_BUCKET).getPublicUrl(path);

  return {
    ...upload,
    publicUrl: data?.publicUrl ?? null,
  };
};

const generateProviderDocumentUploadUrl = async (
  providerId: number,
  { fileName, documentType }: { fileName: string; documentType: string },
) => {
  if (!fileName || !documentType) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'fileName and documentType are required');
  }

  await ensureBucket(PROVIDER_DOCUMENT_BUCKET, { public: false });
  const path = buildDocumentPath(providerId, documentType, fileName);
  return generateSignedUpload(PROVIDER_DOCUMENT_BUCKET, path);
};

const listProviderDocuments = async (providerId: number) => {
  const documents = await prisma.pIQ_Provider_Documents.findMany({
    where: { service_provider_id: providerId },
    orderBy: { uploaded_at: 'desc' },
  });

  const docsWithUrls = await Promise.all(
    documents.map(async (doc) => {
      const signedUrl = await getSignedFileUrl(PROVIDER_DOCUMENT_BUCKET, doc.document_url);
      return {
        document_id: doc.document_id,
        document_type: doc.document_type,
        document_url: doc.document_url,
        status: doc.status,
        uploaded_at: doc.uploaded_at,
        verified_at: doc.verified_at,
        remarks: doc.remarks,
        signedUrl,
      };
    }),
  );

  return docsWithUrls;
};

const saveProviderDocument = async (
  providerId: number,
  document: { documentType: string; storagePath: string },
) => {
  if (!document.documentType || !document.storagePath) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'documentType and storagePath are required');
  }

  const record = await prisma.pIQ_Provider_Documents.create({
    data: {
      service_provider_id: providerId,
      document_type: document.documentType,
      document_url: document.storagePath,
      status: 'pending',
    },
  });

  const signedUrl = await getSignedFileUrl(PROVIDER_DOCUMENT_BUCKET, record.document_url);
  return { ...record, signedUrl };
};

const deleteProviderDocument = async (providerId: number, documentId: number) => {
  const document = await prisma.pIQ_Provider_Documents.findUnique({
    where: { document_id: documentId },
  });

  if (!document || document.service_provider_id !== providerId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Document not found');
  }

  if (document.document_url) {
    await supabaseClient.storage.from(PROVIDER_DOCUMENT_BUCKET).remove([document.document_url]);
  }

  await prisma.pIQ_Provider_Documents.delete({
    where: { document_id: documentId },
  });

  return { success: true };
};

const updateProviderPassword = async (
  providerId: number,
  { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
) => {
  if (!currentPassword || !newPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Current and new password are required');
  }

  const provider = await prisma.pIQ_Service_Provider.findUnique({
    where: { service_provider_id: providerId },
    select: { serv_provider_password: true },
  });

  if (!provider) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provider not found');
  }

  const stored = provider.serv_provider_password ?? '';
  let matches = false;
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    matches = await bcrypt.compare(currentPassword, stored);
  } else {
    matches = stored === currentPassword;
  }

  if (!matches) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Current password is incorrect');
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.pIQ_Service_Provider.update({
    where: { service_provider_id: providerId },
    data: { serv_provider_password: hashed },
  });

  return { success: true };
};

type ListProvidersOptions = {
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
};

const normalizeType = (value?: string) => {
  if (!value) return null;
  return value.trim().toLowerCase();
};

const normalizeStatus = (value?: string) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (['active', 'approved'].includes(normalized)) return 'active';
  if (['pending', 'pending review', 'inactive'].includes(normalized)) return 'inactive';
  if (['rejected', 'declined'].includes(normalized)) return 'rejected';
  return normalized;
};

const listProviders = async (options: ListProvidersOptions = {}) => {
  const {
    type,
    status,
    search,
    page = 1,
    limit = 50,
  } = options;

  const currentPage = Math.max(1, page);
  const take = Math.min(100, Math.max(1, limit));
  const skip = (currentPage - 1) * take;

  const where: any = {};

  const normalizedType = normalizeType(type);
  if (normalizedType) {
    where.serv_provider_type = {
      contains: normalizedType,
      mode: 'insensitive',
    };
  }

  const normalizedStatus = normalizeStatus(status);
  if (normalizedStatus) {
    where.serv_provider_status = normalizedStatus;
  }

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { serv_provider_name: { contains: term, mode: 'insensitive' } },
      { serv_provider_email: { contains: term, mode: 'insensitive' } },
      { serv_provider_contact_nbr: { contains: term, mode: 'insensitive' } },
    ];
  }

  const [results, total] = await Promise.all([
    prisma.pIQ_Service_Provider.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take,
    }),
    prisma.pIQ_Service_Provider.count({ where }),
  ]);

  return {
    results,
    page: currentPage,
    limit: take,
    totalResults: total,
    totalPages: Math.ceil(total / take),
  };
};

const getProviderById = async (id: number) => {
  const provider = await prisma.pIQ_Service_Provider.findUnique({
    where: { service_provider_id: id } as any,
    select: {
      service_provider_id: true,
      serv_provider_name: true,
      serv_provider_email: true,
      serv_provider_contact_nbr: true,
      serv_provider_desc: true,
      serv_provider_type: true,
      serv_provider_status: true,
      serv_provider_exp_years: true,
      serv_provider_certificates: true,
      serv_provider_location: true,
      provider_src: true,
      is_provider_bgchecked: true,
      created_at: true,
      last_updated_dtm: true,
      profile_photo_url: true,
      cover_photo_url: true,
      clinic_name: true,
      clinic_phone: true,
      clinic_website: true,
      clinic_hours: true,
      clinic_address_line1: true,
      clinic_address_line2: true,
      clinic_city: true,
      clinic_state: true,
      clinic_postal_code: true,
      clinic_country: true,
      specializations: true,
      languages_spoken: true,
      PIQ_Provider_Billing: {
        select: {
          payout_method: true,
          account_holder_name: true,
          account_number: true,
          bank_name: true,
          bank_branch: true,
          ifsc_code: true,
          upi_id: true,
          pan_number: true,
          gst_number: true,
          tax_status: true,
          payout_frequency: true,
          billing_address_line1: true,
          billing_address_line2: true,
          billing_city: true,
          billing_state: true,
          billing_postal_code: true,
          billing_country: true,
          notes: true,
        },
      },
    } as any,
  });

  if (!provider) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provider not found');
  }

  const todayIso = new Date();

  // Fetch related data with error handling
  let upcomingBookings: any[] = [];
  let reviews: any[] = [];
  let metricsRecord: any = null;
  let payoutsSummary: any[] = [];

  try {
    // Fetch bookings - using prisma directly for better error handling
    upcomingBookings = await prisma.pIQ_Bookings.findMany({
      where: {
        service_provider_id: id,
        booked_dtm: { gte: todayIso },
        booking_status: { in: ['Pending', 'Confirmed'] },
      },
      orderBy: { booked_dtm: 'asc' },
      take: 10,
      include: {
        PIQ_User: { select: { user_full_name: true } },
        PIQ_Pets: { select: { pet_name: true, pet_type: true } },
        PIQ_Service_Master: { select: { service_title: true, service_type: true } },
      },
    }).catch(() => []);
  } catch (error) {
    console.warn('Error fetching provider dashboard data:', error);
  }

  // Try to fetch reviews if table exists
  try {
    reviews = await (prisma as any).ProviderReviews?.findMany({
      where: { service_provider_id: id },
      orderBy: { reviewed_at: 'desc' },
      take: 5,
    }) || [];
  } catch (error) {
    // Table doesn't exist, skip
  }

  // Try to fetch metrics if table exists
  try {
    metricsRecord = await (prisma as any).ProviderDashboardMetrics?.findFirst({
      where: { service_provider_id: id },
      orderBy: { metric_date: 'desc' },
    }) || null;
  } catch (error) {
    // Table doesn't exist, skip
  }

  // Try to fetch payouts if table exists
  try {
    payoutsSummary = await (prisma as any).ProviderPayouts?.groupBy({
      by: ['status'],
      where: { service_provider_id: id },
      _sum: { amount: true },
      _count: { payout_id: true },
    }) || [];
  } catch (error) {
    // Table doesn't exist, skip
  }

  const upcomingAppointments = upcomingBookings.map((booking: any) => ({
    id: booking.booking_id,
    date: booking.booked_dtm,
    status: booking.booking_status,
    client: booking.PIQ_User?.user_full_name ?? null,
    pet: booking.PIQ_Pets?.pet_name ?? null,
    petType: booking.PIQ_Pets?.pet_type ?? null,
    service: booking.PIQ_Service_Master?.service_title ?? booking.PIQ_Service_Master?.service_type ?? null,
  }));

  const recentReviews = reviews.map((review: any) => ({
    id: review.review_id,
    rating: review.rating,
    comment: review.review_text,
    reviewedAt: review.reviewed_at,
    client: null, // Will be populated if needed
    bookingId: review.booking_id,
  }));

  const performance = {
    earnings: Number(metricsRecord?.earnings ?? 0),
    totalBookings: metricsRecord?.total_bookings ?? 0,
    completedBookings: metricsRecord?.completed_bookings ?? 0,
    cancelledBookings: metricsRecord?.cancelled_bookings ?? 0,
    newClients: metricsRecord?.new_clients ?? 0,
    rating: metricsRecord?.average_rating ? Number(metricsRecord.average_rating) : null,
    payoutSummary: payoutsSummary.map((row: any) => ({
      status: row.status,
      totalAmount: row._sum.amount ? Number(row._sum.amount) : 0,
      count: row._count.payout_id,
    })),
  };

  // Generate signed URLs for profile photos
  let profilePhotoUrl: any = provider.profile_photo_url;
  let coverPhotoUrl: any = provider.cover_photo_url;

  if (profilePhotoUrl && typeof profilePhotoUrl === 'string' && !profilePhotoUrl.startsWith('http')) {
    const signedUrl = await getSignedFileUrl(PROVIDER_PHOTO_BUCKET, profilePhotoUrl);
    profilePhotoUrl = signedUrl || profilePhotoUrl;
  }

  if (coverPhotoUrl && typeof coverPhotoUrl === 'string' && !coverPhotoUrl.startsWith('http')) {
    const signedUrl = await getSignedFileUrl(PROVIDER_PHOTO_BUCKET, coverPhotoUrl);
    coverPhotoUrl = signedUrl || coverPhotoUrl;
  }

  return {
    ...provider,
    profile_photo_url: profilePhotoUrl,
    cover_photo_url: coverPhotoUrl,
    upcomingAppointments,
    recentReviews,
    performance,
  };
};

const getAvailability = async (providerId: number, opts: { start?: string; end?: string }) => {
  const where: any = { service_provider_id: providerId };
  if (opts.start) where.start_time = { gte: new Date(opts.start) };
  if (opts.end) where.end_time = { lte: new Date(opts.end) };

  const items = await db.ProviderAvailability.findMany({
    where,
    orderBy: { start_time: 'asc' },
    include: { service: { select: { services_id: true, service_title: true, service_type: true } } },
  });

  return items.map((slot: any) => ({
    id: slot.availability_id,
    serviceId: slot.services_id,
    start: slot.start_time,
    end: slot.end_time,
    capacity: slot.capacity,
    isRecurring: slot.is_recurring,
    recurrenceRule: slot.recurrence_rule,
    serviceTitle: slot.service?.service_title ?? null,
    serviceType: slot.service?.service_type ?? null,
  }));
};

const upsertAvailability = async (
  providerId: number,
  entries: Array<{
    availability_id?: number;
    services_id?: number | null;
    start_time: string;
    end_time: string;
    capacity?: number;
    is_recurring?: boolean;
    recurrence_rule?: string | null;
  }>,
) => {
  const results = [] as any[];
  await prisma.$transaction(async (tx) => {
    for (const entry of entries) {
      const data = {
        service_provider_id: providerId,
        services_id: entry.services_id ?? null,
        start_time: new Date(entry.start_time),
        end_time: new Date(entry.end_time),
        capacity: entry.capacity ?? 1,
        is_recurring: entry.is_recurring ?? false,
        recurrence_rule: entry.recurrence_rule ?? null,
      };

      if (entry.availability_id) {
        const updated = await (tx as any).ProviderAvailability.update({
          where: { availability_id: entry.availability_id, service_provider_id: providerId },
          data,
        });
        results.push(updated);
      } else {
        const created = await (tx as any).ProviderAvailability.create({ data });
        results.push(created);
      }
    }
  });
  return results;
};

const deleteAvailability = async (providerId: number, availabilityId: number) => {
  await db.ProviderAvailability.delete({
    where: { availability_id: availabilityId, service_provider_id: providerId },
  });
  return { success: true };
};

const listPricing = async (providerId: number) => {
  const now = new Date();
  const records = await db.ProviderServicePricing.findMany({
    where: { service_provider_id: providerId },
    orderBy: [{ services_id: 'asc' }, { effective_from: 'desc' }],
    include: { service: { select: { services_id: true, service_title: true, service_type: true, service_price_amt: true } } },
  });

  return records.map((price: any) => ({
    id: price.pricing_id,
    serviceId: price.services_id,
    serviceTitle: price.service?.service_title ?? null,
    serviceType: price.service?.service_type ?? null,
    defaultPrice: price.service?.service_price_amt ?? null,
    basePrice: price.base_price,
    discountPercent: price.discount_percent,
    currency: price.currency,
    effectiveFrom: price.effective_from,
    effectiveTo: price.effective_to,
    isActive: !price.effective_to || price.effective_to > now,
  }));
};

const upsertPricing = async (
  providerId: number,
  payload: Array<{
    pricing_id?: number;
    services_id: number;
    base_price?: number;
    discount_percent?: number;
    currency?: string;
    effective_from?: string;
    effective_to?: string | null;
  }>,
) => {
  const results = [] as any[];
  await prisma.$transaction(async (tx) => {
    for (const entry of payload) {
      const data = {
        service_provider_id: providerId,
        services_id: entry.services_id,
        base_price: entry.base_price ?? 0,
        discount_percent: entry.discount_percent ?? 0,
        currency: entry.currency ?? 'INR',
        effective_from: entry.effective_from ? new Date(entry.effective_from) : new Date(),
        effective_to: entry.effective_to ? new Date(entry.effective_to) : null,
      };
      if (entry.pricing_id) {
        const updated = await (tx as any).ProviderServicePricing.update({
          where: { pricing_id: entry.pricing_id, service_provider_id: providerId },
          data,
        });
        results.push(updated);
      } else {
        const created = await (tx as any).ProviderServicePricing.create({ data });
        results.push(created);
      }
    }
  });
  return results;
};

const deletePricing = async (providerId: number, pricingId: number) => {
  await db.ProviderServicePricing.delete({
    where: { pricing_id: pricingId, service_provider_id: providerId },
  });
  return { success: true };
};

const listPayouts = async (providerId: number, opts: { status?: string; page?: number; limit?: number }) => {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 10));
  const skip = (page - 1) * limit;
  const where: any = { service_provider_id: providerId };
  if (opts.status) where.status = opts.status;

  const [items, total] = await Promise.all([
    db.ProviderPayouts.findMany({
      where,
      orderBy: { initiated_at: 'desc' },
      skip,
      take: limit,
    }),
    db.ProviderPayouts.count({ where }),
  ]);

  return {
    items: items.map((row: any) => ({
      id: row.payout_id,
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
      initiatedAt: row.initiated_at,
      settledAt: row.settled_at,
      referenceNumber: row.reference_number,
      remarks: row.remarks,
    })),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};

const listReviews = async (providerId: number, opts: { page?: number; limit?: number; rating?: number }) => {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 10));
  const skip = (page - 1) * limit;
  const where: any = { service_provider_id: providerId };
  if (opts.rating) where.rating = opts.rating;

  const [items, total] = await Promise.all([
    db.ProviderReviews.findMany({
      where,
      orderBy: { reviewed_at: 'desc' },
      skip,
      take: limit,
    }),
    db.ProviderReviews.count({ where }),
  ]);

  return {
    items: items.map((review: any) => ({
      id: review.review_id,
      rating: review.rating,
      comment: review.review_text,
      reviewedAt: review.reviewed_at,
      bookingId: review.booking_id,
      userId: review.user_id,
      bookingDate: null, // Can be populated separately if needed
      clientName: null, // Can be populated separately if needed
      clientEmail: null, // Can be populated separately if needed
    })),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};

const buildProfileUpdateData = (body: any) => {
  const profileFieldConfig: Array<{
    column: string;
    keys: string[];
    transform?: (value: any) => any;
  }> = [
    { column: 'serv_provider_name', keys: ['serv_provider_name', 'provider_name', 'name'] },
    { column: 'serv_provider_contact_nbr', keys: ['serv_provider_contact_nbr', 'provider_contact_number', 'phone'] },
    { column: 'serv_provider_desc', keys: ['serv_provider_desc', 'provider_desc', 'description'] },
    { column: 'serv_provider_exp_years', keys: ['serv_provider_exp_years', 'provider_experience_years', 'experience_years', 'experience'] },
    { column: 'serv_provider_certificates', keys: ['serv_provider_certificates', 'provider_certificates', 'certificates'] },
    { column: 'serv_provider_insta_acct_dtls', keys: ['serv_provider_insta_acct_dtls', 'provider_insta', 'instagram'] },
    { column: 'serv_provider_fb_acct_dtls', keys: ['serv_provider_fb_acct_dtls', 'provider_fb', 'facebook'] },
    { column: 'serv_provider_location', keys: ['serv_provider_location', 'provider_location', 'location'] },
    { column: 'profile_photo_url', keys: ['profile_photo_url', 'profilePhotoUrl', 'profile_photo', 'profilePhoto'], transform: extractStoragePath },
    { column: 'cover_photo_url', keys: ['cover_photo_url', 'coverPhotoUrl', 'cover_photo', 'coverPhoto'], transform: extractStoragePath },
    { column: 'clinic_name', keys: ['clinic_name', 'clinicName'] },
    { column: 'clinic_phone', keys: ['clinic_phone', 'clinicPhone'] },
    { column: 'clinic_website', keys: ['clinic_website', 'clinicWebsite', 'website'] },
    { column: 'clinic_hours', keys: ['clinic_hours', 'clinicHours'], transform: stringifyIfObject },
    { column: 'clinic_address_line1', keys: ['clinic_address_line1', 'clinicAddressLine1'] },
    { column: 'clinic_address_line2', keys: ['clinic_address_line2', 'clinicAddressLine2'] },
    { column: 'clinic_city', keys: ['clinic_city', 'clinicCity'] },
    { column: 'clinic_state', keys: ['clinic_state', 'clinicState'] },
    { column: 'clinic_postal_code', keys: ['clinic_postal_code', 'clinicPostalCode', 'clinic_zip', 'clinicZip'] },
    { column: 'clinic_country', keys: ['clinic_country', 'clinicCountry'] },
    { column: 'specializations', keys: ['specializations', 'specialization'], transform: normalizeTextValue },
    { column: 'languages_spoken', keys: ['languages_spoken', 'languagesSpoken', 'languages'], transform: normalizeTextValue },
  ];

  const profileData: Record<string, any> = {};
  for (const field of profileFieldConfig) {
    for (const key of field.keys) {
      if (body[key] !== undefined) {
        const transformed = field.transform ? field.transform(body[key]) : normalizeTextValue(body[key]);
        profileData[field.column] = transformed;
        break;
      }
    }
  }

  return profileData;
};

const buildBillingPayload = (billing: any) => {
  if (!billing) return undefined;

  const billingFieldConfig: Array<{
    column: string;
    keys: string[];
  }> = [
    { column: 'payout_method', keys: ['payout_method', 'payoutMethod'] },
    { column: 'account_holder_name', keys: ['account_holder_name', 'accountHolderName'] },
    { column: 'account_number', keys: ['account_number', 'accountNumber'] },
    { column: 'bank_name', keys: ['bank_name', 'bankName'] },
    { column: 'bank_branch', keys: ['bank_branch', 'bankBranch'] },
    { column: 'ifsc_code', keys: ['ifsc_code', 'ifscCode'] },
    { column: 'upi_id', keys: ['upi_id', 'upiId'] },
    { column: 'pan_number', keys: ['pan_number', 'panNumber'] },
    { column: 'gst_number', keys: ['gst_number', 'gstNumber'] },
    { column: 'tax_status', keys: ['tax_status', 'taxStatus'] },
    { column: 'payout_frequency', keys: ['payout_frequency', 'payoutFrequency'] },
    { column: 'billing_address_line1', keys: ['billing_address_line1', 'billingAddressLine1'] },
    { column: 'billing_address_line2', keys: ['billing_address_line2', 'billingAddressLine2'] },
    { column: 'billing_city', keys: ['billing_city', 'billingCity'] },
    { column: 'billing_state', keys: ['billing_state', 'billingState'] },
    { column: 'billing_postal_code', keys: ['billing_postal_code', 'billingPostalCode', 'billing_zip', 'billingZip'] },
    { column: 'billing_country', keys: ['billing_country', 'billingCountry'] },
    { column: 'notes', keys: ['notes', 'billing_notes', 'billingNotes'] },
  ];

  const payload: Record<string, any> = {};
  for (const field of billingFieldConfig) {
    for (const key of field.keys) {
      if (billing[key] !== undefined) {
        payload[field.column] = normalizeTextValue(billing[key]) ?? null;
        break;
      }
    }
  }

  return payload;
};

const updateProviderProfile = async (id: number, body: any) => {
  const profileData = buildProfileUpdateData(body);

  if (Object.keys(profileData).length === 0 && !body.billing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No valid fields to update');
  }

  if (Object.keys(profileData).length > 0) {
    await prisma.pIQ_Service_Provider.update({
      where: { service_provider_id: id },
      data: profileData,
    });
  }

  if (body.billing) {
    const billingPayload = buildBillingPayload(body.billing);
    await db.pIQ_Provider_Billing.upsert({
      where: { service_provider_id: id },
      update: billingPayload,
      create: {
        service_provider_id: id,
        ...billingPayload,
      },
    });
  }

  return getProviderById(id);
};

const adminUpdateProviderProfile = async (id: number, body: any) => {
  const allowedMap: Record<string, string> = {
    provider_name: 'serv_provider_name',
    provider_contact_number: 'serv_provider_contact_nbr',
    provider_desc: 'serv_provider_desc',
    provider_experience_years: 'serv_provider_exp_years',
    provider_certificates: 'serv_provider_certificates',
    provider_insta: 'serv_provider_insta_acct_dtls',
    provider_fb: 'serv_provider_fb_acct_dtls',
  };

  const data: any = {};
  for (const [key, dbKey] of Object.entries(allowedMap)) {
    if (body[key] !== undefined) data[dbKey] = body[key];
  }

  if (Object.keys(data).length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No valid fields to update');
  }

  const updated = await prisma.pIQ_Service_Provider.update({
    where: { service_provider_id: id },
    data,
  });

  if (!updated) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update provider profile');
  }

  return updated;
};

const updateProviderStatus = async (id: number, status: string) => {
  const normalizedStatus = normalizeStatus(status);

  if (!normalizedStatus || !['active', 'inactive', 'rejected'].includes(normalizedStatus)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid provider status');
  }

  const provider = await prisma.pIQ_Service_Provider.findUnique({
    where: { service_provider_id: id },
    select: { service_provider_id: true },
  });

  if (!provider) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provider not found');
  }

  const result = await db.pIQ_Service_Provider.update({
    where: { service_provider_id: Number(id) },
    data: {
      serv_provider_status: normalizedStatus,
      last_updated_dtm: new Date(),
    },
  });

  return result;
};

export const getAppointments = async (
  providerId: number,
  opts: { page?: number; limit?: number; status?: string },
) => {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(50, Math.max(1, opts.limit ?? 10));
  const skip = (page - 1) * limit;
  const where: any = { service_provider_id: providerId };
  if (opts.status) where.booking_status = opts.status;

  const [items, total] = await Promise.all([
    prisma.pIQ_Bookings.findMany({
      where,
      orderBy: { booked_dtm: 'desc' },
      skip,
      take: limit,
      include: {
        PIQ_User: { select: { user_full_name: true, user_email_id: true } },
        PIQ_Pets: { select: { pet_name: true, pet_type: true } },
        PIQ_Service_Master: { select: { service_title: true, service_type: true } },
      },
    }),
    db.pIQ_Bookings.count({ where }),
  ]);

  return {
    items: items.map((booking) => ({
      id: booking.booking_id,
      date: booking.booked_dtm,
      status: booking.booking_status,
      client: booking.PIQ_User?.user_full_name ?? null,
      clientEmail: booking.PIQ_User?.user_email_id ?? null,
      pet: booking.PIQ_Pets?.pet_name ?? null,
      petType: booking.PIQ_Pets?.pet_type ?? null,
      service: booking.PIQ_Service_Master?.service_title ?? booking.PIQ_Service_Master?.service_type ?? null,
      comments: booking.booking_comments ?? null,
    })),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};

const updateAppointmentStatus = async (
  providerId: number,
  appointmentId: number,
  status: 'Scheduled' | 'Cancelled' | 'Completed',
) => {
  const appointment = await db.pIQ_Appointments.findUnique({
    where: { appointment_id: appointmentId },
    select: { booking_id: true },
  }) as { booking_id: number | null } | null;

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Appointment not found');
  }

  if (!appointment.booking_id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Appointment not linked to a booking');
  }

  const booking = await db.pIQ_Bookings.findUnique({ where: { booking_id: appointment.booking_id } });

  if (!booking || booking.service_provider_id !== providerId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to update this appointment');
  }

  const updated = await prisma.pIQ_Appointments.update({
    where: { appointment_id: appointmentId },
    data: { appointment_status: status },
  });

  return updated;
};

export const providerService = {
  listProviders,
  getProviderById,
  updateProviderProfile,
  generateProviderPhotoUploadUrl,
  generateProviderDocumentUploadUrl,
  listProviderDocuments,
  saveProviderDocument,
  deleteProviderDocument,
  updateProviderPassword,
  getAvailability,
  upsertAvailability,
  deleteAvailability,
  listPricing,
  upsertPricing,
  deletePricing,
  listPayouts,
  listReviews,
  getAppointments,
  updateAppointmentStatus,
  updateProviderStatus,
};
