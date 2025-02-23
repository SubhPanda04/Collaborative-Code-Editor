import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentFile: null,
  openFiles: [], // Array to store multiple open files
  activeFiles: {}, // Object to store content for each open file
  selectedLanguage: 'javascript',
  selectedTheme: 'vs-dark',
  unsavedChanges: {}, // Track unsaved changes per file
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setCurrentFile: (state, action) => {
      state.currentFile = action.payload;
      // Initialize file content if it doesn't exist
      if (!state.activeFiles[action.payload.id]) {
        state.activeFiles[action.payload.id] = action.payload.content || '';
      }
      if (!state.openFiles.find(f => f.id === action.payload.id)) {
        state.openFiles.push(action.payload);
      }
    },
    setFileContent: (state, action) => {
      const { fileId, content } = action.payload;
      state.activeFiles[fileId] = content;
      state.unsavedChanges[fileId] = true;
    },
    closeFile: (state, action) => {
      state.openFiles = state.openFiles.filter(f => f.id !== action.payload);
      delete state.activeFiles[action.payload];
      delete state.unsavedChanges[action.payload];
      if (state.currentFile?.id === action.payload) {
        state.currentFile = state.openFiles[0] || null;
      }
    },
    clearUnsavedChanges: (state, action) => {
      state.unsavedChanges[action.payload] = false;
    },
    setLanguage: (state, action) => {
      state.selectedLanguage = action.payload;
    },
    setTheme: (state, action) => {
      state.selectedTheme = action.payload;
    },
  },
});

export const { 
  setCurrentFile, 
  setFileContent, 
  closeFile,
  setLanguage, 
  setTheme, 
  clearUnsavedChanges 
} = editorSlice.actions;
export default editorSlice.reducer;
