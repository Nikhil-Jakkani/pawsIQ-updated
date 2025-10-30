import { configureStore } from '@reduxjs/toolkit';
import providerReducer from './slices/providerSlice';
import providerOnboardingReducer from './slices/providerOnboardingSlice';
import appointmentsReducer from './slices/appointmentsSlice';
import servicesReducer from './slices/servicesSlice';
import clientsReducer from './slices/clientsSlice';
import analyticsReducer from './slices/analyticsSlice';
import providerAnalyticsReducer from './slices/providerAnalyticsSlice';
import providerClientsReducer from './slices/providerClientsSlice';
import providerAppointmentsReducer from './slices/providerAppointmentsSlice';

export const store = configureStore({
  reducer: {
    provider: providerReducer,
    providerOnboarding: providerOnboardingReducer,
    appointments: appointmentsReducer,
    services: servicesReducer,
    clients: clientsReducer,
    analytics: analyticsReducer,
    providerAnalytics: providerAnalyticsReducer,
    providerClients: providerClientsReducer,
    providerAppointments: providerAppointmentsReducer,
  },
});

export default store;