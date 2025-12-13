import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

const parseJson = async (response, fallbackMessage) => {
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

const normalizeService = (item = {}) => {
  const id =
    item.id ??
    item.offering_id ??
    item.service_offering_id ??
    item.services_id ??
    null;

  const serviceId = item.service_id ?? item.services_id ?? item.servicesId ?? null;

  const defaultPrice =
    item.default_price ??
    item.service_price_amt ??
    item.base_price ??
    item.price ??
    0;
  const defaultDuration =
    item.default_duration ??
    item.service_duration ??
    item.duration ??
    0;

  const customPrice = item.price ?? item.custom_price ?? null;
  const customDuration = item.duration ?? item.custom_duration ?? null;
  const discountPercent = item.discount_percent ?? 0;

  return {
    id,
    offering_id: item.offering_id,
    service_id: serviceId,
    serviceId,
    name:
      item.custom_title ??
      item.name ??
      item.service_title ??
      item.service_name ??
      'Untitled Service',
    description:
      item.custom_description ??
      item.description ??
      item.service_description ??
      null,
    custom_title: item.custom_title ?? null,
    customTitle: item.custom_title ?? null,
    custom_description: item.custom_description ?? null,
    customDescription: item.custom_description ?? null,
    custom_price: customPrice,
    price: customPrice ?? defaultPrice,
    default_price: defaultPrice,
    defaultPrice,
    discount_percent: discountPercent,
    discountPercent,
    duration: customDuration ?? defaultDuration,
    default_duration: defaultDuration,
    defaultDuration,
    is_active: Boolean(item.active ?? item.is_active ?? item.serv_active ?? true),
    active: Boolean(item.active ?? item.is_active ?? item.serv_active ?? true),
    bookings: item.bookings ?? item.totalBookings ?? item.booking_count ?? 0,
    service_type: item.service_type ?? null,
    serviceType: item.service_type ?? null,
    pet_type: item.pet_type ?? null,
    petType: item.pet_type ?? null,
    raw: item,
  };
};

const normalizeServicesResponse = (payload) => {
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
    ? payload
    : [];

  return items.map(normalizeService);
};

const normalizeAvailableService = (item = {}) => ({
  services_id: item.services_id ?? item.service_id ?? item.id,
  service_title: item.service_title ?? item.title ?? 'Service',
  service_description: item.service_description ?? item.description ?? null,
  service_price_amt: item.service_price_amt ?? item.price ?? 0,
  service_duration: item.service_duration ?? item.duration ?? 0,
  service_type: item.service_type ?? null,
  pet_type: item.pet_type ?? null,
  gst: item.gst ?? item.service_gst ?? 0,
  raw: item,
});

export const fetchServices = createAsyncThunk(
  'services/fetchServices',
  async ({ authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/provider/services`);
      const raw = await parseJson(response, 'Failed to fetch services');
      return normalizeServicesResponse(raw);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch services');
    }
  }
);

export const fetchAvailableServices = createAsyncThunk(
  'services/fetchAvailableServices',
  async ({ authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/provider/services/available`);
      const raw = await parseJson(response, 'Failed to fetch available services');
      const items = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : [];
      return items.map(normalizeAvailableService);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch available services');
    }
  }
);

export const createService = createAsyncThunk(
  'services/create',
  async ({ data, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/provider/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const raw = await parseJson(response, 'Failed to create service');
      return normalizeService(raw);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create service');
    }
  }
);

export const updateService = createAsyncThunk(
  'services/update',
  async ({ id, data, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/provider/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const raw = await parseJson(response, 'Failed to update service');
      return normalizeService(raw);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update service');
    }
  }
);

export const deleteService = createAsyncThunk(
  'services/delete',
  async ({ id, authFetch }, { rejectWithValue }) => {
    try {
      await authFetch(`${API_URL}/provider/services/${id}`, { method: 'DELETE' });
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete service');
    }
  }
);

const initialState = {
  services: [],
  availableServices: [],
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
        state.services = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAvailableServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableServices.fulfilled, (state, action) => {
        state.loading = false;
        state.availableServices = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAvailableServices.rejected, (state, action) => {
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
        state.availableServices = state.availableServices.filter((svc) => {
          const createdIds = [action.payload.serviceId, action.payload.service_id, action.payload.id].filter(Boolean);
          return !createdIds.includes(svc.services_id);
        });
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
        const index = state.services.findIndex((s) => s.id === action.payload?.id);
        if (index !== -1) {
          state.services[index] = {
            ...state.services[index],
            ...action.payload,
          };
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