import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userData: null,
  userName: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      // Only store serializable user data
      if (action.payload) {
        state.userData = {
          uid: action.payload.uid,
          email: action.payload.email,
          displayName: action.payload.displayName,
        };
      } else {
        state.userData = null;
      }
    },
    setUserName: (state, action) => {
      state.userName = action.payload;
    },
  },
});

export const { setUser, setUserName } = userSlice.actions;
export default userSlice.reducer; 