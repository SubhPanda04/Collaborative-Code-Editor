const STORAGE_KEY = 'codecollab_files';

export const saveToStorage = (files, folders) => {
  try {
    const data = {
      files: files.map(file => ({
        ...file,
        content: file.content || '',  // Ensure content is never undefined
        updatedAt: new Date().toISOString()
      })),
      folders: folders,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to storage:', error);
    return false;
  }
};

export const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsedData = JSON.parse(data);
      return {
        files: parsedData.files || [],
        folders: parsedData.folders || []
      };
    }
    return { files: [], folders: [] };
  } catch (error) {
    console.error('Error loading from storage:', error);
    return { files: [], folders: [] };
  }
};

export const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}; 