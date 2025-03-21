import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  error: null,
  isInputVisible: true,
  isOutputVisible: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setInputVisibility: (state, action) => {
      state.isInputVisible = action.payload;
    },
    setOutputVisibility: (state, action) => {
      state.isOutputVisible = action.payload;
    },
  },
});

export const { 
  setLoading, 
  setError, 
  clearError,
  setInputVisibility, 
  setOutputVisibility 
} = uiSlice.actions;
export default uiSlice.reducer; 