import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async ({ filters = {}, authFetch }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await authFetch(
        `${API_URL}/clients${queryParams ? '?' + queryParams : ''}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clients');
    }
  }
);

export const fetchClientById = createAsyncThunk(
  'clients/fetchById',
  async ({ id, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/clients/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch client');
    }
  }
);

export const updateClient = createAsyncThunk(
  'clients/update',
  async ({ id, data, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update client');
    }
  }
);

const initialState = {
  clients: [],
  currentClient: null,
  loading: false,
  error: null,
  success: false,
  filters: {
    search: '',
    status: 'all',
  },
};

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    clearCurrentClient: (state) => {
      state.currentClient = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchClientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentClient = action.payload;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.loading = false;
        state.currentClient = action.payload;
        const index = state.clients.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        state.success = true;
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearError, clearSuccess, clearCurrentClient } = clientsSlice.actions;
export default clientsSlice.reducer;