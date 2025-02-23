import { configureStore } from '@reduxjs/toolkit';
import editorReducer from './slices/editorSlice';
import fileSystemReducer from './slices/fileSystemSlice';
import uiReducer from './slices/uiSlice';
import userReducer from './slices/userSlice';
import playgroundReducer from './slices/playgroundSlice';

const store = configureStore({
  reducer: {
    editor: editorReducer,
    fileSystem: fileSystemReducer,
    ui: uiReducer,
    user: userReducer,
    playground: playgroundReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['user/setUser', 'editor/setLanguage', 'editor/setTheme'],
        ignoredActionPaths: ['payload.user'],
        ignoredPaths: ['user.userData'],
      },
    }),
});

export default store;
