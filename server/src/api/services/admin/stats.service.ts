import prisma from '../../../lib/prisma.js';

/**
 * Get dashboard statistics
 */
const getDashboardStats = async () => {
  // Get total counts
  const [users, pets, appointments, providers] = await Promise.all([
    prisma.pIQ_User.count(),
    prisma.pIQ_Pets.count(),
    prisma.pIQ_Appointments.count(),
    prisma.pIQ_Service_Provider.count({ where: { serv_provider_status: 'active' } }),
  ]);

  return {
    users,
    pets,
    providers,
  };
};

/**
 * Get provider counts by service type (6 specific types)
 */
const getProviderCountsByType = async () => {
  const providers = await prisma.pIQ_Service_Provider.findMany({
    where: {
      serv_provider_status: 'active',
    },
    select: {
      service_provider_id: true,
      serv_provider_type: true,
    },
  });

  // Initialize counts for all 6 service types
  const typeCounts: Record<string, number> = {
    'veterinary': 0,
    'diagnostic services': 0,
    'boarding': 0,
    'grooming': 0,
    'training': 0,
    'physical activity': 0,
  };
  
  // Count providers by type
  providers.forEach((provider: any) => {
    const type = (provider.serv_provider_type || '').toLowerCase().trim();
    
    // Map variations to standard types
    if (type === 'veterinarian' || type === 'vet' || type === 'veterinary') {
      typeCounts['veterinary']++;
    } else if (type === 'diagnostic services' || type === 'diagnostics') {
      typeCounts['diagnostic services']++;
    } else if (type === 'boarding') {
      typeCounts['boarding']++;
    } else if (type === 'groomer' || type === 'grooming') {
      typeCounts['grooming']++;
    } else if (type === 'trainer' || type === 'training') {
      typeCounts['training']++;
    } else if (type === 'physical activity' || type === 'pet sitter' || type === 'pet sitting') {
      typeCounts['physical activity']++;
    }
  });

  // Return all 6 service types (even if count is 0)
  const serviceTypes = [
    {
      type: 'Veterinary',
      count: typeCounts['veterinary'],
      icon: 'stethoscope',
      color: 'indigo',
    },
    {
      type: 'Diagnostic Services',
      count: typeCounts['diagnostic services'],
      icon: 'microscope',
      color: 'purple',
    },
    {
      type: 'Boarding',
      count: typeCounts['boarding'],
      icon: 'home',
      color: 'blue',
    },
    {
      type: 'Grooming',
      count: typeCounts['grooming'],
      icon: 'cut',
      color: 'pink',
    },
    {
      type: 'Training',
      count: typeCounts['training'],
      icon: 'graduation-cap',
      color: 'green',
    },
    {
      type: 'Physical Activity',
      count: typeCounts['physical activity'],
      icon: 'running',
      color: 'amber',
    },
  ];

  return serviceTypes;
};

/**
 */
const getUserStats = async (userId: number) => {
  const userIdBigInt = BigInt(userId);
  
  // Get pets count
  const pets = await prisma.pIQ_Pets.count({ where: { user_id: userIdBigInt } });
  
  // Get appointments count through pets
  const userPets = await prisma.pIQ_Pets.findMany({
    where: { user_id: userIdBigInt },
    select: { pet_id: true }
  });
  
  const petIds = userPets.map(p => p.pet_id);
  const appointments = petIds.length > 0 
    ? await prisma.pIQ_Appointments.count({ where: { pet_id: { in: petIds } } })
    : 0;

  return {
    pets,
    appointments,
  };
};

/**
 * Get stats for multiple users at once
 */
const getBulkUserStats = async (userIds: number[]) => {
  const bigIntIds = userIds.map(id => BigInt(id));
  
  // Get pets grouped by user
  const petsData = await prisma.pIQ_Pets.groupBy({
    by: ['user_id'],
    where: { user_id: { in: bigIntIds } },
    _count: true,
  });

  // Create a map of user stats
  const statsMap: Record<string, { pets: number; appointments: number }> = {};
  
  userIds.forEach(id => {
    statsMap[id] = { pets: 0, appointments: 0 };
  });

  // Set pet counts
  petsData.forEach((item: any) => {
    const userId = Number(item.user_id);
    statsMap[userId].pets = item._count;
  });

  // Get all pets for these users to count appointments
  const allPets = await prisma.pIQ_Pets.findMany({
    where: { user_id: { in: bigIntIds } },
    select: { pet_id: true, user_id: true }
  });

  // Group appointments by user through pets
  for (const userId of userIds) {
    const userPets = allPets.filter(p => Number(p.user_id) === userId);
    const petIds = userPets.map(p => p.pet_id);
    
    if (petIds.length > 0) {
      const appointmentCount = await prisma.pIQ_Appointments.count({
        where: { pet_id: { in: petIds } }
      });
      statsMap[userId].appointments = appointmentCount;
    }
  }

  return statsMap;
};

export const statsService = {
  getDashboardStats,
  getProviderCountsByType,
  getUserStats,
  getBulkUserStats,
};
