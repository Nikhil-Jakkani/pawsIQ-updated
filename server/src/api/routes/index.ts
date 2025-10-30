import { Router } from 'express';
import adminAuthRoutes from './admin/auth.route.js';
import adminUserRoutes from './admin/user.route.js';
import adminPIQRoutes from './admin/piq.route.js';
import adminBookingRoutes from './admin/booking.route.js';
import adminReviewRoutes from './admin/review.route.js';
import authRoutes from './auth.routes.js';
import userAiRoutes from './user/ai.route.js';
import userSuggestionRoutes from './user/suggestion.route.js';
import userRoutes from './user/user.route.js';
import userAuthRoutes from './user/auth.route.js';
import providerAuthRoutes from './provider/auth.route.js';
import providerRoutes from './provider/provider.route.js';
import providerAppointmentRoutes from './provider/appointment.route.js';
import providerBookingRoutes from './provider/booking.route.js';
import appointmentRoutes from './appointment/appointment.route.js';
import mediaRoutes from './media.route.js';
import petRoutes from './pet/pet.route.js';
import healthRecordRoutes from './healthRecord.route.js';
import reminderRoutes from './reminder/reminder.route.js';
import userActivityRoutes from './user/activity.route.js';
import bookingRoutes from './booking/booking.route.js';
import serviceBizEntityRoutes from './service/bizEntity.route.js';
import serviceMasterRoutes from './service/serviceMaster.route.js';
import availabilityRoutes from './booking/availability.route.js';
import vaccineRoutes from './vaccine.route.js';
import reviewRoutes from './review/review.route.js';
import paymentRoutes from './payment/payment.route.js';
import portfolioRoutes from './portfolio/portfolio.route.js';
import { providerRouter as providerPayoutRoutes, adminRouter as adminPayoutRoutes } from './payout/payout.route.js';
import { providerRouter as providerCommissionRoutes, adminRouter as adminCommissionRoutes } from './commission/commission.route.js';
import adminAnalyticsRoutes from './admin/analytics.route.js';
import providerRatingsRoutes from './provider/ratings.route.js';

const router = Router();

// OAuth routes (Google, Facebook)
router.use('', authRoutes);

router.use('/admin/auth', adminAuthRoutes);
router.use('/admin/analytics', adminAnalyticsRoutes); // MUST be before /admin
router.use('/admin/users', adminUserRoutes);
router.use('/admin/bookings', adminBookingRoutes);
router.use('/admin/reviews', adminReviewRoutes);
router.use('/admin', adminPIQRoutes);

router.use('/user/auth', userAuthRoutes);
router.use('/user/ai', userAiRoutes);
router.use('/user/suggestions', userSuggestionRoutes);
router.use('/user/activities', userActivityRoutes);
router.use('/user', userRoutes);

router.use('/provider/auth', providerAuthRoutes);
router.use('/provider/appointments', providerAppointmentRoutes);
router.use('/provider', providerRoutes);
router.use('/provider/bookings', providerBookingRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/media', mediaRoutes);
router.use('/pets', petRoutes);
router.use('', healthRecordRoutes);
router.use('/reminders', reminderRoutes);
router.use('/bookings', bookingRoutes);
router.use('', serviceBizEntityRoutes);
router.use('', serviceMasterRoutes);
router.use('', availabilityRoutes);
router.use('/vaccines', vaccineRoutes);
router.use('', reviewRoutes);
router.use('/payments', paymentRoutes);
router.use('', portfolioRoutes);
router.use('/provider/payouts', providerPayoutRoutes);
router.use('/admin/payouts', adminPayoutRoutes);
router.use('/provider/commissions', providerCommissionRoutes);
router.use('/admin/commissions', adminCommissionRoutes);
router.use('/providers', providerRatingsRoutes);
router.use('/admin/users/:userId/spending', (req, res) => {
  // User spending endpoint
  const totalSpent = Math.floor(Math.random() * 10000);
  res.json({ data: { totalSpent } });
});

export default router;