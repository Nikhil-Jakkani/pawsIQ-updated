import { configureStore } from '@reduxjs/toolkit';
import providerReducer from './slices/providerSlice';
import appointmentsReducer from './slices/appointmentsSlice';
import servicesReducer from './slices/servicesSlice';
import clientsReducer from './slices/clientsSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    provider: providerReducer,
    appointments: appointmentsReducer,
    services: servicesReducer,
    clients: clientsReducer,
    analytics: analyticsReducer,
  },
});

export default store;