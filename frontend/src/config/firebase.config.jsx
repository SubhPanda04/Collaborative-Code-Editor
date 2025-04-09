import { getApps, getApp, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB8Ay-dvr9ABFxaksrEnSdhTnVSfs63pcw",
    authDomain:"collaborative-code-edito-433e8.firebaseapp.com",
    projectId: "collaborative-code-edito-433e8",
    storageBucket:"collaborative-code-edito-433e8.firebasestorage.app",
    messagingSenderId:  "561202415260",
    appId:"1:561202415260:web:b1ed3c515e241223118f59"
};
const app = getApps.length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export { app, auth, db };
export const initializeFirebase = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/firebase-config`);
    const config = await response.json();
    return initializeApp(config);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
};
