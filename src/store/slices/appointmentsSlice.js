import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async ({ filters = {}, authFetch }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await authFetch(
        `${API_URL}/appointments${queryParams ? '?' + queryParams : ''}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointments');
    }
  }
);

export const fetchAppointmentById = createAsyncThunk(
  'appointments/fetchById',
  async ({ id, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/appointments/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointment');
    }
  }
);

export const updateAppointment = createAsyncThunk(
  'appointments/update',
  async ({ id, data, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update appointment');
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointments/cancel',
  async ({ id, reason, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/appointments/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel appointment');
    }
  }
);

const initialState = {
  appointments: [],
  currentAppointment: null,
  loading: false,
  error: null,
  success: false,
  filters: {
    status: 'all', // all, pending, confirmed, completed, cancelled
    date: null,
    serviceType: null,
  },
};

const appointmentsSlice = createSlice({
  name: 'appointments',
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
    clearCurrentAppointment: (state) => {
      state.currentAppointment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAppointmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAppointment = action.payload;
      })
      .addCase(fetchAppointmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAppointment = action.payload;
        const index = state.appointments.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
        state.success = true;
      })
      .addCase(updateAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(cancelAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAppointment = action.payload;
        const index = state.appointments.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
        state.success = true;
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearError, clearSuccess, clearCurrentAppointment } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;