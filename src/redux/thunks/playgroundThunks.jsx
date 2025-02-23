import { createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase.config';
import { setPlaygrounds, setLoading, setError } from '../slices/playgroundSlice';

export const fetchUserPlaygrounds = createAsyncThunk(
  'playground/fetchUserPlaygrounds',
  async (userId, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const playgroundsRef = collection(db, "playgrounds");
      const q = query(playgroundsRef, where("userId", "==", userId));
      
      const querySnapshot = await getDocs(q);
      const playgroundsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      dispatch(setPlaygrounds(playgroundsData));
      dispatch(setLoading(false));
    } catch (error) {
      dispatch(setError(error.message));
      dispatch(setLoading(false));
      throw error;
    }
  }
); 