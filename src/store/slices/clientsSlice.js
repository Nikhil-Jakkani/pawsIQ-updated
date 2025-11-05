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

const normalizeClient = (item = {}) => {
  const id =
    item.id ??
    item.client_id ??
    item.user_id ??
    item.booking_client_id ??
    null;

  const joinedDate = item.joinDate ?? item.joined_at ?? item.created_at ?? null;

  return {
    id,
    name: item.name ?? item.clientName ?? item.user_full_name ?? item.full_name ?? 'Unknown',
    email: item.email ?? item.clientEmail ?? item.user_email_id ?? null,
    phone: item.phone ?? item.clientPhone ?? item.user_contact_nbr ?? null,
    profilePhoto: item.profilePhoto ?? item.profile_photo_url ?? null,
    petCount: item.petCount ?? item.pet_count ?? item.totalPets ?? 0,
    totalAppointments: item.totalAppointments ?? item.total_appointments ?? 0,
    activeThisMonth: Boolean(item.activeThisMonth ?? item.active_this_month ?? false),
    newThisMonth: Boolean(item.newThisMonth ?? item.new_this_month ?? false),
    joinDate: joinedDate ? new Date(joinedDate).toLocaleDateString('en-IN') : null,
    raw: item,
  };
};

const normalizeClientsResponse = (payload) => {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.clients)
    ? payload.clients
    : Array.isArray(payload?.data)
    ? payload.data
    : [];

  return items.map(normalizeClient);
};

export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async ({ filters = {}, authFetch }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await authFetch(
        `${API_URL}/provider/dashboard/clients${queryParams ? '?' + queryParams : ''}`
      );
      const raw = await parseJson(response, 'Failed to fetch clients');
      return normalizeClientsResponse(raw);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch clients');
    }
  }
);

export const fetchClientById = createAsyncThunk(
  'clients/fetchById',
  async ({ id, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/provider/dashboard/clients/${id}`);
      const raw = await parseJson(response, 'Failed to fetch client');
      return normalizeClient(raw);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch client');
    }
  }
);

export const updateClient = createAsyncThunk(
  'clients/update',
  async ({ id, data, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/provider/dashboard/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const raw = await parseJson(response, 'Failed to update client');
      return normalizeClient(raw);
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update client');
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
    sortBy: 'lastBooking', // lastBooking, totalBookings, name
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
        state.clients = Array.isArray(action.payload) ? action.payload : [];
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
        const index = state.clients.findIndex((c) => c.id === action.payload?.id);
        if (index !== -1) {
          state.clients[index] = {
            ...state.clients[index],
            ...action.payload,
          };
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