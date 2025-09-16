import httpStatus from 'http-status';
import { ApiError } from '../../utils/ApiError.js';
import prisma from '../../../lib/prisma.js';

const getProviderById = async (id: number) => {
  const provider = await prisma.pIQ_Service_Provider.findUnique({
    where: { service_provider_id: id },
    select: {
      service_provider_id: true,
      serv_provider_name: true,
      serv_provider_email: true,
      serv_provider_contact_nbr: true,
      serv_provider_desc: true,
      serv_provider_type: true,
    },
  });

  if (!provider) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Provider not found');
  }
  // For now, we will return mock data for dashboard components
  const mockDashboardData = {
    upcomingAppointments: [
        { id: 1, date: '2023-07-22', time: '10:00 AM', client: 'Sarah Johnson', pet: 'Max (Golden Retriever)', service: 'Checkup' },
        { id: 2, date: '2023-07-22', time: '2:30 PM', client: 'Michael Chen', pet: 'Luna (Siamese Cat)', service: 'Vaccination' },
        { id: 3, date: '2023-07-23', time: '11:15 AM', client: 'Emma Wilson', pet: 'Charlie (Labrador)', service: 'Dental Cleaning' }
      ],
    recentReviews: [
        { id: 1, client: 'David Miller', rating: 5, comment: 'Dr. Wilson was amazing with my anxious dog. Very patient and knowledgeable!', date: '2023-07-20' },
        { id: 2, client: 'Jessica Lee', rating: 4, comment: 'Great service, but had to wait a bit longer than expected.', date: '2023-07-18' }
      ],
    performance: {
        earnings: 5250,
        newClients: 12,
        rating: 4.8
    }
  };

  return { ...provider, ...mockDashboardData };
};

const updateProviderProfile = async (id: number, body: any) => {
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

export const providerService = {
  getProviderById,
  updateProviderProfile,
  // Mock-backed appointment APIs until provider-appointment link exists in schema
  getUpcomingAppointments: async (id: number) => {
    // Reuse mock data defined in getProviderById for consistency
    const base = await getProviderById(id);
    return base.upcomingAppointments || [];
  },
  getAppointments: async (_id: number, { page = 1, limit = 10 }: { page?: number; limit?: number }) => {
    const items = [
      { id: 101, date: '2023-07-20', time: '09:30 AM', client: 'Anita', pet: 'Bruno (Beagle)', service: 'Checkup', status: 'Completed' },
      { id: 102, date: '2023-07-21', time: '01:00 PM', client: 'Raj', pet: 'Simba (Persian Cat)', service: 'Vaccination', status: 'Scheduled' },
      { id: 103, date: '2023-07-22', time: '04:00 PM', client: 'Karan', pet: 'Rocky (GSD)', service: 'Training', status: 'Scheduled' },
    ];
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);
    return { items: paged, page, limit, total: items.length, pages: Math.ceil(items.length / limit) };
  },
  updateAppointmentStatus: async (_id: number, apptId: number, status: 'Scheduled' | 'Cancelled' | 'Completed') => {
    return { id: apptId, status, updated: true };
  },
};
