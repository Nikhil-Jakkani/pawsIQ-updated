import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

/**
 * Fetch provider's recent appointments
 */
export const fetchProviderAppointments = createAsyncThunk(
  'providerAppointments/fetchAppointments',
  async ({ limit = 10, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/provider/dashboard/appointments?limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointments');
    }
  }
);

/**
 * Fetch all provider appointments (from provider appointments endpoint)
 */
export const fetchAllProviderAppointments = createAsyncThunk(
  'providerAppointments/fetchAll',
  async ({ filters = {}, authFetch }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await authFetch(
        `${API_URL}/provider/appointments${queryParams ? '?' + queryParams : ''}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all appointments');
    }
  }
);

const initialState = {
  appointments: [],
  recentAppointments: [],
  loading: false,
  error: null,
  filters: {
    status: 'all', // all, pending, confirmed, completed, cancelled
    date: null,
  },
};

const providerAppointmentsSlice = createSlice({
  name: 'providerAppointments',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    resetAppointments: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch recent appointments
      .addCase(fetchProviderAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviderAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.recentAppointments = action.payload;
      })
      .addCase(fetchProviderAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch all appointments
      .addCase(fetchAllProviderAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProviderAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchAllProviderAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearError, resetAppointments } = providerAppointmentsSlice.actions;
export default providerAppointmentsSlice.reducer;
