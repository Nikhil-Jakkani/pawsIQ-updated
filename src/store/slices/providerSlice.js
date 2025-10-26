import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

// Async thunks
export const fetchProviderProfile = createAsyncThunk(
  'provider/fetchProfile',
  async ({ authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/providers/profile`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch provider profile');
    }
  }
);

export const updateProviderProfile = createAsyncThunk(
  'provider/updateProfile',
  async ({ data, authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/providers/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

const initialState = {
  profile: null,
  loading: false,
  error: null,
  success: false,
};

const providerSlice = createSlice({
  name: 'provider',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProviderProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviderProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProviderProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProviderProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProviderProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.success = true;
      })
      .addCase(updateProviderProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess } = providerSlice.actions;
export default providerSlice.reducer;