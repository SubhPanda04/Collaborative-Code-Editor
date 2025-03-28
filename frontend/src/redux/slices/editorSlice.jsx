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
      // Add null check
      if (!action.payload) {
        state.currentFile = null;
        return;
      }
      
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
      const fileIdToClose = action.payload;
      state.openFiles = state.openFiles.filter(f => f.id !== fileIdToClose);
      delete state.activeFiles[fileIdToClose];
      delete state.unsavedChanges[fileIdToClose];
      
      // Always set currentFile to null when closing the last file
      if (state.openFiles.length === 0) {
        state.currentFile = null;
      } else if (state.currentFile?.id === fileIdToClose) {
        state.currentFile = state.openFiles[state.openFiles.length - 1];
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
    setIsAIEnabled: (state, action) => {
      state.isAIEnabled = action.payload;
    },
  },
});

export const { 
  setCurrentFile, 
  setFileContent, 
  closeFile,
  setLanguage, 
  setTheme, 
  clearUnsavedChanges,
  setIsAIEnabled
} = editorSlice.actions;
export default editorSlice.reducer;
