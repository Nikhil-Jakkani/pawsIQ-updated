// Notification type definitions and default mock data
export const NOTIFICATION_TYPES = {
  APPOINTMENT: 'appointment',
  ORDER: 'order',
  PET: 'pet',
  PROMOTION: 'promotion',
  SYSTEM: 'system',
};

export const NOTIFICATION_TYPE_LABELS = {
  appointment: 'Appointments',
  order: 'Orders',
  pet: 'Pets',
  promotion: 'Promotions',
  system: 'System',
};

export const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    type: 'appointment',
    title: 'Upcoming Appointment Reminder',
    message: 'Your appointment with Dr. Sarah Johnson for Max is tomorrow at 10:30 AM.',
    date: '2023-12-14T09:00:00',
    isRead: false,
    actionUrl: '/user/appointments/1'
  },
  {
    id: 2,
    type: 'order',
    title: 'Order Shipped',
    message: 'Your order #ORD-12346 has been shipped and is on its way to you.',
    date: '2023-12-12T14:30:00',
    isRead: true,
    actionUrl: '/user/orders/ORD-12346'
  },
  {
    id: 3,
    type: 'pet',
    title: 'Vaccination Due',
    message: 'Luna is due for her annual vaccinations. Book an appointment soon.',
    date: '2023-12-10T11:15:00',
    isRead: false,
    actionUrl: '/user/appointments/new'
  },
  {
    id: 4,
    type: 'promotion',
    title: 'Special Offer',
    message: 'Get 20% off on all pet grooming services this week. Use code: GROOM20',
    date: '2023-12-08T16:45:00',
    isRead: true,
    actionUrl: '/user/marketplace'
  },
  {
    id: 5,
    type: 'system',
    title: 'Account Security',
    message: 'We noticed a login from a new device. Please verify it was you.',
    date: '2023-12-05T08:20:00',
    isRead: false,
    actionUrl: '/user/settings/security'
  },
  {
    id: 6,
    type: 'order',
    title: 'Order Delivered',
    message: 'Your order #ORD-12345 has been delivered. Enjoy your purchase!',
    date: '2023-12-02T13:10:00',
    isRead: true,
    actionUrl: '/user/orders/ORD-12345'
  },
  {
    id: 7,
    type: 'pet',
    title: 'Pet Birthday',
    message: 'Max turns 4 years old today! Celebrate with a special treat.',
    date: '2023-11-30T10:00:00',
    isRead: true,
    actionUrl: '/user/pets/1'
  }
];