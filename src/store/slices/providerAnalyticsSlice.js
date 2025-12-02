import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

/**
 * Fetch complete dashboard overview (all data in one call)
 */
export const fetchProviderDashboardOverview = createAsyncThunk(
  'providerAnalytics/fetchOverview',
  async ({ authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/provider/dashboard/overview`);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message = payload?.message || 'Failed to fetch dashboard overview';
        throw new Error(message);
      }

      return payload?.data || payload || {};
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard overview');
    }
  }
);

const initialState = {
  metrics: {
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    cancelledAppointments: 0,
    averageRating: 0,
    totalReviews: 0,
    completionRate: 0,
    activeClients: 0,
  },
  revenue: {
    totalRevenue: 0,
    pendingAmount: 0,
    paidAmount: 0,
    revenueGrowth: 0,
    monthlyRevenue: [],
    transactionCount: 0,
    averageTransactionValue: 0,
  },
  typeMetrics: {},
  recentAppointments: [],
  clients: [],
  providerType: null,
  loading: false,
  error: null,
};

const providerAnalyticsSlice = createSlice({
  name: 'providerAnalytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAnalytics: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard Overview (all data)
      .addCase(fetchProviderDashboardOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviderDashboardOverview.fulfilled, (state, action) => {
        state.loading = false;
        // Safely destructure with defaults to prevent errors
        if (action.payload && typeof action.payload === 'object') {
          const { metrics, revenue, recentAppointments, clients, typeSpecificMetrics, providerType } = action.payload;
          state.metrics = metrics || state.metrics;
          state.revenue = revenue || state.revenue;
          state.recentAppointments = recentAppointments || [];
          state.clients = clients || [];
          state.typeMetrics = typeSpecificMetrics || {};
          state.providerType = providerType || null;
        }
      })
      .addCase(fetchProviderDashboardOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, resetAnalytics } = providerAnalyticsSlice.actions;
export default providerAnalyticsSlice.reducer;
