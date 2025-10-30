import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const parseResponse = async (response, fallbackMessage) => {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || fallbackMessage;
    throw new Error(message);
  }

  if (payload && typeof payload === 'object') {
    if ('data' in payload) return payload.data;
    return payload;
  }

  return payload;
};

const normalizeAppointment = (item = {}) => {
  const id =
    item.id ??
    item.appointment_id ??
    item.booking_id ??
    item.bookingId ??
    null;

  const rawStatus = item.status ?? item.appointment_status ?? item.booking_status ?? null;
  const status = rawStatus ? String(rawStatus) : null;
  const statusKey = status ? status.toLowerCase().replace(/\s+/g, '-') : null;

  return {
    id,
    status,
    statusKey,
    clientName:
      item.client ??
      item.clientName ??
      item.client_name ??
      item.PIQ_User?.user_full_name ??
      null,
    clientEmail:
      item.clientEmail ??
      item.client_email ??
      item.PIQ_User?.user_email_id ??
      null,
    clientPhone: item.clientPhone ?? item.client_phone ?? null,
    petName: item.pet ?? item.petName ?? item.pet_name ?? null,
    petType: item.petType ?? item.pet_type ?? null,
    serviceType:
      item.service ??
      item.serviceType ??
      item.service_type ??
      item.PIQ_Service_Master?.service_title ??
      item.PIQ_Service_Master?.service_type ??
      null,
    date: item.date ?? item.booked_dtm ?? item.bookedAt ?? item.booked_at ?? null,
    time: item.time ?? item.appointment_time ?? null,
    location: item.location ?? item.address ?? null,
    comments: item.comments ?? item.booking_comments ?? null,
    raw: item,
  };
};

const normalizeAppointmentsResponse = (payload) => {
  const itemsSource =
    Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.appointments)
      ? payload.appointments
      : [];

  const appointments = itemsSource.map(normalizeAppointment);

  return {
    appointments,
    meta: {
      page: payload?.page ?? 1,
      limit: payload?.limit ?? appointments.length,
      total: payload?.total ?? appointments.length,
      pages: payload?.pages ?? 1,
    },
  };
};

export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async ({ filters = {}, authFetch }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await authFetch(
        `${API_URL}/provider/appointments${queryParams ? '?' + queryParams : ''}`
      );
      const raw = await parseResponse(response, 'Failed to fetch appointments');
      return normalizeAppointmentsResponse(raw);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch appointments');
    }
  }
);

export const fetchAppointmentById = createAsyncThunk(
  'appointments/fetchById',
  async ({ id, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/provider/appointments/${id}`);
      const raw = await parseResponse(response, 'Failed to fetch appointment');
      return normalizeAppointment(raw);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch appointment');
    }
  }
);

export const updateAppointment = createAsyncThunk(
  'appointments/update',
  async ({ id, data, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/provider/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const raw = await parseResponse(response, 'Failed to update appointment');
      return normalizeAppointment(raw);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update appointment');
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointments/cancel',
  async ({ id, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/provider/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      const raw = await parseResponse(response, 'Failed to cancel appointment');
      return normalizeAppointment(raw);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to cancel appointment');
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
  meta: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
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
        state.appointments = action.payload?.appointments ?? [];
        state.meta = action.payload?.meta ?? state.meta;
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
        const index = state.appointments.findIndex((a) => a.id === action.payload?.id);
        if (index !== -1) {
          state.appointments[index] = {
            ...state.appointments[index],
            ...action.payload,
          };
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
        const index = state.appointments.findIndex((a) => a.id === action.payload?.id);
        if (index !== -1) {
          state.appointments[index] = {
            ...state.appointments[index],
            ...action.payload,
          };
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