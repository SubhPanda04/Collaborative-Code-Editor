import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.config';

export const saveToStorage = async (files, folders) => {
  try {
    const batch = db.batch();
    
    // Update files
    files.forEach(file => {
      const fileRef = doc(db, "files", file.id);
      batch.update(fileRef, {
        content: file.content,
        updatedAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error saving to storage:', error);
    return false;
  }
};

export const loadFromStorage = async () => {
  try {
    const filesRef = collection(db, "files");
    const foldersRef = collection(db, "playgrounds");
    
    const [filesSnap, foldersSnap] = await Promise.all([
      getDocs(filesRef),
      getDocs(foldersRef)
    ]);
    
    return {
      files: filesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      folders: foldersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
  } catch (error) {
    console.error('Error loading from storage:', error);
    return { files: [], folders: [] };
  }
};

export const clearStorage = async () => {
  // Be careful with this function as it deletes all data
  try {
    const batch = db.batch();
    
    const filesSnap = await getDocs(collection(db, "files"));
    const foldersSnap = await getDocs(collection(db, "playgrounds"));
    
    filesSnap.forEach(doc => batch.delete(doc.ref));
    foldersSnap.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}; 