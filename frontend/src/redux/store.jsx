import { configureStore } from '@reduxjs/toolkit';
import editorReducer from './slices/editorSlice';
import fileSystemReducer from './slices/fileSystemSlice';
import uiReducer from './slices/uiSlice';
import userReducer from './slices/userSlice';
import playgroundReducer from './slices/playgroundSlice';
import codeExecutionReducer from './slices/codeExecutionSlice';

const nonSerializableMiddleware = (store) => (next) => (action) => {
  if (action.payload) {
    try {
      JSON.stringify(action.payload);
    } catch (err) {
      console.warn('Non-serializable value in action:', action.type);
      const safePayload = { ...action.payload };
  
      if (safePayload.createdAt?.toMillis) {
        safePayload.createdAt = safePayload.createdAt.toMillis();
      }
      if (safePayload.updatedAt?.toMillis) {
        safePayload.updatedAt = safePayload.updatedAt.toMillis();
      }
      
      action = { ...action, payload: safePayload };
    }
  }
  return next(action);
};

const store = configureStore({
  reducer: {
    editor: editorReducer,
    fileSystem: fileSystemReducer,
    ui: uiReducer,
    user: userReducer,
    playground: playgroundReducer,
    codeExecution: codeExecutionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    }).concat(nonSerializableMiddleware)
});

export default store;
