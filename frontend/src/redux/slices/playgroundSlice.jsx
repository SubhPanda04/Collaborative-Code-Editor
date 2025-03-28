import { createSlice } from '@reduxjs/toolkit';
import { Timestamp } from 'firebase/firestore';

const transformPlaygroundData = (data) => {
  if (!data) return null;
  
  if (data.createdAt instanceof Timestamp) {
    return {
      ...data,
      createdAt: data.createdAt.toMillis()
    };
  }
  
  return data;
};

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
      state.playgrounds = action.payload.map(transformPlaygroundData);
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
