import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

/**
 * Fetch provider's clients
 */
export const fetchProviderClients = createAsyncThunk(
  'providerClients/fetchClients',
  async ({ authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/provider/dashboard/clients`);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message = payload?.message || 'Failed to fetch clients';
        throw new Error(message);
      }

      return payload?.data || payload || [];
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch clients');
    }
  }
);

const initialState = {
  clients: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    sortBy: 'lastBooking', // lastBooking, totalBookings, name
  },
};

const providerClientsSlice = createSlice({
  name: 'providerClients',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    resetClients: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProviderClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviderClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload;
      })
      .addCase(fetchProviderClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearError, resetClients } = providerClientsSlice.actions;
export default providerClientsSlice.reducer;
