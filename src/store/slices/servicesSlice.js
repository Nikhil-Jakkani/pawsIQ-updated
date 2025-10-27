import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

export const fetchServices = createAsyncThunk(
  'services/fetchServices',
  async ({ authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/services`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch services');
    }
  }
);

export const createService = createAsyncThunk(
  'services/create',
  async ({ data, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create service');
    }
  }
);

export const updateService = createAsyncThunk(
  'services/update',
  async ({ id, data, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update service');
    }
  }
);

export const deleteService = createAsyncThunk(
  'services/delete',
  async ({ id, authFetch }, { rejectWithValue }) => {
    try {
      await authFetch(`${API_URL}/services/${id}`, { method: 'DELETE' });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete service');
    }
  }
);

const initialState = {
  services: [],
  currentService: null,
  loading: false,
  error: null,
  success: false,
};

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    clearCurrentService: (state) => {
      state.currentService = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.loading = false;
        state.services.push(action.payload);
        state.success = true;
      })
      .addCase(createService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.loading = false;
        state.currentService = action.payload;
        const index = state.services.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.services[index] = action.payload;
        }
        state.success = true;
      })
      .addCase(updateService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.loading = false;
        state.services = state.services.filter(s => s.id !== action.payload);
        state.success = true;
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess, clearCurrentService } = servicesSlice.actions;
export default servicesSlice.reducer;