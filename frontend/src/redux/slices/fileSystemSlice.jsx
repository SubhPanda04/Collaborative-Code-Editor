import { createSlice } from '@reduxjs/toolkit';
import { Timestamp } from 'firebase/firestore';

const initialState = {
  files: [],
  folders: [],
  currentFolder: null,
  folderStructure: null,
};

const transformFirestoreData = (data) => {
  if (!data) return null;
  
  if (data.createdAt instanceof Timestamp) {
    return {
      ...data,
      createdAt: data.createdAt.toMillis()
    };
  }
  
  if (Array.isArray(data.items)) {
    return {
      ...data,
      items: data.items.map(transformFirestoreData)
    };
  }
  
  return data;
};

const updateNestedItemHelper = (items, parentId, itemId, updateFn) => {
  return items.map(item => {
    if (item.id === parentId) {
      return {
        ...item,
        items: updateFn(item.items || [])
      };
    }
    if (item.items) {
      return {
        ...item,
        items: updateNestedItemHelper(item.items, parentId, itemId, updateFn)
      };
    }
    return item;
  });
};

const fileSystemSlice = createSlice({
  name: 'fileSystem',
  initialState,
  reducers: {
    setFiles: (state, action) => {
      state.files = action.payload;
    },
    setFolders: (state, action) => {
      state.folders = action.payload;
    },
    setCurrentFolder: (state, action) => {
      state.currentFolder = transformFirestoreData(action.payload);
    },
    setFolderStructure: (state, action) => {
      state.folderStructure = action.payload;
    },
    addNestedFile: (state, action) => {
      const { parentId, file } = action.payload;
      if (state.folderStructure) {
        state.folderStructure.items = updateNestedItemHelper(
          state.folderStructure.items,
          parentId,
          file.id,
          (items) => [...items, file]
        );
      }
    },
    addNestedFolder: (state, action) => {
      const { parentId, folder } = action.payload;
      if (state.folderStructure) {
        state.folderStructure.items = updateNestedItemHelper(
          state.folderStructure.items,
          parentId,
          folder.id,
          (items) => [...items, folder]
        );
      }
    },
    removeNestedItem: (state, action) => {
      const { parentId, itemId } = action.payload;
      if (state.folderStructure) {
        state.folderStructure.items = updateNestedItemHelper(
          state.folderStructure.items,
          parentId,
          itemId,
          (items) => items.filter(item => item.id !== itemId)
        );
      }
    },
    updateNestedItem: (state, action) => {
      const { parentId, itemId, updates } = action.payload;
      if (state.folderStructure) {
        state.folderStructure.items = updateNestedItemHelper(
          state.folderStructure.items,
          parentId,
          itemId,
          (items) => items.map(item => 
            item.id === itemId ? { ...item, ...updates } : item
          )
        );
      }
    },
  },
});

export const {
  setFiles,
  setFolders,
  setCurrentFolder,
  setFolderStructure,
  addNestedFile,
  addNestedFolder,
  removeNestedItem,
  updateNestedItem,
} = fileSystemSlice.actions;

export default fileSystemSlice.reducer;
