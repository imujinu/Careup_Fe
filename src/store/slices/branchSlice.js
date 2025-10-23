import { createSlice } from '@reduxjs/toolkit';

const branchSlice = createSlice({
  name: 'branch',
  initialState: {
    selectedBranch: null,  // { branchId, branchName, address }
    nearbyBranches: [],
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedBranch: (state, action) => {
      state.selectedBranch = action.payload;
      state.error = null;
    },
    clearSelectedBranch: (state) => {
      state.selectedBranch = null;
    },
    setNearbyBranches: (state, action) => {
      state.nearbyBranches = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { 
  setSelectedBranch, 
  clearSelectedBranch, 
  setNearbyBranches,
  setLoading,
  setError 
} = branchSlice.actions;

export default branchSlice.reducer;
