import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider 
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../config/firebase.config";

export const signINWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const userCred = await signInWithPopup(auth, provider);
    
    const user = userCred.user;
    const userData = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      providerId: user.providerData[0].providerId,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "users", user.uid), userData, { merge: true });

    localStorage.setItem('userName', user.displayName || user.email?.split('@')[0] || 'User');
    localStorage.setItem('userUID', user.uid);
    
    window.location.replace('/home/projects');
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.log("Sign-in popup was closed by the user");
      // Don't throw the error for this specific case
      return;
    }
    console.error("Error during Google sign-in:", error);
    throw error;
  }
};

export const signINWithGitHub = async () => {
  try {
    const provider = new GithubAuthProvider();
    const userCred = await signInWithPopup(auth, provider);
  
    const user = userCred.user;
    const userData = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      providerId: user.providerData[0].providerId,
      createdAt: new Date().toISOString(),
    };
  
    await setDoc(doc(db, "users", user.uid), userData, { merge: true });
    
    localStorage.setItem('userName', user.displayName || user.email?.split('@')[0] || 'User');
    localStorage.setItem('userUID', user.uid);
    
    window.location.replace('/home/projects');
  } catch (error) {
    console.error("Error during GitHub sign-in:", error);
    throw error;
  }
};
