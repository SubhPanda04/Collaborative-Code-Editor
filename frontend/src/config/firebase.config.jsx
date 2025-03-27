import { getApps, getApp, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTHDOMAIN,
    projectId: process.env.REACT_APP_PROJECTID,
    storageBucket: process.env.REACT_APP_STORAGEBUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGESENDERID,
    appId: process.env.REACT_APP_APPID
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
