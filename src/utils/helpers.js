import { signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { auth, db } from "../config/firebase.config"; // Import Firestore
import { doc, setDoc } from "firebase/firestore"; // Import Firestore functions

export const signINWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope("email"); // Ensure email scope is requested

    const userCred = await signInWithPopup(auth, provider);

    // Extract user information
    const user = userCred.user;
    //console.log("User object:", user);  // Debugging step

    // if (!user.email) {
    //   console.error("Email is missing from Google authentication response");
    //   return;
    // }

    // Fallback: Get email from providerData if null
    const email = user.email || user.providerData[0]?.email || null;


    const userData = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      providerId: user.providerData[0]?.providerId,
      createdAt: new Date().toISOString(),
    };

    // Store user data in Firestore
    await setDoc(doc(db, "users", user.uid), userData);

    console.log("User signed in and data stored in Firestore:", userData);
  } catch (error) {
    console.error("Error during Google sign-in:", error);
  }
};



export const signINWithGitHub = async () => {
    try {
      const provider = new GithubAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
  
      // Extract user information
      const user = userCred.user;
      const userData = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        providerId: user.providerData[0].providerId,
        createdAt: new Date().toISOString(),
      };
  
      // Store user data in Firestore
      await setDoc(doc(db, "users", user.uid), userData);
  
      console.log("User signed in with GitHub and data stored in Firestore:", userData);
    } catch (error) {
      console.error("Error during GitHub sign-in:", error);
    }
  };