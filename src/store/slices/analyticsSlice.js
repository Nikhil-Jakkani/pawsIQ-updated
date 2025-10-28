import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta?.env?.VITE_API_URL || '/api/v1';

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async ({ dateRange = 'month', authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/admin/analytics/user-metrics?timeRange=${dateRange}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchRevenueMetrics = createAsyncThunk(
  'analytics/fetchRevenue',
  async ({ dateRange = 'month', authFetch }, { rejectWithValue }) => {
    try {
      const response = await authFetch(`${API_URL}/admin/analytics/revenue-metrics?timeRange=${dateRange}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch revenue');
    }
  }
);

const initialState = {
  metrics: {
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    retentionRate: 0,
    userGrowth: 0,
  },
  revenue: {
    totalRevenue: 0,
    transactionCount: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    revenueByCategory: [],
    monthlyRevenue: [],
  },
  loading: false,
  error: null,
  dateRange: 'month',
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchRevenueMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRevenueMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.revenue = action.payload;
      })
      .addCase(fetchRevenueMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setDateRange, clearError } = analyticsSlice.actions;
export default analyticsSlice.reducer;