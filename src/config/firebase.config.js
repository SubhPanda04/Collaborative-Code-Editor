import { getApps, getApp, initializeApp } from "firebase/app"
import { getAuth, setPersistence,browserSessionPersistence } from "firebase/auth"
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

// Set authentication persistence to SESSION-based
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Session-based authentication enabled.");
  })
  .catch((error) => {
    console.error("Error setting authentication persistence:", error);
  });

export {app, auth, db};