import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  playgrounds: [],
  loading: false,
  error: null
};

const playgroundSlice = createSlice({
  name: 'playground',
  initialState,
  reducers: {
    setPlaygrounds: (state, action) => {
      console.log("Setting playgrounds in Redux:", action.payload);
      state.playgrounds = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearPlaygrounds: (state) => {
      console.log("Clearing playgrounds in Redux");
      state.playgrounds = [];
    }
  }
});

export const { setPlaygrounds, setLoading, setError, clearPlaygrounds } = playgroundSlice.actions;
export default playgroundSlice.reducer;
